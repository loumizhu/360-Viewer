// ============================================
// CURSOR PARTICLE SYSTEM (MAGIC TRAIL)
// "Comet tail" effect following the mouse
// Emitter-based system with life cycle
// ============================================

class CursorParticleSystem {
    constructor(scene, camera, domElement) {
        this.scene = scene;
        this.camera = camera;
        this.domElement = domElement;
        
        // Particle layers
        this.particles = null;
        
        // Mouse interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.mouseWorldPos = new THREE.Vector3();
        this.prevMouseWorldPos = new THREE.Vector3();
        this.hasMouseMoved = false;
        
        // Animation state
        this.time = 0;
        this.enabled = false;
        
        // Tracking index for circular buffer emission
        this.spawnIndex = 0;
        
        // Settings tailored for "CC Particle Systems II" match
        this.settings = {
            enabled: false,
            
            // Producer
            birthRate: 50,        // Particles per frame/tick factor
            count: 3000,          // Pool size
            lifeSpan: 1.5,        // Longevity (sec)
            
            radiusX: 2.0,         
            radiusY: 2.0,         
            
            // Physics
            velocity: 20.0,       // "Ejection Speed" - High for rocket
            inheritVelocity: 0,   // Now redundant for direction, but can add extra push
            gravity: 0,
            resistance: 0.1,      
            extra: 1.0,  
            sprayAngle: 0.5,      // Cone spread (0=laser, 1=wide)         
            
            // Particle
            shape: 'soft',
            birthSize: 40.0,
            deathSize: 0.0,
            sizeVariation: 50.0,  
            opacityMap: 'Fade Out',
            maxOpacity: 1.0,
            
            colors: [
                0x00ffff, // Cyan (Hot)
                0x0088ff, // Blue
                0xff00ff, // Purple
                0x5500ff  // Dark Purple (Cold)
            ], 
            
            // Dimensions (Legacy/Helper)
            spread: 2.0,  
            
            // Dynamics (Legacy/Helper)
            drag: 0.90,           
            randomness: 200.0,
            velocityVariation: 50.0, // %
            
            // Gradient Control
            gradientBias: 1.0 // 1.0 = Linear, >1.0 = Stay at start color longer, <1.0 = Rush to end
        };
        
        // Bind mouse events
        this.onMouseMove = this.onMouseMove.bind(this);
    }
    
    init() {
        // Prevent double initialization
        this.dispose();
        
        this.createParticles();
        this.setupMouseTracking();
        
        // Reset state
        this.spawnIndex = 0;
        this.hasMouseMoved = false; // Wait for first movement
        
        console.log('Cursor particle system initialized (CC Mode)');
    }
    
    createParticles() {
        if (!this.settings.enabled) return;
        
        const count = this.settings.count;
        const geometry = new THREE.BufferGeometry();
        
        // Attributes
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3); // Stored but not rendered
        const lives = new Float32Array(count); // 0.0 to 1.0
        const decayRates = new Float32Array(count); // Life deduction per second
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count); 
        const opacities = new Float32Array(count);
        
        // Initialize
        for (let i = 0; i < count; i++) {
            positions[i*3] = 999999; // Offscreen
            lives[i] = 0;
            decayRates[i] = 1.0;
            opacities[i] = 0;
            sizes[i] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        // Store simulation data in simple arrays or hidden attributes
        this.velocities = velocities;
        this.lives = lives;
        this.decayRates = decayRates;
        
        const material = this.createParticleMaterial();
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.name = 'CursorParticles';
        this.particles.frustumCulled = false;
        
        // Remove existing
        const existing = this.scene.getObjectByName('CursorParticles');
        if (existing) this.scene.remove(existing);
        
        this.scene.add(this.particles);
    }
    
    createParticleMaterial() {
        const shape = this.settings.shape || 'soft';
        
        // Generate Texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const cx = 32, cy = 32, r = 28;
        
        ctx.clearRect(0, 0, 64, 64);
        ctx.fillStyle = "white"; 
        
        if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === 'soft') {
            // Stronger soft glow for opacity blending
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grd.addColorStop(0, "rgba(255, 255, 255, 1.0)");
            grd.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
            grd.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
            grd.addColorStop(1, "rgba(255, 255, 255, 0.0)");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(cx, cy - r);
            ctx.lineTo(cx + r * 0.8, cy);
            ctx.lineTo(cx, cy + r);
            ctx.lineTo(cx - r * 0.8, cy);
            ctx.closePath();
            ctx.fill();
        } else {
            // Star
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = r;
            const innerRadius = r * 0.4;
            for(let i=0; i<spikes; i++){
                let x = cx + Math.cos((18+i*72)/180*Math.PI) * outerRadius;
                let y = cy - Math.sin((18+i*72)/180*Math.PI) * outerRadius;
                ctx.lineTo(x, y);
                x = cx + Math.cos((54+i*72)/180*Math.PI) * innerRadius;
                y = cy - Math.sin((54+i*72)/180*Math.PI) * innerRadius;
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // Shader Material
        return new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: texture }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float opacity;
                varying vec3 vColor;
                varying float vOpacity;
                void main() {
                    vColor = color;
                    vOpacity = opacity;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (800.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                varying float vOpacity;
                void main() {
                    vec4 tex = texture2D(pointTexture, gl_PointCoord);
                    // Standard Alpha Blending
                    // Output color and correct alpha to clip transparency
                    gl_FragColor = vec4(vColor, tex.a * vOpacity);
                }
            `,
            transparent: true,
            depthWrite: false,
            // Use NormalBlending to ensure particles are visible on light backgrounds
            // and don't render as black squares
            blending: THREE.NormalBlending 
        });
    }
    
    setupMouseTracking() {
        this.domElement.addEventListener('mousemove', this.onMouseMove, false);
    }
    
    onMouseMove(event) {
        if (!this.enabled) return;
        
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Fixed distance projection logic
        const distance = 800; // Keep consistent fixed distance for now
        
        // Store previous position before updating
        if (!this.hasMouseMoved) {
            // Initialization
            this.mouseWorldPos.copy(this.raycaster.ray.direction).multiplyScalar(distance).add(this.raycaster.ray.origin);
            this.prevMouseWorldPos.copy(this.mouseWorldPos);
            this.hasMouseMoved = true;
        } else {
            this.prevMouseWorldPos.copy(this.mouseWorldPos);
            this.mouseWorldPos.copy(this.raycaster.ray.direction).multiplyScalar(distance).add(this.raycaster.ray.origin);
        }
    }
    
    update(deltaTime) {
        if (!this.enabled || !this.particles || !this.hasMouseMoved) return;
        
        this.time += deltaTime;
        const dt = Math.min(deltaTime, 0.1);
        
        const geometry = this.particles.geometry;
        const positions = geometry.attributes.position.array;
        const sizes = geometry.attributes.size.array;
        const opacities = geometry.attributes.opacity.array;
        const colors = geometry.attributes.color.array;
        
        const velocities = this.velocities;
        const lives = this.lives;
        const decayRates = this.decayRates;
        
        // Parse Colors
        const gradientColors = (this.settings.colors || [0xffffff, 0xff0000]).map(c => new THREE.Color(c));
        const getColor = (t) => {
            let p = 1.0 - t; // 0.0 (Birth) -> 1.0 (Death)
            
            // Apply Gradient Bias
            const bias = this.settings.gradientBias || 1.0;
            p = Math.pow(p, bias);
            
            if (gradientColors.length < 2) return gradientColors[0];
            const maxIdx = gradientColors.length - 1;
            const scaled = p * maxIdx;
            const idx = Math.floor(scaled);
            const frac = scaled - idx;
            if (idx >= maxIdx) return gradientColors[maxIdx];
            if (idx < 0) return gradientColors[0];
            const c1 = gradientColors[idx];
            const c2 = gradientColors[idx + 1];
            return {
                r: c1.r + (c2.r - c1.r) * frac,
                g: c1.g + (c2.g - c1.g) * frac,
                b: c1.b + (c2.b - c1.b) * frac
            };
        };
        
        // 1. UPDATE
        for (let i = 0; i < this.settings.count; i++) {
            if (lives[i] > 0) {
                const i3 = i * 3;
                
                lives[i] -= decayRates[i] * dt;
                
                if (lives[i] <= 0) {
                    lives[i] = 0;
                    positions[i3] = 999999;
                    opacities[i] = 0;
                } else {
                    // Physics
                    positions[i3] += velocities[i3] * dt;
                    positions[i3+1] += velocities[i3+1] * dt;
                    positions[i3+2] += velocities[i3+2] * dt;
                    
                    const friction = 1.0 - (this.settings.resistance * dt);
                    velocities[i3] *= Math.max(0, friction);
                    velocities[i3+1] *= Math.max(0, friction);
                    velocities[i3+2] *= Math.max(0, friction);
                    
                    velocities[i3+1] += this.settings.gravity * dt;
                    
                    // Visuals
                    const rgb = getColor(lives[i]);
                    colors[i3] = rgb.r;
                    colors[i3+1] = rgb.g;
                    colors[i3+2] = rgb.b;
                    
                    // Size Interpolation
                    const lifeRatio = lives[i]; // 1.0 -> 0.0
                    // We need original variation. 
                    // To save memory/complexity, we can re-calculate variation-based size roughly or store birthSize/deathSize per particle?
                    // Let's assume variation applies to both birth/death roughly or just birth.
                    // Ideally we stored 'targetBirthSize' and 'targetDeathSize' but we only have array.
                    // Hack: Use 'velocities' array w-component or similar? No.
                    // Let's just use global settings for simplicity in this pass, or reconstruct.
                    // Variation is random. Let's just use the 'sizes[i]' as state? No, it changes.
                    // We need 'maxSize'.
                    // Let's Add a new Float32Array locally for 'maxSizes' if we want variation.
                    // Actually, let's just use the settings.size with a random factor based on index?
                    // Math.sin(i) is a pseudo-random seed.
                    const seed = Math.sin(i * 12.9898) * 43758.5453;
                    const rand = seed - Math.floor(seed);
                    const varFactor = 1.0 + (rand - 0.5) * 2 * (this.settings.sizeVariation / 100.0);
                    
                    const bSize = this.settings.birthSize * varFactor;
                    const dSize = this.settings.deathSize * varFactor;
                    
                    sizes[i] = dSize + (bSize - dSize) * lifeRatio;
                    
                    // Opacity Fade
                    // Simple linear Fade Out at end, or standard "Opacity Map" (Fade In/Out)
                    // AE "Fade Out" map usually means: Start Max -> End 0.
                    // "Fade In" means: Start 0 -> Max.
                    // "Fade In and Out": 0 -> Max -> 0.
                    // Let's implement Fade Out (default).
                    // Allow a quick fade in at birth (top 10%) to avoid popping.
                    let alpha = this.settings.maxOpacity;
                    if (lifeRatio > 0.9) {
                        alpha *= (1.0 - lifeRatio) / 0.1; // 1.0->0, 0.9->1
                    }
                    else {
                         // 0.0 -> 0.9: Fade out (Quadratic or Linear?)
                         // Linear: 
                         alpha *= (lifeRatio / 0.9);
                    }
                    
                    opacities[i] = alpha;
                }
            }
        }
        
        // 2. EMIT
        const dist = this.mouseWorldPos.distanceTo(this.prevMouseWorldPos);
        const moveVector = new THREE.Vector3().subVectors(this.mouseWorldPos, this.prevMouseWorldPos);
        const mouseVelCallback = moveVector.clone().divideScalar(dt > 0.001 ? dt : 0.001);
        
        // Calculate Direction (Backwards/Exhaust)
        let dir = new THREE.Vector3(0, 0, 0);
        const speed = moveVector.length();
        
        if (speed > 0.0001) {
            dir.copy(moveVector).normalize().negate(); // Point backwards
        } else {
            // If idle, maybe point down or random?
            // For now, random unit sphere if idle, or Up/Down?
            dir.set(0, -1, 0); // Default gravity drop if idle
        }

        const gapSteps = Math.ceil(dist / 2.0) + 1;
        let emitCount = gapSteps * this.settings.birthRate; 
        emitCount = Math.min(emitCount, 500);
        
        const startRGB = getColor(1.0);
        
        for (let s = 0; s < emitCount; s++) {
            const idx = this.spawnIndex;
            const i3 = idx * 3;
            
            this.spawnIndex = (this.spawnIndex + 1) % this.settings.count;
            
            const ratio = s / emitCount; 
            const x = this.prevMouseWorldPos.x + (this.mouseWorldPos.x - this.prevMouseWorldPos.x) * ratio;
            const y = this.prevMouseWorldPos.y + (this.mouseWorldPos.y - this.prevMouseWorldPos.y) * ratio;
            const z = this.prevMouseWorldPos.z + (this.mouseWorldPos.z - this.prevMouseWorldPos.z) * ratio;
            
            // Position Spread (Spherical within Radius)
            // Use rejection sampling or trig for uniform circle/sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const rRand = Math.cbrt(Math.random()); // Cube root for uniform volume distribution
            
            const rX = this.settings.radiusX;
            const rY = this.settings.radiusY;
            const rAvg = (rX + rY) / 2; // Simplified to sphere for now
            
            const spX = rAvg * rRand * Math.sin(phi) * Math.cos(theta);
            const spY = rAvg * rRand * Math.sin(phi) * Math.sin(theta);
            const spZ = rAvg * rRand * Math.cos(phi);
            
            positions[i3] = x + spX;
            positions[i3+1] = y + spY;
            positions[i3+2] = z + spZ;
            
            // --- VELOCITY LOGIC ---
            const vMag = this.settings.velocity * 10.0;
            
            let finalDir = new THREE.Vector3();
            const mode = this.settings.emissionMode || 'Omni';
            
            if (mode === 'Directional' && speed > 0.0001) {
                // Moving: directional exhaust (Rocket Style)
                const coneAngle = this.settings.sprayAngle !== undefined ? this.settings.sprayAngle : 0.5;
                
                // Random vector in unit sphere
                const rx = (Math.random() - 0.5) * 2;
                const ry = (Math.random() - 0.5) * 2;
                const rz = (Math.random() - 0.5) * 2;
                const randVec = new THREE.Vector3(rx, ry, rz).normalize().multiplyScalar(coneAngle);
                
                // Add to base direction (backwards from move) and normalize
                finalDir.copy(dir).add(randVec).normalize();
            } else {
                // Omni-directional (Sparkler Style - Like CodePen)
                const dx = (Math.random() - 0.5) * 2;
                const dy = (Math.random() - 0.5) * 2;
                const dz = (Math.random() - 0.5) * 2;
                finalDir.set(dx, dy, dz).normalize();
            }
            
            // Apply Velocity
            let rVec = finalDir.multiplyScalar(vMag);
            
            // Apply Velocity Magnitude Variation
            const velVar = this.settings.velocityVariation !== undefined ? this.settings.velocityVariation : 50.0;
            const velVarFactor = 1.0 + (Math.random() - 0.5) * 2 * (velVar / 100.0);
            rVec.multiplyScalar(velVarFactor);

            // Inherit Velocity (Mouse influence)
            // CodePen does NOT use this, so default is 0.
            const inheritFactor = this.settings.inheritVelocity / 100.0;
            const iVec = mouseVelCallback.clone().multiplyScalar(inheritFactor);
            
            velocities[i3] = rVec.x + iVec.x;
            velocities[i3+1] = rVec.y + iVec.y;
            velocities[i3+2] = rVec.z + iVec.z;
            
            // Life Init
            const lifeVar = (Math.random() - 0.5) * 2.0 * (this.settings.lifeSpanVariation || 0.2); 
            const realLifeSpan = this.settings.lifeSpan * (1.0 + lifeVar);
            
            decayRates[idx] = 1.0 / Math.max(0.1, realLifeSpan);
            lives[idx] = 1.0;
            
            opacities[idx] = 0; 
            
            // Random Color Support (CodePen style)
            // If randomColor settings is true? For now stick to gradient unless requested.
            // But CodePen uses Math.random() * 360 HSL.
            // Let's rely on the existing Gradient system as it covers "Random" if gradient is rainbow.
            
            colors[i3] = startRGB.r;
            colors[i3+1] = startRGB.g;
            colors[i3+2] = startRGB.b;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.attributes.size.needsUpdate = true;
        geometry.attributes.opacity.needsUpdate = true;
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        this.settings.enabled = enabled;
        if (enabled) {
            this.init();
        } else {
            this.dispose();
        }
    }
    
    dispose() {
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.particles = null;
        }
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
    }
    
    setCamera(camera) {
        this.camera = camera;
    }
    
    setSettings(newSettings) {
        // Safe object merge including array replacement
        const { colors, ...rest } = newSettings;
        Object.assign(this.settings, rest);
        if (colors) this.settings.colors = [...colors];
        
        const needReinit = newSettings.count && newSettings.count !== this.settings.count;
        if (needReinit && this.enabled) this.init();
    }
}
