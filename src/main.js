const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client, Authenticator } = require('minecraft-launcher-core');
const fetch = require('node-fetch');
const configManager = require('./config');

const launcher = new Client();

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0b0e14',
    frame: true
  });

  win.loadFile('src/index.html');
  // win.webContents.openDevTools();

  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  // Launcher Events
  launcher.on('debug', (e) => win.webContents.send('log-data', e + "\n"));
  launcher.on('data', (e) => win.webContents.send('log-data', e + "\n"));
  launcher.on('close', (e) => win.webContents.send('game-closed', e));

  launcher.on('download-status', (e) => win.webContents.send('download-status', e));
  launcher.on('progress', (e) => win.webContents.send('download-progress', e));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

ipcMain.on('get-config', (event) => {
    event.returnValue = configManager.load();
});

ipcMain.on('save-config', (event, config) => {
    configManager.save(config);
});

ipcMain.on('get-versions', async (event) => {
    try {
        const response = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
        const data = await response.json();
        event.reply('versions-list', data.versions);
    } catch (error) {
        event.reply('versions-list', []);
        console.error("Failed to fetch versions:", error);
    }
});

ipcMain.on('launch-game', (event, opts) => {
    const auth = Authenticator.getAuth(opts.username);

    // Use userData directory for reliable file access in production
    const gameRoot = path.join(app.getPath('userData'), 'minecraft_data');

    const launchOptions = {
        clientPackage: null,
        authorization: auth,
        root: gameRoot,
        version: {
            number: opts.version.number,
            type: opts.version.type
        },
        memory: opts.memory,
        javaPath: opts.executablePath !== '' ? opts.executablePath : undefined,
        window: opts.window,
        customArgs: opts.customArgs
    };

    console.log("Launching with options:", launchOptions);
    launcher.launch(launchOptions);
});
