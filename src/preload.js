const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Methods
    getVersions: () => ipcRenderer.send('get-versions'),
    launchGame: (opts) => ipcRenderer.send('launch-game', opts),
    getConfig: () => ipcRenderer.sendSync('get-config'),
    saveConfig: (config) => ipcRenderer.send('save-config', config),

    // Listeners
    onVersionsList: (callback) => ipcRenderer.on('versions-list', (event, data) => callback(data)),
    onLogData: (callback) => ipcRenderer.on('log-data', (event, data) => callback(data)),
    onGameClosed: (callback) => ipcRenderer.on('game-closed', (event, code) => callback(code)),
    onDownloadStatus: (callback) => ipcRenderer.on('download-status', (event, data) => callback(data)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data))
});
