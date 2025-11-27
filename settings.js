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
                glowDuration: 500,
                theme: {
                    mode: 'dark',
                    primary: {
                        50: '#E6F1FE',
                        100: '#CCE3FD',
                        200: '#99C7FB',
                        300: '#66AAF9',
                        400: '#338EF7',
                        500: '#006FEE',
                        600: '#005BC4',
                        700: '#004493',
                        800: '#002E62',
                        900: '#001731'
                    },
                    secondary: {
                        50: '#F5F5F5',
                        100: '#E0E0E0',
                        200: '#BDBDBD',
                        300: '#9E9E9E',
                        400: '#757575',
                        500: '#616161',
                        600: '#424242',
                        700: '#303030',
                        800: '#212121',
                        900: '#121212'
                    },
                    success: '#00C851',
                    warning: '#FFBB33',
                    danger: '#FF4444',
                    background: {
                        default: 'rgba(0, 0, 0, 0.85)',
                        panel: 'rgba(20, 20, 20, 0.95)',
                        card: 'rgba(30, 30, 30, 0.9)',
                        hover: 'rgba(40, 40, 40, 0.9)'
                    },
                    text: {
                        primary: '#FFFFFF',
                        secondary: 'rgba(255, 255, 255, 0.7)',
                        disabled: 'rgba(255, 255, 255, 0.4)'
                    },
                    border: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        radius: {
                            small: '8px',
                            medium: '12px',
                            large: '16px'
                        },
                        width: '2px'
                    },
                    spacing: {
                        xs: '4px',
                        sm: '8px',
                        md: '12px',
                        lg: '16px',
                        xl: '24px',
                        '2xl': '32px'
                    },
                    shadow: {
                        sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        md: '0 4px 8px rgba(0, 0, 0, 0.3)',
                        lg: '0 8px 16px rgba(0, 0, 0, 0.4)',
                        xl: '0 12px 24px rgba(0, 0, 0, 0.5)'
                    },
                    font: {
                        family: 'system-ui, -apple-system, sans-serif',
                        size: {
                            xs: '12px',
                            sm: '13px',
                            md: '14px',
                            lg: '16px',
                            xl: '18px',
                            '2xl': '24px'
                        },
                        weight: {
                            normal: '400',
                            medium: '500',
                            semibold: '600',
                            bold: '700'
                        }
                    }
                }
            },
            effects: {
                // Effect type
                effectType: 'solid',
                
                // Solid effect
                solidPulseSpeed: 1.0,
                hoverOpacity: 0.5,
                hoverColor: 0x175ddc,
                glowColor: 0x175ddc,
                
                // Outline effect
                outlineColor: 0x00ff00,
                outlinePulseSpeed: 8.0,
                
                // Glow/Bloom effect
                bloomStrength: 2.5,
                bloomRadius: 1.0,
                bloomThreshold: 0.5,
                
                // Scan effect
                scanSpeed: 2.0,
                scanLineCount: 15,
                scanColor: 0x00ffff,
                scanOpacity: 0.8,
                
                // Particle effect
                particleCount: 500,
                particleSize: 0.05,
                particleSpeed: 10.0,
                particleColor: 0xffff00,
                particleOpacity: 0.8
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

    // Apply settings to the UI and effects
    applySettings() {
        const uiSettings = this.settings.ui;
        const effectSettings = this.settings.effects;
        
        // Apply theme settings
        if (uiSettings.theme) {
            this.applyTheme(uiSettings.theme);
        }
        
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
        
        // Apply effect settings if CONFIG_3D exists
        if (typeof CONFIG_3D !== 'undefined' && effectSettings) {
            // Apply all effect settings
            if (effectSettings.effectType !== undefined) CONFIG_3D.EFFECT_TYPE = effectSettings.effectType;
            if (effectSettings.solidPulseSpeed !== undefined) CONFIG_3D.SOLID_PULSE_SPEED = effectSettings.solidPulseSpeed;
            if (effectSettings.hoverOpacity !== undefined) CONFIG_3D.HOVER_OPACITY = effectSettings.hoverOpacity;
            if (effectSettings.hoverColor !== undefined) CONFIG_3D.HOVER_COLOR = effectSettings.hoverColor;
            if (effectSettings.glowColor !== undefined) CONFIG_3D.GLOW_COLOR = effectSettings.glowColor;
            if (effectSettings.outlineColor !== undefined) CONFIG_3D.OUTLINE_COLOR = effectSettings.outlineColor;
            if (effectSettings.outlinePulseSpeed !== undefined) CONFIG_3D.OUTLINE_PULSE_SPEED = effectSettings.outlinePulseSpeed;
            if (effectSettings.bloomStrength !== undefined) CONFIG_3D.BLOOM_STRENGTH = effectSettings.bloomStrength;
            if (effectSettings.bloomRadius !== undefined) CONFIG_3D.BLOOM_RADIUS = effectSettings.bloomRadius;
            if (effectSettings.bloomThreshold !== undefined) CONFIG_3D.BLOOM_THRESHOLD = effectSettings.bloomThreshold;
            if (effectSettings.scanSpeed !== undefined) CONFIG_3D.SCAN_SPEED = effectSettings.scanSpeed;
            if (effectSettings.scanLineCount !== undefined) CONFIG_3D.SCAN_LINE_COUNT = effectSettings.scanLineCount;
            if (effectSettings.scanColor !== undefined) CONFIG_3D.SCAN_COLOR = effectSettings.scanColor;
            if (effectSettings.scanOpacity !== undefined) CONFIG_3D.SCAN_OPACITY = effectSettings.scanOpacity;
            if (effectSettings.particleCount !== undefined) CONFIG_3D.PARTICLE_COUNT = effectSettings.particleCount;
            if (effectSettings.particleSize !== undefined) CONFIG_3D.PARTICLE_SIZE = effectSettings.particleSize;
            if (effectSettings.particleSpeed !== undefined) CONFIG_3D.PARTICLE_SPEED = effectSettings.particleSpeed;
            if (effectSettings.particleColor !== undefined) CONFIG_3D.PARTICLE_COLOR = effectSettings.particleColor;
            if (effectSettings.particleOpacity !== undefined) CONFIG_3D.PARTICLE_OPACITY = effectSettings.particleOpacity;
        }
    }
    
    // Save effect settings (called when effect settings change)
    saveEffectSettings() {
        if (typeof CONFIG_3D !== 'undefined') {
            // Sync CONFIG_3D values to settings
            if (!this.settings.effects) this.settings.effects = {};
            this.settings.effects.effectType = CONFIG_3D.EFFECT_TYPE;
            this.settings.effects.solidPulseSpeed = CONFIG_3D.SOLID_PULSE_SPEED;
            this.settings.effects.hoverOpacity = CONFIG_3D.HOVER_OPACITY;
            this.settings.effects.hoverColor = CONFIG_3D.HOVER_COLOR;
            this.settings.effects.glowColor = CONFIG_3D.GLOW_COLOR !== undefined ? CONFIG_3D.GLOW_COLOR : CONFIG_3D.HOVER_COLOR;
            this.settings.effects.outlineColor = CONFIG_3D.OUTLINE_COLOR;
            this.settings.effects.outlinePulseSpeed = CONFIG_3D.OUTLINE_PULSE_SPEED;
            this.settings.effects.bloomStrength = CONFIG_3D.BLOOM_STRENGTH;
            this.settings.effects.bloomRadius = CONFIG_3D.BLOOM_RADIUS;
            this.settings.effects.bloomThreshold = CONFIG_3D.BLOOM_THRESHOLD;
            this.settings.effects.scanSpeed = CONFIG_3D.SCAN_SPEED;
            this.settings.effects.scanLineCount = CONFIG_3D.SCAN_LINE_COUNT;
            this.settings.effects.scanColor = CONFIG_3D.SCAN_COLOR;
            this.settings.effects.scanOpacity = CONFIG_3D.SCAN_OPACITY;
            this.settings.effects.particleCount = CONFIG_3D.PARTICLE_COUNT;
            this.settings.effects.particleSize = CONFIG_3D.PARTICLE_SIZE;
            this.settings.effects.particleSpeed = CONFIG_3D.PARTICLE_SPEED;
            this.settings.effects.particleColor = CONFIG_3D.PARTICLE_COLOR;
            this.settings.effects.particleOpacity = CONFIG_3D.PARTICLE_OPACITY;
            
            // Save to localStorage and file
            this.saveSettings();
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

    // Apply theme to CSS variables
    applyTheme(theme) {
        const root = document.documentElement;
        console.log('[Settings] Applying theme:', theme);
        
        // Apply primary colors
        if (theme.primary) {
            Object.keys(theme.primary).forEach(key => {
                const value = theme.primary[key];
                root.style.setProperty(`--ui-primary-${key}`, value);
                console.log(`[Settings] Set --ui-primary-${key} = ${value}`);
            });
        }
        
        // Apply secondary colors
        if (theme.secondary) {
            Object.keys(theme.secondary).forEach(key => {
                root.style.setProperty(`--ui-secondary-${key}`, theme.secondary[key]);
            });
        }
        
        // Apply semantic colors
        if (theme.success) root.style.setProperty('--ui-success', theme.success);
        if (theme.warning) root.style.setProperty('--ui-warning', theme.warning);
        if (theme.danger) root.style.setProperty('--ui-danger', theme.danger);
        
        // Apply background colors
        if (theme.background) {
            if (theme.background.default) {
                root.style.setProperty('--ui-bg-default', theme.background.default);
                console.log('[Settings] Set --ui-bg-default =', theme.background.default);
            }
            if (theme.background.panel) {
                root.style.setProperty('--ui-bg-panel', theme.background.panel);
                console.log('[Settings] Set --ui-bg-panel =', theme.background.panel);
            }
            if (theme.background.card) {
                root.style.setProperty('--ui-bg-card', theme.background.card);
                console.log('[Settings] Set --ui-bg-card =', theme.background.card);
            }
            if (theme.background.hover) {
                root.style.setProperty('--ui-bg-hover', theme.background.hover);
                console.log('[Settings] Set --ui-bg-hover =', theme.background.hover);
            }
            // Toolbar background can use card or a custom value
            if (theme.background.toolbar) {
                root.style.setProperty('--ui-toolbar-bg', theme.background.toolbar);
                console.log('[Settings] Set --ui-toolbar-bg =', theme.background.toolbar);
            } else if (theme.background.card) {
                // Use card background for toolbar if no specific toolbar color
                root.style.setProperty('--ui-toolbar-bg', theme.background.card);
                console.log('[Settings] Set --ui-toolbar-bg =', theme.background.card, '(from card)');
            }
        }
        
        // Apply text colors
        if (theme.text) {
            if (theme.text.primary) root.style.setProperty('--ui-text-primary', theme.text.primary);
            if (theme.text.secondary) root.style.setProperty('--ui-text-secondary', theme.text.secondary);
            if (theme.text.disabled) root.style.setProperty('--ui-text-disabled', theme.text.disabled);
        }
        
        // Apply border settings
        if (theme.border) {
            if (theme.border.color) {
                root.style.setProperty('--ui-border-color', theme.border.color);
                console.log('[Settings] Set --ui-border-color =', theme.border.color);
                // Also update toolbar border if no specific value
                if (!theme.border.toolbar) {
                    root.style.setProperty('--ui-toolbar-border', theme.border.color);
                    console.log('[Settings] Set --ui-toolbar-border =', theme.border.color, '(from border color)');
                }
            }
            if (theme.border.toolbar) {
                root.style.setProperty('--ui-toolbar-border', theme.border.toolbar);
                console.log('[Settings] Set --ui-toolbar-border =', theme.border.toolbar);
            }
            if (theme.border.width) {
                root.style.setProperty('--ui-border-width', theme.border.width);
                console.log('[Settings] Set --ui-border-width =', theme.border.width);
            }
            if (theme.border.radius) {
                if (theme.border.radius.small) root.style.setProperty('--ui-border-radius-sm', theme.border.radius.small);
                if (theme.border.radius.medium) root.style.setProperty('--ui-border-radius-md', theme.border.radius.medium);
                if (theme.border.radius.large) root.style.setProperty('--ui-border-radius-lg', theme.border.radius.large);
            }
        }
        
        // Apply spacing
        if (theme.spacing) {
            Object.keys(theme.spacing).forEach(key => {
                root.style.setProperty(`--ui-spacing-${key}`, theme.spacing[key]);
            });
        }
        
        // Apply shadows
        if (theme.shadow) {
            Object.keys(theme.shadow).forEach(key => {
                root.style.setProperty(`--ui-shadow-${key}`, theme.shadow[key]);
            });
        }
        
        // Apply font settings
        if (theme.font) {
            if (theme.font.family) root.style.setProperty('--ui-font-family', theme.font.family);
            if (theme.font.size) {
                Object.keys(theme.font.size).forEach(key => {
                    root.style.setProperty(`--ui-font-size-${key}`, theme.font.size[key]);
                });
            }
            if (theme.font.weight) {
                Object.keys(theme.font.weight).forEach(key => {
                    root.style.setProperty(`--ui-font-weight-${key}`, theme.font.weight[key]);
                });
            }
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

// Wait for viewer3d to be loaded, then apply effect settings
window.addEventListener('DOMContentLoaded', () => {
    // Apply settings after a short delay to ensure CONFIG_3D is loaded
    setTimeout(() => {
        if (window.uiSettings && typeof CONFIG_3D !== 'undefined') {
            window.uiSettings.applySettings();
        }
    }, 100);
});

