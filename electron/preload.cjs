const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Mouse ignore / pass-through control
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },
  
  // Window position & bounds
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', x, y),
  setWindowSize: (w, h) => ipcRenderer.send('set-window-size', w, h),
  setFocusable: (enable) => ipcRenderer.send('set-focusable', enable),
  getScreenBounds: () => ipcRenderer.invoke('get-screen-bounds'),
  getCursorScreenPoint: () => ipcRenderer.invoke('get-cursor-screen-point'),
  
  // Event listeners from main process
  onGlobalSpace: (callback) => {
    ipcRenderer.on('global-space', (_event, data) => callback(data));
  },
  onApmUpdate: (callback) => {
    ipcRenderer.on('apm-update', (_event, data) => callback(data));
  },
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', () => callback());
  },
  onResetPosition: (callback) => {
    ipcRenderer.on('reset-position', () => callback());
  },
  
  // State synchronization
  updateTrayStatus: (status) => ipcRenderer.send('update-tray-status', status),
  
  // Character packs & files
  getCharactersDir: () => ipcRenderer.invoke('get-characters-dir'),
  loadCharacters: () => ipcRenderer.invoke('load-characters'),
  openCharactersFolder: () => ipcRenderer.send('open-characters-folder'),
  
  // Clipboard
  copyToClipboard: (text) => ipcRenderer.send('copy-to-clipboard', text),
  copyImageToClipboard: (dataUrl) => ipcRenderer.send('copy-image-to-clipboard', dataUrl),
  
  // Autostart setting
  setAutostart: (enable) => ipcRenderer.invoke('set-autostart', enable),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close')
});
