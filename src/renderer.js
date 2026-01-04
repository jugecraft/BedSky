const { ipcRenderer } = require('electron');

const playBtn = document.getElementById('play-btn');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
const consoleOutput = document.getElementById('console-output');
const usernameInput = document.getElementById('username');
const versionSelect = document.getElementById('version');
const ramSelect = document.getElementById('ram');
const showSnapshotsCheckbox = document.getElementById('show-snapshots');

let allVersions = [];

// Load Versions on startup
async function loadVersions() {
    statusText.textContent = "Cargando versiones...";
    try {
        allVersions = await ipcRenderer.invoke('get-versions');
        renderVersions();

        // Load config after versions are loaded
        loadConfig();

        statusText.textContent = "Listo para jugar";
    } catch (err) {
        statusText.textContent = "Error cargando versiones";
        console.error(err);
    }
}

function renderVersions() {
    versionSelect.innerHTML = '';
    const showSnapshots = showSnapshotsCheckbox.checked;

    allVersions.forEach(v => {
        if (v.type === 'release' || (showSnapshots && v.type === 'snapshot')) {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = v.type === 'snapshot' ? `Snapshot ${v.id}` : v.id;
            versionSelect.appendChild(option);
        }
    });
}

showSnapshotsCheckbox.addEventListener('change', () => {
    const currentVal = versionSelect.value;
    renderVersions();
    // Try to keep selection if possible
    if (Array.from(versionSelect.options).some(o => o.value === currentVal)) {
        versionSelect.value = currentVal;
    } else if (versionSelect.options.length > 0) {
        versionSelect.value = versionSelect.options[0].value;
    }
});

async function loadConfig() {
    const config = await ipcRenderer.invoke('get-config');
    if (config.username) usernameInput.value = config.username;
    if (config.memory) ramSelect.value = config.memory;
    if (config.version && config.version.number) {
        // Ensure the version exists in the list before selecting
        const savedVersion = config.version.number;
        if (Array.from(versionSelect.options).some(o => o.value === savedVersion)) {
            versionSelect.value = savedVersion;
        }
    }
}

loadVersions();

playBtn.addEventListener('click', () => {
    // Find the selected version object to get its type
    const selectedVersionId = versionSelect.value;
    const selectedVersionObj = allVersions.find(v => v.id === selectedVersionId);

    const config = {
        username: usernameInput.value || 'Steve',
        version: {
            number: selectedVersionId,
            type: selectedVersionObj ? selectedVersionObj.type : 'release'
        },
        memory: ramSelect.value
    };

    // Save config
    ipcRenderer.invoke('save-config', config);

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
