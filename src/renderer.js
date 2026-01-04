const { ipcRenderer } = require('electron');

const playBtn = document.getElementById('play-btn');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
const consoleOutput = document.getElementById('console-output');
const usernameInput = document.getElementById('username');
const versionSelect = document.getElementById('version');
const ramSelect = document.getElementById('ram');

playBtn.addEventListener('click', () => {
    const config = {
        username: usernameInput.value || 'Steve',
        version: versionSelect.value,
        memory: ramSelect.value
    };

    // Disable button
    playBtn.disabled = true;
    playBtn.textContent = 'INICIANDO...';
    consoleOutput.classList.add('visible');
    consoleOutput.innerHTML = ''; // Clear logs

    // Send launch signal
    ipcRenderer.send('launch-game', config);
});

// Listen for progress updates
ipcRenderer.on('progress', (event, data) => {
    if (data.type === 'natives') {
        statusText.textContent = `Descargando nativos: ${data.task} (${data.total})`;
    } else if (data.type === 'classes') {
        statusText.textContent = `Descargando clases: ${data.task} (${data.total})`;
    } else if (data.type === 'assets') {
        statusText.textContent = `Descargando assets: ${data.task} (${data.total})`;
    }

    // Simple visual progress simulation if data isn't percentage
    // In a real scenario, we calculate percentage
});

ipcRenderer.on('log', (event, message) => {
    const line = document.createElement('div');
    line.textContent = `[LOG] ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;

    // Update status text with last log
    if (message.length < 50) {
       statusText.textContent = message;
    }
});

ipcRenderer.on('game-closed', (event, code) => {
    playBtn.disabled = false;
    playBtn.textContent = 'JUGAR';
    statusText.textContent = `Juego cerrado (Código: ${code})`;
});

ipcRenderer.on('error', (event, err) => {
    playBtn.disabled = false;
    playBtn.textContent = 'JUGAR';
    statusText.textContent = `Error: ${err}`;
    const line = document.createElement('div');
    line.style.color = 'red';
    line.textContent = `[ERROR] ${err}`;
    consoleOutput.appendChild(line);
});
