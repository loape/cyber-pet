const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let pythonProcess = null;
let currentTrayStatus = '摸鱼中';

app.setName('CyberPet');

const DEFAULT_CHAR_CONFIGS = [
  {
    folder: '01_cyber_cat',
    config: {
      character_id: 'cyber_cat',
      name: '摸鱼猫',
      version: '1.0.0',
      frame_size: { width: 128, height: 128 },
      fps: 12,
      animations: {
        idle: { frames: 8, loop: true, duration_ms: 666 },
        walk: { frames: 6, loop: true, duration_ms: 500 },
        sleep: { frames: 10, loop: true, duration_ms: 833 },
        knock_fish: { frames: 4, loop: false, duration_ms: 333 },
        furious_fire: { frames: 12, loop: true, duration_ms: 1000 },
        dragged: { frames: 6, loop: true, duration_ms: 500 },
        curious: { frames: 6, loop: false, duration_ms: 500 },
        rock_paper_scissors: { frames: 8, loop: false, duration_ms: 666 }
      }
    }
  },
  {
    folder: '02_pixel_dog',
    config: {
      character_id: 'pixel_dog',
      name: '赛博狗',
      version: '1.0.0',
      frame_size: { width: 128, height: 128 },
      fps: 12,
      animations: {
        idle: { frames: 8, loop: true, duration_ms: 666 },
        walk: { frames: 6, loop: true, duration_ms: 500 },
        sleep: { frames: 10, loop: true, duration_ms: 833 },
        knock_fish: { frames: 4, loop: false, duration_ms: 333 },
        furious_fire: { frames: 12, loop: true, duration_ms: 1000 },
        dragged: { frames: 6, loop: true, duration_ms: 500 },
        curious: { frames: 6, loop: false, duration_ms: 500 },
        rock_paper_scissors: { frames: 8, loop: false, duration_ms: 666 }
      }
    }
  },
  {
    folder: '03_crazy_duck',
    config: {
      character_id: 'crazy_duck',
      name: '发疯鸭',
      version: '1.0.0',
      frame_size: { width: 128, height: 128 },
      fps: 12,
      animations: {
        idle: { frames: 8, loop: true, duration_ms: 666 },
        walk: { frames: 6, loop: true, duration_ms: 500 },
        sleep: { frames: 10, loop: true, duration_ms: 833 },
        knock_fish: { frames: 4, loop: false, duration_ms: 333 },
        furious_fire: { frames: 12, loop: true, duration_ms: 1000 },
        dragged: { frames: 6, loop: true, duration_ms: 500 },
        curious: { frames: 6, loop: false, duration_ms: 500 },
        rock_paper_scissors: { frames: 8, loop: false, duration_ms: 666 }
      }
    }
  },
  {
    folder: '04_office_worker',
    config: {
      character_id: 'office_worker',
      name: '打工人',
      version: '1.0.0',
      frame_size: { width: 128, height: 128 },
      fps: 12,
      animations: {
        idle: { frames: 8, loop: true, duration_ms: 666 },
        walk: { frames: 6, loop: true, duration_ms: 500 },
        sleep: { frames: 10, loop: true, duration_ms: 833 },
        knock_fish: { frames: 4, loop: false, duration_ms: 333 },
        furious_fire: { frames: 12, loop: true, duration_ms: 1000 },
        dragged: { frames: 6, loop: true, duration_ms: 500 },
        curious: { frames: 6, loop: false, duration_ms: 500 },
        rock_paper_scissors: { frames: 8, loop: false, duration_ms: 666 }
      }
    }
  },
  {
    folder: '05_shiba_inu',
    config: {
      character_id: 'shiba_inu',
      name: '柴犬',
      version: '1.0.0',
      frame_size: { width: 128, height: 128 },
      fps: 12,
      animations: {
        idle: { frames: 8, loop: true, duration_ms: 666 },
        walk: { frames: 6, loop: true, duration_ms: 500 },
        sleep: { frames: 10, loop: true, duration_ms: 833 },
        knock_fish: { frames: 4, loop: false, duration_ms: 333 },
        furious_fire: { frames: 12, loop: true, duration_ms: 1000 },
        dragged: { frames: 6, loop: true, duration_ms: 500 },
        curious: { frames: 6, loop: false, duration_ms: 500 },
        rock_paper_scissors: { frames: 8, loop: false, duration_ms: 666 }
      }
    }
  }
];

// Characters storage directory: ~/Library/Application Support/CyberPet/characters
function getCharactersDirectory() {
  const userDataPath = app.getPath('userData');
  const charsDir = path.join(userDataPath, 'characters');
  if (!fs.existsSync(charsDir)) {
    fs.mkdirSync(charsDir, { recursive: true });
  }

  // Seed default characters if not already present
  for (const item of DEFAULT_CHAR_CONFIGS) {
    const itemDir = path.join(charsDir, item.folder);
    if (!fs.existsSync(itemDir)) {
      fs.mkdirSync(itemDir, { recursive: true });
      fs.mkdirSync(path.join(itemDir, 'sounds'), { recursive: true });
      fs.writeFileSync(path.join(itemDir, 'config.json'), JSON.stringify(item.config, null, 2));
    }
  }

  return charsDir;
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH, x: screenX, y: screenY } = primaryDisplay.workArea;

  const DEFAULT_WIDTH = 260;
  const DEFAULT_HEIGHT = 240;
  const initialX = screenX + screenW - DEFAULT_WIDTH - 40;
  const initialY = screenY + screenH - DEFAULT_HEIGHT - 60;

  mainWindow = new BrowserWindow({
    x: initialX,
    y: initialY,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false, // does NOT steal keyboard focus from user's coding editor
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // allow loading local character image assets
    }
  });

  // Set floating window level on macOS to stay above normal windows
  if (process.platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'floating', 1);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  // Allow clicking on the pet directly without blocking other apps
  mainWindow.setIgnoreMouseEvents(false);

  const distHtml = path.join(__dirname, '../dist/index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distHtml)) {
    mainWindow.loadFile(distHtml);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Generate a retro 16x16 pixel icon for the macOS menu bar
  const iconCanvas = nativeImage.createFromBuffer(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkoBAwUqifYdQACBrw' +
      'v/D//6f//79j1ACQASgG4DEAmxvgBqC7AV3D+w/v/v8/fR2PjYQbQJwB6DYyEv1x8/9/848fv/4z' +
      'gB2A7g4SbcDmBtz+wNQA6I2w8UikSQkAl0g2hZ33Y0EAAAAASUVORK5CYII=',
      'base64'
    )
  );

  tray = new Tray(iconCanvas);
  tray.setToolTip('赛博工位桌宠 (CyberPet)');
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    { label: `当前状态: ${currentTrayStatus}`, enabled: false },
    { type: 'separator' },
    {
      label: '打开设置面板',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('open-settings');
        }
      }
    },
    {
      label: '重置桌宠到中央底座',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('reset-position');
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出赛博桌宠',
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}

// Start macOS native event hook
function startEventHook() {
  const pythonScript = path.join(__dirname, 'event_hook.py');
  
  // Prefer python3, fallback to system python
  const candidates = [
    '/Users/shizhiwei/anaconda3/envs/py_310/bin/python',
    '/Users/shizhiwei/anaconda3/bin/python3',
    'python3'
  ];

  let pythonExec = 'python3';
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      pythonExec = c;
      break;
    }
  }

  try {
    pythonProcess = spawn(pythonExec, [pythonScript], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let buffer = '';
    pythonProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep partial line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line);
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (evt.is_space) {
              mainWindow.webContents.send('global-space', evt);
            }
            if (evt.apm !== undefined) {
              mainWindow.webContents.send('apm-update', evt);
            }
          }
        } catch (e) {
          // ignore non-json line
        }
      }
    });

    pythonProcess.stderr.on('data', (err) => {
      console.warn('[EventHook Stderr]', err.toString());
    });

    pythonProcess.on('exit', (code) => {
      console.log('[EventHook Exited]', code);
    });
  } catch (err) {
    console.warn('[EventHook Spawn Failed]', err);
  }
}

// Setup IPC handlers
function setupIpc() {
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, options || { forward: true });
    }
  });

  ipcMain.handle('get-window-position', () => {
    return mainWindow ? mainWindow.getPosition() : [0, 0];
  });

  ipcMain.handle('get-cursor-screen-point', () => {
    return screen.getCursorScreenPoint();
  });

  ipcMain.on('set-window-position', (_event, x, y) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setPosition(Math.round(x), Math.round(y));
    }
  });

  ipcMain.on('set-focusable', (_event, enable) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFocusable(!!enable);
      if (enable) {
        mainWindow.focus();
      }
    }
  });

  ipcMain.on('set-window-size', (_event, width, height) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const isModal = (width > 300 || height > 300);
      mainWindow.setFocusable(isModal);
      if (isModal) {
        mainWindow.focus();
      }

      const [currX, currY] = mainWindow.getPosition();
      const [currW] = mainWindow.getSize();
      const primary = screen.getPrimaryDisplay();
      const { width: maxW, height: maxH, x: minX, y: minY } = primary.workArea;

      let newX = currX;
      let newY = currY;

      // When expanding to larger modal, ensure it stays within workArea
      if (width > currW) {
        if (newX + width > minX + maxW) newX = Math.max(minX + 20, minX + maxW - width - 20);
        if (newY + height > minY + maxH) newY = Math.max(minY + 20, minY + maxH - height - 20);
      }

      mainWindow.setBounds({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(width),
        height: Math.round(height)
      });
    }
  });

  ipcMain.handle('get-screen-bounds', () => {
    const primary = screen.getPrimaryDisplay();
    return {
      bounds: primary.bounds,
      workArea: primary.workArea
    };
  });

  ipcMain.on('update-tray-status', (_event, status) => {
    currentTrayStatus = status;
    updateTrayMenu();
  });

  ipcMain.handle('get-characters-dir', () => {
    return getCharactersDirectory();
  });

  ipcMain.on('open-characters-folder', () => {
    shell.openPath(getCharactersDirectory());
  });

  ipcMain.on('copy-to-clipboard', (_event, text) => {
    clipboard.writeText(text);
  });

  ipcMain.on('copy-image-to-clipboard', (_event, dataUrl) => {
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
  });

  ipcMain.handle('set-autostart', (_event, enable) => {
    app.setLoginItemSettings({
      openAtLogin: !!enable,
      openAsHidden: true
    });
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle('get-autostart', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-close', () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  setupIpc();
  createMainWindow();
  createTray();
  startEventHook();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (pythonProcess) {
    try {
      pythonProcess.kill();
    } catch (e) {}
  }
});
