// ============================================
// AMBIENT PARTICLE SYSTEM
// Interactive particles outside building area
// Multi-layered animation with mouse attraction
// ============================================

class AmbientParticleSystem {
    constructor(scene, camera, boundingBox, domElement) {
        this.scene = scene;
        this.camera = camera;
        this.boundingBox = boundingBox;
        this.domElement = domElement;
        
        // Particle layers
        this.heavyParticles = null;
        this.mediumParticles = null;
        this.lightParticles = null;
        
        // Mouse interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.mouseWorldPos = new THREE.Vector3();
        this.prevMouseWorldPos = new THREE.Vector3();
        this.mouseVelocity = new THREE.Vector3();
        
        // Animation state
        this.time = 0;
        this.enabled = false;
        
        // Default settings (matching BoxParticleSystem structure but tailored for exterior)
        this.settings = {
            enabled: true,
            
            // Mouse interaction (Global)
            mouseInfluenceRadius: 15000,
            mouseForce: 80000.0, // Stronger default
            mouseDrag: 0.96,
            mouseReturnSpeed: 0.5,
            mouseInteractionType: 'attract', // 'attract' or 'repel'
            
            // Global Bounds
            spread: 50000,
            minHeight: 0,
            maxHeight: 12000,
            
            // Heavy particles (Layer 1) - Slow, large, background dust
            heavy: {
                enabled: true,
                count: 1500,
                color: 0xcccccc,
                size: 600.0,
                shape: 'soft',
                speed: 100.0,
                acceleration: 20.0,
                deceleration: 0.96,
                fadeTime: 10.0,
                glowStrength: 0.5,
                opacity: 0.3
            },
            
            // Medium particles (Layer 2) - Active, weaving, main dust
            medium: {
                enabled: true,
                count: 1000,
                color: 0xdddddd,
                size: 400.0,
                shape: 'circle',
                speed: 200.0,
                acceleration: 40.0,
                deceleration: 0.96,
                fadeTime: 8.0,
                glowStrength: 0.8,
                opacity: 0.4,
                weaveAmplitude: 300.0,
                weaveFrequency: 0.5
            },
            
            // Light particles (Layer 3) - Fast, twinkling, bright specs
            light: {
                enabled: true,
                count: 500,
                color: 0xffffff,
                size: 200.0,
                shape: 'star',
                speed: 50.0, // Float gently
                acceleration: 10.0,
                deceleration: 0.98,
                fadeTime: 5.0,
                glowStrength: 1.0,
                opacity: 0.6,
                twinkleSpeed: 2.0,
                twinkleIntensity: 0.8
            }
        };
        
        // Bind mouse events
        this.onMouseMove = this.onMouseMove.bind(this);
    }
    
    // Initialize the particle system
    init() {
        if (!this.boundingBox) {
            console.warn('No bounding box provided for ambient particle system');
            return;
        }
        
        // Prevent double initialization
        this.dispose();
        
        // Create layers
        this.createHeavyParticles();
        this.createMediumParticles();
        this.createLightParticles();
        
        this.setupMouseTracking();
        
        console.log('Ambient particle system initialized (Multi-layer)');
    }
    
    // Create Heavy Particles (Layer 1)
    // Update the camera (called when switching views)
    setCamera(camera) {
        this.camera = camera;
    }

    createHeavyParticles() {
        const settings = this.settings.heavy;
        if (!settings.enabled) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const lifetimes = [];
        
        const bounds = this.getAmbientBounds();
        
        for (let i = 0; i < settings.count; i++) {
            const pos = this.getRandomAmbientPosition(bounds);
            positions.push(pos.x, pos.y, pos.z);
            
            // Slow, drifting velocity
            velocities.push(
                (Math.random() - 0.5) * settings.speed,
                (Math.random() - 0.5) * settings.speed * 0.5,
                (Math.random() - 0.5) * settings.speed
            );
            
            lifetimes.push(Math.random() * settings.fadeTime);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.Float32BufferAttribute(lifetimes, 1));
        
        const material = this.createParticleMaterial(settings);
        
        this.heavyParticles = new THREE.Points(geometry, material);
        this.heavyParticles.name = 'AmbientParticles_Heavy';
        this.heavyParticles.frustumCulled = false;
        
        // Safety check
        const existing = this.scene.getObjectByName('AmbientParticles_Heavy');
        if (existing) this.scene.remove(existing);
        
        this.scene.add(this.heavyParticles);
    }
    
    // Create Medium Particles (Layer 2)
    createMediumParticles() {
        const settings = this.settings.medium;
        if (!settings.enabled) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const lifetimes = [];
        const phases = []; // For weaving
        
        const bounds = this.getAmbientBounds();
        
        for (let i = 0; i < settings.count; i++) {
            const pos = this.getRandomAmbientPosition(bounds);
            positions.push(pos.x, pos.y, pos.z);
            
            velocities.push(
                (Math.random() - 0.5) * settings.speed,
                (Math.random() - 0.5) * settings.speed * 0.5,
                (Math.random() - 0.5) * settings.speed
            );
            
            lifetimes.push(Math.random() * settings.fadeTime);
            phases.push(Math.random() * Math.PI * 2);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.Float32BufferAttribute(lifetimes, 1));
        geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
        
        const material = this.createParticleMaterial(settings);
        
        this.mediumParticles = new THREE.Points(geometry, material);
        this.mediumParticles.name = 'AmbientParticles_Medium';
        this.mediumParticles.frustumCulled = false;
        
        const existing = this.scene.getObjectByName('AmbientParticles_Medium');
        if (existing) this.scene.remove(existing);
        
        this.scene.add(this.mediumParticles);
    }
    
    // Create Light Particles (Layer 3)
    createLightParticles() {
        const settings = this.settings.light;
        if (!settings.enabled) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const lifetimes = [];
        const twinklePhases = [];
        
        const bounds = this.getAmbientBounds();
        
        for (let i = 0; i < settings.count; i++) {
            const pos = this.getRandomAmbientPosition(bounds);
            positions.push(pos.x, pos.y, pos.z);
            
            velocities.push(
                (Math.random() - 0.5) * settings.speed,
                (Math.random() - 0.5) * settings.speed,
                (Math.random() - 0.5) * settings.speed
            );
            
            lifetimes.push(Math.random() * settings.fadeTime);
            twinklePhases.push(Math.random() * Math.PI * 2);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.Float32BufferAttribute(lifetimes, 1));
        geometry.setAttribute('twinklePhase', new THREE.Float32BufferAttribute(twinklePhases, 1));
        
        const material = this.createParticleMaterial(settings);
        
        this.lightParticles = new THREE.Points(geometry, material);
        this.lightParticles.name = 'AmbientParticles_Light';
        this.lightParticles.frustumCulled = false;
        
        const existing = this.scene.getObjectByName('AmbientParticles_Light');
        if (existing) this.scene.remove(existing);
        
        this.scene.add(this.lightParticles);
    }

    getAmbientBounds() {
        const center = new THREE.Vector3();
        this.boundingBox.getCenter(center);
        const size = new THREE.Vector3();
        this.boundingBox.getSize(size);
        
        // Spread radius
        const spread = this.settings.spread || 5000;
        
        return {
             // Outer box
             minX: center.x - spread,
             maxX: center.x + spread,
             minY: this.settings.minHeight || 0,
             maxY: this.settings.maxHeight || 12000,
             minZ: center.z - spread,
             maxZ: center.z + spread,
             
             // Inner exclusion zone (building itself) - optional now?
             // Users wanted particles everywhere, "instead of just surrounding"
             // BoxParticleSystem handles the inside. 
             // We can keep a small exclusion if we don't want clipping, 
             // but user request implies they want them everywhere in the scene.
             // We'll trust the spread logic.
             exclusionMinX: center.x - size.x/2,
             exclusionMaxX: center.x + size.x/2,
             exclusionMinZ: center.z - size.z/2,
             exclusionMaxZ: center.z + size.z/2
        };
    }

    getRandomAmbientPosition(bounds) {
        const pos = new THREE.Vector3();
        
        // Simple random distribution for now, we can add exclusion logic if needed
        // but user wanted "all over the scene"
        pos.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
        pos.z = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);
        pos.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);

        return pos;
    }

    setupMouseTracking() {
        // Remove existing listener to be safe
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
        this.domElement.addEventListener('mousemove', this.onMouseMove, false);
    }
    
    onMouseMove(event) {
        if (!this.enabled) return;
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Project to building depth or just arbitrary distance for direction
        // For line-distance check, we just need ray origin and direction, which are set.
        // But for some logic we tracked a "MouseWorldPos" point:
        let distance = 10000;
        if (this.boundingBox) {
            const center = new THREE.Vector3();
            this.boundingBox.getCenter(center);
            distance = this.camera.position.distanceTo(center);
        }
        
        this.prevMouseWorldPos.copy(this.mouseWorldPos);
        this.mouseWorldPos.copy(this.raycaster.ray.direction)
            .multiplyScalar(distance)
            .add(this.raycaster.ray.origin);
    }
    
    // Helper to generate particle texture
    createParticleMaterial(settings) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; // Higher res for smoothness
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const cx = 64;
        const cy = 64;
        const r = 60;
        
        // Clear
        ctx.clearRect(0, 0, 128, 128);
        
        const shape = settings.shape || 'circle';
        
        if (shape === 'soft') {
            // Super soft glow
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);
            
        } else if (shape === 'circle') {
            // Harder circle with soft edge
            const gradient = ctx.createRadialGradient(cx, cy, r*0.5, cx, cy, r);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (shape === 'star') {
            // Star shape
            ctx.shadowBlur = 10;
            ctx.shadowColor = "white";
            ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
            
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
            
        } else if (shape === 'diamond') {
             // Diamond / Sparkle
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy - r);
            ctx.quadraticCurveTo(cx + 10, cy, cx + r, cy);
            ctx.quadraticCurveTo(cx + 10, cy, cx, cy + r);
            ctx.quadraticCurveTo(cx - 10, cy, cx - r, cy);
            ctx.quadraticCurveTo(cx - 10, cy, cx, cy - r);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // Use blending based on settings, but usually Additive is best for "glow" particles
        // To fix black edges on light background, NormalBlending with premultiplied alpha texture is needed,
        // but for 3D viewer (usually dark), Additive is standard. 
        // We will stick to Additive for 'glow', but maybe user wants Normal?
        
        return new THREE.PointsMaterial({
            size: settings.size,
            color: settings.color,
            transparent: true,
            opacity: settings.opacity,
            map: texture,
            blending: THREE.AdditiveBlending, // Forces glow-like appearance
            depthWrite: false,
            sizeAttenuation: true
        });
    }

    getAmbientBounds() {
        const box = this.boundingBox;
        const spread = this.settings.spread || 5000;
        const centerX = (box.min.x + box.max.x) / 2;
        const centerZ = (box.min.z + box.max.z) / 2;
        
        return {
            outerMinX: centerX - spread,
            outerMaxX: centerX + spread,
            outerMinZ: centerZ - spread,
            outerMaxZ: centerZ + spread,
            exclusionMinX: box.min.x,
            exclusionMaxX: box.max.x,
            exclusionMinZ: box.min.z,
            exclusionMaxZ: box.max.z,
            minY: box.min.y + (this.settings.minHeight || 0),
            maxY: box.min.y + (this.settings.maxHeight || 12000)
        };
    }
    
    getRandomAmbientPosition(bounds) {
        const pos = new THREE.Vector3();
        const maxAttempts = 30;
        let attempts = 0;
        let valid = false;
        
        while (!valid && attempts < maxAttempts) {
            attempts++;
            pos.x = bounds.outerMinX + Math.random() * (bounds.outerMaxX - bounds.outerMinX);
            pos.z = bounds.outerMinZ + Math.random() * (bounds.outerMaxZ - bounds.outerMinZ);
            
            const insideExclusion = (
                pos.x > bounds.exclusionMinX && 
                pos.x < bounds.exclusionMaxX && 
                pos.z > bounds.exclusionMinZ && 
                pos.z < bounds.exclusionMaxZ
            );
            
            if (!insideExclusion) valid = true;
        }
        
        if (!valid) {
             if (Math.random() < 0.5) {
                pos.x = bounds.exclusionMinX - (Math.random() * (bounds.exclusionMinX - bounds.outerMinX));
            } else {
                pos.x = bounds.exclusionMaxX + (Math.random() * (bounds.outerMaxX - bounds.exclusionMaxX));
            }
            pos.z = bounds.outerMinZ + Math.random() * (bounds.outerMaxZ - bounds.outerMinZ);
        }
        
        pos.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
        return pos;
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
        
        // Project to building depth
        let distance = 10000;
        if (this.boundingBox) {
            const center = new THREE.Vector3();
            this.boundingBox.getCenter(center);
            distance = this.camera.position.distanceTo(center);
        }
        
        this.prevMouseWorldPos.copy(this.mouseWorldPos);
        this.mouseWorldPos.copy(this.raycaster.ray.direction)
            .multiplyScalar(distance)
            .add(this.raycaster.ray.origin);
    }
    
    // Helper helper for mouse-ray
    getDistanceFromMouseRay(px, py, pz) {
        // Ray Origin (Camera)
        const ox = this.raycaster.ray.origin.x;
        const oy = this.raycaster.ray.origin.y;
        const oz = this.raycaster.ray.origin.z;
        
        // Ray Direction
        const dx = this.raycaster.ray.direction.x;
        const dy = this.raycaster.ray.direction.y;
        const dz = this.raycaster.ray.direction.z;
        
        // Vector from Origin to Point
        const vax = px - ox;
        const vay = py - oy;
        const vaz = pz - oz;
        
        // Projection length of v onto d
        const t = vax * dx + vay * dy + vaz * dz;
        
        // Closest point on ray
        const cx = ox + t * dx;
        const cy = oy + t * dy;
        const cz = oz + t * dz;
        
        // Vector from Point to Closest Point on Ray
        const rx = cx - px;
        const ry = cy - py;
        const rz = cz - pz;
        
        // Distance squared
        const distSq = rx*rx + ry*ry + rz*rz;
        
        return { 
            dist: Math.sqrt(distSq), 
            dx: rx, // Vector TOWARDS ray
            dy: ry, 
            dz: rz 
        }; 
    }

    update(deltaTime) {
        if (!this.enabled) return;
        this.time += deltaTime;
        
        this.mouseVelocity.subVectors(this.mouseWorldPos, this.prevMouseWorldPos);
        
        if (this.heavyParticles && this.settings.heavy.enabled) this.updateHeavyParticles(deltaTime);
        if (this.mediumParticles && this.settings.medium.enabled) this.updateMediumParticles(deltaTime);
        if (this.lightParticles && this.settings.light.enabled) this.updateLightParticles(deltaTime);
    }
    
    // Heavy Particles - Slow rising background dust
    updateHeavyParticles(deltaTime) {
        const system = this.heavyParticles;
        const geometry = system.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const layerSettings = this.settings.heavy;
        const bounds = this.getAmbientBounds();

        // Mouse settings
        const influenceRadius = this.settings.mouseInfluenceRadius;
        const mouseForce = this.settings.mouseForce;
        const drag = this.settings.mouseDrag;
        const returnSpeed = this.settings.mouseReturnSpeed !== undefined ? this.settings.mouseReturnSpeed : 0.5;
        const interactionType = this.settings.mouseInteractionType || 'attract';
        const isMouseActive = (this.mouse.x !== 0 || this.mouse.y !== 0);

        // Effective acceleration (Upward Speed)
        const upwardAccel = layerSettings.acceleration || 20.0;

        for (let i = 0; i < layerSettings.count; i++) {
            const i3 = i * 3;
            
            // 1. Natural Motion & Return
            velocities[i3 + 1] += upwardAccel * deltaTime;
            
            // Apply "return" damping
            velocities[i3] *= (1.0 - returnSpeed * deltaTime); 
            velocities[i3+2] *= (1.0 - returnSpeed * deltaTime);
            
            // 2. Mouse Interaction
            if (isMouseActive) {
                const mouseInfo = this.getDistanceFromMouseRay(positions[i3], positions[i3+1], positions[i3+2]);
                if (mouseInfo.dist < influenceRadius) {
                    const factor = 1 - (mouseInfo.dist / influenceRadius);
                    // Force Magnitude
                    let force = factor * mouseForce * deltaTime * 0.005; 
                    
                    // Repel logic: invert force to push away
                    if (interactionType === 'repel') {
                         force = -force;
                    }
                    
                    velocities[i3] += mouseInfo.dx * force * 0.01;
                    velocities[i3+1] += mouseInfo.dy * force * 0.01;
                    velocities[i3+2] += mouseInfo.dz * force * 0.01;
                }
            }
            
            // 3. Global Drag
            velocities[i3] *= drag;
            velocities[i3+1] *= drag;
            velocities[i3+2] *= drag;
            
            // Min upward speed maintenance
            if (velocities[i3+1] < layerSettings.speed * 0.1) velocities[i3+1] += layerSettings.speed * 0.5 * deltaTime;

            // Update Position
            positions[i3] += velocities[i3] * deltaTime;
            positions[i3+1] += velocities[i3+1] * deltaTime;
            positions[i3+2] += velocities[i3+2] * deltaTime;
            
            // 4. Reset
            if (positions[i3+1] > bounds.maxY) {
                const newPos = this.getRandomAmbientPosition(bounds);
                positions[i3] = newPos.x;
                positions[i3+1] = bounds.minY;
                positions[i3+2] = newPos.z;
                
                velocities[i3] = (Math.random() - 0.5) * layerSettings.speed * 0.5;
                velocities[i3+1] = layerSettings.speed * (0.8 + Math.random() * 0.4);
                velocities[i3+2] = (Math.random() - 0.5) * layerSettings.speed * 0.5;
            }
            if (positions[i3+1] < bounds.minY) {
                 positions[i3+1] = bounds.minY;
                 velocities[i3+1] = Math.abs(velocities[i3+1]) * 0.5;
            }
        }
        
        geometry.attributes.position.needsUpdate = true;
        const pulse = Math.sin(this.time * 1.5) * 0.15;
        system.material.opacity = layerSettings.opacity * (0.85 + pulse);
    }
    
    // Medium Particles - Weaving motion
    updateMediumParticles(deltaTime) {
        const system = this.mediumParticles;
        const geometry = system.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const phases = geometry.attributes.phase.array;
        const layerSettings = this.settings.medium;
        const bounds = this.getAmbientBounds();

        const influenceRadius = this.settings.mouseInfluenceRadius;
        const mouseForce = this.settings.mouseForce;
        const drag = this.settings.mouseDrag;
        const returnSpeed = this.settings.mouseReturnSpeed !== undefined ? this.settings.mouseReturnSpeed : 0.5;
        const interactionType = this.settings.mouseInteractionType || 'attract';
        const isMouseActive = (this.mouse.x !== 0 || this.mouse.y !== 0);
        const upwardAccel = layerSettings.acceleration || 40.0;

        for (let i = 0; i < layerSettings.count; i++) {
            const i3 = i * 3;
            
            velocities[i3 + 1] += upwardAccel * deltaTime;
            
            // Return Damping
            velocities[i3] *= (1.0 - returnSpeed * deltaTime); 
            velocities[i3+2] *= (1.0 - returnSpeed * deltaTime);
            
            const weaveOffset = Math.sin(this.time * layerSettings.weaveFrequency + phases[i]) * layerSettings.weaveAmplitude * deltaTime;
            
            if (isMouseActive) {
                const mouseInfo = this.getDistanceFromMouseRay(positions[i3], positions[i3+1], positions[i3+2]);
                if (mouseInfo.dist < influenceRadius) {
                    const factor = 1 - (mouseInfo.dist / influenceRadius);
                    let force = factor * mouseForce * deltaTime * 0.005;
                    
                    if (interactionType === 'repel') force = -force;

                    velocities[i3] += mouseInfo.dx * force * 0.01;
                    velocities[i3+1] += mouseInfo.dy * force * 0.01;
                    velocities[i3+2] += mouseInfo.dz * force * 0.01;
                }
            }
            
            velocities[i3] *= drag;
            velocities[i3+1] *= drag;
            velocities[i3+2] *= drag;
            
            positions[i3] += velocities[i3] * deltaTime + weaveOffset;
            positions[i3+1] += velocities[i3+1] * deltaTime;
            positions[i3+2] += velocities[i3+2] * deltaTime;
            
             if (positions[i3+1] > bounds.maxY) {
                const newPos = this.getRandomAmbientPosition(bounds);
                positions[i3] = newPos.x;
                positions[i3+1] = bounds.minY;
                positions[i3+2] = newPos.z;
                
                velocities[i3] = (Math.random() - 0.5) * layerSettings.speed * 0.5;
                velocities[i3+1] = layerSettings.speed * (0.8 + Math.random() * 0.4);
                velocities[i3+2] = (Math.random() - 0.5) * layerSettings.speed * 0.5;
                phases[i] = Math.random() * Math.PI * 2;
            }
             if (positions[i3+1] < bounds.minY) {
                 positions[i3+1] = bounds.minY;
                 velocities[i3+1] = Math.abs(velocities[i3+1]) * 0.5;
            }
        }
        
        geometry.attributes.position.needsUpdate = true;
        const pulse = Math.sin(this.time * 2.0) * 0.15;
        system.material.opacity = layerSettings.opacity * (0.85 + pulse);
    }
    
    // Light Particles - Twinkling
    updateLightParticles(deltaTime) {
        const system = this.lightParticles;
        const geometry = system.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const twinklePhases = system.geometry.attributes.twinklePhase.array;
        const layerSettings = this.settings.light;
        const bounds = this.getAmbientBounds();

        const influenceRadius = this.settings.mouseInfluenceRadius;
        const mouseForce = this.settings.mouseForce;
        const drag = this.settings.mouseDrag;
        const returnSpeed = this.settings.mouseReturnSpeed !== undefined ? this.settings.mouseReturnSpeed : 0.5;
        const interactionType = this.settings.mouseInteractionType || 'attract';
        const isMouseActive = (this.mouse.x !== 0 || this.mouse.y !== 0);
        const upwardAccel = layerSettings.acceleration || 10.0;

        for (let i = 0; i < layerSettings.count; i++) {
            const i3 = i * 3;
            
            velocities[i3 + 1] += upwardAccel * deltaTime;
            
            // Return Damping
            velocities[i3] *= (1.0 - returnSpeed * deltaTime); 
            velocities[i3+2] *= (1.0 - returnSpeed * deltaTime);

            if (isMouseActive) {
                const mouseInfo = this.getDistanceFromMouseRay(positions[i3], positions[i3+1], positions[i3+2]);
                if (mouseInfo.dist < influenceRadius) {
                    const factor = 1 - (mouseInfo.dist / influenceRadius);
                    let force = factor * mouseForce * deltaTime * 0.005;
                    
                    if (interactionType === 'repel') force = -force;

                    velocities[i3] += mouseInfo.dx * force * 0.01;
                    velocities[i3+1] += mouseInfo.dy * force * 0.01;
                    velocities[i3+2] += mouseInfo.dz * force * 0.01;
                    
                    // Extra sparkle tickle (randomized depending on direction?)
                    velocities[i3+1] += Math.abs(force) * 0.2; 
                }
            }
            
            velocities[i3] *= drag;
            velocities[i3+1] *= drag;
            velocities[i3+2] *= drag;
            
            positions[i3] += velocities[i3] * deltaTime;
            positions[i3+1] += velocities[i3+1] * deltaTime;
            positions[i3+2] += velocities[i3+2] * deltaTime;
            
            const heightVariation = Math.sin(this.time * layerSettings.twinkleSpeed + twinklePhases[i]) * 1000;
            positions[i3+1] += heightVariation * 0.005 * deltaTime;
            
            if (positions[i3+1] > bounds.maxY) {
                const newPos = this.getRandomAmbientPosition(bounds);
                positions[i3] = newPos.x;
                positions[i3+1] = bounds.minY;
                positions[i3+2] = newPos.z;
                
                velocities[i3] = (Math.random() - 0.5) * layerSettings.speed * 0.5;
                velocities[i3+1] = layerSettings.speed * (0.5 + Math.random() * 0.5);
                velocities[i3+2] = (Math.random() - 0.5) * layerSettings.speed * 0.5;
                twinklePhases[i] = Math.random() * Math.PI * 2;
            }
            if (positions[i3+1] < bounds.minY) {
                 positions[i3+1] = bounds.minY;
                 velocities[i3+1] = Math.abs(velocities[i3+1]) * 0.5;
            }
        }
        
        geometry.attributes.position.needsUpdate = true;
        const pulse = Math.sin(this.time * layerSettings.twinkleSpeed) * layerSettings.twinkleIntensity * 0.3;
        system.material.opacity = layerSettings.opacity * (0.7 + pulse);
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.heavyParticles) this.heavyParticles.visible = enabled && this.settings.heavy.enabled;
        if (this.mediumParticles) this.mediumParticles.visible = enabled && this.settings.medium.enabled;
        if (this.lightParticles) this.lightParticles.visible = enabled && this.settings.light.enabled;
    }
    
    updateSettings(newSettings) {
        console.log('AmbientParticles.updateSettings called with:', newSettings);
        // Deep merge
        for (const key in newSettings) {
            if (['heavy', 'medium', 'light'].includes(key) && typeof newSettings[key] === 'object') {
                this.settings[key] = { ...this.settings[key], ...newSettings[key] };
                // console.log(`Updated ${key} settings:`, this.settings[key]);
            } else {
                this.settings[key] = newSettings[key];
            }
        }
        
        if (this.settings.enabled) {
            this.dispose();
            this.init();
            this.setEnabled(true);
        } else {
            this.setEnabled(false);
        }
    }

    createParticleMaterial(settings) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const cx = 64;
        const cy = 64;
        const r = 60;
        
        const glowFactor = settings.glowStrength !== undefined ? settings.glowStrength : 1.0;
        
        // Clear
        ctx.clearRect(0, 0, 128, 128);
        
        const shape = settings.shape || 'circle';
        
        if (shape === 'soft') {
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * Math.min(1, glowFactor)})`);
            gradient.addColorStop(0.2, `rgba(255, 255, 255, ${0.8 * Math.min(1, glowFactor)})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * Math.min(1, glowFactor)})`);
            gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);
            
        } else if (shape === 'circle') {
            const gradient = ctx.createRadialGradient(cx, cy, r*0.5, cx, cy, r);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * Math.min(1, glowFactor)})`);
            gradient.addColorStop(0.8, `rgba(255, 255, 255, ${0.5 * Math.min(1, glowFactor)})`);
            gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (shape === 'star') {
            ctx.shadowBlur = 10 * glowFactor;
            ctx.shadowColor = "white";
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, glowFactor)})`;
            
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
            
        } else if (shape === 'diamond') {
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, glowFactor)})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy - r);
            ctx.quadraticCurveTo(cx + 10, cy, cx + r, cy);
            ctx.quadraticCurveTo(cx + 10, cy, cx, cy + r);
            ctx.quadraticCurveTo(cx - 10, cy, cx - r, cy);
            ctx.quadraticCurveTo(cx - 10, cy, cx, cy - r);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        
        return new THREE.PointsMaterial({
            size: settings.size * (settings.glowStrength > 1.0 ? settings.glowStrength * 0.8 : 1.0),
            color: settings.color,
            transparent: true,
            opacity: settings.opacity,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });
    }

    dispose() {
        if (this.heavyParticles) {
            this.scene.remove(this.heavyParticles);
            this.heavyParticles.geometry.dispose();
            this.heavyParticles.material.dispose();
            this.heavyParticles = null;
        }
        if (this.mediumParticles) {
            this.scene.remove(this.mediumParticles);
            this.mediumParticles.geometry.dispose();
            this.mediumParticles.material.dispose();
            this.mediumParticles = null;
        }
        if (this.lightParticles) {
            this.scene.remove(this.lightParticles);
            this.lightParticles.geometry.dispose();
            this.lightParticles.material.dispose();
            this.lightParticles = null;
        }
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AmbientParticleSystem;
}
