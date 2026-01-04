const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ConfigManager {
    constructor() {
        this.configPath = path.join(app.getPath('userData'), 'launcher-config.json');
        this.defaults = {
            username: '',
            javaPath: '',
            minMemory: '1G',
            maxMemory: '4G',
            width: 1280,
            height: 720,
            jvmArgs: ''
        };
    }

    load() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf-8');
                return { ...this.defaults, ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('Failed to load config:', e);
        }
        return this.defaults;
    }

    save(config) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            return true;
        } catch (e) {
            console.error('Failed to save config:', e);
            return false;
        }
    }
}

module.exports = new ConfigManager();
