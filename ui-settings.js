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

        // Bind left navigation sidebar tab switching
        if (this.panel) {
            const navBtns = this.panel.querySelectorAll('.nav-tab-btn');
            navBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetTab = btn.getAttribute('data-tab');
                    navBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const pages = this.panel.querySelectorAll('.ui-settings-tab-page');
                    pages.forEach(p => {
                        if (p.id === `tab-page-${targetTab}`) {
                            p.classList.remove('hidden');
                            p.classList.add('active');
                        } else {
                            p.classList.add('hidden');
                            p.classList.remove('active');
                        }
                    });
                });
            });
        }

        // Build the settings UI
        this.buildSettingsUI();
    }

    // ─── Proxy getters: delegate settings data/methods to window.uiSettings ───

    get settings() {
        return window.uiSettings?.settings;
    }

    getSetting(group, key) {
        return window.uiSettings?.getSetting(group, key);
    }

    updateSetting(group, key, value) {
        return window.uiSettings?.updateSetting(group, key, value);
    }

    applySettings() {
        return window.uiSettings?.applySettings();
    }

    saveSettings() {
        return window.uiSettings?.saveSettings();
    }

    applyTheme(theme) {
        return window.uiSettings?.applyTheme(theme);
    }

    applyParticles(settings) {
        return window.uiSettings?.applyParticles(settings);
    }

    // ─────────────────────────────────────────────────────────────────────────

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
        
        const theme = this.getSetting('ui', 'theme') || {};

        // 1. Tab Page: Themes & Presets
        this.createThemesAndPresetsSection();

        // 2. Tab Page: Fonts & Styling
        const stylingPage = document.getElementById('tab-page-styling');
        if (stylingPage) {
            stylingPage.innerHTML = '';
            this.createFontSection(theme, stylingPage);
            this.createColorsSection(theme, stylingPage);
            this.createBackgroundSection(theme, stylingPage);
            this.createBorderSection(theme, stylingPage);
            this.createSpacingSection(theme, stylingPage);
        }

        // 3. Tab Page: Toolbar & Layout
        const layoutPage = document.getElementById('tab-page-layout');
        if (layoutPage) {
            layoutPage.innerHTML = '';
            this.createToolbarAndLayoutSection(theme, layoutPage);
        }

        // 4. Tab Page: 3D & Visual Effects
        const effectsPage = document.getElementById('tab-page-effects');
        if (effectsPage) {
            const effectSection = effectsPage.querySelector('#effect-settings-section');
            effectsPage.innerHTML = '';
            if (effectSection) effectsPage.appendChild(effectSection);
            this.createFilterHighlightSection(effectsPage);
        }

        // 5. Tab Page: Particles
        const particlesPage = document.getElementById('tab-page-particles');
        if (particlesPage) {
            particlesPage.innerHTML = '';
            this.createBoxParticlesSection(particlesPage);
            
            if (typeof this.createAmbientParticlesSection === 'function') {
                const ambientSection = this.createAmbientParticlesSection();
                if (ambientSection) particlesPage.appendChild(ambientSection);
            }
            
            if (typeof this.createCursorParticlesSection === 'function') {
                const cursorSection = this.createCursorParticlesSection();
                if (cursorSection) particlesPage.appendChild(cursorSection);
            }
        }

        // 6. Tab Page: Branding & Info
        const brandingPage = document.getElementById('tab-page-branding');
        if (brandingPage) {
            brandingPage.innerHTML = '';
            this.createShowcaseContentSection(theme, brandingPage);
        }

        // 7. Tab Page: System & Performance
        const systemPage = document.getElementById('tab-page-system');
        if (systemPage) {
            systemPage.innerHTML = '';
            this.createBlurSection(systemPage);
            this.createPerformanceSection(systemPage);
            this.createTooltipSection(systemPage);
            this.createControlsSection(systemPage);
        }


        
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
        group.style.display = 'flex';
        group.style.flexDirection = 'column';
        group.style.gap = '8px';
        
        let isGradient = false;
        let c1 = '#000000', c2 = '#ffffff';
        let direction = 'to right';
        let solidColor = '#000000';

        if (rgbaValue && rgbaValue.includes('linear-gradient')) {
            isGradient = true;
            // Parse linear-gradient(to right, #000, #fff)
            const dirMatch = rgbaValue.match(/linear-gradient\(([^,]+),\s*(.+?),\s*(.+?)\)/);
            if (dirMatch) {
                direction = dirMatch[1].trim();
                c1 = dirMatch[2].trim();
                c2 = dirMatch[3].trim();
            }
        } else {
            solidColor = this.parseColorToHex(rgbaValue) || '#000000';
        }
        
        // Header Row (Label + Type Toggle)
        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.alignItems = 'center';
        
        const labelEl = document.createElement('label');
        labelEl.className = 'ui-settings-label';
        labelEl.textContent = label;
        labelEl.style.marginBottom = '0';
        
        const typeSelect = document.createElement('select');
        typeSelect.className = 'ui-settings-dropdown';
        typeSelect.style.width = '80px';
        typeSelect.style.padding = '2px 5px';
        typeSelect.innerHTML = `
            <option value="solid" ${!isGradient ? 'selected' : ''}>Solid</option>
            <option value="gradient" ${isGradient ? 'selected' : ''}>Gradient</option>
        `;
        
        headerRow.appendChild(labelEl);
        headerRow.appendChild(typeSelect);
        group.appendChild(headerRow);
        
        // Solid Container
        const solidContainer = document.createElement('div');
        solidContainer.style.display = !isGradient ? 'flex' : 'none';
        solidContainer.style.alignItems = 'center';
        solidContainer.style.gap = '10px';
        
        const solidInput = document.createElement('input');
        solidInput.type = 'color';
        solidInput.className = 'ui-settings-color-input';
        solidInput.value = solidColor;
        solidInput.style.flex = '1';
        
        solidContainer.appendChild(solidInput);
        group.appendChild(solidContainer);
        
        // Gradient Container
        const gradContainer = document.createElement('div');
        gradContainer.style.display = isGradient ? 'flex' : 'none';
        gradContainer.style.flexDirection = 'column';
        gradContainer.style.gap = '6px';
        
        const dirSelect = document.createElement('select');
        dirSelect.className = 'ui-settings-dropdown';
        dirSelect.innerHTML = `
            <option value="to right" ${direction === 'to right' ? 'selected' : ''}>Horizontal (→)</option>
            <option value="to bottom" ${direction === 'to bottom' ? 'selected' : ''}>Vertical (↓)</option>
            <option value="135deg" ${direction === '135deg' ? 'selected' : ''}>Diagonal (↘)</option>
            <option value="45deg" ${direction === '45deg' ? 'selected' : ''}>Diagonal (↗)</option>
        `;
        
        const colorsRow = document.createElement('div');
        colorsRow.style.display = 'flex';
        colorsRow.style.gap = '10px';
        
        const c1Input = document.createElement('input');
        c1Input.type = 'color';
        c1Input.className = 'ui-settings-color-input';
        c1Input.value = this.parseColorToHex(c1) || '#000000';
        c1Input.style.flex = '1';
        
        const c2Input = document.createElement('input');
        c2Input.type = 'color';
        c2Input.className = 'ui-settings-color-input';
        c2Input.value = this.parseColorToHex(c2) || '#ffffff';
        c2Input.style.flex = '1';
        
        colorsRow.appendChild(c1Input);
        colorsRow.appendChild(c2Input);
        
        gradContainer.appendChild(dirSelect);
        gradContainer.appendChild(colorsRow);
        group.appendChild(gradContainer);
        
        // Event Listeners
        const triggerChange = () => {
            if (typeSelect.value === 'solid') {
                onChange(solidInput.value);
            } else {
                onChange(`linear-gradient(${dirSelect.value}, ${c1Input.value}, ${c2Input.value})`);
            }
        };
        
        typeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'solid') {
                solidContainer.style.display = 'flex';
                gradContainer.style.display = 'none';
            } else {
                solidContainer.style.display = 'none';
                gradContainer.style.display = 'flex';
            }
            triggerChange();
        });
        
        solidInput.addEventListener('input', triggerChange);
        dirSelect.addEventListener('change', triggerChange);
        c1Input.addEventListener('input', triggerChange);
        c2Input.addEventListener('input', triggerChange);
        
        return group;
    }

    parseColorToHex(val) {
        if (!val) return null;
        if (val.startsWith('#')) return val.substring(0, 7);
        if (val.startsWith('rgba') || val.startsWith('rgb')) {
            const match = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
            }
        }
        return null;
    }

    createThemesAndPresetsSection() {
        const targetPage = document.getElementById('tab-page-themes');
        if (!targetPage) return;
        targetPage.innerHTML = '';

        const section = document.createElement('div');
        section.className = 'ui-settings-section';

        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = '🎨 Curated Theme Presets';
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'theme-presets-grid';

        const PRESET_THEMES = [
            {
                id: 'midnight-neon',
                name: 'Midnight Neon',
                primary: '#006FEE',
                secondary: '#66AAF9',
                bg: 'rgba(18, 18, 18, 0.94)',
                border: '#005BC4',
                font: 'system-ui, -apple-system, sans-serif'
            },
            {
                id: 'cyberpunk-gold',
                name: 'Cyberpunk Gold',
                primary: '#FFB300',
                secondary: '#FFE082',
                bg: 'rgba(20, 15, 6, 0.95)',
                border: '#FF8F00',
                font: "'Outfit', sans-serif"
            },
            {
                id: 'emerald-luxury',
                name: 'Emerald Luxury',
                primary: '#00C851',
                secondary: '#00E676',
                bg: 'rgba(6, 24, 16, 0.94)',
                border: '#007E33',
                font: "'Inter', sans-serif"
            },
            {
                id: 'sunset-coral',
                name: 'Sunset Coral',
                primary: '#FF4444',
                secondary: '#FF8888',
                bg: 'rgba(28, 12, 16, 0.94)',
                border: '#CC0000',
                font: "'Outfit', sans-serif"
            },
            {
                id: 'nord-frost',
                name: 'Nord Frost',
                primary: '#38BDF8',
                secondary: '#7DD3FC',
                bg: 'rgba(15, 23, 42, 0.94)',
                border: '#3B82F6',
                font: "'Roboto', sans-serif"
            },
            {
                id: 'obsidian-violet',
                name: 'Obsidian Violet',
                primary: '#A855F7',
                secondary: '#C084FC',
                bg: 'rgba(19, 14, 28, 0.94)',
                border: '#7E22CE',
                font: 'system-ui, sans-serif'
            },
            {
                id: 'light-clean',
                name: 'Light Clean',
                primary: '#006FEE',
                secondary: '#005BC4',
                bg: 'rgba(248, 250, 252, 0.96)',
                border: '#CBD5E1',
                text: '#0F172A',
                font: "'Inter', sans-serif"
            }
        ];

        // Load custom user presets from localStorage
        let customPresets = [];
        try {
            const saved = localStorage.getItem('ui_custom_theme_presets');
            if (saved) customPresets = JSON.parse(saved);
        } catch (e) {
            console.warn('[UI Settings] Error reading custom presets:', e);
        }

        const allPresets = [...PRESET_THEMES, ...customPresets];

        allPresets.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'theme-preset-card';

            const cardTitle = document.createElement('div');
            cardTitle.className = 'preset-card-title';
            cardTitle.innerHTML = `<span>${preset.name}</span>`;

            if (preset.isCustom) {
                const delBtn = document.createElement('button');
                delBtn.className = 'preset-delete-btn';
                delBtn.innerHTML = '🗑️';
                delBtn.title = 'Delete custom preset';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteCustomPreset(preset.id);
                });
                cardTitle.appendChild(delBtn);
            }

            const swatches = document.createElement('div');
            swatches.className = 'preset-color-swatches';
            swatches.innerHTML = `
                <div class="swatch-item" style="background:${preset.primary}"></div>
                <div class="swatch-item" style="background:${preset.secondary || preset.primary}"></div>
                <div class="swatch-item" style="background:${preset.bg}"></div>
                <div class="swatch-item" style="background:${preset.border}"></div>
            `;

            card.appendChild(swatches);
            card.appendChild(cardTitle);

            card.addEventListener('click', () => {
                this.applyPresetTheme(preset);
                grid.querySelectorAll('.theme-preset-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });

            grid.appendChild(card);
        });

        section.appendChild(grid);

        // Custom Preset Saver Form
        const saveBox = document.createElement('div');
        saveBox.className = 'custom-preset-save-box';
        saveBox.innerHTML = `
            <input type="text" id="custom-preset-name-input" placeholder="Save current theme as custom preset..." />
            <button class="btn-theme-action" id="btn-save-preset-action">💾 Save Preset</button>
        `;

        section.appendChild(saveBox);
        targetPage.appendChild(section);

        // Bind save button
        setTimeout(() => {
            const btnSave = saveBox.querySelector('#btn-save-preset-action');
            const inputName = saveBox.querySelector('#custom-preset-name-input');
            if (btnSave && inputName) {
                btnSave.addEventListener('click', () => {
                    const presetName = inputName.value.trim();
                    if (!presetName) {
                        alert('Please enter a name for your custom theme preset.');
                        return;
                    }
                    this.saveCurrentThemeAsPreset(presetName);
                    inputName.value = '';
                });
            }
        }, 50);
    }

    applyPresetTheme(preset) {
        console.log('[UI Settings] Applying Theme Preset:', preset.name);
        
        const root = document.documentElement;
        if (preset.primary) {
            root.style.setProperty('--ui-primary-500', preset.primary);
            root.style.setProperty('--ui-primary-400', preset.primary);
            root.style.setProperty('--ui-primary-300', preset.primary);
        }
        if (preset.secondary) {
            root.style.setProperty('--ui-secondary-500', preset.secondary);
        }
        if (preset.bg) {
            root.style.setProperty('--ui-bg-panel', preset.bg);
            root.style.setProperty('--ui-bg-card', preset.bg);
        }
        if (preset.border) {
            root.style.setProperty('--ui-border-color', preset.border);
        }
        if (preset.font) {
            root.style.setProperty('--ui-font-family', preset.font);
        }
        if (preset.text) {
            root.style.setProperty('--ui-text-primary', preset.text);
        }

        if (window.uiSettings) {
            this.updateSetting('ui', 'theme', {
                mode: preset.id && preset.id.includes('light') ? 'light' : 'dark',
                primary: { '500': preset.primary },
                secondary: { '500': preset.secondary || preset.primary },
                background: { panel: preset.bg, card: preset.bg },
                border: { color: preset.border },
                font: { family: preset.font }
            });
        }
    }

    saveCurrentThemeAsPreset(name) {
        const rootStyle = getComputedStyle(document.documentElement);
        const primary = rootStyle.getPropertyValue('--ui-primary-500').trim() || '#006FEE';
        const secondary = rootStyle.getPropertyValue('--ui-secondary-500').trim() || primary;
        const bg = rootStyle.getPropertyValue('--ui-bg-panel').trim() || 'rgba(18, 18, 18, 0.94)';
        const border = rootStyle.getPropertyValue('--ui-border-color').trim() || 'rgba(255, 255, 255, 0.15)';
        const font = rootStyle.getPropertyValue('--ui-font-family').trim() || 'system-ui, sans-serif';

        const customPreset = {
            id: 'custom-' + Date.now(),
            name: name,
            primary: primary,
            secondary: secondary,
            bg: bg,
            border: border,
            font: font,
            isCustom: true
        };

        try {
            let customPresets = [];
            const saved = localStorage.getItem('ui_custom_theme_presets');
            if (saved) customPresets = JSON.parse(saved);
            customPresets.push(customPreset);
            localStorage.setItem('ui_custom_theme_presets', JSON.stringify(customPresets));

            // Refresh presets tab
            this.createThemesAndPresetsSection();
        } catch (e) {
            console.error('[UI Settings] Failed to save custom preset:', e);
        }
    }

    deleteCustomPreset(id) {
        try {
            let customPresets = [];
            const saved = localStorage.getItem('ui_custom_theme_presets');
            if (saved) customPresets = JSON.parse(saved);
            customPresets = customPresets.filter(p => p.id !== id);
            localStorage.setItem('ui_custom_theme_presets', JSON.stringify(customPresets));

            // Refresh presets tab
            this.createThemesAndPresetsSection();
        } catch (e) {
            console.error('[UI Settings] Failed to delete custom preset:', e);
        }
    }

    createToolbarAndLayoutSection(theme, targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Toolbar & Layout';
        section.appendChild(title);
        
        const uiSettings = this.settings.ui;
        if (!uiSettings.toolbar) {
            uiSettings.toolbar = {
                height: 70,
                widthMode: 'full',
                floatingMaxWidth: 1200,
                borderRadius: 12,
                gap: 20,
                virtualVisitViewport: 'drawer',
                locationViewport: 'drawer',
                contactViewport: 'drawer',
                defaultLanguage: 'en'
            };
        }
        const tb = uiSettings.toolbar;

        // 1. Theme Mode
        const themeModeGroup = document.createElement('div');
        themeModeGroup.className = 'ui-settings-group';
        themeModeGroup.innerHTML = `
            <label class="ui-settings-label">Theme Mode</label>
            <select class="ui-settings-input" id="ui-theme-mode" style="width:100%; font-family:inherit; cursor:pointer;">
                <option value="dark" ${uiSettings.themeMode === 'dark' ? 'selected' : ''}>Premium Dark</option>
                <option value="light" ${uiSettings.themeMode === 'light' ? 'selected' : ''}>Elegant Light</option>
            </select>
        `;
        themeModeGroup.querySelector('select').addEventListener('change', (e) => {
            uiSettings.themeMode = e.target.value;
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(themeModeGroup);

        // 2. Toolbar Width Mode
        const widthModeGroup = document.createElement('div');
        widthModeGroup.className = 'ui-settings-group';
        widthModeGroup.innerHTML = `
            <label class="ui-settings-label">Toolbar Width Layout</label>
            <select class="ui-settings-input" id="ui-toolbar-width-mode" style="width:100%; font-family:inherit; cursor:pointer;">
                <option value="full" ${tb.widthMode === 'full' ? 'selected' : ''}>Full Width (Standard)</option>
                <option value="floating" ${tb.widthMode === 'floating' ? 'selected' : ''}>Floating Container</option>
            </select>
        `;
        section.appendChild(widthModeGroup);

        // 3. Floating Max Width (Conditional)
        const floatingMaxWidthGroup = document.createElement('div');
        floatingMaxWidthGroup.className = 'ui-settings-group';
        floatingMaxWidthGroup.style.display = tb.widthMode === 'floating' ? 'block' : 'none';
        floatingMaxWidthGroup.innerHTML = `
            <label class="ui-settings-label">Floating Max Width: <span class="ui-settings-value" id="toolbar-max-width-val">${tb.floatingMaxWidth}px</span></label>
            <input type="range" class="ui-settings-slider" id="ui-toolbar-max-width" min="800" max="1600" step="50" value="${tb.floatingMaxWidth}">
        `;
        floatingMaxWidthGroup.querySelector('input').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('toolbar-max-width-val').textContent = `${val}px`;
            tb.floatingMaxWidth = val;
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(floatingMaxWidthGroup);

        // Toggle Floating group on Width Mode change
        widthModeGroup.querySelector('select').addEventListener('change', (e) => {
            const val = e.target.value;
            tb.widthMode = val;
            floatingMaxWidthGroup.style.display = val === 'floating' ? 'block' : 'none';
            this.applySettings();
            this.saveSettings();
        });

        // 4. Toolbar Height Slider
        const heightGroup = document.createElement('div');
        heightGroup.className = 'ui-settings-group';
        heightGroup.innerHTML = `
            <label class="ui-settings-label">Toolbar Height: <span class="ui-settings-value" id="toolbar-height-val">${tb.height}px</span></label>
            <input type="range" class="ui-settings-slider" id="ui-toolbar-height" min="50" max="100" step="2" value="${tb.height}">
        `;
        heightGroup.querySelector('input').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('toolbar-height-val').textContent = `${val}px`;
            tb.height = val;
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(heightGroup);

        // 5. Toolbar Spacing (Gap)
        const gapGroup = document.createElement('div');
        gapGroup.className = 'ui-settings-group';
        gapGroup.innerHTML = `
            <label class="ui-settings-label">Toolbar Element Spacing: <span class="ui-settings-value" id="toolbar-gap-val">${tb.gap}px</span></label>
            <input type="range" class="ui-settings-slider" id="ui-toolbar-gap" min="5" max="40" step="1" value="${tb.gap}">
        `;
        gapGroup.querySelector('input').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('toolbar-gap-val').textContent = `${val}px`;
            tb.gap = val;
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(gapGroup);

        // 6. Floating Border Radius (used if floating)
        const radiusGroup = document.createElement('div');
        radiusGroup.className = 'ui-settings-group';
        radiusGroup.innerHTML = `
            <label class="ui-settings-label">Floating Border Radius: <span class="ui-settings-value" id="toolbar-radius-val">${tb.borderRadius}px</span></label>
            <input type="range" class="ui-settings-slider" id="ui-toolbar-radius" min="0" max="30" step="2" value="${tb.borderRadius}">
        `;
        radiusGroup.querySelector('input').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('toolbar-radius-val').textContent = `${val}px`;
            tb.borderRadius = val;
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(radiusGroup);

        // 7. Showcase Overlays Viewport Modes
        const overlays = [
            { key: 'virtualVisitViewport', label: 'Virtual Visit Viewport' },
            { key: 'locationViewport', label: 'Location Viewport' },
            { key: 'contactViewport', label: 'Contact Viewport' }
        ];

        overlays.forEach(ov => {
            const ovGroup = document.createElement('div');
            ovGroup.className = 'ui-settings-group';
            ovGroup.innerHTML = `
                <label class="ui-settings-label">${ov.label}</label>
                <select class="ui-settings-input" id="ui-ov-${ov.key}" style="width:100%; font-family:inherit; cursor:pointer;">
                    <option value="drawer" ${tb[ov.key] === 'drawer' ? 'selected' : ''}>Standard Drawer (Sliding Panel)</option>
                    <option value="full" ${tb[ov.key] === 'full' ? 'selected' : ''}>Fullscreen (Maximum Space)</option>
                </select>
            `;
            ovGroup.querySelector('select').addEventListener('change', (e) => {
                tb[ov.key] = e.target.value;
                this.applySettings();
                this.saveSettings();
            });
            section.appendChild(ovGroup);
        });
        
        // 7.5. Unit Details Viewport Mode
        const infoPanelGroup = document.createElement('div');
        infoPanelGroup.className = 'ui-settings-group';
        infoPanelGroup.innerHTML = `
            <label class="ui-settings-label">Unit Details Viewport</label>
            <select class="ui-settings-input" id="ui-info-panel-viewport" style="width:100%; font-family:inherit; cursor:pointer;">
                <option value="popup" ${tb.infoPanelViewport === 'popup' ? 'selected' : ''}>Standard Pop-up</option>
                <option value="full" ${tb.infoPanelViewport === 'full' ? 'selected' : ''}>Fullscreen (Maximum Space)</option>
            </select>
        `;
        infoPanelGroup.querySelector('select').addEventListener('change', (e) => {
            tb.infoPanelViewport = e.target.value;
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(infoPanelGroup);

        // 8. Default Startup Language
        const langGroup = document.createElement('div');
        langGroup.className = 'ui-settings-group';
        langGroup.innerHTML = `
            <label class="ui-settings-label">Default Startup Language</label>
            <select class="ui-settings-input" id="ui-default-lang" style="width:100%; font-family:inherit; cursor:pointer;">
                <option value="en" ${tb.defaultLanguage === 'en' ? 'selected' : ''}>English</option>
                <option value="fr" ${tb.defaultLanguage === 'fr' ? 'selected' : ''}>Français</option>
                <option value="ar" ${tb.defaultLanguage === 'ar' ? 'selected' : ''}>العربية</option>
            </select>
        `;
        langGroup.querySelector('select').addEventListener('change', (e) => {
            tb.defaultLanguage = e.target.value;
            this.saveSettings();
        });
        section.appendChild(langGroup);

        (targetParent || this.content).appendChild(section);
    }

    createShowcaseContentSection(theme, targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Showcase & Contact Details';
        section.appendChild(title);
        
        const uiSettings = this.settings.ui;
        
        // 1. Logo Path
        const logoGroup = document.createElement('div');
        logoGroup.className = 'ui-settings-group';
        logoGroup.innerHTML = `
            <label class="ui-settings-label">Logo Path / URL</label>
            <input type="text" class="ui-settings-input" id="ui-logo-path" 
                   value="${uiSettings.logoPath || ''}" placeholder="e.g. img/logo.png">
        `;
        logoGroup.querySelector('input').addEventListener('change', (e) => {
            uiSettings.logoPath = e.target.value.trim();
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(logoGroup);
        
        // 2. Virtual Visit URL
        const visitGroup = document.createElement('div');
        visitGroup.className = 'ui-settings-group';
        visitGroup.innerHTML = `
            <label class="ui-settings-label">Virtual Visit URL</label>
            <input type="text" class="ui-settings-input" id="ui-visit-url" 
                   value="${uiSettings.visitUrl || ''}" placeholder="Matterport or iframe link">
        `;
        visitGroup.querySelector('input').addEventListener('change', (e) => {
            uiSettings.visitUrl = e.target.value.trim();
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(visitGroup);
        
        // 3. Location Address / Map URL
        const locGroup = document.createElement('div');
        locGroup.className = 'ui-settings-group';
        locGroup.innerHTML = `
            <label class="ui-settings-label">Location Address / Map URL</label>
            <input type="text" class="ui-settings-input" id="ui-location-url" 
                   value="${uiSettings.locationUrl || ''}" placeholder="Google Maps embed link or address">
        `;
        locGroup.querySelector('input').addEventListener('change', (e) => {
            uiSettings.locationUrl = e.target.value.trim();
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(locGroup);

        if (!uiSettings.contact) {
            uiSettings.contact = {
                title: 'VARA Headquarters',
                address: '123 Premium Real Estate Ave, Suite 500, Paris, France',
                phone: '+33 1 23 45 67 89',
                email: 'sales@vara3d.com'
            };
        }
        
        // 4. Contact Title
        const cTitleGroup = document.createElement('div');
        cTitleGroup.className = 'ui-settings-group';
        cTitleGroup.innerHTML = `
            <label class="ui-settings-label">Contact Card Title</label>
            <input type="text" class="ui-settings-input" id="ui-contact-title" 
                   value="${uiSettings.contact.title || ''}" placeholder="e.g. VARA Headquarters">
        `;
        cTitleGroup.querySelector('input').addEventListener('change', (e) => {
            uiSettings.contact.title = e.target.value.trim();
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(cTitleGroup);
        
        // 5. Contact Address
        const cAddressGroup = document.createElement('div');
        cAddressGroup.className = 'ui-settings-group';
        cAddressGroup.innerHTML = `
            <label class="ui-settings-label">Contact Address</label>
            <input type="text" class="ui-settings-input" id="ui-contact-address" 
                   value="${uiSettings.contact.address || ''}" placeholder="Address text">
        `;
        cAddressGroup.querySelector('input').addEventListener('change', (e) => {
            uiSettings.contact.address = e.target.value.trim();
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(cAddressGroup);
        
        // 6. Contact Phone
        const cPhoneGroup = document.createElement('div');
        cPhoneGroup.className = 'ui-settings-group';
        cPhoneGroup.innerHTML = `
            <label class="ui-settings-label">Contact Phone</label>
            <input type="text" class="ui-settings-input" id="ui-contact-phone" 
                   value="${uiSettings.contact.phone || ''}" placeholder="Phone number">
        `;
        cPhoneGroup.querySelector('input').addEventListener('change', (e) => {
            uiSettings.contact.phone = e.target.value.trim();
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(cPhoneGroup);
        
        // 7. Contact Email
        const cEmailGroup = document.createElement('div');
        cEmailGroup.className = 'ui-settings-group';
        cEmailGroup.innerHTML = `
            <label class="ui-settings-label">Contact Email</label>
            <input type="text" class="ui-settings-input" id="ui-contact-email" 
                   value="${uiSettings.contact.email || ''}" placeholder="Email address">
        `;
        cEmailGroup.querySelector('input').addEventListener('change', (e) => {
            uiSettings.contact.email = e.target.value.trim();
            this.applySettings();
            this.saveSettings();
        });
        section.appendChild(cEmailGroup);
        
        (targetParent || this.content).appendChild(section);
    }

    createColorsSection(theme, targetParent) {
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
        
        (targetParent || this.content).appendChild(section);
    }

    createBackgroundSection(theme, targetParent) {
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
            { key: 'hover', label: 'Hover Background' },
            { key: 'overlay', label: 'Modal / Overlay Background' },
            { key: 'input', label: 'Input Background' },
            { key: 'button', label: 'Button Background' },
            { key: 'sliderTrack', label: 'Slider Track Background' },
            { key: 'sliderThumb', label: 'Slider Thumb Background' }
        ];
        
        backgrounds.forEach(bg => {
            const val = (theme.background && theme.background[bg.key]) || this.getDefaultBackground(bg.key);
            section.appendChild(this.createColorControl(bg.label, `ui-bg-${bg.key}`, val,
                (newVal) => this.updateBackgroundSetting(bg.key, newVal)
            ));
        });
        
        (targetParent || this.content).appendChild(section);
    }
    
    createTextSection(theme, targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Text Colors';
        section.appendChild(title);
        
        const textColors = [
            { key: 'primary', label: 'Primary Text' },
            { key: 'secondary', label: 'Secondary Text' },
            { key: 'disabled', label: 'Disabled Text' },
            { key: 'active', label: 'Active / Highlight Text' }
        ];
        
        textColors.forEach(text => {
            const val = (theme.text && theme.text[text.key]) || this.getDefaultText(text.key);
            section.appendChild(this.createColorControl(text.label, `ui-text-${text.key}`, val,
                (newVal) => this.updateTextSetting(text.key, newVal)
            ));
        });
        
        (targetParent || this.content).appendChild(section);
    }
    
    createBorderSection(theme, targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Borders & Corners';
        section.appendChild(title);
        
        // Border Color
        const borderColor = (theme.border && theme.border.color) || 'rgba(255, 255, 255, 0.2)';
        section.appendChild(this.createColorControl('General Border Color', 'ui-border-color', borderColor,
            (val) => this.updateBorderSetting('color', val)
        ));
        
        const inputBorder = (theme.border && theme.border.input) || 'rgba(255, 255, 255, 0.3)';
        section.appendChild(this.createColorControl('Input/Slider Stroke', 'ui-input-border', inputBorder,
            (val) => this.updateBorderSetting('input', val)
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
        radiusTitle.textContent = 'Corner Radius (Roundness)';
        section.appendChild(radiusTitle);

        const radii = [
            { key: 'small', label: 'Small Base' },
            { key: 'medium', label: 'Medium Base' },
            { key: 'large', label: 'Large Base' },
            { key: 'element', label: 'General Elements (Panels)' },
            { key: 'button', label: 'Buttons' },
            { key: 'input', label: 'Inputs & Sliders' }
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

        (targetParent || this.content).appendChild(section);
    }

    updateBorderRadiusSetting(key, value) {
        if (!this.settings.ui.theme.border) {
            this.settings.ui.theme.border = {};
        }
        if (!this.settings.ui.theme.border.radius) {
            this.settings.ui.theme.border.radius = {};
        }
        this.settings.ui.theme.border.radius[key] = value;
        this.applyTheme(this.settings.ui.theme);
        this.saveSettings();
    }
    
    colorToRgba(hex) {
        // This method is now legacy or used for fallback, as our controls emit valid RGBA strings directly
        return hex;
    }
    
    createSpacingSection(theme, targetParent) {
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
        
        (targetParent || this.content).appendChild(section);
    }
    
    createFontSection(theme, targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Typography & Font Family';
        section.appendChild(title);
        
        // Font Family Preset Selector
        const familySelectGroup = document.createElement('div');
        familySelectGroup.className = 'ui-settings-group';
        const currentFont = (theme.font && theme.font.family) || 'system-ui, -apple-system, sans-serif';
        
        familySelectGroup.innerHTML = `
            <label class="ui-settings-label">Font Family Preset</label>
            <select class="effect-dropdown" id="ui-font-family-select" style="width:100%;">
                <option value="system-ui, -apple-system, sans-serif" ${currentFont.includes('system-ui') ? 'selected' : ''}>System Default</option>
                <option value="'Inter', sans-serif" ${currentFont.includes('Inter') ? 'selected' : ''}>Inter (Modern & Clean)</option>
                <option value="'Outfit', sans-serif" ${currentFont.includes('Outfit') ? 'selected' : ''}>Outfit (Sleek Geometric)</option>
                <option value="'Roboto', sans-serif" ${currentFont.includes('Roboto') ? 'selected' : ''}>Roboto (Classic Tech)</option>
                <option value="'Orbitron', sans-serif" ${currentFont.includes('Orbitron') ? 'selected' : ''}>Orbitron (Futuristic)</option>
                <option value="'Courier New', monospace" ${currentFont.includes('Courier') || currentFont.includes('monospace') ? 'selected' : ''}>Monospace</option>
                <option value="Georgia, serif" ${currentFont.includes('Georgia') || currentFont.includes('serif') ? 'selected' : ''}>Serif</option>
            </select>
        `;
        familySelectGroup.querySelector('select').addEventListener('change', (e) => {
            const fontVal = e.target.value;
            document.documentElement.style.setProperty('--ui-font-family', fontVal);
            this.updateFontSetting('family', fontVal);
            const fontInput = document.getElementById('ui-font-family');
            if (fontInput) fontInput.value = fontVal;
        });
        section.appendChild(familySelectGroup);

        // Custom Font Family Input
        const familyGroup = document.createElement('div');
        familyGroup.className = 'ui-settings-group';
        familyGroup.innerHTML = `
            <label class="ui-settings-label">Custom Font Family String</label>
            <input type="text" class="ui-settings-input" id="ui-font-family" 
                   value="${currentFont}" 
                   placeholder="e.g. 'Inter', sans-serif">
        `;
        familyGroup.querySelector('input').addEventListener('change', (e) => {
            const fontVal = e.target.value;
            document.documentElement.style.setProperty('--ui-font-family', fontVal);
            this.updateFontSetting('family', fontVal);
        });
        section.appendChild(familyGroup);
        
        (targetParent || this.content).appendChild(section);
    }

    createFilterHighlightSection(targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Filter Highlighting Options';
        section.appendChild(title);
        
        // Ensure defaults in settings
        if (!this.settings.effects) {
            this.settings.effects = {};
        }
        if (!this.settings.effects.filterHighlight) {
            this.settings.effects.filterHighlight = {
                colorMode: 'status',
                customColor: '#006FEE',
                highlightStyle: 'solid',
                highlightOpacity: 0.60,
                ghostOpacity: 0.05,
                pulseSpeed: 1.0
            };
        }
        const fSettings = this.settings.effects.filterHighlight;
        if (!fSettings.highlightStyle) {
            fSettings.highlightStyle = 'solid';
        }
        
        // 1. Color Mode Dropdown
        const modeGroup = document.createElement('div');
        modeGroup.className = 'ui-settings-group';
        modeGroup.innerHTML = `
            <label class="ui-settings-label">Highlight Color Mode</label>
            <select class="ui-settings-input" id="filter-color-mode" style="width:100%; font-family:inherit; cursor:pointer;">
                <option value="status" ${fSettings.colorMode === 'status' ? 'selected' : ''}>Dynamic Status Colors</option>
                <option value="theme" ${fSettings.colorMode === 'theme' ? 'selected' : ''}>Solid UI Theme Color</option>
                <option value="custom" ${fSettings.colorMode === 'custom' ? 'selected' : ''}>Custom Specific Color</option>
            </select>
        `;
        section.appendChild(modeGroup);

        // 1b. Highlight Style Dropdown
        const styleGroup = document.createElement('div');
        styleGroup.className = 'ui-settings-group';
        styleGroup.innerHTML = `
            <label class="ui-settings-label">Highlight Visual Style</label>
            <select class="ui-settings-input" id="filter-highlight-style" style="width:100%; font-family:inherit; cursor:pointer;">
                <option value="solid" ${fSettings.highlightStyle === 'solid' ? 'selected' : ''}>Solid Color Overlay</option>
                <option value="outline" ${fSettings.highlightStyle === 'outline' ? 'selected' : ''}>Outlines Only</option>
                <option value="glow" ${fSettings.highlightStyle === 'glow' ? 'selected' : ''}>Neon Emissive Glow</option>
                <option value="solid-outline" ${fSettings.highlightStyle === 'solid-outline' ? 'selected' : ''}>Solid Fill + Outlines</option>
            </select>
        `;
        styleGroup.querySelector('select').addEventListener('change', (e) => {
            fSettings.highlightStyle = e.target.value;
            this.saveSettings();
            window.dispatchEvent(new CustomEvent('updateFilterSettingsOnly'));
        });
        section.appendChild(styleGroup);
        
        // 2. Custom Color Picker
        const customColorGroup = document.createElement('div');
        customColorGroup.id = 'filter-custom-color-group';
        customColorGroup.className = 'ui-settings-group';
        customColorGroup.style.display = fSettings.colorMode === 'custom' ? 'block' : 'none';
        
        customColorGroup.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <label class="ui-settings-label" style="margin:0;">Custom Highlight Color</label>
                <input type="color" id="filter-custom-color" value="${fSettings.customColor || '#006FEE'}" style="background:none; border:none; width:40px; height:24px; cursor:pointer; padding:0; margin:0;">
            </div>
        `;
        section.appendChild(customColorGroup);
        
        // Toggle Custom Color display on mode change
        modeGroup.querySelector('select').addEventListener('change', (e) => {
            const val = e.target.value;
            fSettings.colorMode = val;
            customColorGroup.style.display = val === 'custom' ? 'block' : 'none';
            this.saveSettings();
            
            // Re-trigger highlighting in 3D viewer
            window.dispatchEvent(new CustomEvent('updateFilterSettingsOnly'));
        });
        
        customColorGroup.querySelector('input').addEventListener('input', (e) => {
            fSettings.customColor = e.target.value;
            this.saveSettings();
            window.dispatchEvent(new CustomEvent('updateFilterSettingsOnly'));
        });
        
        // 3. Highlighted Opacity Slider
        const hOpacityGroup = document.createElement('div');
        hOpacityGroup.className = 'ui-settings-group';
        hOpacityGroup.innerHTML = `
            <label class="ui-settings-label">Highlight Opacity: <span class="ui-settings-value" id="filter-highlight-opacity-val">${Math.round(fSettings.highlightOpacity * 100)}%</span></label>
            <input type="range" class="ui-settings-slider" id="filter-highlight-opacity" min="0.1" max="1.0" step="0.05" value="${fSettings.highlightOpacity}">
        `;
        hOpacityGroup.querySelector('input').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('filter-highlight-opacity-val').textContent = `${Math.round(val * 100)}%`;
            fSettings.highlightOpacity = val;
            this.saveSettings();
            window.dispatchEvent(new CustomEvent('updateFilterSettingsOnly'));
        });
        section.appendChild(hOpacityGroup);
        
        // 4. Ghost / Unmatched Opacity Slider
        const gOpacityGroup = document.createElement('div');
        gOpacityGroup.className = 'ui-settings-group';
        gOpacityGroup.innerHTML = `
            <label class="ui-settings-label">Unmatched Opacity (Ghost): <span class="ui-settings-value" id="filter-ghost-opacity-val">${Math.round(fSettings.ghostOpacity * 100)}%</span></label>
            <input type="range" class="ui-settings-slider" id="filter-ghost-opacity" min="0.0" max="0.5" step="0.01" value="${fSettings.ghostOpacity}">
        `;
        gOpacityGroup.querySelector('input').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('filter-ghost-opacity-val').textContent = `${Math.round(val * 100)}%`;
            fSettings.ghostOpacity = val;
            this.saveSettings();
            window.dispatchEvent(new CustomEvent('updateFilterSettingsOnly'));
        });
        section.appendChild(gOpacityGroup);
        
        // 5. Breathing Pulse Speed Slider
        const speedGroup = document.createElement('div');
        speedGroup.className = 'ui-settings-group';
        speedGroup.innerHTML = `
            <label class="ui-settings-label">Breathing Pulse Speed: <span class="ui-settings-value" id="filter-pulse-speed-val">${fSettings.pulseSpeed.toFixed(1)}x</span></label>
            <input type="range" class="ui-settings-slider" id="filter-pulse-speed" min="0.0" max="5.0" step="0.1" value="${fSettings.pulseSpeed}">
        `;
        speedGroup.querySelector('input').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('filter-pulse-speed-val').textContent = `${val.toFixed(1)}x`;
            fSettings.pulseSpeed = val;
            this.saveSettings();
        });
        section.appendChild(speedGroup);
        
        (targetParent || this.content).appendChild(section);
    }
    
    createBlurSection(targetParent) {
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
                       ${this.getSetting('ui', 'blurEnabled') ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        enabledGroup.querySelector('input').addEventListener('change', (e) => {
            this.updateSetting('ui', 'blurEnabled', e.target.checked);
        });
        section.appendChild(enabledGroup);
        
        // Blur Intensity
        const intensityGroup = document.createElement('div');
        intensityGroup.className = 'ui-settings-group';
        const blurIntensity = this.getSetting('ui', 'blurIntensity') || 15;
        intensityGroup.innerHTML = `
            <label class="ui-settings-label">Blur Intensity: <span class="ui-settings-value" id="blur-intensity-value">${blurIntensity}px</span></label>
            <input type="range" class="ui-settings-slider" id="ui-blur-intensity" 
                   min="0" max="50" step="1" value="${blurIntensity}">
        `;
        intensityGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('blur-intensity-value').textContent = `${value}px`;
            this.updateSetting('ui', 'blurIntensity', value);
        });
        section.appendChild(intensityGroup);
        
        (targetParent || this.content).appendChild(section);
    }
    
    createPerformanceSection(targetParent) {
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
                       ${this.getSetting('performance', 'lightMode') ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        
        toggleGroup.querySelector('input').addEventListener('change', (e) => {
            window.uiSettings.setSetting('performance', 'lightMode', e.target.checked);
            this.saveSettings();
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
        
        (targetParent || this.content).appendChild(section);
    }
    
    createControlsSection(targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Controls & Navigation';
        section.appendChild(title);
        
        // Scrub Speed Slider
        const scrubGroup = document.createElement('div');
        scrubGroup.className = 'ui-settings-group';
        
        const scrubSpeed = this.getSetting('controls', 'scrubSpeed') || 16;
        
        scrubGroup.innerHTML = `
            <label class="ui-settings-label">Scrub Speed: <span class="ui-settings-value" id="scrub-speed-value">${scrubSpeed}</span></label>
            <p class="ui-settings-description" style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px; margin-bottom: 8px;">Controls the sensitivity of dragging to rotate images.</p>
            <input type="range" class="ui-settings-slider" id="controls-scrub-speed" 
                   min="1" max="30" step="1" value="${scrubSpeed}">
        `;
        
        scrubGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('scrub-speed-value').textContent = value;
            this.updateSetting('controls', 'scrubSpeed', value);
            if (window.productViewer) {
                window.productViewer.sensitivity = Math.max(1, 31 - value);
            }
        });
        
        section.appendChild(scrubGroup);
        (targetParent || this.content).appendChild(section);
    }
    
    createTooltipSection(targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Tooltip Options';
        section.appendChild(title);
        
        // Tooltip Scale Slider
        const scaleGroup = document.createElement('div');
        scaleGroup.className = 'ui-settings-group';
        
        const tooltipScale = this.getSetting('ui', 'tooltipScale') || 1.0;
        
        scaleGroup.innerHTML = `
            <label class="ui-settings-label">Tooltip Size: <span class="ui-settings-value" id="tooltip-scale-value">${(tooltipScale * 100).toFixed(0)}%</span></label>
            <input type="range" class="ui-settings-slider" id="ui-tooltip-scale" 
                   min="0.5" max="2.0" step="0.1" value="${tooltipScale}">
        `;
        
        scaleGroup.querySelector('input').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('tooltip-scale-value').textContent = `${(value * 100).toFixed(0)}%`;
            this.updateSetting('ui', 'tooltipScale', value);
            if (window.viewer3D && window.viewer3D.tooltip && window.viewer3D.tooltip.style.display === 'block') {
                window.viewer3D.tooltip.style.transform = `scale(${value})`;
            }
        });
        
        section.appendChild(scaleGroup);
        (targetParent || this.content).appendChild(section);
    }
    
    createBoxParticlesSection(targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Box Particle System';
        section.appendChild(title);
        
        // Get current settings (support both keys, prefer boxParticles)
        const particleSettings = this.settings.effects?.boxParticles || 
                               this.settings.effects?.oscillatingParticles || {};
        
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
        
        (targetParent || this.content).appendChild(section);
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
        if (!this.settings.effects) {
            this.settings.effects = {};
        }
        // Write to boxParticles
        if (!this.settings.effects.boxParticles) {
            this.settings.effects.boxParticles = {};
        }
        this.settings.effects.boxParticles[key] = value;
        
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
        
        this.saveSettings();
    }
    
    updateBoxParticleLayerSetting(layer, key, value) {
        if (!this.settings.effects) {
            this.settings.effects = {};
        }
        if (!this.settings.effects.boxParticles) {
            this.settings.effects.boxParticles = {};
        }
        if (!this.settings.effects.boxParticles[layer]) {
            this.settings.effects.boxParticles[layer] = {};
        }
        this.settings.effects.boxParticles[layer][key] = value;
        
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
            newSettings[layer] = { ...this.settings.effects.boxParticles[layer] };
            window.viewer3D.boxParticles.updateSettings(newSettings);
        }
        
        this.saveSettings();
        this.saveSettings();
    }

    // Sync saved settings to viewer3D particles
    syncParticlesToViewer() {
        if (!window.viewer3D || !window.viewer3D.ambientParticles || !window.viewer3D.boxParticles) {
            // Retry if viewer or particles not ready
            setTimeout(() => this.syncParticlesToViewer(), 500);
            return;
        }

        console.log('[UI Settings] Syncing stored particle settings to Viewer3D...');
        const settings = this.settings.effects || {};
        
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

        // Sync Cursor
        if (settings.cursorParticles) {
            if (window.viewer3D && window.viewer3D.cursorParticles) {
                window.viewer3D.cursorParticles.setSettings(settings.cursorParticles);
                if (settings.cursorParticles.enabled !== undefined) {
                    window.viewer3D.cursorParticles.setEnabled(settings.cursorParticles.enabled);
                }
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
        const settings = this.settings.effects?.ambientParticles || {};
        
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
        if (!this.settings.effects) this.settings.effects = {};
        if (!this.settings.effects.ambientParticles) this.settings.effects.ambientParticles = {};
        if (!this.settings.effects.ambientParticles[layer]) this.settings.effects.ambientParticles[layer] = {};
        
        this.settings.effects.ambientParticles[layer][key] = value;
        
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
        
        this.saveSettings();
    }

    updateAmbientParticleSetting(key, value) {
        if (!this.settings.effects) {
            this.settings.effects = {};
        }
        if (!this.settings.effects.ambientParticles) {
            this.settings.effects.ambientParticles = {};
        }
        this.settings.effects.ambientParticles[key] = value;
        
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
        
        this.saveSettings();
    }
    
    createCursorParticlesSection() {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        
        const title = document.createElement('h4');
        title.className = 'ui-settings-section-title';
        title.textContent = 'Cursor Particles (CC Model)';
        section.appendChild(title);
        
        const settings = this.settings.effects?.cursorParticles || {};
        
        // Helper to create a control
        const createControl = (label, key, min, max, step, defaultValue, suffix='') => {
            const group = document.createElement('div');
            group.className = 'ui-settings-group';
            const value = settings[key] !== undefined ? settings[key] : defaultValue;
            
            group.innerHTML = `
                <div class="ui-settings-label-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label class="ui-settings-label" style="margin:0;">${label}</label>
                    <input type="number" class="ui-settings-number-input" 
                           min="${min}" max="${max}" step="${step}" value="${value}" 
                           style="width: 60px; padding: 2px 5px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff; text-align: right;">
                </div>
                <input type="range" class="ui-settings-slider" min="${min}" max="${max}" step="${step}" value="${value}" style="width: 100%;">
            `;
            
            const numberInput = group.querySelector('input[type="number"]');
            const slider = group.querySelector('input[type="range"]');
            
            const updateValue = (val) => {
                let parsed = parseFloat(val);
                this.updateCursorParticleSetting(key, parsed);
                numberInput.value = parsed;
                slider.value = parsed;
            };
            
            numberInput.addEventListener('change', (e) => updateValue(e.target.value));
            slider.addEventListener('input', (e) => {
                 numberInput.value = e.target.value;
                 this.updateCursorParticleSetting(key, parseFloat(e.target.value)); 
            });
            
            return group;
        };

        const createDropdown = (label, key, options) => {
            const group = document.createElement('div');
            group.className = 'ui-settings-group';
            const currentVal = settings[key] || options[0];
            
            let optionsHtml = '';
            options.forEach(opt => {
                const sel = (opt === currentVal) ? 'selected' : '';
                optionsHtml += `<option value="${opt}" ${sel}>${opt}</option>`;
            });
            
            group.innerHTML = `
                <div class="ui-settings-label-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <label class="ui-settings-label" style="margin:0;">${label}</label>
                    <select class="ui-settings-dropdown" style="padding: 2px 5px; background: #222; color: #fff; border: 1px solid #444; border-radius: 4px;">
                        ${optionsHtml}
                    </select>
                </div>
            `;
            
            const select = group.querySelector('select');
            select.addEventListener('change', (e) => {
                this.updateCursorParticleSetting(key, e.target.value);
            });
            
            return group;
        };

        // Create Presets Container
        const presetsContainer = document.createElement('div');
        presetsContainer.style.marginBottom = '15px';
        presetsContainer.style.padding = '10px';
        presetsContainer.style.background = '#2a2a2a';
        presetsContainer.style.borderRadius = '4px';
        
        presetsContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label style="color:#eee; font-size:12px;">Presets</label>
                <div style="display:flex; gap:5px;">
                    <select id="cpPresetSelect" style="background:#333; color:#fff; border:1px solid #444; padding:2px 5px; border-radius:3px; max-width:100px;">
                        <option value="default">Default</option>
                        <option value="rocket">Blue Rocket</option>
                        <option value="sparkler">Sparkler (Omni)</option>
                        <option value="fire">Fire Trail</option>
                        <option value="smoke">Smoke</option>
                        <option value="custom">Custom...</option>
                    </select>
                    <button id="cpSavePresetBtn" style="background:#444; color:#fff; border:none; border-radius:3px; cursor:pointer; font-size:10px; padding:3px 6px;">SAVE</button>
                </div>
            </div>
        `;
        
        section.appendChild(presetsContainer);
        
        // Preset Logic
        const presetSelect = presetsContainer.querySelector('#cpPresetSelect');
        const savePresetBtn = presetsContainer.querySelector('#cpSavePresetBtn');
        
        const presets = {
            'default': {
                birthRate: 50, lifeSpan: 1.5, radiusX: 2, radiusY: 2, emissionMode: 'Omni',
                velocity: 20, sprayAngle: 0.5, gravity: 0, resistance: 0.1,
                colors: [0x00ffff, 0x0088ff, 0xff00ff, 0x5500ff], gradientBias: 1.0
            },
            'rocket': {
                birthRate: 100, lifeSpan: 1.0, radiusX: 1, radiusY: 1, emissionMode: 'Directional',
                velocity: 60, sprayAngle: 0.1, gravity: 0, resistance: 0.5,
                colors: [0x00ffff, 0x0000ff, 0x000000], gradientBias: 0.5
            },
            'sparkler': {
                birthRate: 40, lifeSpan: 2.0, radiusX: 2, radiusY: 2, emissionMode: 'Omni',
                velocity: 10, sprayAngle: 2.0, gravity: -10, resistance: 0.0,
                colors: [0xffff00, 0xffaa00, 0xffffff], gradientBias: 1.0
            },
            'fire': {
                birthRate: 200, lifeSpan: 0.8, radiusX: 5, radiusY: 1, emissionMode: 'Directional',
                velocity: 15, sprayAngle: 0.5, gravity: 20, resistance: 0.0,
                colors: [0xffaa00, 0xff3300, 0x550000], gradientBias: 1.2
            },
            'smoke': {
                birthRate: 50, lifeSpan: 3.0, radiusX: 5, radiusY: 5, emissionMode: 'Directional',
                velocity: 5, sprayAngle: 1.0, gravity: -5, resistance: 0.5,
                colors: [0xaaaaaa, 0x666666, 0x222222, 0x000000], gradientBias: 1.0
            }
        };

        // Load Custom Presets
        const storedPresets = JSON.parse(localStorage.getItem('cursor_particle_presets') || '{}');
        Object.keys(storedPresets).forEach(key => {
            presets[key] = storedPresets[key];
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = key + ' (Custom)';
            // Insert before 'custom' option if possible, or just append
            presetSelect.appendChild(opt);
        });
        
        savePresetBtn.addEventListener('click', () => {
            const name = prompt("Enter a name for this preset:");
            if (name && name.trim() !== "") {
                const safeName = name.trim();
                
                // Capture current settings (clone)
                // We want to skip 'enabled' usually, but user asked for all controls.
                // We typically filter out unused keys or system keys.
                const current = JSON.parse(JSON.stringify(this.settings.cursorParticles));
                delete current.enabled; // Don't save enabled state usually? Or yes? User choice. Let's keep it pure data.
                
                presets[safeName] = current;
                storedPresets[safeName] = current;
                localStorage.setItem('cursor_particle_presets', JSON.stringify(storedPresets));
                
                // Add to list if new
                if (!presetSelect.querySelector(`option[value="${safeName}"]`)) {
                    const opt = document.createElement('option');
                    opt.value = safeName;
                    opt.innerText = safeName + ' (Custom)';
                    presetSelect.appendChild(opt);
                }
                
                presetSelect.value = safeName;
                alert(`Preset "${safeName}" saved!`);
            }
        });
        
        presetSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (presets[val]) {
                const p = presets[val];
                // Apply all settings
                Object.keys(p).forEach(k => {
                    this.updateCursorParticleSetting(k, p[k]);
                });
                
                // Reload UI
                this.content.innerHTML = '';
                this.content.appendChild(this.createCursorParticlesSection());
            }
        });

        // Enable
        const enableToggle = document.createElement('div');
        enableToggle.className = 'ui-settings-toggle';
        enableToggle.style.marginBottom = '15px';
        const isEnabled = settings.enabled || false;
        enableToggle.innerHTML = `
            <label class="ui-settings-toggle-label">Enable System</label>
            <label class="ui-settings-switch">
                <input type="checkbox" ${isEnabled ? 'checked' : ''}>
                <span class="ui-settings-switch-slider"></span>
            </label>
        `;
        enableToggle.querySelector('input').addEventListener('change', (e) => {
            this.updateCursorParticleSetting('enabled', e.target.checked);
            if (window.viewer3D && window.viewer3D.cursorParticles) {
                window.viewer3D.cursorParticles.setEnabled(e.target.checked);
            }
        });
        section.appendChild(enableToggle);
        
        // --- 1. PRODUCER ---
        const producerHeader = document.createElement('div');
        producerHeader.innerHTML = '<h5 style="color:#aaa; margin: 10px 0 5px; border-bottom:1px solid #444;">Producer</h5>';
        section.appendChild(producerHeader);
        
        section.appendChild(createControl('Birth Rate', 'birthRate', 1, 500, 1, 50));
        section.appendChild(createControl('Trail Length (Life)', 'lifeSpan', 0.1, 10.0, 0.1, 1.5));
        section.appendChild(createControl('Radius X', 'radiusX', 0, 50, 1, 2));
        section.appendChild(createControl('Radius Y', 'radiusY', 0, 50, 1, 2));
        section.appendChild(createDropdown('Emission Mode', 'emissionMode', ['Omni', 'Directional']));
        
        // --- 2. PHYSICS ---
        const physicsHeader = document.createElement('div');
        physicsHeader.innerHTML = '<h5 style="color:#aaa; margin: 15px 0 5px; border-bottom:1px solid #444;">Physics</h5>';
        section.appendChild(physicsHeader);
        
        section.appendChild(createControl('Velocity', 'velocity', 0, 100, 1, 10));
        section.appendChild(createControl('Velocity Variation %', 'velocityVariation', 0, 100, 1, 50));
        section.appendChild(createControl('Inherit Velocity %', 'inheritVelocity', -200, 200, 5, 0));
        section.appendChild(createControl('Gravity', 'gravity', -100, 100, 1, 0));
        section.appendChild(createControl('Air Resistance (Slowdown)', 'resistance', 0, 5.0, 0.1, 0.1));
        section.appendChild(createControl('Spray Angle (Cone)', 'sprayAngle', 0, 2.0, 0.1, 0.5));
        
        // --- 3. PARTICLE ---
        const particleHeader = document.createElement('div');
        particleHeader.innerHTML = '<h5 style="color:#aaa; margin: 15px 0 5px; border-bottom:1px solid #444;">Particle</h5>';
        section.appendChild(particleHeader);
        
        // Shape
        const shapeGroup = document.createElement('div');
        shapeGroup.className = 'ui-settings-group';
        const shape = settings.shape || 'soft';
        shapeGroup.innerHTML = `
            <label class="ui-settings-label">Particle Type</label>
            <select class="ui-settings-select" style="width: 100%; margin-top: 5px; padding: 5px; background: #333; color: white; border: none; border-radius: 4px;">
                <option value="star" ${shape === 'star' ? 'selected' : ''}>Star</option>
                <option value="circle" ${shape === 'circle' ? 'selected' : ''}>Sphere</option>
                <option value="soft" ${shape === 'soft' ? 'selected' : ''}>Faded Sphere</option>
                <option value="diamond" ${shape === 'diamond' ? 'selected' : ''}>Diamond</option>
            </select>
        `;
        shapeGroup.querySelector('select').addEventListener('change', (e) => {
            this.updateCursorParticleSetting('shape', e.target.value);
        });
        section.appendChild(shapeGroup);
        
        section.appendChild(createControl('Birth Size', 'birthSize', 1, 200, 1, 40));
        section.appendChild(createControl('Death Size', 'deathSize', 0, 200, 1, 0));
        section.appendChild(createControl('Size Variation %', 'sizeVariation', 0, 100, 1, 50));
        section.appendChild(createControl('Max Opacity', 'maxOpacity', 0, 1.0, 0.05, 1.0));
        
        // Colors (Multi-stop Gradient)
        const colorContainer = document.createElement('div');
        colorContainer.className = 'ui-settings-group';
        colorContainer.style.marginTop = '15px';
        colorContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <label class="ui-settings-label" style="margin:0;">Color Map (Birth -> Death)</label>
                <div class="ui-settings-buttons">
                    <button class="ui-settings-button-small" id="addColorBtn" style="padding: 2px 8px;">+</button>
                    <button class="ui-settings-button-small" id="removeColorBtn" style="padding: 2px 8px;">-</button>
                </div>
            </div>
            <div id="cursorColorList" style="display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap;"></div>
        `;
        
        let currentColors = (settings.colors || [0xffff00, 0xff0000, 0xff00ff, 0x0000ff]).slice();
        
        const renderColors = () => {
            const list = colorContainer.querySelector('#cursorColorList');
            list.innerHTML = '';
            
            currentColors.forEach((colorInt, index) => {
                const hex = '#' + colorInt.toString(16).padStart(6, '0');
                const input = document.createElement('input');
                input.type = 'color';
                input.value = hex;
                input.style.cssText = 'flex: 1; height: 30px; min-width: 40px; border: none; padding: 0; cursor: pointer;';
                input.title = `Color ${index + 1}`;
                
                input.addEventListener('input', (e) => {
                    const decimal = parseInt(e.target.value.slice(1), 16);
                    currentColors[index] = decimal;
                    this.updateCursorParticleSetting('colors', currentColors);
                });
                
                list.appendChild(input);
            });
        };
        
        colorContainer.querySelector('#addColorBtn').addEventListener('click', () => {
            if (currentColors.length < 5) {
                const last = currentColors[currentColors.length-1];
                currentColors.push(last);
                renderColors();
                this.updateCursorParticleSetting('colors', currentColors);
            }
        });
        
        colorContainer.querySelector('#removeColorBtn').addEventListener('click', () => {
            if (currentColors.length > 2) {
                currentColors.pop();
                renderColors();
                this.updateCursorParticleSetting('colors', currentColors);
            }
        });
        
        renderColors();
        section.appendChild(colorContainer);
        
        // Gradient Bias
        section.appendChild(createControl('Gradient Shift (Bias)', 'gradientBias', 0.1, 5.0, 0.1, 1.0));

        (targetParent || this.content).appendChild(section);
    }
    
    updateCursorParticleSetting(key, value) {
        if (!this.settings.effects) {
            this.settings.effects = {};
        }
        if (!this.settings.effects.cursorParticles) {
            this.settings.effects.cursorParticles = {};
        }
        this.settings.effects.cursorParticles[key] = value;
        
        // Update CONFIG_3D
        if (typeof CONFIG_3D !== 'undefined') {
            if (!CONFIG_3D.CURSOR_PARTICLES) {
                CONFIG_3D.CURSOR_PARTICLES = {};
            }
            CONFIG_3D.CURSOR_PARTICLES[key] = value;
        }
        
        // Update System
        if (window.viewer3D && window.viewer3D.cursorParticles) {
            const updateObj = {};
            updateObj[key] = value;
            window.viewer3D.cursorParticles.setSettings(updateObj);
        }
        
        this.saveSettings();
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
        if (!this.settings.ui.theme) {
            this.settings.ui.theme = {};
        }
        
        if (key === 'ui-primary-500') {
            if (!this.settings.ui.theme.primary) {
                this.settings.ui.theme.primary = {};
            }
            this.settings.ui.theme.primary['500'] = value;
        } else {
            this.settings.ui.theme[key.replace('ui-', '')] = value;
        }
        
        this.applyTheme(this.settings.ui.theme);
        this.saveSettings();
    }
    
    updateBackgroundSetting(key, value) {
        if (!this.settings.ui.theme.background) {
            this.settings.ui.theme.background = {};
        }
        this.settings.ui.theme.background[key] = this.colorToRgba(value);
        this.applyTheme(this.settings.ui.theme);
        this.saveSettings();
    }
    
    updateTextSetting(key, value) {
        if (!this.settings.ui.theme.text) {
            this.settings.ui.theme.text = {};
        }
        this.settings.ui.theme.text[key] = this.colorToRgba(value);
        this.applyTheme(this.settings.ui.theme);
        this.saveSettings();
    }
    
    updateBorderSetting(key, value) {
        if (!this.settings.ui.theme.border) {
            this.settings.ui.theme.border = {};
        }
        if (key === 'color' || key === 'toolbar') {
            this.settings.ui.theme.border[key] = this.colorToRgba(value);
        } else {
            this.settings.ui.theme.border[key] = value;
        }
        this.applyTheme(this.settings.ui.theme);
        this.saveSettings();
    }
    
    updateSpacingSetting(key, value) {
        if (!this.settings.ui.theme.spacing) {
            this.settings.ui.theme.spacing = {};
        }
        this.settings.ui.theme.spacing[key] = value;
        this.applyTheme(this.settings.ui.theme);
        this.saveSettings();
    }
    
    updateFontSetting(key, value) {
        if (!this.settings.ui.theme.font) {
            this.settings.ui.theme.font = {};
        }
        this.settings.ui.theme.font[key] = value;
        this.applyTheme(this.settings.ui.theme);
        this.saveSettings();
    }
    
    colorToRgba(val) {
        if (!val) return 'rgba(0,0,0,1)';
        if (val.includes('linear-gradient') || val.startsWith('rgba') || val.startsWith('rgb')) {
            return val;
        }
        if (val.startsWith('#')) {
            const r = parseInt(val.slice(1, 3), 16) || 0;
            const g = parseInt(val.slice(3, 5), 16) || 0;
            const b = parseInt(val.slice(5, 7), 16) || 0;
            return `rgba(${r}, ${g}, ${b}, 1)`;
        }
        return val;
    }

    createShowcaseContentSection(theme, targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        section.innerHTML = '<h4 class="ui-settings-section-title">Branding & Info</h4><p style="color:#aaa; font-size:12px;">More showcase branding settings coming soon.</p>';
        targetParent.appendChild(section);
    }

    createBlurSection(targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        section.innerHTML = '<h4 class="ui-settings-section-title">Blur Effects</h4><p style="color:#aaa; font-size:12px;">Blur settings coming soon.</p>';
        targetParent.appendChild(section);
    }

    createPerformanceSection(targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        section.innerHTML = '<h4 class="ui-settings-section-title">Performance</h4><p style="color:#aaa; font-size:12px;">Performance settings coming soon.</p>';
        targetParent.appendChild(section);
    }

    createTooltipSection(targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        section.innerHTML = '<h4 class="ui-settings-section-title">Tooltips</h4><p style="color:#aaa; font-size:12px;">Tooltip settings coming soon.</p>';
        targetParent.appendChild(section);
    }

    createControlsSection(targetParent) {
        const section = document.createElement('div');
        section.className = 'ui-settings-section';
        section.innerHTML = '<h4 class="ui-settings-section-title">Controls</h4><p style="color:#aaa; font-size:12px;">Controls settings coming soon.</p>';
        targetParent.appendChild(section);
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
