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
        
        // Toggle button
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        } else {
            console.error('[UI Settings] Toggle Button not found!');
        }
        
        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });
        } else {
            console.warn('[UI Settings] Close Button not found');
        }
        
        // Build the settings UI
        this.buildSettingsUI();
    }
    
    toggle() {
        if (!this.panel) {
            console.error('[UI Settings] Cannot toggle: Panel element not found');
            return;
        }
        
        const isHidden = this.panel.classList.contains('hidden');
        
        if (isHidden) {
            this.show();
        } else {
            this.hide();
        }
    }
    
    show() {
        if (!this.panel) {
            console.error('[UI Settings] Panel element not found');
            return;
        }
        
        // Remove hidden class
        this.panel.classList.remove('hidden');
        
        // Use setProperty with important flag to override !important in CSS
        this.panel.style.setProperty('display', 'flex', 'important');
        this.panel.style.setProperty('visibility', 'visible', 'important');
        this.panel.style.setProperty('opacity', '1', 'important');
        this.panel.style.setProperty('pointer-events', 'auto', 'important');
    }

    hide() {
        if (!this.panel) {
            console.error('[UI Settings] Panel element not found');
            return;
        }
        
        // Add hidden class
        this.panel.classList.add('hidden');
        
        // Use setProperty with important flag to override !important in CSS
        this.panel.style.setProperty('display', 'none', 'important');
        this.panel.style.setProperty('visibility', 'hidden', 'important');
        this.panel.style.setProperty('opacity', '0', 'important');
        this.panel.style.setProperty('pointer-events', 'none', 'important');
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
        
        // Performance Section
        this.createPerformanceSection();
        
        // Re-initialize effect controls after UI is built
        // Make sure effect controls container exists and is populated
        setTimeout(() => {
            const effectControls = document.getElementById('effect-controls');
            if (effectControls && effectControls.children.length === 0) {
                if (window.viewer3D && window.viewer3D.setupEffectSelector) {
                    window.viewer3D.setupEffectSelector();
                }
            } else if (effectControls) {
            } else {
                console.warn('Effect controls container not found');
            }
        }, 100);
    }
    
    // Helper to create a color input with opacity slider
    // Helper to create a color input with opacity slider
    createColorControl(label, id, rgbaValue, onChange) {
        const group = document.createElement('div');
        group.className = 'ui-settings-group';
        
        // Parse RGBA
        let hex = '#000000';
        let alpha = 1.0;
        
        if (rgbaValue && rgbaValue.startsWith('#')) {
            hex = rgbaValue;
        } else if (rgbaValue && rgbaValue.startsWith('rgba')) {
            const match = rgbaValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                const a = match[4] !== undefined ? parseFloat(match[4]) : 1.0;
                hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
                alpha = a;
            }
        }
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '12px';
        wrapper.style.width = '100%';
        
        // Row 1: Label and Color Input
        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'center';
        
        const labelEl = document.createElement('label');
        labelEl.className = 'ui-settings-label';
        labelEl.textContent = label;
        labelEl.style.marginBottom = '0'; // Override default
        
        // Color Input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'ui-settings-color-input';
        colorInput.value = hex;
        colorInput.id = `${id}-color`;
        
        topRow.appendChild(labelEl);
        topRow.appendChild(colorInput);
        
        // Row 2: Opacity Slider
        const sliderRow = document.createElement('div');
        sliderRow.style.display = 'flex';
        sliderRow.style.alignItems = 'center';
        sliderRow.style.gap = '10px';
        sliderRow.style.width = '100%';
        
        const opacityLabel = document.createElement('span');
        opacityLabel.style.fontSize = '12px';
        opacityLabel.style.color = 'rgba(255, 255, 255, 0.6)';
        opacityLabel.textContent = 'Opacity:';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'ui-settings-slider';
        slider.style.flex = '1'; // Take remaining space
        slider.min = '0';
        slider.max = '100';
        slider.value = Math.round(alpha * 100);
        slider.id = `${id}-alpha`;
        
        const percentDisplay = document.createElement('span');
        percentDisplay.className = 'ui-settings-value';
        percentDisplay.style.minWidth = '35px';
        percentDisplay.style.textAlign = 'right';
        percentDisplay.textContent = `${Math.round(alpha * 100)}%`;
        
        sliderRow.appendChild(opacityLabel);
        sliderRow.appendChild(slider);
        sliderRow.appendChild(percentDisplay);
        
        wrapper.appendChild(topRow);
        wrapper.appendChild(sliderRow);
        group.appendChild(wrapper);
        
        // Event listeners
        const updateValue = () => {
            const h = colorInput.value;
            const a = parseInt(slider.value) / 100;
            percentDisplay.textContent = `${parseInt(slider.value)}%`;
            
            // Convert Hex to RGB
            const r = parseInt(h.slice(1, 3), 16);
            const g = parseInt(h.slice(3, 5), 16);
            const b = parseInt(h.slice(5, 7), 16);
            
            const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
            onChange(rgba);
        };
        
        colorInput.addEventListener('input', updateValue);
        // Use 'input' for real-time updates AND 'change' for final commit if needed
        // But 'input' is usually enough for visual feedback. 
        // We might want to debounce saving to settings if it's too frequent, 
        // but current logic just calls onChange which calls updateSetting which calls saveSettings.
        // saveSettings does localStorage(synchronous) and file write(async).
        // File write handles multiple calls? It might be heavy.
        // But for now, let's stick to simple 'input' for slider smoothness.
        slider.addEventListener('input', updateValue);
        
        return group;
    }

    createColorsSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Colors';
        section.appendChild(title);
        
        // Primary Color (Simple hex for now as it maps to palette generation usually, but user asked for transparency everywhere)
        // Note: Generating a full palette from RGBA is complex, so for "Primary 500" we'll stick to Hex or just treat it as the base color
        // For simplicity and to satisfy "all color picker rgba", we allow it, though theme generation might strip alpha if it expects hex.
        // Let's assume theme.primary['500'] CAN be rgba.
        
        section.appendChild(this.createColorControl('Primary Color', 'ui-primary-500', 
            (theme.primary && theme.primary[500]) || '#006FEE', 
            (val) => this.updateColorSetting('ui-primary-500', val)
        ));
        
        section.appendChild(this.createColorControl('Success Color', 'ui-success', 
            theme.success || '#00C851', 
            (val) => this.updateColorSetting('success', val)
        ));
        
        section.appendChild(this.createColorControl('Warning Color', 'ui-warning', 
            theme.warning || '#FFBB33', 
            (val) => this.updateColorSetting('warning', val)
        ));
        
        section.appendChild(this.createColorControl('Danger Color', 'ui-danger', 
            theme.danger || '#FF4444', 
            (val) => this.updateColorSetting('danger', val)
        ));
        
        this.content.appendChild(section);
    }
    
    createBackgroundSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Background Properties';
        section.appendChild(title);
        
        // Tabs for different backgrounds
        const backgrounds = [
            { key: 'default', label: 'Page Background' },
            { key: 'panel', label: 'Panel Background' },
            { key: 'card', label: 'Card Background' },
            { key: 'toolbar', label: 'Toolbar Background' }
        ];
        
        backgrounds.forEach(bg => {
            const val = (theme.background && theme.background[bg.key]) || this.getDefaultBackground(bg.key);
            section.appendChild(this.createColorControl(bg.label, `ui-bg-${bg.key}`, val,
                (newVal) => this.updateBackgroundSetting(bg.key, newVal)
            ));
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
            const val = (theme.text && theme.text[text.key]) || this.getDefaultText(text.key);
            section.appendChild(this.createColorControl(text.label, `ui-text-${text.key}`, val,
                (newVal) => this.updateTextSetting(text.key, newVal)
            ));
        });
        
        this.content.appendChild(section);
    }
    
    createBorderSection(theme) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Borders & Corners';
        section.appendChild(title);
        
        // Border Color
        const borderColor = (theme.border && theme.border.color) || 'rgba(255, 255, 255, 0.2)';
        section.appendChild(this.createColorControl('Border Color', 'ui-border-color', borderColor,
            (val) => this.updateBorderSetting('color', val)
        ));
        
        // Border Width
        const widthGroup = document.createElement('div');
        widthGroup.className = 'ui-settings-group';
        widthGroup.innerHTML = `
            <label class="ui-settings-label">Border Width: <span class="ui-settings-value" id="border-width-value">${(theme.border && theme.border.width) || '2px'}</span></label>
            <input type="range" class="ui-settings-slider" id="ui-border-width" 
                   min="0" max="8" step="1" value="${parseInt((theme.border && theme.border.width) || '2px')}">
        `;
        widthGroup.querySelector('input').addEventListener('input', (e) => {
            const value = `${e.target.value}px`;
            document.getElementById('border-width-value').textContent = value;
            this.updateBorderSetting('width', value);
        });
        section.appendChild(widthGroup);
        
        // Corner Radius Sub-section
        const radiusTitle = document.createElement('div');
        radiusTitle.className = 'ui-settings-label';
        radiusTitle.style.marginTop = '12px';
        radiusTitle.style.marginBottom = '8px';
        radiusTitle.style.fontWeight = '600';
        radiusTitle.textContent = 'Corner Radius';
        section.appendChild(radiusTitle);

        const radii = [
            { key: 'small', label: 'Small (Buttons/Inputs)' },
            { key: 'medium', label: 'Medium (Cards)' },
            { key: 'large', label: 'Large (Panels/Modals)' }
        ];
        
        radii.forEach(r => {
            const group = document.createElement('div');
            group.className = 'ui-settings-group';
            const val = (theme.border && theme.border.radius && theme.border.radius[r.key]) || '8px';
            const intVal = parseInt(val);
            
            group.innerHTML = `
                <label class="ui-settings-label">${r.label}: <span class="ui-settings-value" id="radius-${r.key}-value">${val}</span></label>
                <input type="range" class="ui-settings-slider" id="ui-radius-${r.key}" 
                       min="0" max="32" step="1" value="${intVal}">
            `;
            
            group.querySelector('input').addEventListener('input', (e) => {
                const newVal = `${e.target.value}px`;
                document.getElementById(`radius-${r.key}-value`).textContent = newVal;
                this.updateBorderRadiusSetting(r.key, newVal);
            });
            section.appendChild(group);
        });

        this.content.appendChild(section);
    }

    updateBorderRadiusSetting(key, value) {
        if (!window.uiSettings.settings.ui.theme.border) {
            window.uiSettings.settings.ui.theme.border = {};
        }
        if (!window.uiSettings.settings.ui.theme.border.radius) {
            window.uiSettings.settings.ui.theme.border.radius = {};
        }
        window.uiSettings.settings.ui.theme.border.radius[key] = value;
        window.uiSettings.applyTheme(window.uiSettings.settings.ui.theme);
        window.uiSettings.saveSettings();
    }
    
    colorToRgba(hex) {
        // This method is now legacy or used for fallback, as our controls emit valid RGBA strings directly
        return hex;
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
    
    createPerformanceSection() {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Performance';
        section.appendChild(title);
        
        // Light Mode Toggle
        const lightModeGroup = document.createElement('div');
        lightModeGroup.className = 'ui-settings-group';
        
        const description = document.createElement('p');
        description.className = 'ui-settings-description';
        description.style.marginTop = '8px';
        description.style.marginBottom = '12px';
        description.style.fontSize = '12px';
        description.style.color = 'rgba(255, 255, 255, 0.7)';
        description.textContent = 'Reduces CPU and RAM usage for older computers. Uses light images only, disables fancy 3D effects, and limits preloading.';
        
        const toggleGroup = document.createElement('div');
        toggleGroup.className = 'ui-settings-toggle';
        toggleGroup.innerHTML = `
            <label class="ui-settings-toggle-label">Light Mode (Low CPU/RAM)</label>
            <label class="ui-settings-switch">
                <input type="checkbox" id="light-mode-toggle" 
                       ${window.uiSettings.getSetting('performance', 'lightMode') ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        
        toggleGroup.querySelector('input').addEventListener('change', (e) => {
            window.uiSettings.setSetting('performance', 'lightMode', e.target.checked);
            window.uiSettings.saveSettings();
            // Reload page to apply changes
            if (confirm('Light mode setting changed. Reload page to apply changes?')) {
                window.location.reload();
            } else {
                // Revert checkbox if user cancels
                e.target.checked = !e.target.checked;
            }
        });
        
        lightModeGroup.appendChild(description);
        lightModeGroup.appendChild(toggleGroup);
        section.appendChild(lightModeGroup);
        
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
    
    // Wait for uiSettings to be available
    if (typeof window.uiSettings === 'undefined') {
        setTimeout(initUISettingsPanel, 50);
        return;
    }
    
    // Check if panel exists
    const panel = document.getElementById('ui-settings-panel');
    if (!panel) {
        console.error('UI Settings Panel element not found in DOM');
        return;
    }
    
    // Initialize panel
    try {
        // Prevent multiple initializations
        if (window.uiSettingsPanel) {
            return;
        }
        window.uiSettingsPanel = new UISettingsPanel();
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

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUISettingsPanel);
} else {
    initUISettingsPanel();
}
