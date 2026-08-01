/**
 * 360° Panorama Virtual Visit Engine
 * Interactive equirectangular panorama viewer powered by Three.js
 */

(function () {
    'use strict';

    class VirtualVisit360 {
        constructor() {
            this.container = null;
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.sphereMesh = null;
            this.material = null;
            this.animId = null;

            // Orbit State
            this.isUserInteracting = false;
            this.onPointerDownPointerX = 0;
            this.onPointerDownPointerY = 0;
            this.lon = 0;
            this.onPointerDownLon = 0;
            this.lat = 0;
            this.onPointerDownLat = 0;
            this.phi = 0;
            this.theta = 0;
            this.targetFov = 75;

            // Touch State
            this.touchStartDist = 0;

            // Image State
            this.images = [];
            this.currentImageIndex = 0;
            this.isInitialized = false;

            // Bind methods
            this.onPointerDown = this.onPointerDown.bind(this);
            this.onPointerMove = this.onPointerMove.bind(this);
            this.onPointerUp = this.onPointerUp.bind(this);
            this.onWheel = this.onWheel.bind(this);
            this.onWindowResize = this.onWindowResize.bind(this);
            this.animate = this.animate.bind(this);
        }

        init(containerId = 'panorama-360-container') {
            this.container = document.getElementById(containerId);
            if (!this.container) return;

            // If already initialized but with zero-size container, reset to allow proper re-init
            if (this.isInitialized) {
                const w = this.container.clientWidth;
                const h = this.container.clientHeight;
                if (w > 0 && h > 0) {
                    this.onWindowResize();
                } else {
                    // Container still not visible; skip silently
                }
                return;
            }

            const width = this.container.clientWidth || 800;
            const height = this.container.clientHeight || 500;

            // 1. Scene
            this.scene = new THREE.Scene();

            // 2. Camera
            this.camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
            this.camera.target = new THREE.Vector3(0, 0, 0);

            // 3. Geometry (Inverted Sphere for interior panorama)
            const geometry = new THREE.SphereGeometry(500, 60, 40);
            geometry.scale(-1, 1, 1);

            // 4. Material
            this.material = new THREE.MeshBasicMaterial();
            this.sphereMesh = new THREE.Mesh(geometry, this.material);
            this.scene.add(this.sphereMesh);

            // 5. Renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setSize(width, height);
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);

            // Controls Hint Overlay
            const hintEl = document.createElement('div');
            hintEl.className = 'panorama-hint';
            hintEl.innerHTML = '<span>🖱️ Click & Drag to look around • Scroll to zoom</span>';
            this.container.appendChild(hintEl);

            // Fade out hint on interaction
            setTimeout(() => {
                hintEl.style.opacity = '0';
                setTimeout(() => hintEl.remove(), 1000);
            }, 4000);

            // Event Listeners
            this.container.addEventListener('pointerdown', this.onPointerDown);
            this.container.addEventListener('wheel', this.onWheel, { passive: false });
            window.addEventListener('resize', this.onWindowResize);

            this.isInitialized = true;
            this.animate();
        }

        onPointerDown(e) {
            if (e.isPrimary === false) return;
            this.isUserInteracting = true;

            this.onPointerDownPointerX = e.clientX;
            this.onPointerDownPointerY = e.clientY;
            this.onPointerDownLon = this.lon;
            this.onPointerDownLat = this.lat;

            document.addEventListener('pointermove', this.onPointerMove);
            document.addEventListener('pointerup', this.onPointerUp);
            this.container.style.cursor = 'grabbing';
        }

        onPointerMove(e) {
            if (e.isPrimary === false || !this.isUserInteracting) return;

            // Pan sensitivity
            this.lon = (this.onPointerDownPointerX - e.clientX) * 0.18 + this.onPointerDownLon;
            this.lat = (e.clientY - this.onPointerDownPointerY) * 0.18 + this.onPointerDownLat;
        }

        onPointerUp() {
            this.isUserInteracting = false;
            document.removeEventListener('pointermove', this.onPointerMove);
            document.removeEventListener('pointerup', this.onPointerUp);
            if (this.container) this.container.style.cursor = 'grab';
        }

        onWheel(e) {
            e.preventDefault();
            this.targetFov += e.deltaY * 0.05;
            this.targetFov = Math.max(30, Math.min(100, this.targetFov));
        }

        onWindowResize() {
            if (!this.container || !this.renderer || !this.camera) return;
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            if (width === 0 || height === 0) return;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }

        animate() {
            this.animId = requestAnimationFrame(this.animate);
            this.update();
        }

        update() {
            // Smooth FOV Zoom
            if (Math.abs(this.camera.fov - this.targetFov) > 0.01) {
                this.camera.fov += (this.targetFov - this.camera.fov) * 0.1;
                this.camera.updateProjectionMatrix();
            }

            // Gentle Idle Rotation when not interacting
            if (!this.isUserInteracting) {
                this.lon += 0.03;
            }

            // Clamp latitude to avoid pole flipping
            this.lat = Math.max(-85, Math.min(85, this.lat));

            // Convert spherical angles to Cartesian camera target
            this.phi = THREE.MathUtils.degToRad(90 - this.lat);
            this.theta = THREE.MathUtils.degToRad(this.lon);

            const x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
            const y = 500 * Math.cos(this.phi);
            const z = 500 * Math.sin(this.phi) * Math.sin(this.theta);

            this.camera.lookAt(x, y, z);
            this.renderer.render(this.scene, this.camera);
        }

        loadPanorama(url) {
            if (!url) return;

            // Show loader toast if available
            let loaderEl = this.container?.querySelector('.panorama-loader');
            if (!loaderEl && this.container) {
                loaderEl = document.createElement('div');
                loaderEl.className = 'panorama-loader';
                loaderEl.innerHTML = '<div class="loader-spinner"></div><span>Loading 360° View...</span>';
                this.container.appendChild(loaderEl);
            }
            if (loaderEl) loaderEl.style.display = 'flex';

            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                (texture) => {
                    if ('colorSpace' in texture && THREE.SRGBColorSpace) {
                        texture.colorSpace = THREE.SRGBColorSpace;
                    } else if ('encoding' in texture) {
                        texture.encoding = THREE.sRGBEncoding || 3001;
                    } else {
                        texture.encoding = 3001;
                    }
                    if (this.material.map) this.material.map.dispose();
                    this.material.map = texture;
                    this.material.needsUpdate = true;
                    if (loaderEl) loaderEl.style.display = 'none';

                    // Trigger resize to fix container dimensions
                    setTimeout(() => this.onWindowResize(), 100);
                },
                undefined,
                (err) => {
                    console.error('[VirtualVisit360] Failed loading 360 texture:', url, err);
                    if (loaderEl) {
                        loaderEl.innerHTML = '<span>Failed to load 360° image.</span>';
                    }
                }
            );
        }

        setImages(imagesList) {
            if (!Array.isArray(imagesList) || imagesList.length === 0) return;
            this.images = imagesList;
            this.renderRoomButtons();
            this.selectRoom(0);
        }

        selectRoom(index) {
            if (index < 0 || index >= this.images.length) return;
            this.currentImageIndex = index;

            // Highlight active button
            const buttons = document.querySelectorAll('.visit-room-btn');
            buttons.forEach((btn, idx) => {
                if (idx === index) btn.classList.add('active');
                else btn.classList.remove('active');
            });

            const imgObj = this.images[index];
            const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
            this.loadPanorama(url);
        }

        renderRoomButtons() {
            const btnContainer = document.getElementById('visit-room-buttons');
            if (!btnContainer) return;

            btnContainer.innerHTML = '';

            // Hide button bar if 1 or 0 rooms
            if (this.images.length <= 1) {
                btnContainer.style.display = 'none';
                return;
            }

            btnContainer.style.display = 'flex';

            this.images.forEach((img, idx) => {
                const btn = document.createElement('button');
                btn.className = `visit-room-btn ${idx === 0 ? 'active' : ''}`;

                // Format clean title e.g. "01-Room1.webp" -> "Room 1", "Room02.webp" -> "Room 2"
                let name = typeof img === 'string' ? img.split('/').pop() : (img.name || `Room ${idx + 1}`);
                name = name.replace(/\.[^/.]+$/, '');
                name = name.replace(/^(\d+)[-_]?/, '');
                name = name.replace(/([a-zA-Z]+)0*(\d+)/, '$1 $2');
                name = name.replace(/[-_]/g, ' ').trim();
                if (!name) name = `Room ${idx + 1}`;

                btn.textContent = name;
                btn.title = `Switch to ${name}`;
                btn.addEventListener('click', () => this.selectRoom(idx));
                btnContainer.appendChild(btn);
            });
        }
    }

    // Initialize global instance
    window.virtualVisit360 = new VirtualVisit360();

})();
