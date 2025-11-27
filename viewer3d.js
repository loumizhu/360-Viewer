// Utility function to get client ID from query string
function getClientID() {
    const urlParams = new URLSearchParams(window.location.search);
    const clientID = urlParams.get('clientID');
    return clientID || null;
}

// Utility function to get the repository base path (for GitHub Pages compatibility)
function getRepoBasePath() {
    // Get the current pathname (e.g., "/360-Viewer/index.html" or "/index.html")
    const pathname = window.location.pathname;
    
    // Extract the repository name if we're on GitHub Pages
    // GitHub Pages URLs are like: username.github.io/repo-name/...
    if (pathname.includes('/') && pathname !== '/') {
        // Split by '/' and get the first non-empty segment (the repo name)
        const parts = pathname.split('/').filter(p => p);
        if (parts.length > 0 && parts[0] !== 'index.html') {
            // Check if we're on GitHub Pages by looking for .github.io domain
            if (window.location.hostname.includes('.github.io')) {
                return '/' + parts[0] + '/';
            }
        }
    }
    
    // Default to root for local development
    return '/';
}

// Get repository base path and client ID
const REPO_BASE_PATH = getRepoBasePath();
const CLIENT_ID = getClientID();
const CLIENT_BASE_PATH = CLIENT_ID ? `${CLIENT_ID}/` : '';

// Check for light mode setting
const LIGHT_MODE = window.uiSettings?.getSetting('performance', 'lightMode') || false;

console.log('[Viewer3D] Repo base path:', REPO_BASE_PATH);
console.log('[Viewer3D] Client ID:', CLIENT_ID || 'none (using default paths)');
console.log('[Viewer3D] Base path:', CLIENT_BASE_PATH || 'root');
console.log('[Viewer3D] Light mode:', LIGHT_MODE);

// ============================================
// 3D VIEWER CONFIGURATION
// ============================================
const CONFIG_3D = {
    // Model settings - will use client path if clientID is in query string
    MODEL_PATH: `${REPO_BASE_PATH}${CLIENT_BASE_PATH}3D/Serenia Zenata Orbiting Mockup Units Boxes.glb`.replace(/\/+/g, '/'),
    
    // Material settings - Default (invisible)
    DEFAULT_OPACITY: 0.0,           // 0.0 = invisible, 1.0 = solid
    DEFAULT_COLOR: 0xffffff,        // White
    DEFAULT_DEPTH_WRITE: false,
    
    // Material settings - Hover (red highlight)
    HOVER_OPACITY: 0.5,            // 75% opaque (25% transparent)
    HOVER_COLOR: 0x175ddc,          // blue
    HOVER_EMISSIVE: 0x175ddc,       // Red glow
    HOVER_EMISSIVE_INTENSITY: 0.6,  // Glow strength
    HOVER_DEPTH_WRITE: true,
    
    // Lighting
    AMBIENT_LIGHT_INTENSITY: 1.5,
    DIRECTIONAL_LIGHT_INTENSITY: 1.0,
    DIRECTIONAL_LIGHT_2_INTENSITY: 0.5,
    LIGHT_POSITION_SCALE: 0.3,      // Multiplier for light position based on camera distance
    
    // Camera sync
    CAMERA_ASPECT_RATIO: null,      // Will be set to window.innerWidth / window.innerHeight
    CAMERA_NEAR_CLIP: 0.1,      // Near clipping plane base value (objects closer than this are not rendered)
    CAMERA_FAR_CLIP: 10000000,      // Far clipping plane (objects farther than this are not rendered)
    DYNAMIC_CLIPPING: true,         // Automatically adjust clipping planes based on scene size and zoom level
    NEAR_CLIP_ZOOM_FACTOR: 1.0,     // How aggressively near plane reduces with zoom (1.0 = linear, 2.0 = squared)
    
    // Tooltip settings
    SHOW_TOOLTIP: true,             // Show tooltip with object name on hover
    TOOLTIP_OFFSET_X: 15,           // Horizontal offset from cursor (pixels)
    TOOLTIP_OFFSET_Y: 15,           // Vertical offset from cursor (pixels)
    TOOLTIP_BG_COLOR: 'rgba(0, 0, 0, 0.85)', // Background color
    TOOLTIP_TEXT_COLOR: '#ffffff',  // Text color
    TOOLTIP_FONT_SIZE: '14px',      // Font size
    TOOLTIP_PADDING: '8px 12px',    // Padding
    TOOLTIP_BORDER_RADIUS: '6px',   // Border radius
    TOOLTIP_MAX_WIDTH: '250px',     // Maximum width
    
    // Effect settings
    EFFECT_TYPE: LIGHT_MODE ? 'solid' : 'solid',           // Default effect: 'solid', 'outline', 'glow', 'scan', 'particles'
    // In light mode, force solid effect only
    
    // Solid effect
    SOLID_PULSE_SPEED: 1.0,         // Slow pulse animation speed for solid effect
    
    // Outline effect (BoxHelper)
    OUTLINE_COLOR: 0x00ff00,        // Outline color (green)
    OUTLINE_PULSE_SPEED: 8.0,       // Pulse animation speed
    
    // Glow/Bloom effect
    BLOOM_STRENGTH: 2.5,            // Bloom intensity
    BLOOM_RADIUS: 1.0,              // Bloom spread
    BLOOM_THRESHOLD: 0.6,           // Bloom threshold (higher = only bright objects glow, prevents black screen)
    GLOW_COLOR: 0x175ddc,           // Glow color (separate from hover color)
    
    // Scanning lines effect
    SCAN_SPEED: 2.0,                // Scanning animation speed
    SCAN_LINE_COUNT: 15,            // Number of scanning lines
    SCAN_COLOR: 0x00ffff,           // Scanning line color (cyan)
    SCAN_OPACITY: 0.8,              // Scanning line opacity
    
    // Particle effect
    PARTICLE_COUNT: 500,            // Number of particles per object
    PARTICLE_SIZE: 0.05,            // Particle size (relative to object size)
    PARTICLE_SPEED: 10.0,            // Particle animation speed
    PARTICLE_COLOR: 0xffff00,       // Particle color (yellow)
    PARTICLE_OPACITY: 0.8,          // Particle opacity
    
    // Debug
    ENABLE_HOVER_LOGGING: true,     // Log object names when hovering
    ENABLE_CLICK_LOGGING: true,     // Log object names when clicking
    ENABLE_CLIPPING_LOGGING: false, // Log camera clipping plane adjustments (for debugging clipping issues)
    SHOW_ZOOM_PIVOT: false,         // Show red crosshair at 3D zoom pivot point (for debugging)
    
    // Scan effect debug settings
    SCAN_DEBUG_MODE: false,         // Enable debug logging and visualization
    SCAN_LOG_GEOMETRY: false,       // Log geometry bounds to console
    
    // Intro Animation settings
    ENABLE_INTRO_ANIMATION: false,   // Enable/disable intro animation
    INTRO_DELAY: 1000,              // Delay before animation starts (ms)
    INTRO_PLANE_SPEED: 2000,        // Speed of plane rising (units per second)
    INTRO_PLANE_ANGLE: 45,          // Angle of plane in degrees (0 = horizontal, 45 = diagonal)
    INTRO_OBJECT_OPACITY: 0.5,      // Opacity when plane touches object
    INTRO_FADE_SPEED: 2.0,          // Speed of fade in/out
    INTRO_PLANE_COLOR: 0x00ffff,    // Color of the scanning plane (cyan) - only for debug
    INTRO_PLANE_OPACITY: 0.0,       // Opacity of the scanning plane (0 = invisible)
    INTRO_SHOW_PLANE: false         // Show the plane during animation (false = invisible)
};

// ============================================
// 3D Overlay Manager for 360° Product Viewer
// ============================================
class Viewer3D {
    constructor(viewer2D) {
        this.viewer2D = viewer2D;
        this.canvas = document.getElementById('viewer3d');
        this.scene = null;
        this.renderer = null;
        this.cameras = [];
        this.currentCameraIndex = 0;
        this.meshes = [];
        this.hoveredObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isHoveringObject = false;
        
        // Effect systems
        this.currentEffect = CONFIG_3D.EFFECT_TYPE;
        this.composer = null;
        this.outlinePass = null;
        this.bloomPass = null;
        this.scanningLines = null;
        this.particleSystems = new Map(); // Map object to particle system
        this.activeEffects = [];
        
        // Scene debug helpers
        this.sceneHelpers = {
            gridHelper: null,
            horizonLines: null,
            vanishingLines: null,
            axesHelper: null,
            allBoxHelpers: [],
            cameraHelper: null
        };
        this.debugSettings = {
            showGrid: false,
            showHorizon: false,
            showVanishing: false,
            showAxes: false,
            showAllBoxes: false,
            showCameraHelper: false,
            gridSize: 10000,
            gridDivisions: 50
        };
        
        // Intro animation state
        this.introAnimation = {
            active: false,
            plane: null,
            planeY: 0,
            startY: 0,
            endY: 0,
            startTime: 0,
            touchedObjects: new Set(),
            objectOpacities: new Map()
        };
        
        // Create tooltip element
        this.createTooltip();
        
        // Setup debug panel
        this.setupDebugPanel();
        
        this.init();
        
        // Setup effect selector UI after DOM is ready and UI settings panel is initialized
        setTimeout(() => {
            this.setupEffectSelector();
        }, 500);
    }
    
    createTooltip() {
        // Create tooltip element if enabled
        if (!CONFIG_3D.SHOW_TOOLTIP) return;
        
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'viewer3d-tooltip';
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.backgroundColor = CONFIG_3D.TOOLTIP_BG_COLOR;
        this.tooltip.style.color = CONFIG_3D.TOOLTIP_TEXT_COLOR;
        this.tooltip.style.fontSize = CONFIG_3D.TOOLTIP_FONT_SIZE;
        this.tooltip.style.padding = CONFIG_3D.TOOLTIP_PADDING;
        this.tooltip.style.borderRadius = CONFIG_3D.TOOLTIP_BORDER_RADIUS;
        this.tooltip.style.maxWidth = CONFIG_3D.TOOLTIP_MAX_WIDTH;
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.zIndex = '10000';
        this.tooltip.style.display = 'none';
        this.tooltip.style.whiteSpace = 'nowrap';
        this.tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        this.tooltip.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        
        document.body.appendChild(this.tooltip);
    }
    
    showTooltip(text, x, y) {
        if (!CONFIG_3D.SHOW_TOOLTIP || !this.tooltip) return;
        
        this.tooltip.textContent = text;
        this.tooltip.style.left = (x + CONFIG_3D.TOOLTIP_OFFSET_X) + 'px';
        this.tooltip.style.top = (y + CONFIG_3D.TOOLTIP_OFFSET_Y) + 'px';
        this.tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        if (!this.tooltip) return;
        this.tooltip.style.display = 'none';
    }
    
    setupEffectSelector() {
        const selector = document.getElementById('effect-select');
        const controlsContainer = document.getElementById('effect-controls');
        
        if (!selector) {
            console.warn('Effect selector not found, retrying...');
            setTimeout(() => this.setupEffectSelector(), 200);
            return;
        }
        
        if (!controlsContainer) {
            console.warn('Effect controls container not found, retrying...');
            setTimeout(() => this.setupEffectSelector(), 200);
            return;
        }
        
        console.log('Setting up effect selector, container found:', controlsContainer);
        
        // Load saved effect type if available, but force 'solid' in light mode
        if (LIGHT_MODE) {
            this.currentEffect = 'solid';
            CONFIG_3D.EFFECT_TYPE = 'solid';
        } else if (window.uiSettings && window.uiSettings.getSetting('effects', 'effectType')) {
            this.currentEffect = window.uiSettings.getSetting('effects', 'effectType');
            CONFIG_3D.EFFECT_TYPE = this.currentEffect;
        }
        selector.value = this.currentEffect;
        
        // Disable effect selector in light mode
        if (LIGHT_MODE) {
            selector.disabled = true;
            selector.title = 'Effect selection disabled in Light Mode';
        }
        
        // Function to show all effect controls at once
        const showAllControls = () => {
            controlsContainer.innerHTML = '';
            
            // Create section for each effect
            const effects = [
                { name: 'solid', label: 'Solid Effect', createFn: (container) => this.createSolidControls(container) },
                { name: 'outline', label: 'Outline Effect', createFn: (container) => this.createOutlineControls(container) },
                { name: 'glow', label: 'Glow Effect', createFn: (container) => this.createGlowControls(container) },
                { name: 'scan', label: 'Scan Effect', createFn: (container) => this.createScanControls(container) },
                { name: 'particles', label: 'Particles Effect', createFn: (container) => this.createParticleControls(container) }
            ];
            
            effects.forEach((effect, index) => {
                // Create section
                const section = document.createElement('div');
                section.className = 'effect-control-section';
                section.style.marginBottom = 'var(--ui-spacing-lg)';
                section.style.paddingBottom = 'var(--ui-spacing-md)';
                section.style.borderBottom = index < effects.length - 1 ? '1px solid var(--ui-border-color)' : 'none';
                
                // Create section header
                const header = document.createElement('h5');
                header.className = 'effect-section-header';
                header.textContent = effect.label;
                header.style.color = 'var(--ui-text-primary)';
                header.style.fontSize = 'var(--ui-font-size-sm)';
                header.style.fontWeight = 'var(--ui-font-weight-semibold)';
                header.style.marginBottom = 'var(--ui-spacing-sm)';
                section.appendChild(header);
                
                // Create container for this effect's controls
                const effectContainer = document.createElement('div');
                effectContainer.className = 'effect-controls-group';
                effectContainer.dataset.effect = effect.name;
                
                // Create controls for this effect in the container
                effect.createFn(effectContainer);
                
                section.appendChild(effectContainer);
                controlsContainer.appendChild(section);
            });
        };
        
        selector.addEventListener('change', (e) => {
            // Ignore changes in light mode
            if (LIGHT_MODE) {
                e.target.value = 'solid';
                return;
            }
            this.currentEffect = e.target.value;
            CONFIG_3D.EFFECT_TYPE = this.currentEffect;
            console.log(`Switched to effect: ${this.currentEffect}`);
            
            // Save effect settings
            if (window.uiSettings) {
                window.uiSettings.saveEffectSettings();
            }
            
            // Clear current hover effect and reapply with new effect
            if (this.hoveredObject) {
                this.clearAllEffects(this.hoveredObject);
                this.applyEffect(this.hoveredObject);
            }
        });
        
        // Initialize controls - show all at once
        showAllControls();
        
        console.log('Effect controls created, container now has', controlsContainer.children.length, 'children');
    }
    
    createControl(container, label, value, min, max, step, onChange) {
        const group = document.createElement('div');
        group.className = 'effect-control-group';
        
        const labelEl = document.createElement('span');
        labelEl.className = 'effect-control-label';
        labelEl.textContent = label + ':';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'effect-slider';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'effect-value';
        valueDisplay.textContent = value;
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            valueDisplay.textContent = val.toFixed(step < 1 ? 1 : 0);
            onChange(val);
            
            // Save effect settings
            if (window.uiSettings) {
                window.uiSettings.saveEffectSettings();
            }
            
            // Reapply effect if hovering
            if (this.hoveredObject) {
                this.clearAllEffects(this.hoveredObject);
                this.applyEffect(this.hoveredObject);
            }
        });
        
        group.appendChild(labelEl);
        group.appendChild(slider);
        group.appendChild(valueDisplay);
        container.appendChild(group);
    }
    
    createSolidControls(container) {
        this.createControl(container, 'Opacity', CONFIG_3D.HOVER_OPACITY, 0, 1, 0.05, (val) => {
            CONFIG_3D.HOVER_OPACITY = val;
        });
        
        // Color picker for cube color
        const colorGroup = document.createElement('div');
        colorGroup.className = 'effect-control-group';
        
        const colorLabel = document.createElement('span');
        colorLabel.className = 'effect-control-label';
        colorLabel.textContent = 'Color:';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'effect-color-picker';
        // Ensure color is properly formatted (always 6 hex digits)
        const hoverColor = CONFIG_3D.HOVER_COLOR || 0x175ddc;
        colorInput.value = '#' + hoverColor.toString(16).padStart(6, '0').toUpperCase();
        colorInput.addEventListener('input', (e) => {
            const colorHex = parseInt(e.target.value.replace('#', ''), 16);
            CONFIG_3D.HOVER_COLOR = colorHex;
            // Update hover material for all meshes (including emissive for consistency)
            if (this.meshes) {
                this.meshes.forEach(mesh => {
                    if (mesh.userData.hoverMaterial) {
                        mesh.userData.hoverMaterial.color.setHex(colorHex);
                        // Also update emissive to match for solid effect consistency
                        mesh.userData.hoverMaterial.emissive.setHex(colorHex);
                        mesh.userData.hoverMaterial.needsUpdate = true;
                    }
                });
            }
            // Reapply effect if hovering (for immediate visual feedback)
            if (this.hoveredObject) {
                const currentEffect = this.currentEffect;
                this.clearAllEffects(this.hoveredObject);
                if (currentEffect === 'solid') {
                    this.applySolidEffect(this.hoveredObject);
                } else if (currentEffect === 'glow') {
                    this.applyGlowEffect(this.hoveredObject);
                } else {
                    this.applyEffect(this.hoveredObject);
                }
            }
        });
        
        // Save on change (after user finishes picking color)
        colorInput.addEventListener('change', (e) => {
            // Save settings after color is fully changed
            if (window.uiSettings) {
                window.uiSettings.saveEffectSettings();
            }
        });
        
        colorGroup.appendChild(colorLabel);
        colorGroup.appendChild(colorInput);
        container.appendChild(colorGroup);
    }
    
    createOutlineControls(container) {
        this.createControl(container, 'Speed', CONFIG_3D.OUTLINE_PULSE_SPEED, 0, 5, 0.1, (val) => {
            CONFIG_3D.OUTLINE_PULSE_SPEED = val;
        });
    }
    
    createGlowControls(container) {
        this.createControl(container, 'Strength', CONFIG_3D.BLOOM_STRENGTH, 0, 5, 0.1, (val) => {
            CONFIG_3D.BLOOM_STRENGTH = val;
            if (this.bloomPass) this.bloomPass.strength = val;
            // Reapply effect if hovering
            if (this.hoveredObject) {
                this.clearAllEffects(this.hoveredObject);
                this.applyEffect(this.hoveredObject);
            }
        });
        this.createControl(container, 'Radius', CONFIG_3D.BLOOM_RADIUS, 0, 2, 0.1, (val) => {
            CONFIG_3D.BLOOM_RADIUS = val;
            if (this.bloomPass) this.bloomPass.radius = val;
        });
        
        // Color picker for glow color
        const glowColorGroup = document.createElement('div');
        glowColorGroup.className = 'effect-control-group';
        
        const glowColorLabel = document.createElement('span');
        glowColorLabel.className = 'effect-control-label';
        glowColorLabel.textContent = 'Glow Color:';
        
        const glowColorInput = document.createElement('input');
        glowColorInput.type = 'color';
        glowColorInput.className = 'effect-color-picker';
        // Ensure glow color is properly formatted (always 6 hex digits)
        const glowColor = CONFIG_3D.GLOW_COLOR !== undefined ? CONFIG_3D.GLOW_COLOR : (CONFIG_3D.HOVER_COLOR || 0x175ddc);
        glowColorInput.value = '#' + glowColor.toString(16).padStart(6, '0').toUpperCase();
        glowColorInput.addEventListener('input', (e) => {
            const colorHex = parseInt(e.target.value.replace('#', ''), 16);
            CONFIG_3D.GLOW_COLOR = colorHex;
            // Reapply glow effect if hovering (for immediate visual feedback)
            if (this.hoveredObject && this.currentEffect === 'glow') {
                this.clearAllEffects(this.hoveredObject);
                this.applyGlowEffect(this.hoveredObject);
            }
        });
        
        // Save on change (after user finishes picking color)
        glowColorInput.addEventListener('change', (e) => {
            // Save settings after color is fully changed
            if (window.uiSettings) {
                window.uiSettings.saveEffectSettings();
            }
        });
        
        glowColorGroup.appendChild(glowColorLabel);
        glowColorGroup.appendChild(glowColorInput);
        container.appendChild(glowColorGroup);
    }
    
    createScanControls(container) {
        this.createControl(container, 'Speed', CONFIG_3D.SCAN_SPEED, 0.1, 5, 0.1, (val) => {
            CONFIG_3D.SCAN_SPEED = val;
        });
        this.createControl(container, 'Lines', CONFIG_3D.SCAN_LINE_COUNT, 1, 20, 1, (val) => {
            CONFIG_3D.SCAN_LINE_COUNT = val;
        });
        this.createControl(container, 'Opacity', CONFIG_3D.SCAN_OPACITY, 0, 1, 0.05, (val) => {
            CONFIG_3D.SCAN_OPACITY = val;
        });
        
        // Add debug toggle button
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Debug';
        debugBtn.className = 'control-btn';
        debugBtn.style.marginLeft = '10px';
        debugBtn.style.padding = '5px 10px';
        debugBtn.style.background = CONFIG_3D.SCAN_DEBUG_MODE ? '#ff4444' : 'rgba(255, 255, 255, 0.1)';
        debugBtn.onclick = () => {
            CONFIG_3D.SCAN_DEBUG_MODE = !CONFIG_3D.SCAN_DEBUG_MODE;
            debugBtn.style.background = CONFIG_3D.SCAN_DEBUG_MODE ? '#ff4444' : 'rgba(255, 255, 255, 0.1)';
            console.log('Scan Debug Mode:', CONFIG_3D.SCAN_DEBUG_MODE);
            
            // Refresh effect on hovered object if any
            if (this.hoveredObject) {
                this.clearAllEffects(this.hoveredObject);
                this.applyEffect(this.hoveredObject);
            }
        };
        container.appendChild(debugBtn);
        
        // Add info text
        const info = document.createElement('span');
        info.className = 'toolbar-label';
        info.style.fontSize = '10px';
        info.style.marginLeft = '5px';
        info.style.opacity = '0.7';
        info.textContent = '(Shows BoxHelper & Axes)';
        container.appendChild(info);
    }
    
    createParticleControls(container) {
        this.createControl(container, 'Count', CONFIG_3D.PARTICLE_COUNT, 50, 1000, 50, (val) => {
            CONFIG_3D.PARTICLE_COUNT = val;
        });
        this.createControl(container, 'Size', CONFIG_3D.PARTICLE_SIZE, 0.01, 0.2, 0.01, (val) => {
            CONFIG_3D.PARTICLE_SIZE = val;
        });
        this.createControl(container, 'Speed', CONFIG_3D.PARTICLE_SPEED, 0.1, 3, 0.1, (val) => {
            CONFIG_3D.PARTICLE_SPEED = val;
        });
    }
    
    // Setup Debug Panel
    setupDebugPanel() {
        try {
            const panel = document.getElementById('debug-panel');
            const toggleBtn = document.getElementById('debugToggleBtn');
            const closeBtn = document.getElementById('debugCloseBtn');
            const content = document.querySelector('.debug-panel-content');
            
            if (!panel || !toggleBtn || !closeBtn || !content) {
                console.warn('Debug panel elements not found, skipping debug panel setup');
                return;
            }
            
            // Toggle button click
            toggleBtn.addEventListener('click', () => {
                panel.classList.toggle('hidden');
            });
            
            // Close button click
            closeBtn.addEventListener('click', () => {
                panel.classList.add('hidden');
            });
            
            // Build debug panel content
            content.innerHTML = this.buildDebugPanelHTML();
            
            // Attach event listeners
            this.attachDebugEventListeners();
            
            console.log('Debug panel initialized');
        } catch (error) {
            console.error('Error setting up debug panel:', error);
        }
    }
    
    buildDebugPanelHTML() {
        return `
            <!-- Visual Helpers Section -->
            <div class="debug-section">
                <div class="debug-section-title">Visual Helpers</div>
                
                <div class="debug-toggle">
                    <label for="debug-grid">Ground Grid</label>
                    <label class="debug-switch">
                        <input type="checkbox" id="debug-grid">
                        <span class="debug-switch-slider"></span>
                    </label>
                </div>
                
                <div class="debug-toggle">
                    <label for="debug-horizon">Horizon Lines</label>
                    <label class="debug-switch">
                        <input type="checkbox" id="debug-horizon">
                        <span class="debug-switch-slider"></span>
                    </label>
                </div>
                
                <div class="debug-toggle">
                    <label for="debug-vanishing">Vanishing Lines</label>
                    <label class="debug-switch">
                        <input type="checkbox" id="debug-vanishing">
                        <span class="debug-switch-slider"></span>
                    </label>
                </div>
                
                <div class="debug-toggle">
                    <label for="debug-axes">World Axes</label>
                    <label class="debug-switch">
                        <input type="checkbox" id="debug-axes">
                        <span class="debug-switch-slider"></span>
                    </label>
                </div>
                
                <div class="debug-toggle">
                    <label for="debug-boxes">All Object Boxes</label>
                    <label class="debug-switch">
                        <input type="checkbox" id="debug-boxes">
                        <span class="debug-switch-slider"></span>
                    </label>
                </div>
                
                <div class="debug-toggle">
                    <label for="debug-camera-helper">Camera Frustum</label>
                    <label class="debug-switch">
                        <input type="checkbox" id="debug-camera-helper">
                        <span class="debug-switch-slider"></span>
                    </label>
                </div>
                
                <div class="debug-slider-control">
                    <div class="debug-slider-label">
                        <span>Grid Size</span>
                        <span class="debug-slider-value" id="grid-size-value">${this.debugSettings.gridSize}</span>
                    </div>
                    <input type="range" class="debug-slider" id="grid-size" 
                           min="1000" max="50000" step="1000" value="${this.debugSettings.gridSize}">
                </div>
                
                <div class="debug-slider-control">
                    <div class="debug-slider-label">
                        <span>Grid Divisions</span>
                        <span class="debug-slider-value" id="grid-divisions-value">${this.debugSettings.gridDivisions}</span>
                    </div>
                    <input type="range" class="debug-slider" id="grid-divisions" 
                           min="10" max="100" step="10" value="${this.debugSettings.gridDivisions}">
                </div>
            </div>
            
            <!-- Camera Info Section -->
            <div class="debug-section">
                <div class="debug-section-title">Camera Info</div>
                <div class="debug-info" id="camera-position">
                    <strong>Position:</strong> Not loaded
                </div>
                <div class="debug-info" id="camera-rotation">
                    <strong>Rotation:</strong> Not loaded
                </div>
                <div class="debug-info" id="camera-fov">
                    <strong>FOV:</strong> Not loaded
                </div>
                <div class="debug-info" id="camera-zoom">
                    <strong>Zoom:</strong> ${this.viewer2D?.zoomLevel?.toFixed(0) || 100}%
                </div>
                <div class="debug-info" id="camera-index">
                    <strong>Camera Index:</strong> 0 / 0
                </div>
            </div>
            
            <!-- Scene Info Section -->
            <div class="debug-section">
                <div class="debug-section-title">Scene Info</div>
                <div class="debug-info" id="mesh-count">
                    <strong>Meshes:</strong> 0
                </div>
                <div class="debug-info" id="camera-count">
                    <strong>Cameras:</strong> 0
                </div>
                <div class="debug-info" id="hovered-object">
                    <strong>Hovered:</strong> None
                </div>
            </div>
        `;
    }
    
    attachDebugEventListeners() {
        try {
            // Grid toggle
            document.getElementById('debug-grid')?.addEventListener('change', (e) => {
                this.debugSettings.showGrid = e.target.checked;
                this.toggleGridHelper();
            });
        
        // Horizon toggle
        document.getElementById('debug-horizon')?.addEventListener('change', (e) => {
            this.debugSettings.showHorizon = e.target.checked;
            this.toggleHorizonLines();
        });
        
        // Vanishing lines toggle
        document.getElementById('debug-vanishing')?.addEventListener('change', (e) => {
            this.debugSettings.showVanishing = e.target.checked;
            this.toggleVanishingLines();
        });
        
        // Axes toggle
        document.getElementById('debug-axes')?.addEventListener('change', (e) => {
            this.debugSettings.showAxes = e.target.checked;
            this.toggleAxesHelper();
        });
        
        // All boxes toggle
        document.getElementById('debug-boxes')?.addEventListener('change', (e) => {
            this.debugSettings.showAllBoxes = e.target.checked;
            this.toggleAllBoxHelpers();
        });
        
        // Camera helper toggle
        document.getElementById('debug-camera-helper')?.addEventListener('change', (e) => {
            this.debugSettings.showCameraHelper = e.target.checked;
            this.toggleCameraHelper();
        });
        
        // Grid size slider
        document.getElementById('grid-size')?.addEventListener('input', (e) => {
            this.debugSettings.gridSize = parseInt(e.target.value);
            document.getElementById('grid-size-value').textContent = e.target.value;
            if (this.debugSettings.showGrid) {
                this.toggleGridHelper(); // Recreate grid
                this.toggleGridHelper();
            }
        });
        
        // Grid divisions slider
        document.getElementById('grid-divisions')?.addEventListener('input', (e) => {
            this.debugSettings.gridDivisions = parseInt(e.target.value);
            document.getElementById('grid-divisions-value').textContent = e.target.value;
            if (this.debugSettings.showGrid) {
                this.toggleGridHelper(); // Recreate grid
                this.toggleGridHelper();
            }
        });
        } catch (error) {
            console.error('Error attaching debug event listeners:', error);
        }
    }
    
    async init() {
        // Setup Three.js renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: !LIGHT_MODE, // Disable antialiasing in light mode for performance
            premultipliedAlpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Reduce pixel ratio in light mode for better performance
        this.renderer.setPixelRatio(LIGHT_MODE ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        
        // Load GLB file
        await this.loadGLB();
        
        // Setup postprocessing (for outline and bloom effects)
        this.setupPostProcessing();
        
        // Setup mouse move for hover detection
        this.setupInteraction();
        
        // Initialize cursor to 360 icon (default state - not hovering 3D objects)
        this.canvas.style.cursor = `url("${REPO_BASE_PATH}img/360icon.svg") 15 15, grab`;
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start render loop
        this.animate();
        
        console.log('3D Viewer initialized');
        
        // Start intro animation if enabled
        if (CONFIG_3D.ENABLE_INTRO_ANIMATION) {
            setTimeout(() => this.startIntroAnimation(), CONFIG_3D.INTRO_DELAY);
        }
    }
    
    async loadGLB() {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            
            // Get client ID and build model path with repository base path
            const clientID = getClientID();
            const repoBase = getRepoBasePath();
            const basePath = clientID ? `${clientID}/` : '';
            const modelPath = `${repoBase}${basePath}3D/Serenia Zenata Orbiting Mockup Units Boxes.glb`.replace(/\/+/g, '/');
            
            console.log('[Viewer3D] Loading 3D model from:', modelPath);
            console.log('[Viewer3D] Repo base:', repoBase);
            console.log('[Viewer3D] Client ID:', clientID || 'none');
            
            loader.load(
                modelPath,
                (gltf) => {
                    this.scene = gltf.scene;
                    
                    // Extract cameras from the GLB file
                    this.cameras = [];
                    gltf.cameras.forEach((camera, index) => {
                        if (camera.isCamera) {
                            this.cameras.push(camera);
                        }
                    });
                    
                    console.log(`Found ${this.cameras.length} cameras in GLB file`);
                    
                    // If no cameras in GLB, create a default one
                    if (this.cameras.length === 0) {
                        console.warn('No cameras found in GLB, creating default camera');
                        const defaultCamera = new THREE.PerspectiveCamera(
                            75,
                            window.innerWidth / window.innerHeight,
                            CONFIG_3D.CAMERA_NEAR_CLIP,
                            CONFIG_3D.CAMERA_FAR_CLIP
                        );
                        defaultCamera.position.set(0, 0, 5);
                        this.cameras.push(defaultCamera);
                    }
                    
                    // Apply clipping planes to all cameras
                    this.cameras.forEach(camera => {
                        if (camera.isPerspectiveCamera) {
                            camera.near = CONFIG_3D.CAMERA_NEAR_CLIP;
                            camera.far = CONFIG_3D.CAMERA_FAR_CLIP;
                            camera.updateProjectionMatrix();
                        }
                    });
                    
                    console.log(`Applied clipping planes: near=${CONFIG_3D.CAMERA_NEAR_CLIP}, far=${CONFIG_3D.CAMERA_FAR_CLIP}`);
                    
                    // Set initial camera
                    this.currentCamera = this.cameras[0];
                    
                    // Process meshes - make them transparent and interactive
                    this.scene.traverse((child) => {
                        if (child.isMesh) {
                            this.meshes.push(child);
                            
                            // Store original material
                            child.userData.originalMaterial = child.material.clone();
                            
                            // Create transparent material - invisible by default
                            const transparentMaterial = new THREE.MeshStandardMaterial({
                                color: CONFIG_3D.DEFAULT_COLOR,
                                transparent: true,
                                opacity: CONFIG_3D.DEFAULT_OPACITY,
                                side: THREE.DoubleSide,
                                depthWrite: CONFIG_3D.DEFAULT_DEPTH_WRITE,
                                depthTest: true
                            });
                            
                            child.material = transparentMaterial;
                            child.userData.transparentMaterial = transparentMaterial;
                            
                            // Create hover material (uses current HOVER_COLOR from config)
                            child.userData.hoverMaterial = new THREE.MeshStandardMaterial({
                                color: CONFIG_3D.HOVER_COLOR,
                                transparent: true,
                                opacity: CONFIG_3D.HOVER_OPACITY,
                                side: THREE.DoubleSide,
                                depthWrite: CONFIG_3D.HOVER_DEPTH_WRITE,
                                depthTest: true,
                                emissive: CONFIG_3D.HOVER_COLOR, // Use same color for emissive in solid effect
                                emissiveIntensity: 0.0 // No emissive for solid effect
                            });
                        }
                    });
                    
                    console.log(`Found ${this.meshes.length} meshes in GLB file`);
                    
                    // Calculate bounding box to understand scene scale
                    const box = new THREE.Box3().setFromObject(this.scene);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());
                    
                    // Store for dynamic clipping calculations
                    this.sceneBounds = { box, size, center };
                    
                    console.log('Scene bounding box:');
                    console.log('  Size:', size);
                    console.log('  Center:', center);
                    
                    // Calculate scale factor based on camera distance
                    // Cameras are around 14000 units away, objects are small
                    // We need to scale objects OR we can work with the existing scale
                    
                    // Get average camera distance from origin
                    let avgCameraDistance = 0;
                    this.cameras.forEach(cam => {
                        const dist = cam.position.length();
                        avgCameraDistance += dist;
                    });
                    avgCameraDistance /= this.cameras.length;
                    
                    console.log('Average camera distance from origin:', avgCameraDistance);
                    console.log('Object size:', size.length());
                    
                    // If objects are much smaller than camera distance, they won't be visible
                    // This is expected for architectural models - objects are at real-world scale
                    
                    // Add lights - strong lighting for visibility
                    const ambientLight = new THREE.AmbientLight(0xffffff, CONFIG_3D.AMBIENT_LIGHT_INTENSITY);
                    this.scene.add(ambientLight);
                    
                    // Add lights relative to scene size
                    const directionalLight = new THREE.DirectionalLight(0xffffff, CONFIG_3D.DIRECTIONAL_LIGHT_INTENSITY);
                    const lightPos = avgCameraDistance * CONFIG_3D.LIGHT_POSITION_SCALE;
                    directionalLight.position.set(lightPos, lightPos, lightPos);
                    this.scene.add(directionalLight);
                    
                    const directionalLight2 = new THREE.DirectionalLight(0xffffff, CONFIG_3D.DIRECTIONAL_LIGHT_2_INTENSITY);
                    directionalLight2.position.set(-lightPos, -lightPos, -lightPos);
                    this.scene.add(directionalLight2);
                    
                    // Debug first mesh visibility
                    if (this.meshes.length > 0) {
                        console.log('Sample mesh info:');
                        console.log('  Position:', this.meshes[0].position);
                        console.log('  Scale:', this.meshes[0].scale);
                        console.log('  Visible:', this.meshes[0].visible);
                        console.log('  Material opacity:', this.meshes[0].material.opacity);
                    }
                    
                    // Debug first camera
                    if (this.cameras.length > 0) {
                        console.log('Sample camera info:');
                        console.log('  Position:', this.cameras[0].position);
                        console.log('  Rotation:', this.cameras[0].rotation);
                        if (this.cameras[0].isPerspectiveCamera) {
                            console.log('  FOV:', this.cameras[0].fov);
                            console.log('  Near/Far:', this.cameras[0].near, '/', this.cameras[0].far);
                        }
                    }
                    
                    resolve();
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(0);
                    console.log(`Loading 3D model: ${percent}%`);
                },
                (error) => {
                    console.error('Error loading GLB:', error);
                    reject(error);
                }
            );
        });
    }
    
    setupInteraction() {
        // Mouse move for hover detection
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.scene || !this.currentCamera) return;
            
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.currentCamera);
            
            // Check for intersections
            const intersects = this.raycaster.intersectObjects(this.meshes, false);
            
            if (intersects.length > 0) {
                const newHovered = intersects[0].object;
                this.isHoveringObject = true;
                
                if (this.hoveredObject !== newHovered) {
                    // Clear previous hovered object's effects
                    if (this.hoveredObject) {
                        this.clearAllEffects(this.hoveredObject);
                    }
                    
                    // Apply effect to new hovered object
                    this.hoveredObject = newHovered;
                    this.applyEffect(this.hoveredObject);
                    
                    // Change cursor to pointer when hovering over 3D objects
                    this.canvas.style.cursor = 'pointer';
                    
                    // Hover logging removed for performance
                }
                
                // Show tooltip with object name
                const objectName = this.hoveredObject.name || 'Unnamed Object';
                this.showTooltip(objectName, e.clientX, e.clientY);
            } else {
                // No intersection - reset hover and set 360 cursor on 3D canvas (which is on top)
                this.isHoveringObject = false;
                // Set custom 360 cursor when hovering over image (not 3D objects)
                this.canvas.style.cursor = `url("${REPO_BASE_PATH}img/360icon.svg") 15 15, grab`;
                
                if (this.hoveredObject) {
                    this.clearAllEffects(this.hoveredObject);
                    this.hoveredObject = null;
                }
                
                // Hide tooltip
                this.hideTooltip();
            }
        });
        
        // Track if user started dragging on 3D object
        this.dragStartedOn3D = false;
        
        // Mouse down - pass to 2D viewer if not hovering 3D object OR if zoomed out (scrubbing mode)
        this.canvas.addEventListener('mousedown', (e) => {
            // Check zoom level - if <= 1.0, always forward to 2D viewer for scrubbing
            const viewer2D = window.productViewer || window.viewer;
            const isScrubbingMode = viewer2D && viewer2D.zoom !== undefined && viewer2D.zoom <= 1.0;
            
            // Always forward if in scrubbing mode (zoom <= 1.0), or if not hovering 3D object
            if (isScrubbingMode || !this.isHoveringObject) {
                this.dragStartedOn3D = false;
                // Pass through to 2D viewer by directly calling the handler
                const viewer2D = window.productViewer || window.viewer;
                if (viewer2D && viewer2D.onMouseDown) {
                    e.stopPropagation();
                    viewer2D.onMouseDown(e);
                }
            } else {
                this.dragStartedOn3D = true;
            }
        });
        
        // Mouse move - always pass to 2D viewer if drag didn't start on 3D
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.dragStartedOn3D) {
                // Pass through to 2D viewer by directly calling the handler
                const viewer2D = window.productViewer || window.viewer;
                if (viewer2D && viewer2D.onMouseMove) {
                    e.stopPropagation();
                    viewer2D.onMouseMove(e);
                }
            }
        });
        
        // Mouse up - always pass to 2D viewer to ensure drag ends properly
        this.canvas.addEventListener('mouseup', (e) => {
            const viewer2DCanvas = document.getElementById('viewer');
            const mouseEvent = new MouseEvent('mouseup', {
                clientX: e.clientX,
                clientY: e.clientY,
                buttons: e.buttons,
                bubbles: true,
                cancelable: true
            });
            viewer2DCanvas.dispatchEvent(mouseEvent);
            
            this.dragStartedOn3D = false;
        });
        
        // Mouse leave - always forward to 2D viewer to ensure drag ends properly
        this.canvas.addEventListener('mouseleave', (e) => {
            if (!this.dragStartedOn3D) {
                const viewer2DCanvas = document.getElementById('viewer');
                if (viewer2DCanvas) {
                    const mouseEvent = new MouseEvent('mouseup', {
                        clientX: e.clientX,
                        clientY: e.clientY,
                        bubbles: true,
                        cancelable: true
                    });
                    viewer2DCanvas.dispatchEvent(mouseEvent);
                }
            }
            this.dragStartedOn3D = false;
            
            // Reset hover state and cursor back to 360 icon
            this.isHoveringObject = false;
            this.canvas.style.cursor = `url("${REPO_BASE_PATH}img/360icon.svg") 15 15, grab`;
            
            // Clear effects if hovering object
            if (this.hoveredObject) {
                this.clearAllEffects(this.hoveredObject);
                this.hoveredObject = null;
            }
            
            // Hide tooltip when mouse leaves canvas
            this.hideTooltip();
        });
        
        // Touch events - don't handle on 3D canvas, let them pass through to 2D canvas
        // The 2D canvas handles all touch interactions (scrubbing/panning/pinch zoom)
        // We use pointer-events CSS to allow touches to pass through on mobile
        
        // Click handler for 3D objects - show plan image
        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredObject) {
                const objectName = this.hoveredObject.name;
                if (objectName) {
                    this.showPlanImage(objectName);
                }
            }
        });
        
        // Pass through wheel events to 2D viewer for zoom functionality
        this.canvas.addEventListener('wheel', (e) => {
            // Always pass wheel events to the 2D viewer (for zoom)
            const viewer2DCanvas = document.getElementById('viewer');
            const wheelEvent = new WheelEvent('wheel', {
                deltaY: e.deltaY,
                deltaX: e.deltaX,
                deltaZ: e.deltaZ,
                deltaMode: e.deltaMode,
                clientX: e.clientX,
                clientY: e.clientY,
                bubbles: true,
                cancelable: true
            });
            viewer2DCanvas.dispatchEvent(wheelEvent);
        }, { passive: false });
    }
    
    switchCamera(index) {
        if (index < 0 || index >= this.cameras.length) return;
        
        this.currentCameraIndex = index;
        this.currentCamera = this.cameras[index];
        
        // Store original FOV for this camera
        if (this.currentCamera.isPerspectiveCamera) {
            if (!this.currentCamera.userData.originalFOV) {
                this.currentCamera.userData.originalFOV = this.currentCamera.fov;
            }
            this.originalFOV = this.currentCamera.userData.originalFOV;
            
            // Update aspect ratio
            this.currentCamera.aspect = window.innerWidth / window.innerHeight;
            this.currentCamera.updateProjectionMatrix();
            
            // Update clipping planes for this camera (pass current zoom level)
            const currentZoom = window.productViewer ? window.productViewer.zoom : 1.0;
            this.updateCameraClipping(currentZoom);
            
            // Sync zoom and pan with 2D viewer
            if (window.productViewer) {
                const mouseX = window.productViewer.lastZoomMouseX || window.innerWidth / 2;
                const mouseY = window.productViewer.lastZoomMouseY || window.innerHeight / 2;
                this.syncZoomAndPan(window.productViewer.zoom, window.productViewer.panX, window.productViewer.panY, mouseX, mouseY);
            }
        }
        
        // Camera switch logging removed
    }
    
    updateCameraClipping(zoomLevel = 1.0) {
        if (!this.currentCamera || !this.currentCamera.isPerspectiveCamera) return;
        if (!CONFIG_3D.DYNAMIC_CLIPPING || !this.sceneBounds) return;
        
        // Calculate distance from camera to scene center
        const cameraToCenter = this.currentCamera.position.distanceTo(this.sceneBounds.center);
        
        // Calculate the radius of the scene (half of diagonal)
        const sceneRadius = this.sceneBounds.size.length() / 2;
        
        // Near plane: Must get MUCH smaller as we zoom in
        // When zoomed in, objects appear closer in perspective, so we need a smaller near plane
        // Use configurable zoom factor (1.0 = linear, 2.0 = squared, 3.0 = cubed)
        let nearPlane = CONFIG_3D.CAMERA_NEAR_CLIP / Math.pow(zoomLevel, CONFIG_3D.NEAR_CLIP_ZOOM_FACTOR);
        
        // Ensure it's never larger than a fraction of the scene
        nearPlane = Math.min(nearPlane, sceneRadius * 0.00001);
        
        // Also ensure it never gets unreasonably small (avoid depth buffer precision issues)
        nearPlane = Math.max(nearPlane, 0.000001);
        
        // Far plane: ensure we can see the entire scene from this camera position
        const farPlane = Math.max(CONFIG_3D.CAMERA_FAR_CLIP, cameraToCenter + sceneRadius * 2);
        
        this.currentCamera.near = nearPlane;
        this.currentCamera.far = farPlane;
        this.currentCamera.updateProjectionMatrix();
        
        if (CONFIG_3D.ENABLE_CLIPPING_LOGGING) {
            console.log(`Camera ${this.currentCameraIndex} clipping (zoom ${zoomLevel.toFixed(2)}x): near=${nearPlane.toFixed(6)}, far=${farPlane.toFixed(0)}`);
        }
    }
    
    onWindowResize() {
        if (!this.currentCamera) return;
        
        if (this.currentCamera.isPerspectiveCamera) {
            this.currentCamera.aspect = window.innerWidth / window.innerHeight;
            this.currentCamera.updateProjectionMatrix();
        }
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update composer size if it exists
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    // ============================================
    // POSTPROCESSING SETUP
    // ============================================
    setupPostProcessing() {
        if (!this.scene || !this.currentCamera) return;
        
        // Skip postprocessing in light mode
        if (LIGHT_MODE) {
            console.log('[Viewer3D] Light mode: Postprocessing disabled');
            this.composer = null;
            this.outlinePass = null;
            this.bloomPass = null;
            return;
        }
        
        try {
            // Check if postprocessing classes are available
            if (typeof THREE.EffectComposer === 'undefined') {
                console.warn('EffectComposer not available. Outline and Bloom effects will be disabled.');
                return;
            }
            
            // Create composer with transparent render target
            this.composer = new THREE.EffectComposer(this.renderer);
            
            // Add render pass (renders the scene) with transparent clearing
            const renderPass = new THREE.RenderPass(this.scene, this.currentCamera);
            renderPass.clear = true;
            renderPass.clearColor = 0x000000;
            renderPass.clearAlpha = 0; // Transparent background - this is the key!
            this.composer.addPass(renderPass);
            
            // Setup outline pass
            if (typeof THREE.OutlinePass !== 'undefined') {
                this.outlinePass = new THREE.OutlinePass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    this.scene,
                    this.currentCamera
                );
                this.outlinePass.edgeStrength = CONFIG_3D.OUTLINE_THICKNESS;
                this.outlinePass.edgeGlow = CONFIG_3D.OUTLINE_GLOW;
                this.outlinePass.edgeThickness = 2.0;
                this.outlinePass.pulsePeriod = 2.0;
                this.outlinePass.visibleEdgeColor.set(CONFIG_3D.OUTLINE_COLOR);
                this.outlinePass.hiddenEdgeColor.set(CONFIG_3D.OUTLINE_COLOR);
                this.outlinePass.enabled = false;
                this.composer.addPass(this.outlinePass);
                
                console.log('OutlinePass initialized with thickness:', CONFIG_3D.OUTLINE_THICKNESS);
            } else {
                console.warn('OutlinePass not available. Outline effect will be disabled.');
            }
            
            // Setup bloom pass (check for dependencies)
            if (typeof THREE.UnrealBloomPass !== 'undefined' && typeof THREE.LuminosityHighPassShader !== 'undefined') {
                // Use VERY high threshold (0.95) so bloom ONLY captures bright emissive objects
                // This prevents any dimming or overlay on the background image
                const bloomThreshold = 0.95; // Very high - only captures bright emissive glow
                this.bloomPass = new THREE.UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    CONFIG_3D.BLOOM_STRENGTH,
                    CONFIG_3D.BLOOM_RADIUS,
                    bloomThreshold
                );
                this.bloomPass.enabled = false;
                // Make sure bloom render targets are transparent
                if (this.bloomPass.renderTargetBright) {
                    this.bloomPass.renderTargetBright.texture.format = THREE.RGBAFormat;
                }
                // Ensure bloom only adds glow, doesn't dim the scene
                // The high threshold ensures only bright emissive objects are processed
                this.composer.addPass(this.bloomPass);
            } else {
                console.warn('UnrealBloomPass or LuminosityHighPassShader not available. Bloom effect will be disabled.');
                console.warn('To enable bloom, add: <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>');
            }
            
            console.log('Postprocessing initialized successfully');
        } catch (error) {
            console.error('Error setting up postprocessing:', error);
            console.warn('Postprocessing disabled. Falling back to basic rendering.');
            this.composer = null;
            this.outlinePass = null;
            this.bloomPass = null;
        }
    }
    
    // ============================================
    // EFFECT METHODS
    // ============================================
    
    applyEffect(object) {
        if (!object) return;
        
        // In light mode, only use simple solid effect
        if (LIGHT_MODE) {
            this.clearEffect(object);
            this.applySolidEffect(object);
            return;
        }
        
        switch (this.currentEffect) {
            case 'solid':
                this.applySolidEffect(object);
                break;
            case 'outline':
                this.applyOutlineEffect(object);
                break;
            case 'glow':
                this.applyGlowEffect(object);
                break;
            case 'scan':
                this.applyScanEffect(object);
                break;
            case 'particles':
                this.applyParticleEffect(object);
                break;
        }
    }
    
    clearAllEffects(object) {
        if (!object) return;
        
        try {
            // Clear solid effect and restore transparent material
            if (object.userData.transparentMaterial) {
                object.material = object.userData.transparentMaterial;
            }
            // Clear solid effect timing
            if (object.userData.solidEffectStartTime) {
                object.userData.solidEffectStartTime = null;
            }
            
            // Clear outline BoxHelper (custom aligned box - child of object)
            if (object.userData.outlineBoxHelper) {
                object.remove(object.userData.outlineBoxHelper); // Remove from object, not scene
                // Dispose geometry and material
                if (object.userData.outlineBoxHelper.geometry) {
                    object.userData.outlineBoxHelper.geometry.dispose();
                }
                if (object.userData.outlineBoxHelper.material) {
                    object.userData.outlineBoxHelper.material.dispose();
                }
                object.userData.outlineBoxHelper = null;
            }
            
            // Clear outline (postprocessing - fallback)
            if (this.outlinePass) {
                this.outlinePass.selectedObjects = [];
                this.outlinePass.enabled = false;
            }
            
            // Clear bloom - disable bloom pass when no object is glowing
            if (this.bloomPass) {
                this.bloomPass.enabled = false;
            }
            // Restore original material properties
            if (object.material && object.userData.originalEmissive !== undefined) {
                object.material.emissive.setHex(object.userData.originalEmissive);
                object.material.emissiveIntensity = object.userData.originalEmissiveIntensity || 0;
                object.material.opacity = object.userData.originalOpacity !== undefined ? object.userData.originalOpacity : CONFIG_3D.DEFAULT_OPACITY;
                object.material.needsUpdate = true;
            }
            
            // Clear scan BoxHelper (custom aligned box - child of object)
            if (object.userData.scanBoxHelper) {
                object.remove(object.userData.scanBoxHelper); // Remove from object, not scene
                // Dispose geometry and material
                if (object.userData.scanBoxHelper.geometry) {
                    object.userData.scanBoxHelper.geometry.dispose();
                }
                if (object.userData.scanBoxHelper.material) {
                    object.userData.scanBoxHelper.material.dispose();
                }
                object.userData.scanBoxHelper = null;
            }
            
            // Clear scan planes (now child of object, not scene)
            if (object.userData.scanPlanes) {
                object.remove(object.userData.scanPlanes); // Remove from object, not scene
                object.userData.scanPlanes.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                object.userData.scanPlanes = null;
            }
            
            // Clear scan material
            if (object.userData.scanMaterial) {
                object.userData.scanMaterial = null;
            }
            
            // Clear scan debug helpers (custom aligned box - child of object)
            if (object.userData.scanDebugBoxHelper) {
                object.remove(object.userData.scanDebugBoxHelper); // Remove from object, not scene
                // Dispose geometry and material
                if (object.userData.scanDebugBoxHelper.geometry) {
                    object.userData.scanDebugBoxHelper.geometry.dispose();
                }
                if (object.userData.scanDebugBoxHelper.material) {
                    object.userData.scanDebugBoxHelper.material.dispose();
                }
                object.userData.scanDebugBoxHelper = null;
            }
            
            // Clear particles
            if (this.particleSystems.has(object)) {
                const particleSystem = this.particleSystems.get(object);
                object.remove(particleSystem);
                this.particleSystems.delete(object);
            }
        } catch (error) {
            console.error('Error clearing effects:', error);
        }
    }
    
    // Solid color effect (original) with slow pulse
    applySolidEffect(object) {
        if (object.userData.hoverMaterial) {
            // Store start time for pulsing animation
            if (!object.userData.solidEffectStartTime) {
                object.userData.solidEffectStartTime = Date.now();
            }
            // Update material color from current config
            object.userData.hoverMaterial.color.setHex(CONFIG_3D.HOVER_COLOR);
            // Update opacity from current config (will be animated in updateEffects)
            object.userData.hoverMaterial.opacity = CONFIG_3D.HOVER_OPACITY;
            object.userData.hoverMaterial.needsUpdate = true;
            object.material = object.userData.hoverMaterial;
        }
    }
    
    // Outline effect - using ALIGNED Box3 helper that respects object rotation
    applyOutlineEffect(object) {
        if (!object.geometry) return;
        
        // Create properly aligned box using object's local bounding box
        // Note: createAlignedBoxHelper adds the box as a child of the object
        const alignedBox = this.createAlignedBoxHelper(object, CONFIG_3D.OUTLINE_COLOR);
        alignedBox.name = 'OutlineBoxHelper';
        alignedBox.userData.startTime = Date.now();
        
        // Store reference for cleanup and animation
        object.userData.outlineBoxHelper = alignedBox;
        
        console.log('Aligned outline applied to:', object.name);
    }
    
    // Create an aligned box helper that respects object rotation
    createAlignedBoxHelper(object, color) {
        // Ensure geometry bounding box is computed
        object.geometry.computeBoundingBox();
        const bbox = object.geometry.boundingBox;
        
        // Get min and max directly from geometry's local bounding box
        // This is already in the object's local coordinate system
        const min = bbox.min.clone();
        const max = bbox.max.clone();
        
        // Create edges geometry (12 edges of a box) using bbox coordinates
        // These coordinates are in the geometry's local space, which is the object's local space
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            // Bottom face (Y = min.y)
            min.x, min.y, min.z,  max.x, min.y, min.z,
            max.x, min.y, min.z,  max.x, min.y, max.z,
            max.x, min.y, max.z,  min.x, min.y, max.z,
            min.x, min.y, max.z,  min.x, min.y, min.z,
            // Top face (Y = max.y)
            min.x, max.y, min.z,  max.x, max.y, min.z,
            max.x, max.y, min.z,  max.x, max.y, max.z,
            max.x, max.y, max.z,  min.x, max.y, max.z,
            min.x, max.y, max.z,  min.x, max.y, min.z,
            // Vertical edges
            min.x, min.y, min.z,  min.x, max.y, min.z,
            max.x, min.y, min.z,  max.x, max.y, min.z,
            max.x, min.y, max.z,  max.x, max.y, max.z,
            min.x, min.y, max.z,  min.x, max.y, max.z
        ]);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1.0,
            linewidth: 2
        });
        
        const boxLines = new THREE.LineSegments(geometry, material);
        
        // CRITICAL: Set box helper to identity transform in object's local space
        // Position at origin, no rotation, no scale - this ensures perfect alignment
        // The geometry vertices are already in the correct local space
        boxLines.position.set(0, 0, 0);
        boxLines.rotation.set(0, 0, 0);
        boxLines.scale.set(1, 1, 1);
        
        // Add as child of object - it will inherit object's transforms (rotation, position, scale)
        // Since the box vertices are in the object's local space, it will align perfectly
        object.add(boxLines);
        
        // Update matrices to ensure proper alignment
        boxLines.updateMatrix();
        boxLines.updateMatrixWorld(true);
        
        // Store object reference for updates
        boxLines.userData.targetObject = object;
        
        return boxLines;
    }
    
    // Glow effect - use pure emissive glow WITHOUT bloom pass to avoid scene dimming
    applyGlowEffect(object) {
        // Store original emissive and opacity
        if (object.userData.originalEmissive === undefined) {
            object.userData.originalEmissive = object.material.emissive.getHex();
            object.userData.originalEmissiveIntensity = object.material.emissiveIntensity || 0;
            object.userData.originalOpacity = object.material.opacity;
        }
        
        // Make object visible - cube should be visible
        object.material.opacity = CONFIG_3D.HOVER_OPACITY;
        object.material.transparent = true;
        
        // Use separate glow color if defined, otherwise use hover color
        const glowColor = CONFIG_3D.GLOW_COLOR !== undefined ? CONFIG_3D.GLOW_COLOR : CONFIG_3D.HOVER_COLOR;
        object.material.color.setHex(glowColor); // Set base color
        object.material.emissive.setHex(glowColor); // Set emissive to same color for glow
        
        // Use VERY strong emissive intensity for visible glow effect
        // This creates a natural glow without postprocessing (which causes dimming)
        // Strength setting controls the intensity: multiply by 3-5 for visible glow
        object.material.emissiveIntensity = Math.max(3.0, CONFIG_3D.BLOOM_STRENGTH * 3);
        object.material.needsUpdate = true;
        
        // CRITICAL: Disable bloom pass entirely - it processes the whole scene and causes dimming
        // Pure emissive glow doesn't affect the background image at all
        if (this.bloomPass) {
            this.bloomPass.enabled = false; // Disabled to prevent ANY scene dimming or overlay
        }
        
        console.log('Glow effect applied - pure emissive glow (no bloom), color:', glowColor.toString(16), 'intensity:', object.material.emissiveIntensity, 'opacity:', object.material.opacity);
    }
    
    // Scanning lines effect - uses aligned box helper like outline
    applyScanEffect(object) {
        if (!object.geometry) return;
        
        // Make the object itself visible and pulsing
        if (object.userData.hoverMaterial) {
            object.material = object.userData.hoverMaterial.clone();
            object.material.opacity = 0.1; // Very low opacity
            object.userData.scanMaterial = object.material;
        }
        
        // Use SAME aligned box as outline (added as child of object)
        const alignedBox = this.createAlignedBoxHelper(object, CONFIG_3D.SCAN_COLOR);
        alignedBox.name = 'ScanBoxHelper';
        alignedBox.userData.startTime = Date.now();
        
        // Store reference for cleanup and animation
        object.userData.scanBoxHelper = alignedBox;
        
        // Get geometry's local bounding box for accurate sizing and positioning
        object.geometry.computeBoundingBox();
        const localBBox = object.geometry.boundingBox;
        const localSize = new THREE.Vector3();
        localBBox.getSize(localSize);
        const localMin = localBBox.min.clone();
        const localMax = localBBox.max.clone();
        const localCenter = new THREE.Vector3();
        localBBox.getCenter(localCenter);
        
        // Create animated scan planes group - add as child of object so it follows transforms
        const scanPlanesGroup = new THREE.Group();
        scanPlanesGroup.name = 'ScanPlanesGroup';
        scanPlanesGroup.userData.startTime = Date.now();
        scanPlanesGroup.userData.localSize = localSize;
        scanPlanesGroup.userData.localMin = localMin;
        scanPlanesGroup.userData.localMax = localMax;
        scanPlanesGroup.userData.localCenter = localCenter;
        scanPlanesGroup.userData.targetObject = object;
        
        // Set group position to geometry's bounding box center (in object's local space)
        // This ensures planes are centered on the geometry, not the object origin
        scanPlanesGroup.position.copy(localCenter);
        scanPlanesGroup.rotation.set(0, 0, 0);
        scanPlanesGroup.scale.set(1, 1, 1);
        
        const lineCount = Math.min(CONFIG_3D.SCAN_LINE_COUNT, 8);
        
        for (let i = 0; i < lineCount; i++) {
            // Create horizontal scan planes - size based on LOCAL geometry size
            // Use the larger of X/Z dimensions to ensure planes cover the object
            // Add small margin (10%) for visual effect
            const planeSize = Math.max(localSize.x, localSize.z) * 1.1;
            const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
            const planeMaterial = new THREE.MeshBasicMaterial({
                color: CONFIG_3D.SCAN_COLOR,
                transparent: true,
                opacity: CONFIG_3D.SCAN_OPACITY * 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            
            // Rotate to be horizontal (XZ plane)
            plane.rotation.x = Math.PI / 2;
            
            // Position relative to group center (which is at geometry's bounding box center)
            // Calculate Y position from min to max of bounding box
            const yPos = localMin.y + (i / lineCount) * localSize.y;
            // Offset from group center (which is at localCenter.y)
            const yOffset = yPos - localCenter.y;
            plane.position.set(0, yOffset, 0);
            
            plane.userData.scanOffset = i / lineCount;
            plane.userData.localMinY = localMin.y;
            plane.userData.localMaxY = localMax.y;
            plane.userData.localSizeY = localSize.y;
            plane.userData.planeSize = planeSize;
            plane.name = `ScanPlane${i}`;
            
            scanPlanesGroup.add(plane);
        }
        
        // Add planes group as child of object so it follows object's transforms
        object.add(scanPlanesGroup);
        object.userData.scanPlanes = scanPlanesGroup;
        
        // Add debug helpers if enabled
        if (CONFIG_3D.SCAN_DEBUG_MODE) {
            // Add green aligned BoxHelper for reference (already added as child by createAlignedBoxHelper)
            const debugBoxHelper = this.createAlignedBoxHelper(object, 0x00ff00);
            debugBoxHelper.name = 'ScanDebugBoxHelper';
            debugBoxHelper.material.opacity = 0.5;
            // Note: debugBoxHelper is already added as child of object by createAlignedBoxHelper
            object.userData.scanDebugBoxHelper = debugBoxHelper;
            
            console.log('Scan debug helpers added:', object.name);
            console.log('World Box:', worldBox);
            console.log('World Size:', worldSize);
            console.log('World Center:', worldCenter);
        }
        
        console.log('Scan effect applied to:', object.name);
    }
    
    // Particle effect
    applyParticleEffect(object) {
        // Get local bounding box (not world space)
        if (!object.geometry) return;
        
        object.geometry.computeBoundingBox();
        const bbox = object.geometry.boundingBox;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        
        // Create particles
        const particleCount = CONFIG_3D.PARTICLE_COUNT;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Start particles at bottom, random X and Z (relative to particle system origin)
            positions[i * 3] = (Math.random() - 0.5) * size.x;
            positions[i * 3 + 1] = - size.y / 2; // Start at bottom
            positions[i * 3 + 2] = (Math.random() - 0.5) * size.z;
            
            // Upward velocity with slight random horizontal movement
            velocities[i * 3] = (Math.random() - 0.5) * 0.05; // Slight X drift
            velocities[i * 3 + 1] = 0.5 + Math.random() * 0.3; // Upward movement
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05; // Slight Z drift
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.userData.velocities = velocities;
        geometry.userData.bounds = size;
        geometry.userData.center = new THREE.Vector3(0, 0, 0); // Center relative to particle system
        
        const material = new THREE.PointsMaterial({
            color: CONFIG_3D.PARTICLE_COLOR,
            size: Math.max(size.x, size.y, size.z) * CONFIG_3D.PARTICLE_SIZE,
            transparent: true,
            opacity: CONFIG_3D.PARTICLE_OPACITY,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        particleSystem.position.set(center.x, center.y, center.z); // Position at geometry center
        particleSystem.userData.startTime = Date.now();
        
        object.add(particleSystem);
        this.particleSystems.set(object, particleSystem);
    }
    
    // ============================================
    // INTRO ANIMATION
    // ============================================
    
    startIntroAnimation() {
        if (!CONFIG_3D.ENABLE_INTRO_ANIMATION || this.meshes.length === 0) return;
        
        console.log('Starting intro animation...');
        
        // Calculate scene bounding box
        const sceneBounds = new THREE.Box3();
        this.meshes.forEach(mesh => {
            const meshBounds = new THREE.Box3().setFromObject(mesh);
            sceneBounds.union(meshBounds);
        });
        
        const sceneSize = new THREE.Vector3();
        sceneBounds.getSize(sceneSize);
        const sceneCenter = new THREE.Vector3();
        sceneBounds.getCenter(sceneCenter);
        
        // Set start and end Y positions
        this.introAnimation.startY = sceneBounds.min.y - sceneSize.y * 0.2;
        this.introAnimation.endY = sceneBounds.max.y + sceneSize.y * 0.2;
        this.introAnimation.planeY = this.introAnimation.startY;
        this.introAnimation.startTime = Date.now();
        this.introAnimation.active = true;
        
        // Store original opacities
        this.meshes.forEach(mesh => {
            this.introAnimation.objectOpacities.set(mesh, mesh.material.opacity);
        });
        
        // Create the scanning plane (invisible by default, used for collision detection)
        const planeSize = Math.max(sceneSize.x, sceneSize.z) * 2;
        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG_3D.INTRO_PLANE_COLOR,
            transparent: true,
            opacity: CONFIG_3D.INTRO_PLANE_OPACITY, // 0 = invisible
            side: THREE.DoubleSide,
            depthWrite: false,
            visible: CONFIG_3D.INTRO_SHOW_PLANE // Control visibility
        });
        
        this.introAnimation.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.introAnimation.plane.name = 'IntroScanPlane';
        this.introAnimation.plane.visible = CONFIG_3D.INTRO_SHOW_PLANE;
        
        // Rotate plane based on angle (convert to radians)
        const angleRad = (CONFIG_3D.INTRO_PLANE_ANGLE * Math.PI) / 180;
        this.introAnimation.plane.rotation.x = Math.PI / 2 - angleRad;
        
        // Position at start
        this.introAnimation.plane.position.set(
            sceneCenter.x,
            this.introAnimation.planeY,
            sceneCenter.z
        );
        
        this.scene.add(this.introAnimation.plane);
        
        console.log('Intro animation started - rising from Y:', this.introAnimation.startY, 'to Y:', this.introAnimation.endY);
    }
    
    updateIntroAnimation() {
        if (!this.introAnimation.active) return;
        
        const elapsed = (Date.now() - this.introAnimation.startTime) / 1000;
        const speed = CONFIG_3D.INTRO_PLANE_SPEED;
        
        // Update plane Y position
        this.introAnimation.planeY = this.introAnimation.startY + (speed * elapsed);
        
        // Update plane position
        if (this.introAnimation.plane) {
            this.introAnimation.plane.position.y = this.introAnimation.planeY;
        }
        
        // Check intersection with each object
        this.meshes.forEach(mesh => {
            const meshBounds = new THREE.Box3().setFromObject(mesh);
            const planeY = this.introAnimation.planeY;
            
            // Check if plane is touching this object
            const isTouching = planeY >= meshBounds.min.y && planeY <= meshBounds.max.y;
            
            if (isTouching) {
                // Fade in to INTRO_OBJECT_OPACITY
                if (!this.introAnimation.touchedObjects.has(mesh)) {
                    this.introAnimation.touchedObjects.add(mesh);
                }
                
                const targetOpacity = CONFIG_3D.INTRO_OBJECT_OPACITY;
                if (mesh.material.opacity < targetOpacity) {
                    mesh.material.opacity = Math.min(
                        targetOpacity,
                        mesh.material.opacity + CONFIG_3D.INTRO_FADE_SPEED * 0.016
                    );
                }
            } else if (this.introAnimation.touchedObjects.has(mesh)) {
                // Fade out back to transparent
                const originalOpacity = this.introAnimation.objectOpacities.get(mesh) || CONFIG_3D.DEFAULT_OPACITY;
                if (mesh.material.opacity > originalOpacity) {
                    mesh.material.opacity = Math.max(
                        originalOpacity,
                        mesh.material.opacity - CONFIG_3D.INTRO_FADE_SPEED * 0.016
                    );
                } else {
                    mesh.material.opacity = originalOpacity;
                }
            }
        });
        
        // Check if animation is complete
        if (this.introAnimation.planeY >= this.introAnimation.endY) {
            this.stopIntroAnimation();
        }
    }
    
    stopIntroAnimation() {
        if (!this.introAnimation.active) return;
        
        console.log('Intro animation complete');
        this.introAnimation.active = false;
        
        // Remove plane
        if (this.introAnimation.plane) {
            this.scene.remove(this.introAnimation.plane);
            this.introAnimation.plane.geometry.dispose();
            this.introAnimation.plane.material.dispose();
            this.introAnimation.plane = null;
        }
        
        // Restore original opacities
        this.meshes.forEach(mesh => {
            const originalOpacity = this.introAnimation.objectOpacities.get(mesh) || CONFIG_3D.DEFAULT_OPACITY;
            mesh.material.opacity = originalOpacity;
        });
        
        // Clear state
        this.introAnimation.touchedObjects.clear();
        this.introAnimation.objectOpacities.clear();
    }
    
    // Update animated effects
    updateEffects() {
        // Skip effect updates in light mode (no animations)
        if (LIGHT_MODE) return;
        
        try {
            const time = Date.now() / 1000;
            
            // Update solid effect pulse (slow pulsing)
            this.meshes.forEach(mesh => {
                if (mesh.userData.solidEffectStartTime && mesh.material === mesh.userData.hoverMaterial) {
                    const elapsed = (Date.now() - mesh.userData.solidEffectStartTime) / 1000;
                    // Slow pulse: sine wave with amplitude 0.3 (30% opacity variation)
                    // Range: 0.2 to 0.8 of HOVER_OPACITY
                    const pulse = Math.sin(elapsed * CONFIG_3D.SOLID_PULSE_SPEED * Math.PI * 2) * 0.3 + 0.5;
                    mesh.material.opacity = CONFIG_3D.HOVER_OPACITY * pulse;
                }
            });
            
            // Update outline BoxHelper
            this.meshes.forEach(mesh => {
                if (mesh.userData.outlineBoxHelper) {
                    const boxHelper = mesh.userData.outlineBoxHelper;
                    const elapsed = (Date.now() - boxHelper.userData.startTime) / 1000;
                    
                    // Pulse the outline
                    const pulse = Math.sin(elapsed * CONFIG_3D.OUTLINE_PULSE_SPEED * 2) * 0.2 + 0.8;
                    boxHelper.material.opacity = pulse;
                    
                    // No need to update position/rotation - it's a child of the object and inherits transforms automatically
                }
            });
            
            // Update scanning effect (BoxHelper + animated planes)
            this.meshes.forEach(mesh => {
                // Update scan BoxHelper (pulsing animation like outline)
                if (mesh.userData.scanBoxHelper) {
                    const boxHelper = mesh.userData.scanBoxHelper;
                    const elapsed = (Date.now() - boxHelper.userData.startTime) / 1000;
                    
                    // Pulse the box opacity
                    const pulse = Math.sin(elapsed * CONFIG_3D.SCAN_SPEED * 2) * 0.2 + 0.8;
                    boxHelper.material.opacity = CONFIG_3D.SCAN_OPACITY * pulse;
                    
                    // No need to update position/rotation - it's a child of the object and inherits transforms automatically
                }
                
                // Pulse the object material
                if (mesh.userData.scanMaterial) {
                    const elapsed = Date.now() / 1000;
                    const pulse = Math.sin(elapsed * CONFIG_3D.SCAN_SPEED * 2) * 0.05 + 0.15;
                    mesh.userData.scanMaterial.opacity = pulse;
                }
                
                // Update scan planes animation
                if (mesh.userData.scanPlanes) {
                    const scanGroup = mesh.userData.scanPlanes;
                    const elapsed = (Date.now() - scanGroup.userData.startTime) / 1000;
                    
                    // Recompute local bounding box in case geometry changed
                    mesh.geometry.computeBoundingBox();
                    const localBBox = mesh.geometry.boundingBox;
                    const localSize = new THREE.Vector3();
                    localBBox.getSize(localSize);
                    const localMin = localBBox.min.clone();
                    const localMax = localBBox.max.clone();
                    const localCenter = new THREE.Vector3();
                    localBBox.getCenter(localCenter);
                    
                    // Update group position to geometry's bounding box center
                    scanGroup.position.copy(localCenter);
                    
                    scanGroup.children.forEach((plane, i) => {
                        if (plane.userData.scanOffset !== undefined) {
                            // Animate opacity with wave pattern
                            const offset = plane.userData.scanOffset;
                            const wave = Math.sin((elapsed * CONFIG_3D.SCAN_SPEED + offset * 2) * Math.PI * 2);
                            plane.material.opacity = CONFIG_3D.SCAN_OPACITY * 0.3 * (wave * 0.5 + 0.5);
                            
                            // Update plane Y position relative to group center
                            const yPos = localMin.y + (i / scanGroup.children.length) * localSize.y;
                            const yOffset = yPos - localCenter.y;
                            plane.position.y = yOffset;
                            
                            // Update plane size based on local size (not world size)
                            const planeSize = Math.max(localSize.x, localSize.z) * 1.1;
                            if (!plane.userData.planeSize || Math.abs(plane.userData.planeSize - planeSize) > 0.01) {
                                plane.geometry.dispose();
                                plane.geometry = new THREE.PlaneGeometry(planeSize, planeSize);
                                plane.userData.planeSize = planeSize;
                            }
                        }
                    });
                }
                
                // Debug BoxHelper updates automatically as child of object
            });
            
            // Update particles
            this.particleSystems.forEach((particleSystem, object) => {
                const positions = particleSystem.geometry.attributes.position.array;
                const velocities = particleSystem.geometry.userData.velocities;
                const bounds = particleSystem.geometry.userData.bounds;
                const center = particleSystem.geometry.userData.center; // This is now (0,0,0)
                
                for (let i = 0; i < positions.length / 3; i++) {
                    // Update position
                    positions[i * 3] += velocities[i * 3] * CONFIG_3D.PARTICLE_SPEED * 0.1;
                    positions[i * 3 + 1] += velocities[i * 3 + 1] * CONFIG_3D.PARTICLE_SPEED * 0.1;
                    positions[i * 3 + 2] += velocities[i * 3 + 2] * CONFIG_3D.PARTICLE_SPEED * 0.1;
                    
                    // Reset to bottom if particle goes above top (center.y is 0)
                    if (positions[i * 3 + 1] > bounds.y / 2) {
                        positions[i * 3 + 1] = - bounds.y / 2;
                        // Randomize X and Z when resetting
                        positions[i * 3] = (Math.random() - 0.5) * bounds.x;
                        positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;
                    }
                    
                    // Keep particles within X bounds
                    if (Math.abs(positions[i * 3]) > bounds.x / 2) {
                        positions[i * 3] = (Math.random() - 0.5) * bounds.x;
                    }
                    
                    // Keep particles within Z bounds
                    if (Math.abs(positions[i * 3 + 2]) > bounds.z / 2) {
                        positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;
                    }
                }
                
                particleSystem.geometry.attributes.position.needsUpdate = true;
            });
            
            // Update outline pulse (for postprocessing outline if enabled - fallback)
            if (this.outlinePass && this.outlinePass.enabled) {
                const pulse = Math.sin(time * CONFIG_3D.OUTLINE_PULSE_SPEED) * 0.5 + 0.5;
                this.outlinePass.edgeStrength = CONFIG_3D.OUTLINE_THICKNESS * (0.5 + pulse * 0.5);
            }
        } catch (error) {
            console.error('Error updating effects:', error);
        }
    }
    
    // Debug Helper Toggle Methods
    toggleGridHelper() {
        if (this.debugSettings.showGrid) {
            // Remove old grid if exists
            if (this.sceneHelpers.gridHelper) {
                this.scene.remove(this.sceneHelpers.gridHelper);
                // GridHelper doesn't have dispose, just dispose geometry and material
                if (this.sceneHelpers.gridHelper.geometry) this.sceneHelpers.gridHelper.geometry.dispose();
                if (this.sceneHelpers.gridHelper.material) this.sceneHelpers.gridHelper.material.dispose();
            }
            
            // Create new grid
            const size = this.debugSettings.gridSize;
            const divisions = this.debugSettings.gridDivisions;
            this.sceneHelpers.gridHelper = new THREE.GridHelper(size, divisions, 0x888888, 0x444444);
            this.sceneHelpers.gridHelper.name = 'GridHelper';
            this.scene.add(this.sceneHelpers.gridHelper);
            console.log(`Grid Helper added: ${size} x ${divisions}`);
        } else {
            if (this.sceneHelpers.gridHelper) {
                this.scene.remove(this.sceneHelpers.gridHelper);
                // GridHelper doesn't have dispose, just dispose geometry and material
                if (this.sceneHelpers.gridHelper.geometry) this.sceneHelpers.gridHelper.geometry.dispose();
                if (this.sceneHelpers.gridHelper.material) this.sceneHelpers.gridHelper.material.dispose();
                this.sceneHelpers.gridHelper = null;
                console.log('Grid Helper removed');
            }
        }
    }
    
    toggleHorizonLines() {
        if (this.debugSettings.showHorizon) {
            if (this.sceneHelpers.horizonLines) return;
            
            const group = new THREE.Group();
            group.name = 'HorizonLines';
            
            // Create horizon line (horizontal line at y=0)
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-50000, 0, 0),
                new THREE.Vector3(50000, 0, 0)
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2 });
            const horizonLine = new THREE.Line(lineGeometry, lineMaterial);
            group.add(horizonLine);
            
            // Add cross line (Z-axis)
            const crossGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, -50000),
                new THREE.Vector3(0, 0, 50000)
            ]);
            const crossLine = new THREE.Line(crossGeometry, lineMaterial);
            group.add(crossLine);
            
            this.sceneHelpers.horizonLines = group;
            this.scene.add(group);
            console.log('Horizon Lines added');
        } else {
            if (this.sceneHelpers.horizonLines) {
                this.scene.remove(this.sceneHelpers.horizonLines);
                this.sceneHelpers.horizonLines.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.sceneHelpers.horizonLines = null;
                console.log('Horizon Lines removed');
            }
        }
    }
    
    toggleVanishingLines() {
        if (this.debugSettings.showVanishing) {
            if (this.sceneHelpers.vanishingLines) return;
            
            const group = new THREE.Group();
            group.name = 'VanishingLines';
            
            if (this.currentCamera) {
                const cameraPos = this.currentCamera.position;
                const distance = 20000;
                
                // Create vanishing lines from camera to horizon points
                const vanishPoints = [
                    new THREE.Vector3(distance, 0, 0),
                    new THREE.Vector3(-distance, 0, 0),
                    new THREE.Vector3(0, 0, distance),
                    new THREE.Vector3(0, 0, -distance)
                ];
                
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x00ffff, 
                    linewidth: 1,
                    transparent: true,
                    opacity: 0.4
                });
                
                vanishPoints.forEach(point => {
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        cameraPos.clone(),
                        point
                    ]);
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    group.add(line);
                });
            }
            
            this.sceneHelpers.vanishingLines = group;
            this.scene.add(group);
            console.log('Vanishing Lines added');
        } else {
            if (this.sceneHelpers.vanishingLines) {
                this.scene.remove(this.sceneHelpers.vanishingLines);
                this.sceneHelpers.vanishingLines.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.sceneHelpers.vanishingLines = null;
                console.log('Vanishing Lines removed');
            }
        }
    }
    
    toggleAxesHelper() {
        if (this.debugSettings.showAxes) {
            if (this.sceneHelpers.axesHelper) return;
            
            // Create axes helper at world origin
            const size = 5000;
            this.sceneHelpers.axesHelper = new THREE.AxesHelper(size);
            this.sceneHelpers.axesHelper.name = 'AxesHelper';
            this.scene.add(this.sceneHelpers.axesHelper);
            console.log('Axes Helper added');
        } else {
            if (this.sceneHelpers.axesHelper) {
                this.scene.remove(this.sceneHelpers.axesHelper);
                // AxesHelper doesn't have dispose method
                if (this.sceneHelpers.axesHelper.geometry) this.sceneHelpers.axesHelper.geometry.dispose();
                if (this.sceneHelpers.axesHelper.material) {
                    if (Array.isArray(this.sceneHelpers.axesHelper.material)) {
                        this.sceneHelpers.axesHelper.material.forEach(m => m.dispose());
                    } else {
                        this.sceneHelpers.axesHelper.material.dispose();
                    }
                }
                this.sceneHelpers.axesHelper = null;
                console.log('Axes Helper removed');
            }
        }
    }
    
    toggleAllBoxHelpers() {
        if (this.debugSettings.showAllBoxes) {
            // Create box helpers for all meshes
            this.meshes.forEach((mesh, index) => {
                const boxHelper = new THREE.BoxHelper(mesh, 0xffff00);
                boxHelper.name = `BoxHelper_${index}`;
                this.sceneHelpers.allBoxHelpers.push(boxHelper);
                this.scene.add(boxHelper);
            });
            console.log(`Added ${this.sceneHelpers.allBoxHelpers.length} box helpers`);
        } else {
            // Remove all box helpers
            this.sceneHelpers.allBoxHelpers.forEach(boxHelper => {
                this.scene.remove(boxHelper);
                // BoxHelper has proper dispose method
                if (boxHelper.dispose) boxHelper.dispose();
            });
            this.sceneHelpers.allBoxHelpers = [];
            console.log('All box helpers removed');
        }
    }
    
    toggleCameraHelper() {
        if (this.debugSettings.showCameraHelper) {
            if (this.sceneHelpers.cameraHelper) return;
            
            if (this.currentCamera) {
                this.sceneHelpers.cameraHelper = new THREE.CameraHelper(this.currentCamera);
                this.sceneHelpers.cameraHelper.name = 'CameraHelper';
                this.scene.add(this.sceneHelpers.cameraHelper);
                console.log('Camera Helper added');
            }
        } else {
            if (this.sceneHelpers.cameraHelper) {
                this.scene.remove(this.sceneHelpers.cameraHelper);
                // CameraHelper has proper dispose method
                if (this.sceneHelpers.cameraHelper.dispose) this.sceneHelpers.cameraHelper.dispose();
                this.sceneHelpers.cameraHelper = null;
                console.log('Camera Helper removed');
            }
        }
    }
    
    updateDebugInfo() {
        try {
            if (!this.currentCamera) return;
        
            // Update camera position
            const pos = this.currentCamera.position;
            const posEl = document.getElementById('camera-position');
            if (posEl) posEl.innerHTML = `<strong>Position:</strong> X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)}`;
            
            // Update camera rotation
            const rot = this.currentCamera.rotation;
            const rotEl = document.getElementById('camera-rotation');
            if (rotEl) rotEl.innerHTML = `<strong>Rotation:</strong> X:${(rot.x * 180 / Math.PI).toFixed(1)}° Y:${(rot.y * 180 / Math.PI).toFixed(1)}° Z:${(rot.z * 180 / Math.PI).toFixed(1)}°`;
            
            // Update FOV
            const fovEl = document.getElementById('camera-fov');
            if (fovEl) fovEl.innerHTML = `<strong>FOV:</strong> ${this.currentCamera.fov?.toFixed(1) || 'N/A'}°`;
            
            // Update zoom
            const zoomEl = document.getElementById('camera-zoom');
            if (zoomEl) zoomEl.innerHTML = `<strong>Zoom:</strong> ${this.viewer2D?.zoomLevel?.toFixed(0) || 100}%`;
            
            // Update camera index
            const indexEl = document.getElementById('camera-index');
            if (indexEl) indexEl.innerHTML = `<strong>Camera Index:</strong> ${this.currentCameraIndex + 1} / ${this.cameras.length}`;
            
            // Update mesh count
            const meshEl = document.getElementById('mesh-count');
            if (meshEl) meshEl.innerHTML = `<strong>Meshes:</strong> ${this.meshes.length}`;
            
            // Update camera count
            const camCountEl = document.getElementById('camera-count');
            if (camCountEl) camCountEl.innerHTML = `<strong>Cameras:</strong> ${this.cameras.length}`;
            
            // Update hovered object
            const hoveredEl = document.getElementById('hovered-object');
            if (hoveredEl) hoveredEl.innerHTML = `<strong>Hovered:</strong> ${this.hoveredObject?.name || 'None'}`;
            
            // Update camera helper if it exists
            if (this.sceneHelpers.cameraHelper && this.currentCamera) {
                this.sceneHelpers.cameraHelper.update();
            }
            
            // Update vanishing lines if they exist (to follow camera)
            if (this.sceneHelpers.vanishingLines && this.currentCamera) {
                this.toggleVanishingLines(); // Remove
                this.toggleVanishingLines(); // Recreate
            }
            
            // Update all box helpers
            if (this.debugSettings.showAllBoxes) {
                this.sceneHelpers.allBoxHelpers.forEach(boxHelper => {
                    boxHelper.update();
                });
            }
        } catch (error) {
            // Silently fail debug info updates to avoid breaking the viewer
        }
    }
    
    animate() {
        // In light mode, reduce render frequency (every other frame)
        if (LIGHT_MODE) {
            if (!this._lightModeFrameSkip) {
                this._lightModeFrameSkip = 0;
            }
            this._lightModeFrameSkip++;
            if (this._lightModeFrameSkip % 2 === 0) {
                // Skip every other frame in light mode
                requestAnimationFrame(() => this.animate());
                return;
            }
        }
        
        requestAnimationFrame(() => this.animate());
        
        // Update intro animation
        this.updateIntroAnimation();
        
        // Update animated effects
        this.updateEffects();
        
        // Update debug info
        this.updateDebugInfo();
        
        if (this.scene && this.currentCamera) {
            // NEVER use bloom pass - it causes scene dimming/overlay
            // Only use composer for outline effect
            if (this.composer && this.outlinePass?.enabled) {
                // Update composer's camera reference if it changed
                if (this.composer.passes[0]) {
                    this.composer.passes[0].camera = this.currentCamera;
                    // Ensure render pass clears with transparency - CRITICAL to prevent black overlay
                    if (this.composer.passes[0].clearAlpha !== undefined) {
                        this.composer.passes[0].clearAlpha = 0; // Fully transparent background
                    }
                }
                if (this.outlinePass) {
                    this.outlinePass.renderCamera = this.currentCamera;
                }
                // Ensure bloom is always disabled - it causes scene dimming
                if (this.bloomPass) {
                    this.bloomPass.enabled = false;
                }
                // Clear renderer with fully transparent background
                this.renderer.setClearColor(0x000000, 0);
                this.composer.render();
            } else {
                // Normal rendering with fully transparent background (no postprocessing)
                // This ensures the background image is NEVER affected
                this.renderer.setClearColor(0x000000, 0);
                // Always disable bloom to prevent any scene effects
                if (this.bloomPass) {
                    this.bloomPass.enabled = false;
                }
                this.renderer.render(this.scene, this.currentCamera);
            }
        }
    }
    
    // Debug helper - call this to check if 3D is rendering
    debug() {
        console.log('=== 3D Viewer Debug Info ===');
        console.log('Scene:', this.scene);
        console.log('Current Camera:', this.currentCamera);
        console.log('Camera Index:', this.currentCameraIndex);
        console.log('Total Cameras:', this.cameras.length);
        console.log('Total Meshes:', this.meshes.length);
        console.log('Renderer size:', this.renderer.getSize(new THREE.Vector2()));
        console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);
        
        if (this.currentCamera) {
            console.log('Camera position:', this.currentCamera.position);
            console.log('Camera rotation:', this.currentCamera.rotation);
            if (this.currentCamera.isPerspectiveCamera) {
                console.log('Camera FOV:', this.currentCamera.fov);
                console.log('Camera aspect:', this.currentCamera.aspect);
            }
        }
        
        // Check if meshes are visible
        const visibleMeshes = this.meshes.filter(m => m.visible);
        console.log('Visible meshes:', visibleMeshes.length);
        
        if (this.meshes.length > 0) {
            console.log('First mesh position:', this.meshes[0].position);
            console.log('First mesh material opacity:', this.meshes[0].material.opacity);
        }
        
        // Check scene bounds
        const box = new THREE.Box3().setFromObject(this.scene);
        console.log('Scene bounds:', box);
        console.log('Scene size:', box.getSize(new THREE.Vector3()));
    }
    
    // Make all objects super visible for debugging
    makeVisible() {
        console.log('Making all objects highly visible (solid red)...');
        this.meshes.forEach(mesh => {
            mesh.material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: false,
                opacity: 1.0,
                side: THREE.DoubleSide
            });
        });
        console.log('Done! Objects should now be bright red and fully opaque.');
    }
    
    // Reset to transparent
    makeTransparent() {
        console.log('Resetting objects to transparent...');
        this.meshes.forEach(mesh => {
            mesh.material = mesh.userData.transparentMaterial;
        });
        console.log('Done!');
    }
    
    // Sync with 2D viewer
    syncWithImageIndex(imageIndex) {
        // Map image index to camera index (assuming 1:1 mapping)
        if (this.cameras.length > 0) {
            // If we have exactly 90 cameras, direct mapping
            if (this.cameras.length === 90) {
                this.switchCamera(imageIndex);
            } else {
                // Otherwise, scale the index proportionally
                const cameraIndex = Math.round((imageIndex / 89) * (this.cameras.length - 1));
                this.switchCamera(cameraIndex);
            }
        }
    }
    
    // Sync zoom and pan from 2D viewer
    syncZoomAndPan(zoomLevel, panX, panY, mouseX, mouseY) {
        if (!this.currentCamera || !this.currentCamera.isPerspectiveCamera) return;
        
        // Store original FOV if not already stored
        if (!this.originalFOV) {
            this.originalFOV = this.currentCamera.fov;
        }
        
        // ZOOM: Adjust camera FOV (inversely proportional to zoom level)
        // Lower FOV = more zoomed in (like a telephoto lens)
        this.currentCamera.fov = this.originalFOV / zoomLevel;
        this.currentCamera.updateProjectionMatrix();
        
        // Update clipping planes to prevent objects from being clipped when zoomed in
        // Pass zoom level so near plane gets smaller as we zoom in
        this.updateCameraClipping(zoomLevel);
        
        // PAN: Use CSS transform to shift the canvas
        // This matches how the 2D viewer pans (translate after scale in canvas context)
        this.canvas.style.transform = `translate(${panX}px, ${panY}px)`;
        this.canvas.style.transformOrigin = 'center center';
        
        // Show zoom pivot point for debugging
        if (CONFIG_3D.SHOW_ZOOM_PIVOT && zoomLevel > 1.0) {
            this.showZoomPivot(mouseX, mouseY, panX, panY);
        } else {
            this.hideZoomPivot();
        }
    }
    
    showZoomPivot(mouseX, mouseY, panX, panY) {
        let pivotEl = document.getElementById('zoomPivot3D');
        
        if (!pivotEl) {
            // Create pivot indicator
            pivotEl = document.createElement('div');
            pivotEl.id = 'zoomPivot3D';
            pivotEl.style.position = 'fixed';
            pivotEl.style.pointerEvents = 'none';
            pivotEl.style.zIndex = '9998';
            pivotEl.innerHTML = `
                <div style="position: absolute; width: 40px; height: 40px; margin-left: -20px; margin-top: -20px;">
                    <!-- Outer circle -->
                    <div style="position: absolute; width: 40px; height: 40px; border: 2px solid rgba(255, 0, 0, 0.8); border-radius: 50%; box-shadow: 0 0 10px rgba(255, 0, 0, 0.6);"></div>
                    <!-- Inner circle -->
                    <div style="position: absolute; width: 10px; height: 10px; left: 15px; top: 15px; background: rgba(255, 0, 0, 0.9); border-radius: 50%; box-shadow: 0 0 5px rgba(255, 0, 0, 0.8);"></div>
                    <!-- Horizontal line -->
                    <div style="position: absolute; width: 40px; height: 2px; top: 19px; background: rgba(255, 0, 0, 0.8);"></div>
                    <!-- Vertical line -->
                    <div style="position: absolute; width: 2px; height: 40px; left: 19px; background: rgba(255, 0, 0, 0.8);"></div>
                    <!-- Label -->
                    <div style="position: absolute; left: 45px; top: 15px; color: red; font-size: 11px; font-weight: bold; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 3px; white-space: nowrap; text-shadow: 0 0 3px black;">3D Zoom Pivot</div>
                </div>
            `;
            document.body.appendChild(pivotEl);
        }
        
        // Position at the calculated zoom center
        // This should match where the 2D viewer is zooming
        pivotEl.style.left = mouseX + 'px';
        pivotEl.style.top = mouseY + 'px';
        pivotEl.style.display = 'block';
    }
    
    hideZoomPivot() {
        const pivotEl = document.getElementById('zoomPivot3D');
        if (pivotEl) {
            pivotEl.style.display = 'none';
        }
    }
    
    // Legacy method for backward compatibility
    syncZoom(zoomLevel) {
        if (window.productViewer) {
            const mouseX = window.productViewer.lastZoomMouseX || window.innerWidth / 2;
            const mouseY = window.productViewer.lastZoomMouseY || window.innerHeight / 2;
            this.syncZoomAndPan(zoomLevel, window.productViewer.panX, window.productViewer.panY, mouseX, mouseY);
        } else {
            this.syncZoomAndPan(zoomLevel, 0, 0, window.innerWidth / 2, window.innerHeight / 2);
        }
    }
}

// Wait for 2D viewer to initialize, then create 3D viewer
window.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for ProductViewer to be created
    setTimeout(() => {
        if (window.productViewer) {
            window.viewer3D = new Viewer3D(window.productViewer);
            
            // Hook into the 2D viewer's image switching
            const originalShowImage = window.productViewer.showImage.bind(window.productViewer);
            window.productViewer.showImage = function(index, forceTier) {
                originalShowImage(index, forceTier);
                if (window.viewer3D) {
                    window.viewer3D.syncWithImageIndex(this.currentImageIndex);
                }
            };
            
            // Hook into the 2D viewer's redraw to sync zoom and pan
            const originalRedraw = window.productViewer.redrawCurrentImage.bind(window.productViewer);
            window.productViewer.redrawCurrentImage = function() {
                originalRedraw();
                if (window.viewer3D) {
                    // Pass mouse position for cursor-relative zoom
                    const mouseX = this.lastZoomMouseX || window.innerWidth / 2;
                    const mouseY = this.lastZoomMouseY || window.innerHeight / 2;
                    window.viewer3D.syncZoomAndPan(this.zoom, this.panX, this.panY, mouseX, mouseY);
                }
            };
            
            // Debug: Show initial camera info
            console.log('3D viewer ready. Call window.viewer3D.debug() for debug info');
            setTimeout(() => {
                if (window.viewer3D && window.viewer3D.currentCamera) {
                    console.log('Initial camera synced to image 0');
                    window.viewer3D.syncWithImageIndex(0);
                }
            }, 1000);
        }
    }, 500);
});

