const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Methods
    getVersions: () => ipcRenderer.send('get-versions'),
    launchGame: (opts) => ipcRenderer.send('launch-game', opts),

    // Listeners
    onVersionsList: (callback) => ipcRenderer.on('versions-list', (event, data) => callback(data)),
    onLogData: (callback) => ipcRenderer.on('log-data', (event, data) => callback(data)),
    onGameClosed: (callback) => ipcRenderer.on('game-closed', (event, code) => callback(code))
});
