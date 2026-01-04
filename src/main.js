const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client, Authenticator } = require('minecraft-launcher-core');

const launcher = new Client();

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple prototype, simpler IPC
        },
        backgroundColor: '#1e1e24',
        title: 'Fenix Clone Launcher'
    });

    win.loadFile('src/index.html');
    // win.webContents.openDevTools(); // Uncomment for debugging
}

app.whenReady().then(() => {
    createWindow();

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

// IPC Handling
ipcMain.on('launch-game', (event, config) => {
    const win = BrowserWindow.getAllWindows()[0];

    // Auth setup (Offline mode for this prototype)
    // MCLC provides Authenticator for Yggdrasil/Microsoft, but we use getAuth for simple offline
    const authorization = Authenticator.getAuth(config.username);

    const opts = {
        clientPackage: null,
        authorization: authorization,
        root: path.join(__dirname, '../minecraft'),
        version: {
            number: config.version,
            type: "release"
        },
        memory: {
            max: config.memory,
            min: "2G"
        }
    };

    win.webContents.send('log', `Iniciando configuración para versión ${config.version}...`);
    win.webContents.send('log', `Directorio de juego: ${opts.root}`);

    launcher.launch(opts).catch(err => {
        win.webContents.send('error', err.message);
    });

    launcher.on('debug', (e) => win.webContents.send('log', e));
    launcher.on('data', (e) => win.webContents.send('log', e));

    launcher.on('progress', (e) => {
        win.webContents.send('progress', e);
    });

    launcher.on('close', (code) => {
        win.webContents.send('game-closed', code);
    });
});
