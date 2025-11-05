// ============================================
// 3D VIEWER CONFIGURATION
// ============================================
const CONFIG_3D = {
    // Model settings
    MODEL_PATH: '3D/Serenia Zenata Orbiting Mockup Units Boxes.glb',
    
    // Material settings - Default (invisible)
    DEFAULT_OPACITY: 0.0,           // 0.0 = invisible, 1.0 = solid
    DEFAULT_COLOR: 0xffffff,        // White
    DEFAULT_DEPTH_WRITE: false,
    
    // Material settings - Hover (red highlight)
    HOVER_OPACITY: 0.75,            // 75% opaque (25% transparent)
    HOVER_COLOR: 0xff0000,          // Red
    HOVER_EMISSIVE: 0xff0000,       // Red glow
    HOVER_EMISSIVE_INTENSITY: 0.6,  // Glow strength
    HOVER_DEPTH_WRITE: true,
    
    // Lighting
    AMBIENT_LIGHT_INTENSITY: 1.5,
    DIRECTIONAL_LIGHT_INTENSITY: 1.0,
    DIRECTIONAL_LIGHT_2_INTENSITY: 0.5,
    LIGHT_POSITION_SCALE: 0.3,      // Multiplier for light position based on camera distance
    
    // Camera sync
    CAMERA_ASPECT_RATIO: null,      // Will be set to window.innerWidth / window.innerHeight
    
    // Debug
    ENABLE_HOVER_LOGGING: true,     // Log object names when hovering
    ENABLE_CLICK_LOGGING: true,     // Log object names when clicking
    SHOW_ZOOM_PIVOT: false,          // Show red crosshair at 3D zoom pivot point (for debugging)
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
        
        this.init();
    }
    
    async init() {
        // Setup Three.js renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        
        // Load GLB file
        await this.loadGLB();
        
        // Setup mouse move for hover detection
        this.setupInteraction();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start render loop
        this.animate();
        
        console.log('3D Viewer initialized');
    }
    
    async loadGLB() {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            
            console.log('Loading 3D model...');
            
            loader.load(
                CONFIG_3D.MODEL_PATH,
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
                            0.1,
                            1000
                        );
                        defaultCamera.position.set(0, 0, 5);
                        this.cameras.push(defaultCamera);
                    }
                    
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
                            
                            // Create hover material (red highlight)
                            child.userData.hoverMaterial = new THREE.MeshStandardMaterial({
                                color: CONFIG_3D.HOVER_COLOR,
                                transparent: true,
                                opacity: CONFIG_3D.HOVER_OPACITY,
                                side: THREE.DoubleSide,
                                depthWrite: CONFIG_3D.HOVER_DEPTH_WRITE,
                                depthTest: true,
                                emissive: CONFIG_3D.HOVER_EMISSIVE,
                                emissiveIntensity: CONFIG_3D.HOVER_EMISSIVE_INTENSITY
                            });
                        }
                    });
                    
                    console.log(`Found ${this.meshes.length} meshes in GLB file`);
                    
                    // Calculate bounding box to understand scene scale
                    const box = new THREE.Box3().setFromObject(this.scene);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());
                    
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
                    // Reset previous hovered object to transparent
                    if (this.hoveredObject) {
                        this.hoveredObject.material = this.hoveredObject.userData.transparentMaterial;
                    }
                    
                    // Set new hovered object to red
                    this.hoveredObject = newHovered;
                    this.hoveredObject.material = this.hoveredObject.userData.hoverMaterial;
                    
                    // Change cursor to pointer
                    this.canvas.style.cursor = 'pointer';
                    
                    if (CONFIG_3D.ENABLE_HOVER_LOGGING) {
                        console.log('Hovering over:', this.hoveredObject.name || 'Mesh', 
                                    '- Position:', this.hoveredObject.position);
                    }
                }
            } else {
                // No intersection - reset hover
                this.isHoveringObject = false;
                this.canvas.style.cursor = 'default';
                
                if (this.hoveredObject) {
                    this.hoveredObject.material = this.hoveredObject.userData.transparentMaterial;
                    this.hoveredObject = null;
                }
            }
        });
        
        // Track if user started dragging on 3D object
        this.dragStartedOn3D = false;
        
        // Mouse down - pass to 2D viewer if not hovering 3D object
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isHoveringObject) {
                this.dragStartedOn3D = false;
                // Pass through to 2D viewer
                const viewer2DCanvas = document.getElementById('viewer');
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    buttons: e.buttons,
                    bubbles: true,
                    cancelable: true
                });
                viewer2DCanvas.dispatchEvent(mouseEvent);
            } else {
                this.dragStartedOn3D = true;
            }
        });
        
        // Mouse move - always pass to 2D viewer if drag started there
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.dragStartedOn3D) {
                const viewer2DCanvas = document.getElementById('viewer');
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    buttons: e.buttons,
                    bubbles: true,
                    cancelable: true
                });
                viewer2DCanvas.dispatchEvent(mouseEvent);
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
        
        // Mouse leave - ensure drag ends if mouse leaves canvas
        this.canvas.addEventListener('mouseleave', (e) => {
            const viewer2DCanvas = document.getElementById('viewer');
            const mouseEvent = new MouseEvent('mouseup', {
                clientX: e.clientX,
                clientY: e.clientY,
                bubbles: true,
                cancelable: true
            });
            viewer2DCanvas.dispatchEvent(mouseEvent);
            
            this.dragStartedOn3D = false;
        });
        
        // Click handler for 3D objects
        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredObject) {
                if (CONFIG_3D.ENABLE_CLICK_LOGGING) {
                    console.log('Clicked on 3D object:', this.hoveredObject.name || 'Unnamed object');
                }
                // Add your click logic here (e.g., show info panel, navigate to unit details, etc.)
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
            
            // Sync zoom and pan with 2D viewer
            if (window.productViewer) {
                const mouseX = window.productViewer.lastZoomMouseX || window.innerWidth / 2;
                const mouseY = window.productViewer.lastZoomMouseY || window.innerHeight / 2;
                this.syncZoomAndPan(window.productViewer.zoom, window.productViewer.panX, window.productViewer.panY, mouseX, mouseY);
            }
        }
        
        console.log(`Switched to camera ${index}:`, {
            position: this.currentCamera.position,
            rotation: this.currentCamera.rotation
        });
    }
    
    onWindowResize() {
        if (!this.currentCamera) return;
        
        if (this.currentCamera.isPerspectiveCamera) {
            this.currentCamera.aspect = window.innerWidth / window.innerHeight;
            this.currentCamera.updateProjectionMatrix();
        }
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.scene && this.currentCamera) {
            this.renderer.render(this.scene, this.currentCamera);
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

