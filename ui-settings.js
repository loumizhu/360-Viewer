// ============================================
// UI SETTINGS PANEL MANAGER
// ============================================
class UISettingsPanel {
    constructor() {
        this.panel = document.getElementById('ui-settings-panel');
        this.toggleBtn = document.getElementById('uiSettingsToggleBtn');
        this.closeBtn = document.getElementById('uiSettingsCloseBtn');
        
        if (!this.panel) {
            console.error('UI Settings Panel not found in DOM');
            return;
        }
        
        this.content = this.panel.querySelector('.ui-settings-content');
        
        if (!this.content) {
            console.error('UI Settings Content not found in DOM');
            return;
        }
        
        this.init();
    }
    
    init() {
        console.log('[UI Settings] Initializing...');
        console.log('[UI Settings] Panel:', this.panel);
        console.log('[UI Settings] Toggle Button:', this.toggleBtn);
        console.log('[UI Settings] Close Button:', this.closeBtn);
        console.log('[UI Settings] Content:', this.content);
        
        // Toggle button
        if (this.toggleBtn) {
            console.log('[UI Settings] Adding click listener to toggle button');
            this.toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[UI Settings] Toggle button clicked!');
                this.toggle();
            });
        } else {
            console.error('[UI Settings] Toggle Button not found!');
        }
        
        // Close button
        if (this.closeBtn) {
            console.log('[UI Settings] Adding click listener to close button');
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[UI Settings] Close button clicked!');
                this.hide();
            });
        } else {
            console.warn('[UI Settings] Close Button not found');
        }
        
        // Build the settings UI
        console.log('[UI Settings] Building settings UI...');
        this.buildSettingsUI();
        console.log('[UI Settings] Initialization complete');
    }
    
    toggle() {
        console.log('[UI Settings] toggle() called');
        if (!this.panel) {
            console.error('[UI Settings] Cannot toggle: Panel element not found');
            return;
        }
        
        const isHidden = this.panel.classList.contains('hidden');
        console.log('[UI Settings] Panel has hidden class:', isHidden);
        console.log('[UI Settings] Panel current display:', window.getComputedStyle(this.panel).display);
        console.log('[UI Settings] Panel current visibility:', window.getComputedStyle(this.panel).visibility);
        console.log('[UI Settings] Panel current opacity:', window.getComputedStyle(this.panel).opacity);
        
        if (isHidden) {
            console.log('[UI Settings] Showing panel...');
            this.show();
        } else {
            console.log('[UI Settings] Hiding panel...');
            this.hide();
        }
    }
    
    show() {
        console.log('[UI Settings] show() called');
        if (!this.panel) {
            console.error('[UI Settings] Panel element not found');
            return;
        }
        
        console.log('[UI Settings] Before show - classes:', this.panel.className);
        console.log('[UI Settings] Before show - computed display:', window.getComputedStyle(this.panel).display);
        console.log('[UI Settings] Before show - inline styles:', this.panel.style.cssText);
        
        // Remove hidden class
        this.panel.classList.remove('hidden');
        console.log('[UI Settings] Removed hidden class, classes now:', this.panel.className);
        
        // Use setProperty with important flag to override !important in CSS
        this.panel.style.setProperty('display', 'flex', 'important');
        this.panel.style.setProperty('visibility', 'visible', 'important');
        this.panel.style.setProperty('opacity', '1', 'important');
        
        console.log('[UI Settings] After show - inline styles:', this.panel.style.cssText);
        console.log('[UI Settings] After show - computed display:', window.getComputedStyle(this.panel).display);
        console.log('[UI Settings] After show - computed visibility:', window.getComputedStyle(this.panel).visibility);
        console.log('[UI Settings] After show - computed opacity:', window.getComputedStyle(this.panel).opacity);
        console.log('[UI Settings] Panel element:', this.panel);
        console.log('[UI Settings] Panel position:', this.panel.getBoundingClientRect());
    }
    
    hide() {
        console.log('[UI Settings] hide() called');
        if (!this.panel) {
            console.error('[UI Settings] Panel element not found');
            return;
        }
        
        console.log('[UI Settings] Before hide - classes:', this.panel.className);
        console.log('[UI Settings] Before hide - computed display:', window.getComputedStyle(this.panel).display);
        
        // Add hidden class
        this.panel.classList.add('hidden');
        
        // Use setProperty with important flag to override !important in CSS
        this.panel.style.setProperty('display', 'none', 'important');
        this.panel.style.setProperty('visibility', 'hidden', 'important');
        this.panel.style.setProperty('opacity', '0', 'important');
        this.panel.style.setProperty('pointer-events', 'none', 'important');
        
        console.log('[UI Settings] After hide - inline styles:', this.panel.style.cssText);
        console.log('[UI Settings] After hide - computed display:', window.getComputedStyle(this.panel).display);
        console.log('[UI Settings] Panel hidden successfully');
    }
    
    buildSettingsUI() {
        if (!this.content) {
            console.error('Content element not found');
            return;
        }
        
        if (!window.uiSettings) {
            console.warn('uiSettings not available yet, retrying...');
            setTimeout(() => this.buildSettingsUI(), 100);
            return;
        }
        
        const theme = window.uiSettings.getSetting('ui', 'theme') || {};
        
        // Don't clear the effect settings section - it's already in the HTML
        // Just clear other sections and rebuild them
        const effectSection = this.content.querySelector('#effect-settings-section');
        const otherSections = Array.from(this.content.children).filter(child => child.id !== 'effect-settings-section');
        
        // Remove only non-effect sections
        otherSections.forEach(section => section.remove());
        
        // Colors Section
        this.createColorsSection(theme);
        
        // Background Section
        this.createBackgroundSection(theme);
        
        // Text Section
        this.createTextSection(theme);
        
        // Border Section
        this.createBorderSection(theme);
        
        // Spacing Section
        this.createSpacingSection(theme);
        
        // Font Section
        this.createFontSection(theme);
        
        // Blur Section
        this.createBlurSection();
        
        // Re-initialize effect controls after UI is built
        // Make sure effect controls container exists and is populated
        setTimeout(() => {
            const effectControls = document.getElementById('effect-controls');
            if (effectControls && effectControls.children.length === 0) {
                console.log('Effect controls container is empty, initializing...');
                if (window.viewer3D && window.viewer3D.setupEffectSelector) {
                    window.viewer3D.setupEffectSelector();
                }
            } else if (effectControls) {
                console.log('Effect controls already populated with', effectControls.children.length, 'sections');
            } else {
                console.warn('Effect controls container not found');
            }
        }, 100);
    }
    
    createColorsSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Colors';
        section.appendChild(title);
        
        // Primary Color
        const primaryGroup = document.createElement('div');
        primaryGroup.className = 'ui-settings-group';
        primaryGroup.innerHTML = `
            <label class="ui-settings-label">Primary Color (500)</label>
            <input type="color" class="ui-settings-color-input" id="ui-primary-500" 
                   value="${this.hexToColor((theme.primary && theme.primary[500]) || '#006FEE')}">
        `;
        section.appendChild(primaryGroup);
        
        // Success Color
        const successGroup = document.createElement('div');
        successGroup.className = 'ui-settings-group';
        successGroup.innerHTML = `
            <label class="ui-settings-label">Success Color</label>
            <input type="color" class="ui-settings-color-input" id="ui-success" 
                   value="${this.hexToColor(theme.success || '#00C851')}">
        `;
        section.appendChild(successGroup);
        
        // Warning Color
        const warningGroup = document.createElement('div');
        warningGroup.className = 'ui-settings-group';
        warningGroup.innerHTML = `
            <label class="ui-settings-label">Warning Color</label>
            <input type="color" class="ui-settings-color-input" id="ui-warning" 
                   value="${this.hexToColor(theme.warning || '#FFBB33')}">
        `;
        section.appendChild(warningGroup);
        
        // Danger Color
        const dangerGroup = document.createElement('div');
        dangerGroup.className = 'ui-settings-group';
        dangerGroup.innerHTML = `
            <label class="ui-settings-label">Danger Color</label>
            <input type="color" class="ui-settings-color-input" id="ui-danger" 
                   value="${this.hexToColor(theme.danger || '#FF4444')}">
        `;
        section.appendChild(dangerGroup);
        
        // Add event listeners
        section.querySelectorAll('.ui-settings-color-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateColorSetting(e.target.id, e.target.value);
            });
        });
        
        this.content.appendChild(section);
    }
    
    createBackgroundSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Background';
        section.appendChild(title);
        
        const backgrounds = [
            { key: 'default', label: 'Default Background' },
            { key: 'panel', label: 'Panel Background' },
            { key: 'card', label: 'Card Background' },
            { key: 'hover', label: 'Hover Background' },
            { key: 'toolbar', label: 'Toolbar Background' }
        ];
        
        backgrounds.forEach(bg => {
            const group = document.createElement('div');
            group.className = 'ui-settings-group';
            group.innerHTML = `
                <label class="ui-settings-label">${bg.label}</label>
                <input type="color" class="ui-settings-color-input" id="ui-bg-${bg.key}" 
                       value="${this.rgbaToColor((theme.background && theme.background[bg.key]) || this.getDefaultBackground(bg.key))}">
            `;
            
            group.querySelector('input').addEventListener('change', (e) => {
                this.updateBackgroundSetting(bg.key, e.target.value);
            });
            
            section.appendChild(group);
        });
        
        this.content.appendChild(section);
    }
    
    createTextSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Text Colors';
        section.appendChild(title);
        
        const textColors = [
            { key: 'primary', label: 'Primary Text' },
            { key: 'secondary', label: 'Secondary Text' },
            { key: 'disabled', label: 'Disabled Text' }
        ];
        
        textColors.forEach(text => {
            const group = document.createElement('div');
            group.className = 'ui-settings-group';
            group.innerHTML = `
                <label class="ui-settings-label">${text.label}</label>
                <input type="color" class="ui-settings-color-input" id="ui-text-${text.key}" 
                       value="${this.rgbaToColor((theme.text && theme.text[text.key]) || this.getDefaultText(text.key))}">
            `;
            
            group.querySelector('input').addEventListener('change', (e) => {
                this.updateTextSetting(text.key, e.target.value);
            });
            
            section.appendChild(group);
        });
        
        this.content.appendChild(section);
    }
    
    createBorderSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Border';
        section.appendChild(title);
        
        // Border Color
        const colorGroup = document.createElement('div');
        colorGroup.className = 'ui-settings-group';
        colorGroup.innerHTML = `
            <label class="ui-settings-label">Border Color</label>
            <input type="color" class="ui-settings-color-input" id="ui-border-color" 
                   value="${this.rgbaToColor((theme.border && theme.border.color) || 'rgba(255, 255, 255, 0.2)')}">
        `;
        colorGroup.querySelector('input').addEventListener('change', (e) => {
            this.updateBorderSetting('color', e.target.value);
        });
        section.appendChild(colorGroup);
        
        // Toolbar Border Color
        const toolbarBorderGroup = document.createElement('div');
        toolbarBorderGroup.className = 'ui-settings-group';
        toolbarBorderGroup.innerHTML = `
            <label class="ui-settings-label">Toolbar Border Color</label>
            <input type="color" class="ui-settings-color-input" id="ui-toolbar-border" 
                   value="${this.rgbaToColor((theme.border && theme.border.toolbar) || 'rgba(255, 255, 255, 0.18)')}">
        `;
        toolbarBorderGroup.querySelector('input').addEventListener('change', (e) => {
            this.updateBorderSetting('toolbar', e.target.value);
        });
        section.appendChild(toolbarBorderGroup);
        
        // Border Width
        const widthGroup = document.createElement('div');
        widthGroup.className = 'ui-settings-group';
        widthGroup.innerHTML = `
            <label class="ui-settings-label">Border Width: <span class="ui-settings-value" id="border-width-value">${(theme.border && theme.border.width) || '2px'}</span></label>
            <input type="range" class="ui-settings-slider" id="ui-border-width" 
                   min="1" max="8" step="1" value="${parseInt((theme.border && theme.border.width) || '2px')}">
        `;
        widthGroup.querySelector('input').addEventListener('input', (e) => {
            const value = `${e.target.value}px`;
            document.getElementById('border-width-value').textContent = value;
            this.updateBorderSetting('width', value);
        });
        section.appendChild(widthGroup);
        
        this.content.appendChild(section);
    }
    
    createSpacingSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Spacing';
        section.appendChild(title);
        
        const spacings = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const defaultSpacings = { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px' };
        
        spacings.forEach(spacing => {
            const group = document.createElement('div');
            group.className = 'ui-settings-group';
            const value = (theme.spacing && theme.spacing[spacing]) || defaultSpacings[spacing];
            group.innerHTML = `
                <label class="ui-settings-label">${spacing.toUpperCase()}: <span class="ui-settings-value" id="spacing-${spacing}-value">${value}</span></label>
                <input type="range" class="ui-settings-slider" id="ui-spacing-${spacing}" 
                       min="2" max="64" step="2" value="${parseInt(value)}">
            `;
            
            group.querySelector('input').addEventListener('input', (e) => {
                const val = `${e.target.value}px`;
                document.getElementById(`spacing-${spacing}-value`).textContent = val;
                this.updateSpacingSetting(spacing, val);
            });
            
            section.appendChild(group);
        });
        
        this.content.appendChild(section);
    }
    
    createFontSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Font';
        section.appendChild(title);
        
        // Font Family
        const familyGroup = document.createElement('div');
        familyGroup.className = 'ui-settings-group';
        familyGroup.innerHTML = `
            <label class="ui-settings-label">Font Family</label>
            <input type="text" class="ui-settings-input" id="ui-font-family" 
                   value="${(theme.font && theme.font.family) || 'system-ui, -apple-system, sans-serif'}" 
                   placeholder="system-ui, -apple-system, sans-serif">
        `;
        familyGroup.querySelector('input').addEventListener('change', (e) => {
            this.updateFontSetting('family', e.target.value);
        });
        section.appendChild(familyGroup);
        
        this.content.appendChild(section);
    }
    
    createBlurSection() {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Blur Effects';
        section.appendChild(title);
        
        // Blur Enabled
        const enabledGroup = document.createElement('div');
        enabledGroup.className = 'ui-settings-toggle';
        enabledGroup.innerHTML = `
            <label class="ui-settings-toggle-label">Enable Blur</label>
            <label class="ui-settings-switch">
                <input type="checkbox" id="ui-blur-enabled" 
                       ${window.uiSettings.getSetting('ui', 'blurEnabled') ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        enabledGroup.querySelector('input').addEventListener('change', (e) => {
            window.uiSettings.updateSetting('ui', 'blurEnabled', e.target.checked);
        });
        section.appendChild(enabledGroup);
        
        // Blur Intensity
        const intensityGroup = document.createElement('div');
        intensityGroup.className = 'ui-settings-group';
        const blurIntensity = window.uiSettings.getSetting('ui', 'blurIntensity') || 15;
        intensityGroup.innerHTML = `
            <label class="ui-settings-label">Blur Intensity: <span class="ui-settings-value" id="blur-intensity-value">${blurIntensity}px</span></label>
            <input type="range" class="ui-settings-slider" id="ui-blur-intensity" 
                   min="0" max="50" step="1" value="${blurIntensity}">
        `;
        intensityGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('blur-intensity-value').textContent = `${value}px`;
            window.uiSettings.updateSetting('ui', 'blurIntensity', value);
        });
        section.appendChild(intensityGroup);
        
        this.content.appendChild(section);
    }
    
    // Helper methods
    hexToColor(hex) {
        if (hex.startsWith('#')) return hex;
        return `#${hex.toString(16).padStart(6, '0')}`;
    }
    
    rgbaToColor(rgba) {
        if (rgba.startsWith('#')) return rgba;
        if (rgba.startsWith('rgba')) {
            const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
            }
        }
        return '#FFFFFF';
    }
    
    getDefaultBackground(key) {
        const defaults = {
            default: 'rgba(0, 0, 0, 0.85)',
            panel: 'rgba(20, 20, 20, 0.95)',
            card: 'rgba(30, 30, 30, 0.9)',
            hover: 'rgba(40, 40, 40, 0.9)'
        };
        return defaults[key] || defaults.default;
    }
    
    getDefaultText(key) {
        const defaults = {
            primary: '#FFFFFF',
            secondary: 'rgba(255, 255, 255, 0.7)',
            disabled: 'rgba(255, 255, 255, 0.4)'
        };
        return defaults[key] || defaults.primary;
    }
    
    // Update methods
    updateColorSetting(key, value) {
        if (!window.uiSettings.settings.ui.theme) {
            window.uiSettings.settings.ui.theme = {};
        }
        
        if (key === 'ui-primary-500') {
            if (!window.uiSettings.settings.ui.theme.primary) {
                window.uiSettings.settings.ui.theme.primary = {};
            }
            window.uiSettings.settings.ui.theme.primary['500'] = value;
        } else {
            window.uiSettings.settings.ui.theme[key.replace('ui-', '')] = value;
        }
        
        window.uiSettings.applyTheme(window.uiSettings.settings.ui.theme);
        window.uiSettings.saveSettings();
    }
    
    updateBackgroundSetting(key, value) {
        if (!window.uiSettings.settings.ui.theme.background) {
            window.uiSettings.settings.ui.theme.background = {};
        }
        window.uiSettings.settings.ui.theme.background[key] = this.colorToRgba(value);
        window.uiSettings.applyTheme(window.uiSettings.settings.ui.theme);
        window.uiSettings.saveSettings();
    }
    
    updateTextSetting(key, value) {
        if (!window.uiSettings.settings.ui.theme.text) {
            window.uiSettings.settings.ui.theme.text = {};
        }
        window.uiSettings.settings.ui.theme.text[key] = this.colorToRgba(value);
        window.uiSettings.applyTheme(window.uiSettings.settings.ui.theme);
        window.uiSettings.saveSettings();
    }
    
    updateBorderSetting(key, value) {
        if (!window.uiSettings.settings.ui.theme.border) {
            window.uiSettings.settings.ui.theme.border = {};
        }
        if (key === 'color' || key === 'toolbar') {
            window.uiSettings.settings.ui.theme.border[key] = this.colorToRgba(value);
        } else {
            window.uiSettings.settings.ui.theme.border[key] = value;
        }
        window.uiSettings.applyTheme(window.uiSettings.settings.ui.theme);
        window.uiSettings.saveSettings();
    }
    
    updateSpacingSetting(key, value) {
        if (!window.uiSettings.settings.ui.theme.spacing) {
            window.uiSettings.settings.ui.theme.spacing = {};
        }
        window.uiSettings.settings.ui.theme.spacing[key] = value;
        window.uiSettings.applyTheme(window.uiSettings.settings.ui.theme);
        window.uiSettings.saveSettings();
    }
    
    updateFontSetting(key, value) {
        if (!window.uiSettings.settings.ui.theme.font) {
            window.uiSettings.settings.ui.theme.font = {};
        }
        window.uiSettings.settings.ui.theme.font[key] = value;
        window.uiSettings.applyTheme(window.uiSettings.settings.ui.theme);
        window.uiSettings.saveSettings();
    }
    
    colorToRgba(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 1)`;
    }
}

// Initialize UI settings panel when DOM is ready
function initUISettingsPanel() {
    console.log('Initializing UI Settings Panel...');
    console.log('uiSettings available:', typeof window.uiSettings !== 'undefined');
    console.log('Panel element exists:', !!document.getElementById('ui-settings-panel'));
    console.log('Toggle button exists:', !!document.getElementById('uiSettingsToggleBtn'));
    
    // Wait for uiSettings to be available
    if (typeof window.uiSettings === 'undefined') {
        console.log('Waiting for uiSettings...');
        setTimeout(initUISettingsPanel, 50);
        return;
    }
    
    // Check if panel exists
    const panel = document.getElementById('ui-settings-panel');
    if (!panel) {
        console.error('UI Settings Panel element not found in DOM');
        return;
    }
    
    // Check if toggle button exists
    const toggleBtn = document.getElementById('uiSettingsToggleBtn');
    if (!toggleBtn) {
        console.error('UI Settings Toggle Button not found in DOM');
        return;
    }
    
    // Initialize panel
    try {
        window.uiSettingsPanel = new UISettingsPanel();
        console.log('UI Settings Panel initialized successfully', window.uiSettingsPanel);
        
        // Add backup direct click handler
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('[UI Settings] Backup toggle button click handler fired');
            const panel = document.getElementById('ui-settings-panel');
            if (panel) {
                console.log('[UI Settings] Backup - Panel found:', panel);
                console.log('[UI Settings] Backup - Has hidden class:', panel.classList.contains('hidden'));
                if (panel.classList.contains('hidden')) {
                    panel.classList.remove('hidden');
                    // Use setProperty with important flag to override !important in CSS
                    panel.style.setProperty('display', 'flex', 'important');
                    panel.style.setProperty('visibility', 'visible', 'important');
                    panel.style.setProperty('opacity', '1', 'important');
                    panel.style.setProperty('pointer-events', 'auto', 'important');
                    console.log('[UI Settings] Backup - Panel shown, computed display:', window.getComputedStyle(panel).display);
                    console.log('[UI Settings] Backup - Panel position:', panel.getBoundingClientRect());
                } else {
                    panel.classList.add('hidden');
                    console.log('[UI Settings] Backup - Panel hidden');
                }
            } else {
                console.error('[UI Settings] Backup - Panel element not found!');
            }
        });
    } catch (error) {
        console.error('Error initializing UI Settings Panel:', error);
    }
}

// Show temporary tooltip message
function showTooltip(message, element) {
    const tooltip = document.createElement('div');
    tooltip.textContent = message;
    tooltip.style.position = 'fixed';
    tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 16px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.zIndex = '10000';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.fontSize = '14px';
    tooltip.style.fontFamily = 'system-ui, sans-serif';
    tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
    tooltip.style.top = (rect.top - 40) + 'px';
    tooltip.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s';
        setTimeout(() => tooltip.remove(), 300);
    }, 2000);
}

// Add immediate direct event listener as fallback
function addDirectToggleListener() {
    const toggleBtn = document.getElementById('uiSettingsToggleBtn');
    if (toggleBtn) {
        console.log('[UI Settings] Adding direct toggle listener to button');
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[UI Settings] DIRECT toggle button clicked!');
            
            const panel = document.getElementById('ui-settings-panel');
            if (!panel) {
                console.error('[UI Settings] DIRECT - Panel not found!');
                showTooltip('Error: Panel not found!', toggleBtn);
                return;
            }
            
            console.log('[UI Settings] DIRECT - Panel found:', panel);
            console.log('[UI Settings] DIRECT - Has hidden class:', panel.classList.contains('hidden'));
            console.log('[UI Settings] DIRECT - Current display:', window.getComputedStyle(panel).display);
            
            if (panel.classList.contains('hidden')) {
                console.log('[UI Settings] DIRECT - Removing hidden class and showing panel');
                panel.classList.remove('hidden');
                panel.style.setProperty('display', 'flex', 'important');
                panel.style.setProperty('visibility', 'visible', 'important');
                panel.style.setProperty('opacity', '1', 'important');
                panel.style.setProperty('pointer-events', 'auto', 'important');
                
                console.log('[UI Settings] DIRECT - After show, computed display:', window.getComputedStyle(panel).display);
                console.log('[UI Settings] DIRECT - Panel position:', panel.getBoundingClientRect());
                showTooltip('UI Settings Panel Opened', toggleBtn);
            } else {
                console.log('[UI Settings] DIRECT - Hiding panel');
                panel.classList.add('hidden');
                // Use setProperty with important flag to override !important in CSS
                panel.style.setProperty('display', 'none', 'important');
                panel.style.setProperty('visibility', 'hidden', 'important');
                panel.style.setProperty('opacity', '0', 'important');
                panel.style.setProperty('pointer-events', 'none', 'important');
                console.log('[UI Settings] DIRECT - Panel hidden, computed display:', window.getComputedStyle(panel).display);
                showTooltip('UI Settings Panel Closed', toggleBtn);
            }
        });
        console.log('[UI Settings] Direct toggle listener added successfully');
    } else {
        console.warn('[UI Settings] Toggle button not found for direct listener, retrying...');
        setTimeout(addDirectToggleListener, 100);
    }
}

// Add direct listener immediately
addDirectToggleListener();

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[UI Settings] DOMContentLoaded fired, initializing...');
        setTimeout(initUISettingsPanel, 200);
    });
} else {
    // DOM already loaded
    console.log('[UI Settings] DOM already loaded, initializing...');
    setTimeout(initUISettingsPanel, 200);
}

