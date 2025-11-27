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

// 360° Product Viewer - Drag to rotate through images
class ProductViewer {
    constructor() {
        // Get repository base path (for GitHub Pages compatibility)
        this.repoBasePath = getRepoBasePath();
        
        // Get client ID from URL and set base path
        this.clientID = getClientID();
        this.basePath = this.clientID ? `${this.clientID}/` : '';
        
        
        this.currentImageIndex = 0;
        this.totalImages = 0; // Will be set after discovering images
        
        // Two-tier image system
        this.lightImages = [];  // Fast loading, lower res for dragging
        this.fullImages = [];   // High res, loaded on demand
        this.lightImageElements = [];
        this.fullImageElements = [];
        
        // Rotation drag controls
        this.isDragging = false;
        this.isRotating = false; // True when rotating product
        this.startX = 0;
        this.currentX = 0;
        this.dragDistance = 0;
        this.sensitivity = 15; // Pixels to drag before switching image
        
        // Zoom and pan controls
        this.zoom = 1.0;
        this.minZoom = 1.0;
        this.maxZoom = 5.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        this.lastZoomMouseX = 0;
        this.lastZoomMouseY = 0;
        
        this.useFullRes = false; // Start with light images
        this.fullResLoadTimeout = null;
        this.discoveryComplete = false;
        
        // Check for light mode setting
        this.lightMode = window.uiSettings?.getSetting('performance', 'lightMode') || false;
        
        // Start loading immediately with most likely pattern, then continue discovery
        this.startImmediateLoading();
        
        // Discover images in background (will update image list as it finds them)
        this.discoverImages().then(() => {
            this.discoveryComplete = true;
            // If we already initialized, update the image list
            if (this.canvas) {
                this.updateImageListAfterDiscovery();
            } else {
                this.init();
            }
        });
    }
    
    async startImmediateLoading() {
        // Initialize canvas and UI immediately
        this.canvas = document.getElementById('viewer');
        this.ctx = this.canvas.getContext('2d');
        this.loadingEl = document.getElementById('loading');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Setup controls immediately (user can start interacting)
        this.setupControls();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Try to load first image immediately using most likely pattern
        const firstImagePattern = `modif_animated (1)`;
        const extensions = ['.jpg', '.JPG', '.jpeg', '.JPEG'];
        const repoBase = this.repoBasePath;
        const basePath = this.basePath;
        
        this.loadingEl.classList.add('loading');
        
        // Try to load first light image immediately
        for (const ext of extensions) {
            const lightPath = `${repoBase}${basePath}3D-Images/light/${firstImagePattern}${ext}`.replace(/\/+/g, '/');
            const fullPath = `${repoBase}${basePath}3D-Images/${firstImagePattern}${ext}`.replace(/\/+/g, '/');
            
            try {
                // Try light version first with shorter timeout for immediate loading
                const lightExists = await this.testImageExists(lightPath, 500); // 500ms timeout for immediate load
                if (lightExists) {
                    // Found it! Load immediately
                    this.lightImages = [lightPath];
                    this.fullImages = [fullPath];
                    this.totalImages = 1;
                    this.currentImageIndex = 0;
                    
                    await this.loadSingleImage(0, 'light');
                    this.showImage(0, 'light');
                    
                    setTimeout(() => {
                        this.loadingEl.classList.remove('loading');
                        this.loadingEl.classList.add('hidden');
                    }, 300);
                    
                    // Start progressive preloading in background
                    this.progressivePreload();
                    
                    // Set initial cursor (zoom is 1.0, so use 360icon)
                    this.updateCursor(false);
                    
                    // Show zoom hint after a moment
                    setTimeout(() => {
                        this.updateZoomIndicator();
                    }, 1000);
                    
                    return;
                }
            } catch (e) {
                // Continue to next extension
            }
        }
    }
    
    updateImageListAfterDiscovery() {
        // Update the image lists after discovery completes
        // This is called if we already started loading
        if (this.totalImages > 0) {
            // Restart preloading with the complete list
            this.progressivePreload();
        }
    }
    
    async discoverImages() {
        // Build paths with repository base path (for GitHub Pages compatibility)
        const fullImagesPath = `${this.repoBasePath}${this.basePath}3D-Images`.replace(/\/+/g, '/'); // Remove duplicate slashes
        const lightImagesPath = `${this.repoBasePath}${this.basePath}3D-Images/light`.replace(/\/+/g, '/');
        
        // Try to load a manifest file first (if it exists) - but don't wait long
        try {
            const manifestPath = this.basePath ? `${this.repoBasePath}${this.basePath}image-manifest.json`.replace(/\/+/g, '/') : `${this.repoBasePath}image-manifest.json`.replace(/\/+/g, '/');
            const manifestResponse = await Promise.race([
                fetch(manifestPath),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
            ]);
            if (manifestResponse.ok) {
                const manifest = await manifestResponse.json();
                this.lightImages = manifest.light || [];
                this.fullImages = manifest.full || [];
                this.totalImages = Math.max(this.lightImages.length, this.fullImages.length);
                return;
            }
        } catch (e) {
            // No manifest file, continue with discovery
        }
        
        // Skip directory listing on GitHub Pages (it won't work) - go straight to pattern discovery
        // Only try directory listing if we're on a local server
        if (!window.location.hostname.includes('.github.io')) {
            try {
                // Try to get directory listing from server (if supported)
                const fullDirUrl = `${fullImagesPath}/?json=1`;
                const lightDirUrl = `${lightImagesPath}/?json=1`;
                
                const [fullDirResponse, lightDirResponse] = await Promise.race([
                    Promise.all([fetch(fullDirUrl), fetch(lightDirUrl)]),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
                ]);
                
                if (fullDirResponse.ok && lightDirResponse.ok) {
                    const fullFiles = await fullDirResponse.json();
                    const lightFiles = await lightDirResponse.json();
                    
                    // Filter and sort image files
                    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP'];
                    const fullImages = fullFiles
                        .filter(f => imageExtensions.some(ext => f.name.endsWith(ext)))
                        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                        .map(f => `${fullImagesPath}/${f.name}`.replace(/\/+/g, '/'));
                    
                    const lightImages = lightFiles
                        .filter(f => imageExtensions.some(ext => f.name.endsWith(ext)))
                        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                        .map(f => `${lightImagesPath}/${f.name}`.replace(/\/+/g, '/'));
                    
                    // Match light and full images by base name (without extension)
                    this.matchImagePairs(fullImages, lightImages);
                    return;
                }
            } catch (e) {
                // Directory listing not available, continue with fallback
            }
        }
        
        // Fallback: Try to discover by attempting to load images
        await this.discoverImagesByTrying();
    }
    
    async discoverImagesByTrying() {
        // Try common image extensions (prioritize .jpg since that's what we have)
        const extensions = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.webp', '.WEBP', '.png', '.PNG'];
        const maxAttempts = 200; // Try up to 200 images
        const discoveredFull = new Set();
        const discoveredLight = new Set();
        
        // Try different naming patterns - prioritize modif_animated first
        const patterns = [
            (i) => `modif_animated (${i})`,  // Most likely pattern
            (i) => `image_${i}`,
            (i) => `img_${i}`,
            (i) => `frame_${i}`,
            (i) => `${i}`,
            (i) => `image${String(i).padStart(3, '0')}`,
            (i) => `img${String(i).padStart(3, '0')}`,
            (i) => `frame${String(i).padStart(3, '0')}`
        ];
        
        let workingPattern = null;
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = 5; // Stop after 5 consecutive failures
        
        // First, try to find which pattern works - but start with modif_animated immediately
        // and test only first 3 images to find the pattern quickly
        for (const patternFn of patterns) {
            let foundPattern = false;
            for (let i = 1; i <= 2; i++) { // Test only first 2 images to find pattern very quickly
                const pattern = patternFn(i);
                for (const ext of extensions) {
                    const fullPath = `${this.repoBasePath}${this.basePath}3D-Images/${pattern}${ext}`.replace(/\/+/g, '/');
                    const lightPath = `${this.repoBasePath}${this.basePath}3D-Images/light/${pattern}${ext}`.replace(/\/+/g, '/');
                    
                    const [fullExists, lightExists] = await Promise.all([
                        this.testImageExists(fullPath),
                        this.testImageExists(lightPath)
                    ]);
                    
                    if (fullExists || lightExists) {
                        workingPattern = patternFn;
                        foundPattern = true;
                        if (fullExists) discoveredFull.add(fullPath);
                        if (lightExists) discoveredLight.add(lightPath);
                        break;
                    }
                }
                if (foundPattern) break;
            }
                    if (foundPattern) {
                        break;
                    }
        }
        
        // If we found a working pattern, continue with that pattern only
        if (workingPattern) {
            for (let i = 1; i <= maxAttempts; i++) {
                const pattern = workingPattern(i);
                let foundAny = false;
                
                for (const ext of extensions) {
                    const fullPath = `${this.repoBasePath}${this.basePath}3D-Images/${pattern}${ext}`.replace(/\/+/g, '/');
                    const lightPath = `${this.repoBasePath}${this.basePath}3D-Images/light/${pattern}${ext}`.replace(/\/+/g, '/');
                    
                    const [fullExists, lightExists] = await Promise.all([
                        this.testImageExists(fullPath),
                        this.testImageExists(lightPath)
                    ]);
                    
                    if (fullExists) {
                        discoveredFull.add(fullPath);
                        foundAny = true;
                    }
                    if (lightExists) {
                        discoveredLight.add(lightPath);
                        foundAny = true;
                    }
                    
                    if (fullExists || lightExists) break; // Found with this extension, no need to try others
                }
                
                if (foundAny) {
                    consecutiveFailures = 0;
                } else {
                    consecutiveFailures++;
                    if (consecutiveFailures >= maxConsecutiveFailures) {
                        break;
                    }
                }
            }
        }
        
        // Convert sets to arrays and match
        this.matchImagePairs(Array.from(discoveredFull), Array.from(discoveredLight));
    }
    
    async testImageExists(path, timeout = 2000) {
        return new Promise((resolve) => {
            const img = new Image();
            let resolved = false;
            
            img.onload = () => {
                if (!resolved) {
                    resolved = true;
                    resolve(true);
                }
            };
            
            img.onerror = () => {
                if (!resolved) {
                    resolved = true;
                    resolve(false);
                }
            };
            
            img.src = path;
            
            // Timeout (default 2 seconds for GitHub Pages, can be shorter for immediate loading)
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve(false);
                }
            }, timeout);
        });
    }
    
    matchImagePairs(fullImages, lightImages) {
        // Extract base names (without extension) for matching
        const getBaseName = (path) => {
            const name = path.split('/').pop();
            return name.replace(/\.(jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)$/i, '');
        };
        
        // Create maps for quick lookup
        const fullMap = new Map();
        fullImages.forEach(path => {
            const base = getBaseName(path);
            if (!fullMap.has(base)) {
                fullMap.set(base, path);
            }
        });
        
        const lightMap = new Map();
        lightImages.forEach(path => {
            const base = getBaseName(path);
            if (!lightMap.has(base)) {
                lightMap.set(base, path);
            }
        });
        
        // Get all unique base names and sort them
        const allBases = [...new Set([...fullMap.keys(), ...lightMap.keys()])];
        allBases.sort((a, b) => {
            // Natural sort (handles numbers correctly)
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        // Create matched pairs
        this.fullImages = [];
        this.lightImages = [];
        
        allBases.forEach(base => {
            const full = fullMap.get(base);
            const light = lightMap.get(base);
            
            // Use light version if available, otherwise full
            // Use full version if available, otherwise light
            this.fullImages.push(full || light);
            this.lightImages.push(light || full);
        });
        
        this.totalImages = allBases.length;
        
        if (this.totalImages === 0) {
            const pathInfo = this.clientID ? `client folder ${this.clientID}/` : 'root';
            console.error(`No images found! Please ensure images are in ${pathInfo}3D-Images/ and ${pathInfo}3D-Images/light/ folders`);
        }
    }
    
    async init() {
        this.canvas = document.getElementById('viewer');
        this.ctx = this.canvas.getContext('2d');
        this.loadingEl = document.getElementById('loading');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Load and show first image immediately
        this.loadingEl.classList.add('loading');
        await this.loadSingleImage(0, 'light');
        this.showImage(0, 'light');
        setTimeout(() => {
            this.loadingEl.classList.remove('loading');
        this.loadingEl.classList.add('hidden');
        }, 300);
        
        // Setup controls (user can start interacting immediately)
        this.setupControls();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Set initial cursor (zoom is 1.0, so use 360icon)
        this.updateCursor(false);
        
        // Show zoom hint after a moment
        setTimeout(() => {
            this.updateZoomIndicator();
        }, 1000);
        
        // Start progressive preloading in background
        this.progressivePreload();
    }
    
    updateCursor(isGrabbing = false) {
        // Update cursor based on zoom level and interaction state
        if (!this.canvas) return; // Canvas not ready yet
        
        // Use > 1.0 to detect any zoom above 100% (even 1.001)
        const isZoomed = this.zoom > 1.0;
        
        if (isZoomed) {
            // Zoomed in - use drag cursor (pan mode)
            const cursorIcon = 'drag.svg';
            const cursorState = isGrabbing ? 'grabbing' : 'grab';
            // Use relative path with repo base path
            const cursorPath = `${this.repoBasePath}img/${cursorIcon}`.replace(/\/+/g, '/');
            this.canvas.style.setProperty('cursor', `url("${cursorPath}") 15 15, ${cursorState}`, 'important');
        } else {
            // Not zoomed (at or below 100%) - use 360 icon cursor (rotate mode)
            const cursorIcon = '360icon.svg';
            const cursorState = isGrabbing ? 'grabbing' : 'grab';
            // Use relative path with repo base path
            const cursorPath = `${this.repoBasePath}img/${cursorIcon}`.replace(/\/+/g, '/');
            this.canvas.style.setProperty('cursor', `url("${cursorPath}") 15 15, ${cursorState}`, 'important');
        }
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Redraw current image after resize
        if (this.currentImageIndex >= 0) {
            const img = this.fullImageElements[this.currentImageIndex] || this.lightImageElements[this.currentImageIndex];
            if (img) {
                this.drawImage(img);
            }
        }
    }
    
    onWindowResize() {
        this.resizeCanvas();
    }
    
    drawImage(img) {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state
        this.ctx.save();
        
        // Calculate base dimensions to fit image while maintaining aspect ratio
        const canvasAspect = this.canvas.width / this.canvas.height;
        const imgAspect = img.width / img.height;
        
        let baseWidth, baseHeight, baseX, baseY;
        
        if (imgAspect > canvasAspect) {
            // Image is wider - fit to width
            baseWidth = this.canvas.width;
            baseHeight = this.canvas.width / imgAspect;
            baseX = 0;
            baseY = (this.canvas.height - baseHeight) / 2;
        } else {
            // Image is taller - fit to height
            baseHeight = this.canvas.height;
            baseWidth = this.canvas.height * imgAspect;
            baseX = (this.canvas.width - baseWidth) / 2;
            baseY = 0;
        }
        
        // Apply zoom and pan transformations
        const centerX = baseX + baseWidth / 2;
        const centerY = baseY + baseHeight / 2;
        
        // Translate to center, apply zoom, translate back, then apply pan
        this.ctx.translate(centerX + this.panX, centerY + this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-centerX, -centerY);
        
        // Draw image with transformations
        this.ctx.drawImage(img, baseX, baseY, baseWidth, baseHeight);
        
        // Restore context state
        this.ctx.restore();
        
        // Store base dimensions for zoom calculations
        this.baseImageBounds = { x: baseX, y: baseY, width: baseWidth, height: baseHeight };
    }
    
    async loadSingleImage(index, tier = 'light') {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const src = tier === 'light' ? this.lightImages[index] : this.fullImages[index];
            const targetArray = tier === 'light' ? this.lightImageElements : this.fullImageElements;
            
            img.onload = () => {
                targetArray[index] = img;
                resolve(img);
            };
            img.onerror = (err) => {
                console.warn(`Failed to load ${tier} image ${index}:`, err);
                reject(err);
            };
            img.src = src;
        });
    }
    
    async progressivePreload() {
        // Light mode: Only preload current ± 3 images
        if (this.lightMode) {
            const nearbyRange = 3;
            const start = Math.max(0, this.currentImageIndex - nearbyRange);
            const end = Math.min(this.totalImages, this.currentImageIndex + nearbyRange + 1);
            
            this.updateLoadingProgress('Loading nearby images (light mode)...', 0, end - start);
            
            let loadedCount = 0;
            for (let i = start; i < end; i++) {
                if (!this.lightImageElements[i]) {
                    try {
                        await this.loadSingleImage(i, 'light');
                        loadedCount++;
                        this.updateLoadingProgress(`Loading nearby images... ${loadedCount}/${end - start}`, loadedCount, end - start);
                    } catch (error) {
                        console.warn(`Failed to load light image ${i}:`, error);
                    }
                }
            }
            
            this.updateLoadingProgress('Ready (light mode)', loadedCount, end - start);
            
            // Hide progress after 1 second in light mode
            setTimeout(() => {
                const progressEl = document.getElementById('loadingProgress');
                if (progressEl) {
                    progressEl.style.opacity = '0';
                    setTimeout(() => progressEl.remove(), 500);
                }
            }, 1000);
            return; // Don't load full-res or other images in light mode
        }
        
        // Normal mode: Full preloading
        // Priority 1: Load nearby images first (spiral out from current)
        const priorityIndices = this.getSpiralOrder(this.currentImageIndex, 10);
        
            this.updateLoadingProgress('Loading nearby images...', 0, this.totalImages);
        
        for (let i = 0; i < priorityIndices.length; i++) {
            const index = priorityIndices[i];
            if (!this.lightImageElements[index]) {
                try {
                    await this.loadSingleImage(index, 'light');
                } catch (error) {
                    // Skip failed images, continue loading others
                    console.warn(`Failed to load light image ${index}:`, error);
                }
            }
            this.updateLoadingProgress(`Loading nearby images... ${i + 1}/${priorityIndices.length}`, i + 1, priorityIndices.length);
        }
        
        // Priority 2: Load all remaining light images
        let loadedCount = priorityIndices.length;
        for (let i = 0; i < this.totalImages; i++) {
            if (!this.lightImageElements[i]) {
                try {
                    await this.loadSingleImage(i, 'light');
                    loadedCount++;
                    this.updateLoadingProgress(`Loading light images... ${loadedCount}/${this.totalImages}`, loadedCount, this.totalImages);
                } catch (error) {
                    // Skip failed images, continue loading others
                    console.warn(`Failed to load light image ${i}:`, error);
                }
            }
        }
        
        this.updateLoadingProgress('All light images loaded! Loading HD...', this.totalImages, this.totalImages);
        
        // Priority 3: Load full-res images (starting with nearby)
        const fullResPriority = this.getSpiralOrder(this.currentImageIndex, this.totalImages);
        
        for (let i = 0; i < fullResPriority.length; i++) {
            const index = fullResPriority[i];
            if (!this.fullImageElements[index]) {
                try {
                    await this.loadSingleImage(index, 'full');
                    this.updateLoadingProgress(`Loading HD images... ${i + 1}/${this.totalImages}`, i + 1, this.totalImages);
                } catch (error) {
                    // If full-res fails, that's okay, we have light version
                    console.warn(`Failed to load full-res image ${index}:`, error);
                }
            }
        }
        
        this.updateLoadingProgress('All images loaded!', this.totalImages, this.totalImages);
        
        // Hide progress after 2 seconds
        setTimeout(() => {
            const progressEl = document.getElementById('loadingProgress');
            if (progressEl) {
                progressEl.style.opacity = '0';
                setTimeout(() => progressEl.remove(), 500);
            }
        }, 2000);
    }
    
    updateLoadingProgress(message, current, total) {
        const loadingEl = document.getElementById('loading');
        if (!loadingEl) return;
        
        const percentage = (current / total * 100).toFixed(0);
        loadingEl.style.width = percentage + '%';
        
        if (current < total) {
            loadingEl.classList.remove('hidden');
            loadingEl.classList.add('loading');
        } else {
            // All loaded, fade out
            setTimeout(() => {
                loadingEl.classList.remove('loading');
                loadingEl.classList.add('hidden');
            }, 500);
        }
    }
    
    getSpiralOrder(center, radius) {
        // Generate indices in spiral order: center, center±1, center±2, etc.
        const indices = [center];
        
        for (let offset = 1; offset <= radius; offset++) {
            // Add after
            let afterIndex = (center + offset) % this.totalImages;
            if (afterIndex < this.totalImages) {
                indices.push(afterIndex);
            }
            
            // Add before
            let beforeIndex = (center - offset + this.totalImages) % this.totalImages;
            if (beforeIndex >= 0 && beforeIndex !== afterIndex) {
                indices.push(beforeIndex);
            }
        }
        
        // Remove duplicates and ensure within bounds
        return [...new Set(indices)].filter(i => i >= 0 && i < this.totalImages);
    }
    
    setupControls() {
        // Mouse events for desktop
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        
        // Mouse move with cursor update
        this.canvas.addEventListener('mousemove', (e) => {
            this.onMouseMove(e);
            // Update cursor if not actively interacting
            if (!this.isPanning && !this.isRotating && !this.isDragging) {
                this.updateCursor(false);
            }
        });
        
        // Update cursor on mouse enter
        this.canvas.addEventListener('mouseenter', () => {
            this.updateCursor(false);
        });
        
        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.onTouchEnd());
        
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.previousImage());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextImage());
        
        // Zoom slider
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomIndicator = document.getElementById('zoom-indicator');
        if (zoomSlider && zoomIndicator) {
            // Set initial value based on current zoom
            zoomSlider.value = Math.round(this.zoom * 100);
            zoomIndicator.textContent = Math.round(this.zoom * 100) + '%';
            
            zoomSlider.addEventListener('input', (e) => {
                const zoomValue = parseInt(e.target.value) / 100;
                this.setZoom(zoomValue);
                zoomIndicator.textContent = e.target.value + '%';
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousImage();
            if (e.key === 'ArrowRight') this.nextImage();
            if (e.key === 'r' || e.key === 'R' || e.key === 'Escape') this.resetZoom();
        });
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.zoom >= 1.01) {
            // If zoomed in (above 100%), enable panning
            this.isPanning = true;
            this.lastPanX = x;
            this.lastPanY = y;
            this.updateCursor(true); // Grabbing state
        } else {
            // If not zoomed, enable rotation (scrubbing)
            // Check if we have images loaded before allowing scrubbing
            if (this.totalImages === 0) {
                console.warn('[Scrubbing] Cannot scrub - no images discovered yet. Total images:', this.totalImages);
                return;
            }
            
            // In light mode, check if at least current image is loaded
            if (this.lightMode && !this.lightImageElements[this.currentImageIndex]) {
                console.warn('[Scrubbing] Cannot scrub - current image not loaded yet in light mode');
                return;
            }
            
            // In normal mode, check if first image is loaded
            if (!this.lightMode && !this.lightImageElements[0]) {
                console.warn('[Scrubbing] Cannot scrub - images not loaded yet. Total images:', this.totalImages);
                return;
            }
            
            this.isRotating = true;
            this.isDragging = true;
            this.startX = e.clientX;
            this.currentX = e.clientX;
            this.dragDistance = 0;
            this.updateCursor(true); // Grabbing state
            
            console.log('[Scrubbing] Started - isRotating:', this.isRotating, 'isDragging:', this.isDragging, 'totalImages:', this.totalImages);
            
            // Use light images while rotating for performance
            this.useFullRes = false;
            
            // Cancel any pending full-res load
            if (this.fullResLoadTimeout) {
                clearTimeout(this.fullResLoadTimeout);
                this.fullResLoadTimeout = null;
            }
        }
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isPanning) {
            // Pan the zoomed image
            const deltaX = x - this.lastPanX;
            const deltaY = y - this.lastPanY;
            
            this.panX += deltaX;
            this.panY += deltaY;
            
            this.lastPanX = x;
            this.lastPanY = y;
            
            // Redraw with new pan position
            this.redrawCurrentImage();
        } else if (this.isRotating && this.isDragging) {
            // Rotate through images (scrubbing)
            const deltaX = e.clientX - this.currentX;
            this.dragDistance += deltaX;
            this.currentX = e.clientX;
            
            console.log('[Scrubbing] Move - dragDistance:', this.dragDistance, 'sensitivity:', this.sensitivity);
            
            // Check if we've dragged enough to change image
            if (Math.abs(this.dragDistance) >= this.sensitivity) {
                if (this.dragDistance > 0) {
                    // Dragging right - go to previous image (rotate left)
                    console.log('[Scrubbing] Moving to previous image');
                    this.previousImage(false);
                } else {
                    // Dragging left - go to next image (rotate right)
                    console.log('[Scrubbing] Moving to next image');
                    this.nextImage(false);
                }
                this.dragDistance = 0; // Reset after switching
            }
        }
        // Cursor is updated via event listeners and zoom changes
    }
    
    onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.updateCursor(false); // Not grabbing
        }
        
        if (this.isRotating) {
            console.log('[Scrubbing] Ended - was dragging:', this.isDragging, 'dragDistance:', this.dragDistance);
            this.isRotating = false;
            this.isDragging = false;
            this.dragDistance = 0;
            this.updateCursor(false); // Not grabbing
            
            // Load full-res version after a short delay (300ms) - skip in light mode
            if (!this.lightMode) {
                this.fullResLoadTimeout = setTimeout(() => {
                    this.loadAndShowFullRes();
                }, 300);
            }
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Store mouse position for 3D sync
        this.lastZoomMouseX = mouseX;
        this.lastZoomMouseY = mouseY;
        
        // Calculate zoom factor
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));
        
        if (newZoom !== this.zoom) {
            const oldZoom = this.zoom;
            
            // Calculate the canvas center
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // Calculate mouse position relative to center
            const mouseOffsetX = mouseX - centerX;
            const mouseOffsetY = mouseY - centerY;
            
            // Calculate the world position under the mouse before zoom
            const worldX = (mouseOffsetX - this.panX) / oldZoom;
            const worldY = (mouseOffsetY - this.panY) / oldZoom;
            
            // Update zoom
            this.zoom = newZoom;
            
            // Calculate new pan to keep world position under mouse
            this.panX = mouseOffsetX - (worldX * this.zoom);
            this.panY = mouseOffsetY - (worldY * this.zoom);
            
            // Reset pan if zoomed out to 1.0
            if (this.zoom === this.minZoom) {
                this.panX = 0;
                this.panY = 0;
            }
            
            // Update cursor IMMEDIATELY after zoom changes
            this.updateCursor(false);
            
            // Show zoom ripple effect - skip in light mode
            if (!this.lightMode) {
                this.showZoomRipple(mouseX, mouseY, e.deltaY < 0);
            }
            
            // Redraw with new zoom
            this.redrawCurrentImage();
            
            // Update zoom indicator
            this.updateZoomIndicator();
        }
    }
    
    showZoomRipple(x, y, isZoomIn) {
        // Skip in light mode
        if (this.lightMode) return;
        
        // Create ripple element
        const ripple = document.createElement('div');
        ripple.className = 'zoom-ripple';
        ripple.style.position = 'fixed';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.marginLeft = '-10px';
        ripple.style.marginTop = '-10px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '9999';
        ripple.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
        
        // Add plus or minus symbol
        const symbol = document.createElement('div');
        symbol.textContent = isZoomIn ? '+' : '−';
        symbol.style.position = 'absolute';
        symbol.style.top = '50%';
        symbol.style.left = '50%';
        symbol.style.transform = 'translate(-50%, -50%)';
        symbol.style.color = 'white';
        symbol.style.fontSize = '14px';
        symbol.style.fontWeight = 'bold';
        symbol.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.8)';
        ripple.appendChild(symbol);
        
        document.body.appendChild(ripple);
        
        // Animate ripple
        const animation = ripple.animate([
            { 
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1
            },
            { 
                transform: isZoomIn ? 'translate(-50%, -50%) scale(2)' : 'translate(-50%, -50%) scale(0.5)',
                opacity: 0
            }
        ], {
            duration: 400,
            easing: 'ease-out'
        });
        
        // Remove after animation
        animation.onfinish = () => ripple.remove();
    }
    
    onTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            if (this.zoom >= 1.01) {
                this.isPanning = true;
                this.lastPanX = x;
                this.lastPanY = y;
            } else {
                this.isRotating = true;
                this.isDragging = true;
                this.startX = touch.clientX;
                this.currentX = touch.clientX;
                this.dragDistance = 0;
            }
        }
    }
    
    onTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            if (this.isPanning) {
                const deltaX = x - this.lastPanX;
                const deltaY = y - this.lastPanY;
                
                this.panX += deltaX;
                this.panY += deltaY;
                
                this.lastPanX = x;
                this.lastPanY = y;
                
                this.redrawCurrentImage();
            } else if (this.isRotating && this.isDragging) {
                const deltaX = touch.clientX - this.currentX;
                this.dragDistance += deltaX;
                this.currentX = touch.clientX;
                
                if (Math.abs(this.dragDistance) >= this.sensitivity) {
                    if (this.dragDistance > 0) {
                        this.previousImage(false);
                    } else {
                        this.nextImage(false);
                    }
                    this.dragDistance = 0;
                }
            }
        }
    }
    
    onTouchEnd() {
        this.isPanning = false;
        this.isRotating = false;
        this.isDragging = false;
        this.dragDistance = 0;
        
        if (!this.isPanning && !this.isRotating && !this.lightMode) {
            this.fullResLoadTimeout = setTimeout(() => {
                this.loadAndShowFullRes();
            }, 300);
        }
    }
    
    resetZoom() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.updateCursor(false); // Update cursor to 360icon (zoom is now 1.0)
        this.redrawCurrentImage();
        this.updateZoomIndicator();
    }
    
    redrawCurrentImage() {
        const index = this.currentImageIndex;
        const useTier = this.useFullRes && this.fullImageElements[index] ? 'full' : 'light';
        const imageArray = useTier === 'full' ? this.fullImageElements : this.lightImageElements;
        
        if (imageArray[index]) {
            this.drawImage(imageArray[index]);
        }
    }
    
    setZoom(zoomValue) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomValue));
        this.updateCursor(false); // Update cursor based on new zoom level
        this.redrawCurrentImage();
        this.updateZoomIndicator();
    }
    
    updateZoomIndicator() {
        const zoomIndicator = document.getElementById('zoom-indicator');
        const zoomSlider = document.getElementById('zoom-slider');
        if (zoomIndicator) {
            zoomIndicator.textContent = Math.round(this.zoom * 100) + '%';
        }
        if (zoomSlider) {
            zoomSlider.value = Math.round(this.zoom * 100);
        }
        let zoomEl = document.getElementById('zoomIndicator');
        
        if (!zoomEl) {
            zoomEl = document.createElement('div');
            zoomEl.id = 'zoomIndicator';
            zoomEl.style.position = 'fixed';
            zoomEl.style.bottom = '100px';
            zoomEl.style.left = '50%';
            zoomEl.style.transform = 'translateX(-50%)';
            zoomEl.style.background = 'rgba(0, 0, 0, 0.7)';
            zoomEl.style.color = 'white';
            zoomEl.style.padding = '8px 20px';
            zoomEl.style.borderRadius = '20px';
            zoomEl.style.fontSize = '12px';
            zoomEl.style.fontWeight = 'bold';
            zoomEl.style.zIndex = '100';
            zoomEl.style.backdropFilter = 'blur(10px)';
            zoomEl.style.opacity = '0';
            zoomEl.style.transition = 'opacity 0.3s';
            zoomEl.style.pointerEvents = 'none';
            document.body.appendChild(zoomEl);
        }
        
        const zoomPercent = Math.round(this.zoom * 100);
        zoomEl.textContent = this.zoom === 1.0 ? 'Scroll to zoom' : `${zoomPercent}% (R to reset)`;
        zoomEl.style.opacity = '1';
        
        // Auto-hide after 2 seconds
        clearTimeout(this.zoomIndicatorTimeout);
        this.zoomIndicatorTimeout = setTimeout(() => {
            zoomEl.style.opacity = '0';
        }, 2000);
    }
    
    showImage(index, forceTier = null) {
        // Cycle through images (wrap around)
        if (index < 0) {
            index = this.totalImages - 1;
        } else if (index >= this.totalImages) {
            index = 0;
        }
        
        this.currentImageIndex = index;
        
        // Determine which tier to use
        // In light mode, always use light images
        const useTier = forceTier || (this.lightMode || !this.useFullRes || !this.fullImageElements[index]) ? 'light' : 'full';
        const imageArray = useTier === 'full' ? this.fullImageElements : this.lightImageElements;
        
        // Draw preloaded image to canvas - instant, no flashing!
        if (imageArray[index]) {
            this.drawImage(imageArray[index]);
        }
        
        // Update info
        const quality = useTier === 'full' ? ' (HD)' : '';
        // Image info removed from toolbar
        // document.getElementById('imageInfo').textContent = 
            `${this.currentImageIndex + 1} / ${this.totalImages}${quality}`;
    }
    
    async loadAndShowFullRes() {
        // Skip in light mode
        if (this.lightMode) return;
        
        const index = this.currentImageIndex;
        
        // Load full-res if not already loaded
        if (!this.fullImageElements[index]) {
            try {
                await this.loadSingleImage(index, 'full');
            } catch (error) {
                console.warn('Failed to load full-res image, using light version');
                return;
            }
        }
        
        // Show full-res version
        this.useFullRes = true;
        this.showImage(index, 'full');
    }
    
    nextImage(updateInfo = true) {
        const newIndex = this.currentImageIndex + 1;
        this.showImage(newIndex);
    }
    
    previousImage(updateInfo = true) {
        const newIndex = this.currentImageIndex - 1;
        this.showImage(newIndex);
    }
}

// Initialize viewer when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.productViewer = new ProductViewer();
});

