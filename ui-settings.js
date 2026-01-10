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
        
        // Listen for settings loaded event
        window.addEventListener('viewerSettingsLoaded', () => {
            console.log('[UI Settings] Settings loaded, rebuilding UI');
            this.buildSettingsUI();
        });

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
        
        // Box Particles Section
        this.createBoxParticlesSection();
        
        // Ambient Particles Section
        this.createAmbientParticlesSection();
        
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
            
            // Sync stored settings to viewer particles
            this.syncParticlesToViewer();
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
    
    createBoxParticlesSection() {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Box Particle System';
        section.appendChild(title);
        
        // Get current settings (support both keys, prefer boxParticles)
        const particleSettings = window.uiSettings.settings.effects?.boxParticles || 
                               window.uiSettings.settings.effects?.oscillatingParticles || {};
        
        // Master Enable/Disable Toggle
        const masterToggle = document.createElement('div');
        masterToggle.className = 'ui-settings-toggle';
        masterToggle.innerHTML = `
            <label class="ui-settings-toggle-label">Enable Particle System</label>
            <label class="ui-settings-switch">
                <input type="checkbox" id="particles-enabled" ${particleSettings.enabled ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        masterToggle.querySelector('input').addEventListener('change', (e) => {
            this.updateBoxParticleSetting('enabled', e.target.checked);
            // Toggle particle system
            if (window.viewer3D && window.viewer3D.boxParticles) {
                window.viewer3D.boxParticles.setEnabled(e.target.checked);
            }
        });
        section.appendChild(masterToggle);
        
        // Border Spacing
        const spacingGroup = document.createElement('div');
        spacingGroup.className = 'ui-settings-group';
        const borderSpacing = particleSettings.borderSpacing || 500;
        spacingGroup.innerHTML = `
            <label class="ui-settings-label">Border Spacing: <span class="ui-settings-value" id="particle-border-spacing-value">${borderSpacing}m</span></label>
            <input type="range" class="ui-settings-slider" id="particle-border-spacing" 
                   min="0" max="5000" step="50" value="${borderSpacing}">
        `;
        spacingGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('particle-border-spacing-value').textContent = `${value}m`;
            this.updateBoxParticleSetting('borderSpacing', value);
        });
        section.appendChild(spacingGroup);
        
        // Create collapsible sections for each particle layer
        this.createParticleLayerSection(section, 'heavy', 'Heavy Particles (Layer 1)', particleSettings.heavy || {});
        this.createParticleLayerSection(section, 'medium', 'Medium Particles (Layer 2)', particleSettings.medium || {});
        this.createParticleLayerSection(section, 'light', 'Light Particles (Layer 3)', particleSettings.light || {});
        
        this.content.appendChild(section);
    }
    
    createParticleLayerSection(parentSection, layerKey, layerTitle, layerSettings) {
        // Collapsible header
        const header = document.createElement('div');
        header.className = 'ui-settings-collapsible-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin-top: 16px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            cursor: pointer;
            user-select: none;
        `;
        
        const headerTitle = document.createElement('span');
        headerTitle.style.fontWeight = '600';
        headerTitle.style.fontSize = '14px';
        headerTitle.textContent = layerTitle;
        
        const arrow = document.createElement('span');
        arrow.textContent = '▼';
        arrow.style.transition = 'transform 0.3s';
        arrow.id = `${layerKey}-arrow`;
        
        header.appendChild(headerTitle);
        header.appendChild(arrow);
        
        // Content container
        const content = document.createElement('div');
        content.id = `${layerKey}-content`;
        content.style.cssText = `
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        `;
        
        // Toggle collapse/expand
        let isExpanded = false;
        header.addEventListener('click', () => {
            isExpanded = !isExpanded;
            if (isExpanded) {
                content.style.maxHeight = content.scrollHeight + 'px';
                arrow.style.transform = 'rotate(180deg)';
            } else {
                content.style.maxHeight = '0';
                arrow.style.transform = 'rotate(0deg)';
            }
        });
        
        // Layer Enable Toggle
        const layerToggle = document.createElement('div');
        layerToggle.className = 'ui-settings-toggle';
        layerToggle.style.marginTop = '12px';
        layerToggle.innerHTML = `
            <label class="ui-settings-toggle-label">Enable ${layerTitle}</label>
            <label class="ui-settings-switch">
                <input type="checkbox" id="${layerKey}-enabled" ${layerSettings.enabled ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        layerToggle.querySelector('input').addEventListener('change', (e) => {
            this.updateBoxParticleLayerSetting(layerKey, 'enabled', e.target.checked);
        });
        content.appendChild(layerToggle);
        
        // Particle Count
        const countGroup = document.createElement('div');
        countGroup.className = 'ui-settings-group';
        const count = layerSettings.count || 100;
        countGroup.innerHTML = `
            <label class="ui-settings-label">Particle Count: <span class="ui-settings-value" id="${layerKey}-count-value">${count}</span></label>
            <input type="range" class="ui-settings-slider" id="${layerKey}-count" 
                   min="10" max="1000" step="10" value="${count}">
        `;
        countGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById(`${layerKey}-count-value`).textContent = value;
            this.updateBoxParticleLayerSetting(layerKey, 'count', value);
        });
        content.appendChild(countGroup);
        
        // Color (convert from decimal to hex)
        const colorHex = '#' + (layerSettings.color || 0xffffff).toString(16).padStart(6, '0');
        const colorGroup = document.createElement('div');
        colorGroup.className = 'ui-settings-group';
        colorGroup.innerHTML = `
            <label class="ui-settings-label">Color</label>
            <input type="color" class="ui-settings-color-input" id="${layerKey}-color" value="${colorHex}">
        `;
        colorGroup.querySelector('input').addEventListener('input', (e) => {
            const decimal = parseInt(e.target.value.slice(1), 16);
            this.updateBoxParticleLayerSetting(layerKey, 'color', decimal);
        });
        content.appendChild(colorGroup);
        
        // Size
        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'ui-settings-group';
        const size = layerSettings.size || 50;
        sizeGroup.innerHTML = `
            <label class="ui-settings-label">Size: <span class="ui-settings-value" id="${layerKey}-size-value">${size}</span></label>
            <input type="range" class="ui-settings-slider" id="${layerKey}-size" 
                   min="1" max="500" step="1" value="${size}">
        `;
        sizeGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById(`${layerKey}-size-value`).textContent = value.toFixed(0);
            this.updateBoxParticleLayerSetting(layerKey, 'size', value);
        });
        content.appendChild(sizeGroup);
        
        // Shape
        const shapeGroup = document.createElement('div');
        shapeGroup.className = 'ui-settings-group';
        const shape = layerSettings.shape || 'circle';
        shapeGroup.innerHTML = `
            <label class="ui-settings-label">Shape</label>
            <select class="ui-settings-select" id="${layerKey}-shape" style="width: 100%; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
                <option value="circle" ${shape === 'circle' ? 'selected' : ''}>Circle</option>
                <option value="square" ${shape === 'square' ? 'selected' : ''}>Square</option>
                <option value="triangle" ${shape === 'triangle' ? 'selected' : ''}>Triangle</option>
                <option value="star" ${shape === 'star' ? 'selected' : ''}>Star</option>
            </select>
        `;
        shapeGroup.querySelector('select').addEventListener('change', (e) => {
            this.updateBoxParticleLayerSetting(layerKey, 'shape', e.target.value);
        });
        content.appendChild(shapeGroup);
        
        // Speed
        const speedGroup = document.createElement('div');
        speedGroup.className = 'ui-settings-group';
        const speed = layerSettings.speed || 100;
        speedGroup.innerHTML = `
            <label class="ui-settings-label">Speed: <span class="ui-settings-value" id="${layerKey}-speed-value">${speed.toFixed(0)}</span></label>
            <input type="range" class="ui-settings-slider" id="${layerKey}-speed" 
                   min="10" max="2000" step="10" value="${speed}">
        `;
        speedGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById(`${layerKey}-speed-value`).textContent = value.toFixed(0);
            this.updateBoxParticleLayerSetting(layerKey, 'speed', value);
        });
        content.appendChild(speedGroup);
        
        // Acceleration
        const accelGroup = document.createElement('div');
        accelGroup.className = 'ui-settings-group';
        const accel = layerSettings.acceleration || 10;
        accelGroup.innerHTML = `
            <label class="ui-settings-label">Acceleration: <span class="ui-settings-value" id="${layerKey}-accel-value">${accel.toFixed(0)}</span></label>
            <input type="range" class="ui-settings-slider" id="${layerKey}-accel" 
                   min="0" max="100" step="1" value="${accel}">
        `;
        accelGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById(`${layerKey}-accel-value`).textContent = value.toFixed(0);
            this.updateBoxParticleLayerSetting(layerKey, 'acceleration', value);
        });
        content.appendChild(accelGroup);
        
        // Deceleration
        const decelGroup = document.createElement('div');
        decelGroup.className = 'ui-settings-group';
        const decel = layerSettings.deceleration || 0.95;
        decelGroup.innerHTML = `
            <label class="ui-settings-label">Deceleration: <span class="ui-settings-value" id="${layerKey}-decel-value">${decel.toFixed(2)}</span></label>
            <input type="range" class="ui-settings-slider" id="${layerKey}-decel" 
                   min="0.8" max="1" step="0.01" value="${decel}">
        `;
        decelGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById(`${layerKey}-decel-value`).textContent = value.toFixed(2);
            this.updateBoxParticleLayerSetting(layerKey, 'deceleration', value);
        });
        content.appendChild(decelGroup);
        
        // Fade Time
        const fadeGroup = document.createElement('div');
        fadeGroup.className = 'ui-settings-group';
        const fadeTime = layerSettings.fadeTime || 2.0;
        fadeGroup.innerHTML = `
            <label class="ui-settings-label">Fade Time: <span class="ui-settings-value" id="${layerKey}-fade-value">${fadeTime.toFixed(1)}s</span></label>
            <input type="range" class="ui-settings-slider" id="${layerKey}-fade" 
                   min="0.5" max="10" step="0.1" value="${fadeTime}">
        `;
        fadeGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById(`${layerKey}-fade-value`).textContent = `${value.toFixed(1)}s`;
            this.updateBoxParticleLayerSetting(layerKey, 'fadeTime', value);
        });
        content.appendChild(fadeGroup);
        
        // Opacity
        const opacityGroup = document.createElement('div');
        opacityGroup.className = 'ui-settings-group';
        const opacity = layerSettings.opacity || 0.8;
        opacityGroup.innerHTML = `
            <label class="ui-settings-label">Opacity: <span class="ui-settings-value" id="${layerKey}-opacity-value">${Math.round(opacity * 100)}%</span></label>
            <input type="range" class="ui-settings-slider" id="${layerKey}-opacity" 
                   min="0" max="100" step="1" value="${Math.round(opacity * 100)}">
        `;
        opacityGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById(`${layerKey}-opacity-value`).textContent = `${value}%`;
            this.updateBoxParticleLayerSetting(layerKey, 'opacity', value / 100);
        });
        content.appendChild(opacityGroup);
        
        // Glow Toggle
        const glowToggle = document.createElement('div');
        glowToggle.className = 'ui-settings-toggle';
        glowToggle.innerHTML = `
            <label class="ui-settings-toggle-label">Glow Effect</label>
            <label class="ui-settings-switch">
                <input type="checkbox" id="${layerKey}-glow" ${layerSettings.glow ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        glowToggle.querySelector('input').addEventListener('change', (e) => {
            this.updateBoxParticleLayerSetting(layerKey, 'glow', e.target.checked);
        });
        content.appendChild(glowToggle);
        
        // Glitter Toggle
        const glitterToggle = document.createElement('div');
        glitterToggle.className = 'ui-settings-toggle';
        glitterToggle.innerHTML = `
            <label class="ui-settings-toggle-label">Glitter Effect</label>
            <label class="ui-settings-switch">
                <input type="checkbox" id="${layerKey}-glitter" ${layerSettings.glitter ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        glitterToggle.querySelector('input').addEventListener('change', (e) => {
            this.updateBoxParticleLayerSetting(layerKey, 'glitter', e.target.checked);
        });
        content.appendChild(glitterToggle);
        
        // Haze Toggle
        const hazeToggle = document.createElement('div');
        hazeToggle.className = 'ui-settings-toggle';
        hazeToggle.innerHTML = `
            <label class="ui-settings-toggle-label">Haze Effect</label>
            <label class="ui-settings-switch">
                <input type="checkbox" id="${layerKey}-haze" ${layerSettings.haze ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        hazeToggle.querySelector('input').addEventListener('change', (e) => {
            this.updateBoxParticleLayerSetting(layerKey, 'haze', e.target.checked);
        });
        content.appendChild(hazeToggle);
        
        // Layer-specific parameters
        if (layerKey === 'medium') {
            // Weave Amplitude
            const weaveAmpGroup = document.createElement('div');
            weaveAmpGroup.className = 'ui-settings-group';
            const weaveAmp = layerSettings.weaveAmplitude || 200;
            weaveAmpGroup.innerHTML = `
                <label class="ui-settings-label">Weave Amplitude: <span class="ui-settings-value" id="${layerKey}-weave-amp-value">${weaveAmp.toFixed(0)}</span></label>
                <input type="range" class="ui-settings-slider" id="${layerKey}-weave-amp" 
                       min="0" max="1000" step="10" value="${weaveAmp}">
            `;
            weaveAmpGroup.querySelector('input').addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById(`${layerKey}-weave-amp-value`).textContent = value.toFixed(0);
                this.updateBoxParticleLayerSetting(layerKey, 'weaveAmplitude', value);
            });
            content.appendChild(weaveAmpGroup);
            
            // Weave Frequency
            const weaveFreqGroup = document.createElement('div');
            weaveFreqGroup.className = 'ui-settings-group';
            const weaveFreq = layerSettings.weaveFrequency || 1.0;
            weaveFreqGroup.innerHTML = `
                <label class="ui-settings-label">Weave Frequency: <span class="ui-settings-value" id="${layerKey}-weave-freq-value">${weaveFreq.toFixed(1)}</span></label>
                <input type="range" class="ui-settings-slider" id="${layerKey}-weave-freq" 
                       min="0.1" max="5" step="0.1" value="${weaveFreq}">
            `;
            weaveFreqGroup.querySelector('input').addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById(`${layerKey}-weave-freq-value`).textContent = value.toFixed(1);
                this.updateBoxParticleLayerSetting(layerKey, 'weaveFrequency', value);
            });
            content.appendChild(weaveFreqGroup);
        }
        
        if (layerKey === 'light') {
            // Flow Height
            const flowHeightGroup = document.createElement('div');
            flowHeightGroup.className = 'ui-settings-group';
            const flowHeight = layerSettings.flowHeight || 5000;
            flowHeightGroup.innerHTML = `
                <label class="ui-settings-label">Flow Height: <span class="ui-settings-value" id="${layerKey}-flow-height-value">${flowHeight}</span></label>
                <input type="range" class="ui-settings-slider" id="${layerKey}-flow-height" 
                       min="100" max="20000" step="100" value="${flowHeight}">
            `;
            flowHeightGroup.querySelector('input').addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById(`${layerKey}-flow-height-value`).textContent = value;
                this.updateBoxParticleLayerSetting(layerKey, 'flowHeight', value);
            });
            content.appendChild(flowHeightGroup);
            
            // Twinkle Speed
            const twinkleSpeedGroup = document.createElement('div');
            twinkleSpeedGroup.className = 'ui-settings-group';
            const twinkleSpeed = layerSettings.twinkleSpeed || 2.0;
            twinkleSpeedGroup.innerHTML = `
                <label class="ui-settings-label">Twinkle Speed: <span class="ui-settings-value" id="${layerKey}-twinkle-speed-value">${twinkleSpeed.toFixed(1)}</span></label>
                <input type="range" class="ui-settings-slider" id="${layerKey}-twinkle-speed" 
                       min="0.1" max="10" step="0.1" value="${twinkleSpeed}">
            `;
            twinkleSpeedGroup.querySelector('input').addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById(`${layerKey}-twinkle-speed-value`).textContent = value.toFixed(1);
                this.updateBoxParticleLayerSetting(layerKey, 'twinkleSpeed', value);
            });
            content.appendChild(twinkleSpeedGroup);
            
            // Twinkle Intensity
            const twinkleIntensityGroup = document.createElement('div');
            twinkleIntensityGroup.className = 'ui-settings-group';
            const twinkleIntensity = layerSettings.twinkleIntensity || 0.5;
            twinkleIntensityGroup.innerHTML = `
                <label class="ui-settings-label">Twinkle Intensity: <span class="ui-settings-value" id="${layerKey}-twinkle-intensity-value">${twinkleIntensity.toFixed(2)}</span></label>
                <input type="range" class="ui-settings-slider" id="${layerKey}-twinkle-intensity" 
                       min="0" max="1" step="0.01" value="${twinkleIntensity}">
            `;
            twinkleIntensityGroup.querySelector('input').addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById(`${layerKey}-twinkle-intensity-value`).textContent = value.toFixed(2);
                this.updateBoxParticleLayerSetting(layerKey, 'twinkleIntensity', value);
            });
            content.appendChild(twinkleIntensityGroup);
        }
        
        parentSection.appendChild(header);
        parentSection.appendChild(content);
    }
    
    updateBoxParticleSetting(key, value) {
        if (!window.uiSettings.settings.effects) {
            window.uiSettings.settings.effects = {};
        }
        // Write to boxParticles
        if (!window.uiSettings.settings.effects.boxParticles) {
            window.uiSettings.settings.effects.boxParticles = {};
        }
        window.uiSettings.settings.effects.boxParticles[key] = value;
        
        // Update CONFIG_3D
        if (typeof CONFIG_3D !== 'undefined') {
            if (!CONFIG_3D.BOX_PARTICLES) {
                CONFIG_3D.BOX_PARTICLES = {};
            }
            CONFIG_3D.BOX_PARTICLES[key] = value;
        }
        
        // Update particle system
        if (window.viewer3D && window.viewer3D.boxParticles) {
            const newSettings = {};
            newSettings[key] = value;
            window.viewer3D.boxParticles.updateSettings(newSettings);
        }
        
        window.uiSettings.saveSettings();
    }
    
    updateBoxParticleLayerSetting(layer, key, value) {
        if (!window.uiSettings.settings.effects) {
            window.uiSettings.settings.effects = {};
        }
        if (!window.uiSettings.settings.effects.boxParticles) {
            window.uiSettings.settings.effects.boxParticles = {};
        }
        if (!window.uiSettings.settings.effects.boxParticles[layer]) {
            window.uiSettings.settings.effects.boxParticles[layer] = {};
        }
        window.uiSettings.settings.effects.boxParticles[layer][key] = value;
        
        // Update CONFIG_3D
        if (typeof CONFIG_3D !== 'undefined') {
            if (!CONFIG_3D.BOX_PARTICLES) {
                CONFIG_3D.BOX_PARTICLES = {};
            }
            if (!CONFIG_3D.BOX_PARTICLES[layer]) {
                CONFIG_3D.BOX_PARTICLES[layer] = {};
            }
            
            // Ensure types match what system expects
            if (key === 'color' && typeof value !== 'number') {
                 // Convert if needed, but UI sends number for color
            }
            
            CONFIG_3D.BOX_PARTICLES[layer][key] = value;
        }
        
        // Update particle system
        if (window.viewer3D && window.viewer3D.boxParticles) {
            const newSettings = {};
            newSettings[layer] = { ...window.uiSettings.settings.effects.boxParticles[layer] };
            window.viewer3D.boxParticles.updateSettings(newSettings);
        }
        
        window.uiSettings.saveSettings();
        window.uiSettings.saveSettings();
    }

    // Sync saved settings to viewer3D particles
    syncParticlesToViewer() {
        if (!window.viewer3D || !window.viewer3D.ambientParticles || !window.viewer3D.boxParticles) {
            // Retry if viewer or particles not ready
            setTimeout(() => this.syncParticlesToViewer(), 500);
            return;
        }

        console.log('[UI Settings] Syncing stored particle settings to Viewer3D...');
        const settings = window.uiSettings.settings.effects || {};
        
        // Sync Ambient
        if (settings.ambientParticles) {
            // Update all settings
            window.viewer3D.ambientParticles.updateSettings(settings.ambientParticles);
            // Explicitly force enabled state to override defaults
            if (typeof settings.ambientParticles.enabled !== 'undefined') {
                window.viewer3D.ambientParticles.setEnabled(settings.ambientParticles.enabled);
            }
        }

        // Sync Box
        if (settings.boxParticles) {
            // Update all settings
            window.viewer3D.boxParticles.updateSettings(settings.boxParticles);
            
            // If enabled in settings, ensure enabled in system (logic handles hover visibility)
            if (settings.boxParticles.enabled !== undefined) {
                window.viewer3D.boxParticles.setEnabled(settings.boxParticles.enabled);
            }
        }
    }

    createAmbientParticlesSection() {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Ambient Particles (Exterior)';
        section.appendChild(title);
        
        // Get current settings
        const settings = window.uiSettings.settings.effects?.ambientParticles || {};
        
        // Enabled Toggle
        const enableToggle = document.createElement('div');
        enableToggle.className = 'ui-settings-toggle';
        const isEnabled = settings.enabled !== undefined ? settings.enabled : true;
        enableToggle.innerHTML = `
            <label class="ui-settings-toggle-label">Enable Ambient Particles</label>
            <label class="ui-settings-switch">
                <input type="checkbox" id="ambient-enabled" ${isEnabled ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        enableToggle.querySelector('input').addEventListener('change', (e) => {
            this.updateAmbientParticleSetting('enabled', e.target.checked);
            if (window.viewer3D && window.viewer3D.ambientParticles) {
                window.viewer3D.ambientParticles.setEnabled(e.target.checked);
            }
        });
        section.appendChild(enableToggle);
        
        // Global Settings Header
        const globalTitle = document.createElement('div');
        globalTitle.style.cssText = 'font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.7); margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;';
        globalTitle.textContent = 'Global Interaction & Bounds';
        section.appendChild(globalTitle);
        
        // Spread
        const spreadGroup = document.createElement('div');
        spreadGroup.className = 'ui-settings-group';
        const spread = settings.spread || 5000;
        spreadGroup.innerHTML = `
            <label class="ui-settings-label">Spread (Area): <span class="ui-settings-value" id="ambient-spread-value">${spread}m</span></label>
            <input type="range" class="ui-settings-slider" id="ambient-spread" 
                   min="1000" max="50000" step="1000" value="${spread}">
        `;
        spreadGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('ambient-spread-value').textContent = value + 'm';
            this.updateAmbientParticleSetting('spread', value);
        });
        section.appendChild(spreadGroup);
        
        // Interaction Type
        const typeGroup = document.createElement('div');
        typeGroup.className = 'ui-settings-group';
        const interType = settings.mouseInteractionType || 'attract';
        typeGroup.innerHTML = `
            <label class="ui-settings-label">Interaction Type</label>
            <select class="ui-settings-select" id="ambient-interaction-type">
                <option value="attract" ${interType === 'attract' ? 'selected' : ''}>Attract (Pull)</option>
                <option value="repel" ${interType === 'repel' ? 'selected' : ''}>Repel (Push)</option>
            </select>
        `;
        typeGroup.querySelector('select').addEventListener('change', (e) => {
            this.updateAmbientParticleSetting('mouseInteractionType', e.target.value);
        });
        section.appendChild(typeGroup);

        // Influence Radius
        const radiusGroup = document.createElement('div');
        radiusGroup.className = 'ui-settings-group';
        const radius = settings.mouseInfluenceRadius !== undefined ? settings.mouseInfluenceRadius : 15000;
        radiusGroup.innerHTML = `
            <label class="ui-settings-label">Influence Radius: <span class="ui-settings-value" id="ambient-radius-value">${radius}</span></label>
            <input type="range" class="ui-settings-slider" id="ambient-radius" 
                   min="2000" max="50000" step="1000" value="${radius}">
        `;
        radiusGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('ambient-radius-value').textContent = value;
            this.updateAmbientParticleSetting('mouseInfluenceRadius', value);
        });
        section.appendChild(radiusGroup);

        // Mouse Force (Attraction/Repulsion Strength)
        const forceGroup = document.createElement('div');
        forceGroup.className = 'ui-settings-group';
        const force = settings.mouseForce !== undefined ? settings.mouseForce : 80000;
        forceGroup.innerHTML = `
            <label class="ui-settings-label">Attraction Force: <span class="ui-settings-value" id="ambient-force-value">${force}</span></label>
            <input type="range" class="ui-settings-slider" id="ambient-force" 
                   min="0" max="200000" step="5000" value="${force}">
        `;
        forceGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('ambient-force-value').textContent = value;
            this.updateAmbientParticleSetting('mouseForce', value);
        });
        section.appendChild(forceGroup);
        
        // Mouse Drag
        const dragGroup = document.createElement('div');
        dragGroup.className = 'ui-settings-group';
        const drag = settings.mouseDrag !== undefined ? settings.mouseDrag : 0.96;
        dragGroup.innerHTML = `
            <label class="ui-settings-label">Drag (Friction): <span class="ui-settings-value" id="ambient-drag-value">${Number(drag).toFixed(3)}</span></label>
            <input type="range" class="ui-settings-slider" id="ambient-drag" 
                   min="0.500" max="0.995" step="0.005" value="${drag}">
        `;
        dragGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('ambient-drag-value').textContent = value.toFixed(3);
            this.updateAmbientParticleSetting('mouseDrag', value);
        });
        section.appendChild(dragGroup);
        
        // Return Speed (Damping for interaction recovery)
        const returnGroup = document.createElement('div');
        returnGroup.className = 'ui-settings-group';
        const returnSpeed = settings.mouseReturnSpeed !== undefined ? settings.mouseReturnSpeed : 0.5;
        returnGroup.innerHTML = `
            <label class="ui-settings-label">Return Speed: <span class="ui-settings-value" id="ambient-return-value">${returnSpeed.toFixed(2)}</span></label>
            <input type="range" class="ui-settings-slider" id="ambient-return" 
                   min="0.0" max="2.0" step="0.1" value="${returnSpeed}">
        `;
        returnGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('ambient-return-value').textContent = value.toFixed(2);
            this.updateAmbientParticleSetting('mouseReturnSpeed', value);
        });
        section.appendChild(returnGroup);
        
        // Min Height
        const minHGroup = document.createElement('div');
        minHGroup.className = 'ui-settings-group';
        const minH = settings.minHeight !== undefined ? settings.minHeight : 0;
        minHGroup.innerHTML = `
            <label class="ui-settings-label">Min Height: <span class="ui-settings-value" id="ambient-minh-value">${minH}m</span></label>
            <input type="range" class="ui-settings-slider" id="ambient-minh" 
                   min="-5000" max="20000" step="500" value="${minH}">
        `;
        minHGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('ambient-minh-value').textContent = value + 'm';
            this.updateAmbientParticleSetting('minHeight', value);
        });
        section.appendChild(minHGroup);
        
        // Max Height
        const maxHGroup = document.createElement('div');
        maxHGroup.className = 'ui-settings-group';
        const maxH = settings.maxHeight !== undefined ? settings.maxHeight : 12000;
        maxHGroup.innerHTML = `
            <label class="ui-settings-label">Max Height: <span class="ui-settings-value" id="ambient-maxh-value">${maxH}m</span></label>
            <input type="range" class="ui-settings-slider" id="ambient-maxh" 
                   min="0" max="50000" step="500" value="${maxH}">
        `;
        maxHGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('ambient-maxh-value').textContent = value + 'm';
            this.updateAmbientParticleSetting('maxHeight', value);
        });
        section.appendChild(maxHGroup);
        
        // Layers
        // We use default empty objects if settings don't exist yet to ensure UI is created
        this.createAmbientLayerSection(section, 'heavy', 'Layer 1 (Heavy)', settings.heavy || {enabled: true, count: 1500, size: 600});
        this.createAmbientLayerSection(section, 'medium', 'Layer 2 (Medium)', settings.medium || {enabled: true, count: 1000, size: 400});
        this.createAmbientLayerSection(section, 'light', 'Layer 3 (Light)', settings.light || {enabled: true, count: 500, size: 200});
        
        this.content.appendChild(section);
    }
    
    // Create UI for a single ambient particle layer
    createAmbientLayerSection(parentSection, layerKey, layerTitle, layerSettings) {
        // Collapsible header
        const header = document.createElement('div');
        header.className = 'ui-settings-collapsible-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin-top: 16px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            cursor: pointer;
            user-select: none;
        `;
        
        const headerTitle = document.createElement('span');
        headerTitle.style.fontWeight = '600';
        headerTitle.style.fontSize = '14px';
        headerTitle.textContent = layerTitle;
        
        const arrow = document.createElement('span');
        arrow.textContent = '▼';
        arrow.style.transition = 'transform 0.3s';
        
        header.appendChild(headerTitle);
        header.appendChild(arrow);
        
        // Content container
        const content = document.createElement('div');
        content.style.cssText = `
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        `;
        
        let isExpanded = false;
        header.addEventListener('click', () => {
            isExpanded = !isExpanded;
            if (isExpanded) {
                content.style.maxHeight = content.scrollHeight + 'px';
                arrow.style.transform = 'rotate(180deg)';
            } else {
                content.style.maxHeight = '0';
                arrow.style.transform = 'rotate(0deg)';
            }
        });
        
        // Layer Enable Toggle
        const layerToggle = document.createElement('div');
        layerToggle.className = 'ui-settings-toggle';
        layerToggle.style.marginTop = '12px';
        const isEnabled = layerSettings.enabled !== undefined ? layerSettings.enabled : true;
        layerToggle.innerHTML = `
            <label class="ui-settings-toggle-label">Enable ${layerTitle}</label>
            <label class="ui-settings-switch">
                <input type="checkbox" ${isEnabled ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        layerToggle.querySelector('input').addEventListener('change', (e) => {
            this.updateAmbientParticleLayerSetting(layerKey, 'enabled', e.target.checked);
        });
        content.appendChild(layerToggle);
        
        // Color (convert from decimal to hex)
        const colorHex = '#' + (layerSettings.color || 0xffffff).toString(16).padStart(6, '0');
        const colorGroup = document.createElement('div');
        colorGroup.className = 'ui-settings-group';
        colorGroup.innerHTML = `
            <label class="ui-settings-label">Color</label>
            <input type="color" class="ui-settings-color-input" value="${colorHex}">
        `;
        colorGroup.querySelector('input').addEventListener('input', (e) => {
            const decimal = parseInt(e.target.value.slice(1), 16);
            this.updateAmbientParticleLayerSetting(layerKey, 'color', decimal);
        });
        content.appendChild(colorGroup);
        
        content.appendChild(colorGroup);
        
        // Shape
        const shapeGroup = document.createElement('div');
        shapeGroup.className = 'ui-settings-group';
        const shape = layerSettings.shape || 'circle';
        shapeGroup.innerHTML = `
            <label class="ui-settings-label">Shape</label>
            <select class="ui-settings-select">
                <option value="circle" ${shape === 'circle' ? 'selected' : ''}>Circle (Harder)</option>
                <option value="soft" ${shape === 'soft' ? 'selected' : ''}>Soft (Haze)</option>
                <option value="star" ${shape === 'star' ? 'selected' : ''}>Star</option>
                <option value="diamond" ${shape === 'diamond' ? 'selected' : ''}>Diamond</option>
            </select>
        `;
        shapeGroup.querySelector('select').addEventListener('change', (e) => {
            this.updateAmbientParticleLayerSetting(layerKey, 'shape', e.target.value);
        });
        content.appendChild(shapeGroup);
        
        // Count
        const countGroup = document.createElement('div');
        countGroup.className = 'ui-settings-group';
        const count = layerSettings.count || 1000;
        countGroup.innerHTML = `
            <label class="ui-settings-label">Count: <span class="ui-settings-value">${count}</span></label>
            <input type="range" class="ui-settings-slider" min="100" max="10000" step="100" value="${count}">
        `;
        countGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            e.target.previousElementSibling.querySelector('span').textContent = value;
            this.updateAmbientParticleLayerSetting(layerKey, 'count', value);
        });
        content.appendChild(countGroup);
        
        // Size
        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'ui-settings-group';
        const size = layerSettings.size || 200;
        sizeGroup.innerHTML = `
            <label class="ui-settings-label">Size: <span class="ui-settings-value">${size}</span></label>
            <input type="range" class="ui-settings-slider" min="50" max="2000" step="50" value="${size}">
        `;
        sizeGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            e.target.previousElementSibling.querySelector('span').textContent = value;
            this.updateAmbientParticleLayerSetting(layerKey, 'size', value);
        });
        content.appendChild(sizeGroup);
        
        // Vertical Speed (Rise)
        const accelGroup = document.createElement('div');
        accelGroup.className = 'ui-settings-group';
        const accel = layerSettings.acceleration || 20;
        accelGroup.innerHTML = `
            <label class="ui-settings-label">Vertical Speed: <span class="ui-settings-value">${accel}</span></label>
            <input type="range" class="ui-settings-slider" min="0" max="500" step="5" value="${accel}">
        `;
        accelGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            e.target.previousElementSibling.querySelector('span').textContent = value;
            this.updateAmbientParticleLayerSetting(layerKey, 'acceleration', value);
        });
        content.appendChild(accelGroup);
        
        // Speed (Random Velocity)
        const speedGroup = document.createElement('div');
        speedGroup.className = 'ui-settings-group';
        const speed = layerSettings.speed || 100;
        speedGroup.innerHTML = `
            <label class="ui-settings-label">Max Random Vel: <span class="ui-settings-value">${speed}</span></label>
            <input type="range" class="ui-settings-slider" min="0" max="50000" step="50" value="${speed}">
        `;
        speedGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            e.target.previousElementSibling.querySelector('span').textContent = value;
            this.updateAmbientParticleLayerSetting(layerKey, 'speed', value);
        });
        content.appendChild(speedGroup);
        
        // Opacity
        const opacityGroup = document.createElement('div');
        opacityGroup.className = 'ui-settings-group';
        const opacity = layerSettings.opacity || 0.5;
        opacityGroup.innerHTML = `
            <label class="ui-settings-label">Opacity: <span class="ui-settings-value">${Math.round(opacity*100)}%</span></label>
            <input type="range" class="ui-settings-slider" min="0" max="100" step="5" value="${Math.round(opacity*100)}">
        `;
        opacityGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            e.target.previousElementSibling.querySelector('span').textContent = value + '%';
            this.updateAmbientParticleLayerSetting(layerKey, 'opacity', value / 100);
        });
        content.appendChild(opacityGroup);
        
        // Glow Strength
        const glowGroup = document.createElement('div');
        glowGroup.className = 'ui-settings-group';
        const glow = layerSettings.glowStrength !== undefined ? layerSettings.glowStrength : 0.5;
        glowGroup.innerHTML = `
            <label class="ui-settings-label">Glow Strength: <span class="ui-settings-value">${glow.toFixed(2)}</span></label>
            <input type="range" class="ui-settings-slider" min="0" max="2" step="0.1" value="${glow}">
        `;
        glowGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            e.target.previousElementSibling.querySelector('span').textContent = value.toFixed(2);
            this.updateAmbientParticleLayerSetting(layerKey, 'glowStrength', value);
        });
        content.appendChild(glowGroup);
        
        // Weave (Medium Only)
        if (layerKey === 'medium') {
            const weaveGroup = document.createElement('div');
            weaveGroup.className = 'ui-settings-group';
            const weaveAmp = layerSettings.weaveAmplitude || 300;
             weaveGroup.innerHTML = `
                <label class="ui-settings-label">Weave Amt: <span class="ui-settings-value">${weaveAmp}</span></label>
                <input type="range" class="ui-settings-slider" min="0" max="2000" step="50" value="${weaveAmp}">
            `;
            weaveGroup.querySelector('input').addEventListener('input', (e) => {
                this.updateAmbientParticleLayerSetting(layerKey, 'weaveAmplitude', parseFloat(e.target.value));
                 e.target.previousElementSibling.querySelector('span').textContent = e.target.value;
            });
            content.appendChild(weaveGroup);
        }
        
        // Twinkle (Light Only)
        if (layerKey === 'light') {
            const twinkleGroup = document.createElement('div');
            twinkleGroup.className = 'ui-settings-group';
            const twinkleInt = layerSettings.twinkleIntensity || 0.8;
             twinkleGroup.innerHTML = `
                <label class="ui-settings-label">Twinkle: <span class="ui-settings-value">${twinkleInt}</span></label>
                <input type="range" class="ui-settings-slider" min="0" max="2" step="0.1" value="${twinkleInt}">
            `;
            twinkleGroup.querySelector('input').addEventListener('input', (e) => {
                this.updateAmbientParticleLayerSetting(layerKey, 'twinkleIntensity', parseFloat(e.target.value));
                e.target.previousElementSibling.querySelector('span').textContent = e.target.value;
            });
            content.appendChild(twinkleGroup);
        }

        parentSection.appendChild(header);
        parentSection.appendChild(content);
    }

    updateAmbientParticleLayerSetting(layer, key, value) {
        if (!window.uiSettings.settings.effects) window.uiSettings.settings.effects = {};
        if (!window.uiSettings.settings.effects.ambientParticles) window.uiSettings.settings.effects.ambientParticles = {};
        if (!window.uiSettings.settings.effects.ambientParticles[layer]) window.uiSettings.settings.effects.ambientParticles[layer] = {};
        
        window.uiSettings.settings.effects.ambientParticles[layer][key] = value;
        
        // Update CONFIG_3D if needed
        if (typeof CONFIG_3D !== 'undefined') {
            if (!CONFIG_3D.AMBIENT_PARTICLES) CONFIG_3D.AMBIENT_PARTICLES = {};
            if (!CONFIG_3D.AMBIENT_PARTICLES[layer]) CONFIG_3D.AMBIENT_PARTICLES[layer] = {};
            CONFIG_3D.AMBIENT_PARTICLES[layer][key] = value;
        }
        
        // Update System
        if (window.viewer3D && window.viewer3D.ambientParticles) {
            const updateObj = {};
            updateObj[layer] = {};
            updateObj[layer][key] = value;
            window.viewer3D.ambientParticles.updateSettings(updateObj);
        }
        
        window.uiSettings.saveSettings();
    }

    updateAmbientParticleSetting(key, value) {
        if (!window.uiSettings.settings.effects) {
            window.uiSettings.settings.effects = {};
        }
        if (!window.uiSettings.settings.effects.ambientParticles) {
            window.uiSettings.settings.effects.ambientParticles = {};
        }
        window.uiSettings.settings.effects.ambientParticles[key] = value;
        
        // Update CONFIG_3D
        if (typeof CONFIG_3D !== 'undefined') {
            if (!CONFIG_3D.AMBIENT_PARTICLES) {
                CONFIG_3D.AMBIENT_PARTICLES = {};
            }
            CONFIG_3D.AMBIENT_PARTICLES[key] = value;
        }
        
        // Update particle system
        if (window.viewer3D && window.viewer3D.ambientParticles) {
            const newSettings = {};
            newSettings[key] = value;
            window.viewer3D.ambientParticles.updateSettings(newSettings);
        }
        
        window.uiSettings.saveSettings();
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
