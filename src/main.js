const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client, Authenticator } = require('minecraft-launcher-core');
const fetch = require('node-fetch');
const fs = require('fs');

const launcher = new Client();
const configPath = path.join(app.getPath('userData'), 'launcher-config.json');

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
        title: 'JugeLancher'
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
ipcMain.handle('get-versions', async () => {
    try {
        const response = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest.json');
        const data = await response.json();
        return data.versions;
    } catch (error) {
        console.error('Failed to fetch versions:', error);
        return [];
    }
});

ipcMain.handle('get-config', () => {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (e) {
        console.error("Error reading config", e);
    }
    return {};
});

ipcMain.handle('save-config', (event, config) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        return true;
    } catch (e) {
        console.error("Error saving config", e);
        return false;
    }
});

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
            number: config.version.number,
            type: config.version.type
        },
        memory: {
            max: config.memory,
            min: "2G"
        }
    };

    win.webContents.send('log', `Iniciando configuración para versión ${config.version.number} (${config.version.type})...`);
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
