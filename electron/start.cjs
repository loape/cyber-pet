const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const electron = require('electron');

const PORT = 5173;
const URL = `http://localhost:${PORT}`;

function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
}

async function waitForServer() {
  process.stdout.write('Waiting for Vite dev server to start...');
  for (let i = 0; i < 40; i++) {
    const ready = await checkServerReady();
    if (ready) {
      console.log('\n[Vite Ready] Launching Electron...');
      return true;
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log('\n[Timeout] Launching Electron anyway...');
  return false;
}

async function start() {
  if (process.env.WAIT_ON_WEB) {
    await waitForServer();
  }

  const child = spawn(electron, [path.resolve(__dirname, '..')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: URL
    }
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });
}

start();
