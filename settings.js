// ============================================
// UI SETTINGS MANAGER
// ============================================
class UISettingsManager {
    constructor() {
        this.settings = {
            ui: {
                blurEnabled: true,
                blurIntensity: 15,
                tooltipScale: 1.0,
                glowEnabled: true,
                glowColor: 'rgba(100, 200, 255, 0.8)',
                glowDuration: 500,
                themeMode: 'dark',
                logoPath: 'img/favIcon.ico',
                visitUrl: '',
                locationUrl: '',
                contact: {
                    title: 'VARA Headquarters',
                    address: '123 Premium Real Estate Ave, Suite 500, Paris, France',
                    phone: '+33 1 23 45 67 89',
                    email: 'sales@vara3d.com'
                },
                toolbar: {
                    height: 70,
                    widthMode: 'full',
                    floatingMaxWidth: 1200,
                    borderRadius: 12,
                    gap: 20,
                    virtualVisitViewport: 'drawer',
                    locationViewport: 'drawer',
                    contactViewport: 'drawer',
                    infoPanelViewport: 'popup',
                    defaultLanguage: 'en'
                },
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
                        panel: 'rgba(20, 20, 20, 0.75)',
                        card: 'rgba(30, 30, 30, 0.8)',
                        hover: 'rgba(40, 40, 40, 0.9)',
                        overlay: 'rgba(18, 18, 18, 0.85)',
                        input: 'rgba(255, 255, 255, 0.05)',
                        button: 'rgba(255, 255, 255, 0.1)',
                        sliderTrack: 'rgba(255, 255, 255, 0.2)',
                        sliderThumb: '#006FEE'
                    },
                    text: {
                        primary: '#FFFFFF',
                        secondary: 'rgba(255, 255, 255, 0.7)',
                        disabled: 'rgba(255, 255, 255, 0.4)',
                        active: '#006FEE'
                    },
                    border: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        input: 'rgba(255, 255, 255, 0.3)',
                        radius: {
                            small: '8px',
                            medium: '12px',
                            large: '16px',
                            element: '12px',
                            button: '8px',
                            input: '8px'
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
            performance: {
                // Light mode for low CPU/RAM usage
                lightMode: false
            },
            controls: {
                scrubSpeed: 16
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
    async loadSettings() {
        // 1. Always try to load from server/file first (Source of Truth)
        await this.loadFromFile();
        
        // 2. Optionally check localStorage for any non-persisted local overrides, 
        // OR just rely on file if we want strict server persistence.
        // Given the user's issue, prioritizing the file is safer.
        try {
            const stored = localStorage.getItem('viewerSettings');
            if (stored) {
                const localSettings = JSON.parse(stored);
                // Optional: Deep merge localSettings ON TOP of file settings? 
                // Or just use file settings if they exist?
                // For now, let's treat the file as the primary Authority if it loaded successfully.
                // If file load completely failed (offline), we might rely on localStorage.
                
                // If we simply want to ensure file settings are used:
                console.log('Settings loaded from file (Server-side persistence)');
            }
        } catch (error) {
            console.warn('Error checking localStorage:', error);
        }

        this.applySettings();
        window.dispatchEvent(new CustomEvent('viewerSettingsLoaded'));
    }

    // Load settings from JSON file
    async loadFromFile() {
        try {
            // 1. Fetch Root Settings
            const rootResponse = await fetch(this.settingsFile).catch(() => null);
            let rootData = (rootResponse && rootResponse.ok) ? await rootResponse.json() : {};

            // 2. Fetch Client Settings (if clientID exists in URL)
            const urlParams = new URLSearchParams(window.location.search);
            const clientID = urlParams.get('clientID');
            
            let clientData = {};
            if (clientID) {
                // Try to load settings from client folder
                const clientResponse = await fetch(`${clientID}/${this.settingsFile}`).catch(() => null);
                if (clientResponse && clientResponse.ok) {
                    clientData = await clientResponse.json();
                }
            }
            
            // 3. Merge Strategies
            // Start with defaults (this.settings)
            
            // Create a merged settings object from files (Root -> Client)
            const fileSettings = { ...rootData, ...clientData };
            
            // Deep merge specific objects if they exist
            fileSettings.ui = { ...this.settings.ui, ...(rootData.ui || {}), ...(clientData.ui || {}) };
            // Migration logic for old JSON files that had .theme instead of .themes
            if (fileSettings.ui.theme && !fileSettings.ui.themes) {
                fileSettings.ui.themes = { dark: fileSettings.ui.theme, light: {} };
                delete fileSettings.ui.theme;
            }
            if (fileSettings.ui.themes) {
                 fileSettings.ui.themes = { ...this.settings.ui.themes, ...(rootData.ui?.themes || {}), ...(clientData.ui?.themes || {}) };
            }
            if (fileSettings.ui.toolbar) {
                 fileSettings.ui.toolbar = { ...this.settings.ui.toolbar, ...(rootData.ui?.toolbar || {}), ...(clientData.ui?.toolbar || {}) };
            }
            fileSettings.ui.contact = { ...this.settings.ui.contact, ...(rootData.ui?.contact || {}), ...(clientData.ui?.contact || {}) };
            if (rootData.theme || clientData.theme) {
                // Shallow merge theme for now, deep merge if robust theme support needed
                fileSettings.theme = { ...(rootData.theme || {}), ...(clientData.theme || {}) };
            }
            if (rootData.effects || clientData.effects) {
                fileSettings.effects = { ...(rootData.effects || {}), ...(clientData.effects || {}) };
            }

            // Apply merged file settings on top of current defaults
            this.settings = { ...this.settings, ...fileSettings };
            
            this.applySettings();
            window.dispatchEvent(new CustomEvent('viewerSettingsLoaded'));
            
            // Optional: Update localStorage to reflect the current loaded state?
            // this.saveToLocalStorage(); 
            
        } catch (error) {
            console.warn('Error loading settings file:', error);
            // If files fail, we still have defaults. 
            // We could try to create a default file if needed, but only for root?
            // this.saveSettings(); 
        }
    }


    // Save settings to both localStorage and JSON file
    saveSettings() {
        try {
            // Save to localStorage (immediate)
            this.saveToLocalStorage();
            
            // Save to JSON file (async)
            this.saveToFile();
            
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
        } catch (error) {
            console.warn('Error saving to file:', error);
        }
    }

    // Apply settings to the UI and effects
    applySettings() {
        const uiSettings = this.settings.ui;
        const effectSettings = this.settings.effects;
        
        // 1. Apply visual theme mode (dark vs light)
        const themeMode = uiSettings.themeMode || 'dark';
        if (themeMode === 'light') {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
            // Update toggle icon if it exists in the DOM
            const iconEl = document.getElementById('theme-toggle-icon');
            if (iconEl) iconEl.textContent = '🌙'; // Switch to Moon in light mode to suggest toggling to dark
        } else {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            const iconEl = document.getElementById('theme-toggle-icon');
            if (iconEl) iconEl.textContent = '☀️'; // Switch to Sun in dark mode to suggest toggling to light
        }

        // 2. Apply Toolbar & Layout settings
        if (uiSettings.toolbar) {
            const tb = uiSettings.toolbar;
            const root = document.body;
            
            // Spacing / gaps
            if (tb.gap !== undefined) {
                root.style.setProperty('--ui-toolbar-gap', `${tb.gap}px`);
            }
            
            // Height
            if (tb.height !== undefined) {
                root.style.setProperty('--ui-toolbar-height', `${tb.height}px`);
                // Move other absolute panels down if toolbar height is larger
                root.style.setProperty('--ui-toolbar-offset', `${tb.height + 20}px`);
            }

            // Width Mode
            if (tb.widthMode === 'floating') {
                root.style.setProperty('--ui-toolbar-top', '12px');
                root.style.setProperty('--ui-toolbar-left', '12px');
                root.style.setProperty('--ui-toolbar-right', '12px');
                root.style.setProperty('--ui-toolbar-radius', `${tb.borderRadius || 12}px`);
                root.style.setProperty('--ui-toolbar-max-width', `${tb.floatingMaxWidth || 1200}px`);
            } else {
                root.style.setProperty('--ui-toolbar-top', '0px');
                root.style.setProperty('--ui-toolbar-left', '0px');
                root.style.setProperty('--ui-toolbar-right', '0px');
                root.style.setProperty('--ui-toolbar-radius', '0px');
                root.style.setProperty('--ui-toolbar-max-width', '100%');
            }

            // Fullscreen overlays classes
            const toggleOverlayClass = (id, viewportMode) => {
                const el = document.getElementById(id);
                if (el) {
                    if (viewportMode === 'full') {
                        el.classList.add('viewport-full');
                    } else {
                        el.classList.remove('viewport-full');
                    }
                }
            };
            toggleOverlayClass('visit-overlay', tb.virtualVisitViewport);
            toggleOverlayClass('location-overlay', tb.locationViewport);
            toggleOverlayClass('contact-overlay', tb.contactViewport);
            toggleOverlayClass('plan-image-panel', tb.infoPanelViewport);
        }

        // 3. Apply custom Showcase & Contact details
        if (uiSettings.logoPath) {
            const logoImg = document.getElementById('project-logo');
            if (logoImg) logoImg.src = uiSettings.logoPath;
        }

        if (uiSettings.visitUrl) {
            const visitTab = document.getElementById('tab-visit');
            if (visitTab) visitTab.classList.remove('hidden');
            const iframe = document.getElementById('visit-iframe');
            if (iframe) iframe.src = uiSettings.visitUrl;
        }

        const effectiveCoords = uiSettings.locationUrl || '42.1158762,12.7758299';
        const streetAddress = uiSettings.locationAddress || uiSettings.contact?.address || '123 Premium Real Estate Ave, Paris';
        const combinedAddress = `${streetAddress} • ${effectiveCoords}`;

        const locationTab = document.getElementById('tab-location');
        if (locationTab) locationTab.classList.remove('hidden');
        const iframe = document.getElementById('location-iframe');
        if (iframe) {
            if (effectiveCoords.includes('google.com/maps/embed')) {
                iframe.src = effectiveCoords;
            } else {
                const match = effectiveCoords.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (match) {
                    iframe.src = `https://maps.google.com/maps?q=${match[1]},${match[2]}&t=k&z=18&output=embed`;
                } else {
                    iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(effectiveCoords)}&t=k&z=18&output=embed`;
                }
            }
        }
        const locValAddress = document.getElementById('loc-val-address');
        if (locValAddress) locValAddress.textContent = combinedAddress;

        const openMapsBtn = document.getElementById('loc-open-maps-btn');
        if (openMapsBtn) {
            if (effectiveCoords.includes('google.com') || effectiveCoords.includes('google.fr')) {
                openMapsBtn.href = effectiveCoords;
            } else {
                openMapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(effectiveCoords)}`;
            }
        }

        const contactValAddress = document.getElementById('contact-val-address');
        if (contactValAddress) contactValAddress.textContent = streetAddress;

        if (uiSettings.contact) {
            const contact = uiSettings.contact;
            const titleEl = document.getElementById('contact-card-title');
            if (titleEl && contact.title) titleEl.textContent = contact.title;
            
            const addressEl = document.getElementById('contact-val-address');
            if (addressEl && contact.address) {
                addressEl.textContent = contact.address;
                const locValAddress = document.getElementById('loc-val-address');
                if (locValAddress) locValAddress.textContent = contact.address;
            }
            
            const phoneEl = document.getElementById('contact-val-phone');
            if (phoneEl && contact.phone) {
                phoneEl.textContent = contact.phone;
                const locValPhone = document.getElementById('loc-val-phone');
                if (locValPhone) locValPhone.textContent = contact.phone;
            }
            
            const emailEl = document.getElementById('contact-val-email');
            if (emailEl && contact.email) {
                emailEl.textContent = contact.email;
                const locValEmail = document.getElementById('loc-val-email');
                if (locValEmail) locValEmail.textContent = contact.email;
            }
        }

        // Apply theme settings
        if (uiSettings.theme) {
            this.applyTheme(uiSettings.theme);
        }
        
        // Apply blur settings
        if (uiSettings.blurEnabled !== undefined) {
             document.body.style.setProperty('--blur-intensity', `${uiSettings.blurIntensity || 15}px`);
             
             // Update all elements with backdrop-filter
             const elementsWithBlur = document.querySelectorAll('#controls, #loading, #debug-panel, #ui-settings-panel, #plan-image-panel, .control-btn, .effect-dropdown, .debug-close-btn, .effect-control-group, #top-toolbar, .showcase-overlay');
             elementsWithBlur.forEach(el => {
                 if (uiSettings.blurEnabled) {
                     el.style.backdropFilter = `blur(${uiSettings.blurIntensity || 15}px)`;
                     el.style.webkitBackdropFilter = `blur(${uiSettings.blurIntensity || 15}px)`;
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
            
            // Apply Advanced Particle Systems
            if (effectSettings.ambientParticles) {
                if (!CONFIG_3D.AMBIENT_PARTICLES) CONFIG_3D.AMBIENT_PARTICLES = {};
                // Deep merge/copy to ensure CONFIG_3D reflects saved state
                CONFIG_3D.AMBIENT_PARTICLES = JSON.parse(JSON.stringify(effectSettings.ambientParticles));
            }
            
            if (effectSettings.boxParticles) {
                if (!CONFIG_3D.BOX_PARTICLES) CONFIG_3D.BOX_PARTICLES = {};
                // Deep merge/copy to ensure CONFIG_3D reflects saved state
                CONFIG_3D.BOX_PARTICLES = JSON.parse(JSON.stringify(effectSettings.boxParticles));
            }
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
            
            // Sync Advanced Particle Systems
            if (CONFIG_3D.AMBIENT_PARTICLES) {
                this.settings.effects.ambientParticles = JSON.parse(JSON.stringify(CONFIG_3D.AMBIENT_PARTICLES));
            }
            if (CONFIG_3D.BOX_PARTICLES) {
                this.settings.effects.boxParticles = JSON.parse(JSON.stringify(CONFIG_3D.BOX_PARTICLES));
            }
            
            // Save to localStorage and file
            this.saveSettings();
        }
    }

    // Get a setting value
    getSetting(category, key) {
        if (this.settings[category] && this.settings[category][key] !== undefined) {
            return this.settings[category][key];
        }
        return null;
    }

    // Update a setting
    updateSetting(category, key, value) {
        if (this.settings[category] && this.settings[category][key] !== undefined) {
            this.settings[category][key] = value;
            this.applySettings();
            this.saveSettings();
        }
    }
    
    // Apply theme settings to CSS variables
    applyTheme(overrideTheme) {
        const mode = this.settings.ui?.themeMode || 'dark';
        const themes = this.settings.ui?.themes || {};
        const theme = overrideTheme || themes[mode] || this.settings.ui?.theme || {};
        if (!theme) return;

        const root = document.body;
        
        // Colors
        if (theme.primary) {
            Object.keys(theme.primary).forEach(k => {
                root.style.setProperty(`--ui-primary-${k}`, theme.primary[k]);
            });
        }
        if (theme.secondary) {
            Object.keys(theme.secondary).forEach(k => {
                root.style.setProperty(`--ui-secondary-${k}`, theme.secondary[k]);
            });
        }
        if (theme.success) root.style.setProperty('--ui-success', theme.success);
        if (theme.warning) root.style.setProperty('--ui-warning', theme.warning);
        if (theme.danger) root.style.setProperty('--ui-danger', theme.danger);
        
        // Backgrounds
        if (theme.background) {
            if (theme.background.default) root.style.setProperty('--ui-bg-default', theme.background.default);
            if (theme.background.panel) root.style.setProperty('--ui-bg-panel', theme.background.panel);
            if (theme.background.card) root.style.setProperty('--ui-bg-card', theme.background.card);
            if (theme.background.hover) root.style.setProperty('--ui-bg-hover', theme.background.hover);
            if (theme.background.overlay) root.style.setProperty('--ui-bg-overlay', theme.background.overlay);
            if (theme.background.input) root.style.setProperty('--ui-input-bg', theme.background.input);
            if (theme.background.button) root.style.setProperty('--ui-button-bg', theme.background.button);
            if (theme.background.sliderTrack) root.style.setProperty('--ui-slider-track', theme.background.sliderTrack);
            if (theme.background.sliderThumb) root.style.setProperty('--ui-slider-thumb', theme.background.sliderThumb);
        }
        
        // Text
        if (theme.text) {
            if (theme.text.primary) root.style.setProperty('--ui-text-primary', theme.text.primary);
            if (theme.text.secondary) root.style.setProperty('--ui-text-secondary', theme.text.secondary);
            if (theme.text.disabled) root.style.setProperty('--ui-text-disabled', theme.text.disabled);
            if (theme.text.active) root.style.setProperty('--ui-text-active', theme.text.active);
        }
        
        // Border
        if (theme.border) {
            if (theme.border.color) root.style.setProperty('--ui-border-color', theme.border.color);
            if (theme.border.input) root.style.setProperty('--ui-input-border', theme.border.input);
            if (theme.border.width) root.style.setProperty('--ui-border-width', theme.border.width);
            if (theme.border.radius) {
                if (theme.border.radius.small) root.style.setProperty('--ui-border-radius-sm', theme.border.radius.small);
                if (theme.border.radius.medium) root.style.setProperty('--ui-border-radius-md', theme.border.radius.medium);
                if (theme.border.radius.large) root.style.setProperty('--ui-border-radius-lg', theme.border.radius.large);
                if (theme.border.radius.element) root.style.setProperty('--ui-border-radius-element', theme.border.radius.element);
                if (theme.border.radius.button) root.style.setProperty('--ui-border-radius-button', theme.border.radius.button);
                if (theme.border.radius.input) root.style.setProperty('--ui-border-radius-input', theme.border.radius.input);
            }
        }
        
        // Spacing
        if (theme.spacing) {
            Object.keys(theme.spacing).forEach(k => {
                root.style.setProperty(`--ui-spacing-${k}`, theme.spacing[k]);
            });
        }
        
        // Shadow
        if (theme.shadow) {
            Object.keys(theme.shadow).forEach(k => {
                root.style.setProperty(`--ui-shadow-${k}`, theme.shadow[k]);
            });
        }
        
        // Font
        if (theme.font) {
            if (theme.font.family) root.style.setProperty('--ui-font-family', theme.font.family);
            if (theme.font.size) {
                Object.keys(theme.font.size).forEach(k => {
                    root.style.setProperty(`--ui-font-size-${k}`, theme.font.size[k]);
                });
            }
            if (theme.font.weight) {
                Object.keys(theme.font.weight).forEach(k => {
                    root.style.setProperty(`--ui-font-weight-${k}`, theme.font.weight[k]);
                });
            }
        }
    }

    // Save to JSON file
    async saveToFile() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const clientID = urlParams.get('clientID');
            
            if (!clientID) {
                console.warn('Cannot save settings: No clientID found');
                return;
            }

            const filename = `${clientID}/${this.settingsFile}`;
            const content = JSON.stringify(this.settings, null, 2);

            // Use the server API to save the file
            const response = await fetch('/api/save-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: filename,
                    content: content
                })
            });

            if (response.ok) {
                console.log(`Settings saved to ${filename} successfully`);
            } else {
                console.error(`Failed to save settings to ${filename}`);
            }
            
        } catch (error) {
            console.warn('Error saving to file:', error);
        }
    }
}

// Instantiate the settings manager globally
window.uiSettings = new UISettingsManager();

