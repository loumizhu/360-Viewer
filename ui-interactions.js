// ============================================
// UI INTERACTION HANDLER - Glow Effects
// ============================================
class UIInteractionHandler {
    constructor() {
        this.glowDuration = 500; // milliseconds
        this.init();
    }

    init() {
        // Wait for DOM and settings to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupInteractions());
        } else {
            this.setupInteractions();
        }
    }

    setupInteractions() {
        // Get glow settings
        if (window.uiSettings) {
            this.glowDuration = window.uiSettings.getSetting('ui', 'glowDuration') || 500;
        }

        // Setup glow effects for all interactive elements
        this.setupButtonGlow();
        this.setupDropdownGlow();
        this.setupSliderGlow();
        this.setupPanelGlow();
        this.setupControlGroupGlow();

        console.log('UI interaction handlers initialized');
    }

    // Add glow effect to an element
    addGlow(element, duration = null) {
        if (!element) return;
        
        const glowDuration = duration || this.glowDuration;
        
        // Check if glow is enabled
        if (window.uiSettings && !window.uiSettings.getSetting('ui', 'glowEnabled')) {
            return;
        }

        // Add glowing class
        element.classList.add('glowing');

        // Remove glow after duration
        setTimeout(() => {
            element.classList.remove('glowing');
        }, glowDuration);
    }

    // Setup glow for buttons
    setupButtonGlow() {
        const buttons = document.querySelectorAll('.control-btn, .debug-close-btn');
        
        buttons.forEach(btn => {
            // Click event
            btn.addEventListener('click', (e) => {
                this.addGlow(e.currentTarget);
            });

            // Focus event (for keyboard navigation)
            btn.addEventListener('focus', (e) => {
                this.addGlow(e.currentTarget, 300);
            });
        });
    }

    // Setup glow for dropdowns
    setupDropdownGlow() {
        const dropdowns = document.querySelectorAll('.effect-dropdown, select');
        
        dropdowns.forEach(dropdown => {
            // Change event
            dropdown.addEventListener('change', (e) => {
                this.addGlow(e.currentTarget);
            });

            // Focus event
            dropdown.addEventListener('focus', (e) => {
                this.addGlow(e.currentTarget, 300);
            });

            // Click event
            dropdown.addEventListener('click', (e) => {
                this.addGlow(e.currentTarget, 200);
            });
        });
    }

    // Setup glow for sliders
    setupSliderGlow() {
        const sliders = document.querySelectorAll('.effect-slider, .debug-slider, input[type="range"]');
        
        sliders.forEach(slider => {
            // Input event (when dragging)
            slider.addEventListener('input', (e) => {
                this.addGlow(e.currentTarget, 200);
            });

            // Focus event
            slider.addEventListener('focus', (e) => {
                this.addGlow(e.currentTarget, 300);
            });

            // Mouse down (start dragging)
            slider.addEventListener('mousedown', (e) => {
                this.addGlow(e.currentTarget, 400);
            });
        });
    }

    // Setup glow for debug panel
    setupPanelGlow() {
        const panel = document.getElementById('debug-panel');
        const toggleBtn = document.getElementById('debugToggleBtn');
        
        if (panel && toggleBtn) {
            // When panel is toggled
            toggleBtn.addEventListener('click', () => {
                setTimeout(() => {
                    if (!panel.classList.contains('hidden')) {
                        this.addGlow(panel, 800);
                    }
                }, 100);
            });

            // When panel is interacted with
            panel.addEventListener('click', (e) => {
                // Only glow if clicking inside panel (not on close button)
                if (e.target !== document.getElementById('debugCloseBtn')) {
                    this.addGlow(panel, 300);
                }
            });
        }
    }

    // Setup glow for effect control groups
    setupControlGroupGlow() {
        // Use event delegation for dynamically created control groups
        document.addEventListener('input', (e) => {
            const controlGroup = e.target.closest('.effect-control-group');
            if (controlGroup) {
                this.addGlow(controlGroup, 300);
            }
        });

        document.addEventListener('click', (e) => {
            const controlGroup = e.target.closest('.effect-control-group');
            if (controlGroup) {
                this.addGlow(controlGroup, 200);
            }
        });
    }

    // Update glow duration from settings
    updateGlowDuration(duration) {
        this.glowDuration = duration;
    }
}

// Initialize UI interaction handler
window.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for settings to load
    setTimeout(() => {
        window.uiInteractionHandler = new UIInteractionHandler();
    }, 100);
});

