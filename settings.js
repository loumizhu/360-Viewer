// ============================================
// UI SETTINGS MANAGER
// ============================================
class UISettingsManager {
    constructor() {
        this.settings = {
            ui: {
                blurEnabled: true,
                blurIntensity: 15,
                glowEnabled: true,
                glowColor: 'rgba(100, 200, 255, 0.8)',
                glowDuration: 500
            }
        };
        this.settingsFile = 'settings.json';
        this.loadSettings();
    }

    // Load settings from localStorage (fallback to JSON file)
    loadSettings() {
        try {
            // Try localStorage first (faster, no file I/O)
            const stored = localStorage.getItem('viewerSettings');
            if (stored) {
                this.settings = JSON.parse(stored);
                this.applySettings();
                console.log('Settings loaded from localStorage');
                return;
            }
        } catch (error) {
            console.warn('Error loading from localStorage:', error);
        }

        // Fallback: Try to load from JSON file
        this.loadFromFile();
    }

    // Load settings from JSON file
    async loadFromFile() {
        try {
            const response = await fetch(this.settingsFile);
            if (response.ok) {
                const data = await response.json();
                this.settings = { ...this.settings, ...data };
                this.applySettings();
                this.saveToLocalStorage();
                console.log('Settings loaded from file');
            } else {
                console.log('Settings file not found, using defaults');
                this.saveSettings(); // Create default file
            }
        } catch (error) {
            console.warn('Error loading settings file:', error);
            // Create default settings file
            this.saveSettings();
        }
    }

    // Save settings to both localStorage and JSON file
    saveSettings() {
        try {
            // Save to localStorage (immediate)
            this.saveToLocalStorage();
            
            // Save to JSON file (async)
            this.saveToFile();
            
            console.log('Settings saved');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    // Save to localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('viewerSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Error saving to localStorage:', error);
        }
    }

    // Save to JSON file
    async saveToFile() {
        try {
            // Note: In a browser environment, we can't directly write to files
            // So we'll use localStorage as primary storage and provide download option
            // For server-side, you'd need a backend endpoint
            
            // Create a download link for the settings file
            const dataStr = JSON.stringify(this.settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Store in a way that can be accessed later if needed
            // For now, localStorage is the primary storage mechanism
            console.log('Settings ready to save:', this.settings);
        } catch (error) {
            console.warn('Error saving to file:', error);
        }
    }

    // Apply settings to the UI
    applySettings() {
        const uiSettings = this.settings.ui;
        
        // Apply blur settings
        if (uiSettings.blurEnabled) {
            document.documentElement.style.setProperty('--blur-intensity', `${uiSettings.blurIntensity}px`);
            
            // Update all elements with backdrop-filter
            const elementsWithBlur = document.querySelectorAll('#controls, #loading, #debug-panel, .control-btn, .effect-dropdown, .debug-close-btn, .effect-control-group');
            elementsWithBlur.forEach(el => {
                if (uiSettings.blurEnabled) {
                    el.style.backdropFilter = `blur(${uiSettings.blurIntensity}px)`;
                    el.style.webkitBackdropFilter = `blur(${uiSettings.blurIntensity}px)`;
                } else {
                    el.style.backdropFilter = 'none';
                    el.style.webkitBackdropFilter = 'none';
                }
            });
        }
    }

    // Update a setting
    updateSetting(category, key, value) {
        if (this.settings[category] && this.settings[category][key] !== undefined) {
            this.settings[category][key] = value;
            this.applySettings();
            this.saveSettings();
        }
    }

    // Get a setting
    getSetting(category, key) {
        return this.settings[category]?.[key];
    }

    // Export settings as JSON (for download)
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.settingsFile;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import settings from JSON file
    async importSettings(file) {
        try {
            const text = await file.text();
            const imported = JSON.parse(text);
            this.settings = { ...this.settings, ...imported };
            this.applySettings();
            this.saveSettings();
            console.log('Settings imported successfully');
        } catch (error) {
            console.error('Error importing settings:', error);
            throw error;
        }
    }
}

// Initialize settings manager
window.uiSettings = new UISettingsManager();

