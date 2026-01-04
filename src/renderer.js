// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginUsernameInput = document.getElementById('login-username');
const btnLogin = document.getElementById('btn-login');
const btnMicrosoft = document.getElementById('btn-microsoft');
const btnLogout = document.getElementById('btn-logout');
const displayUsername = document.getElementById('display-username');

const versionSelect = document.getElementById('version-select');
const checkboxSnapshot = document.getElementById('checkbox-snapshot');
const ramSelect = document.getElementById('ram-select');
const btnLaunch = document.getElementById('btn-launch');

// Modals
const settingsOverlay = document.getElementById('settings-modal-overlay');
const logsOverlay = document.getElementById('logs-modal-overlay');
const closeSettingsBtn = document.getElementById('close-settings');
const closeLogsBtn = document.getElementById('close-logs');
const saveSettingsBtn = document.getElementById('save-settings');
const logsContent = document.getElementById('logs-content');

// Settings Inputs
const inputJavaPath = document.getElementById('settings-java-path');
const inputMinMem = document.getElementById('settings-min-memory');
const inputMaxMem = document.getElementById('settings-max-memory');
const inputWidth = document.getElementById('settings-width');
const inputHeight = document.getElementById('settings-height');
const inputJvmArgs = document.getElementById('settings-jvm-args');


// State
let currentUser = null;
let currentSettings = {
    javaPath: '',
    minMemory: '1G',
    maxMemory: '4G',
    width: 1280,
    height: 720,
    jvmArgs: ''
};

// --- View Switching Logic ---
function showDashboard(username) {
    currentUser = username;
    displayUsername.textContent = username;
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');

    if (versionSelect.options.length <= 1) {
        loadVersions();
    }
}

function showLogin() {
    currentUser = null;
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
    loginUsernameInput.value = '';
}

// --- Event Listeners ---

// Login
btnLogin.addEventListener('click', () => {
    const username = loginUsernameInput.value.trim();
    if (username) {
        showDashboard(username);
    } else {
        alert('Por favor introduce un nombre de usuario.');
    }
});

// Microsoft Login Placeholder
btnMicrosoft.addEventListener('click', () => {
    alert('Próximamente: Inicio de sesión con Microsoft');
});

// Logout
btnLogout.addEventListener('click', () => {
    showLogin();
});

// Load Versions
function loadVersions() {
    window.electronAPI.getVersions();
}

window.electronAPI.onVersionsList((versions) => {
    versionSelect.innerHTML = '';
    const showSnapshots = checkboxSnapshot.checked;

    versions.forEach(v => {
        if (v.type === 'release' || (showSnapshots && v.type === 'snapshot')) {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `${v.type === 'release' ? 'Release' : 'Snapshot'} ${v.id}`;
            versionSelect.appendChild(option);
        }
    });

    if (versionSelect.options.length > 0) {
        versionSelect.selectedIndex = 0;
    }
});

checkboxSnapshot.addEventListener('change', () => {
    loadVersions();
});


// Launch
btnLaunch.addEventListener('click', () => {
    if (!currentUser) return;

    // Update logs modal
    logsContent.textContent = "Iniciando...";
    logsOverlay.classList.add('active');

    const opts = {
        username: currentUser,
        version: versionSelect.value,
        memory: {
            min: currentSettings.minMemory,
            max: currentSettings.maxMemory
        },
        executablePath: currentSettings.javaPath || undefined,
        window: {
            width: parseInt(currentSettings.width),
            height: parseInt(currentSettings.height)
        },
        customArgs: currentSettings.jvmArgs ? currentSettings.jvmArgs.split(' ') : []
    };

    window.electronAPI.launchGame(opts);
});


// --- Settings Logic ---
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (item.dataset.tab === 'settings') {
             // Load current settings into inputs (in a real app, load from IPC)
             inputJavaPath.value = currentSettings.javaPath;
             inputMinMem.value = currentSettings.minMemory;
             inputMaxMem.value = currentSettings.maxMemory;
             inputWidth.value = currentSettings.width;
             inputHeight.value = currentSettings.height;
             inputJvmArgs.value = currentSettings.jvmArgs;

             settingsOverlay.classList.add('active');
        }
    });
});

closeSettingsBtn.addEventListener('click', () => {
    settingsOverlay.classList.remove('active');
});

saveSettingsBtn.addEventListener('click', () => {
    // Save to state
    currentSettings = {
        javaPath: inputJavaPath.value.trim(),
        minMemory: inputMinMem.value.trim(),
        maxMemory: inputMaxMem.value.trim(),
        width: parseInt(inputWidth.value) || 1280,
        height: parseInt(inputHeight.value) || 720,
        jvmArgs: inputJvmArgs.value.trim()
    };
    // Sync UI if needed
    ramSelect.value = currentSettings.maxMemory; // Basic sync

    settingsOverlay.classList.remove('active');
    // In real app, send 'save-config' IPC
});


// --- Logs Logic ---
closeLogsBtn.addEventListener('click', () => {
    logsOverlay.classList.remove('active');
});

window.electronAPI.onLogData((data) => {
    logsContent.textContent += data;
    logsContent.scrollTop = logsContent.scrollHeight;
});

window.electronAPI.onGameClosed((code) => {
    logsContent.textContent += `\n[Launcher] El juego se cerró con código: ${code}`;
});
