// ============================================
// OSCILLATING PARTICLE SYSTEM
// Mimics Briggs-Rauscher Oscillating Reaction
// ============================================

class OscillatingParticleSystem {
    constructor(scene, camera, boundingBox) {
        this.scene = scene;
        this.camera = camera;
        this.boundingBox = boundingBox;
        
        // Particle systems for each layer
        this.heavyParticles = null;
        this.mediumParticles = null;
        this.lightParticles = null;
        
        // Glow/bloom effects
        this.glowSprites = [];
        
        // Animation state
        this.time = 0;
        this.enabled = false;
        
        // Default settings (will be overridden by CONFIG_3D)
        this.settings = {
            enabled: false,
            
            // Border spacing from 3D boxes
            borderSpacing: 1000, // meters (increased for very large scenes)
            
            // Heavy particles (Layer 1)
            heavy: {
                enabled: true,
                count: 2000,  // Increased 4x to fill entire volume
                color: 0x4488ff,
                size: 800.0,  // Increased 10x more for 86k camera distance
                shape: 'circle', // circle, square, triangle, star
                speed: 500.0,  // Faster for visible movement
                acceleration: 50.0,  // Stronger acceleration
                deceleration: 0.95,
                fadeTime: 8.0,  // Longer lifetime to reach full height
                glow: true,
                glitter: false,
                haze: true,
                opacity: 0.8,
                maxHeight: 12000  // Rise to full building height
            },
            
            // Medium particles (Layer 2)
            medium: {
                enabled: true,
                count: 1200,  // Increased 4x
                color: 0x88ff44,
                size: 500.0,  // Increased 10x more
                shape: 'circle',
                speed: 800.0,  // Faster
                acceleration: 80.0,  // Stronger
                deceleration: 0.98,
                fadeTime: 6.0,  // Longer
                glow: true,
                glitter: true,
                haze: false,
                opacity: 0.7,
                weaveAmplitude: 500.0, // Increased for visibility
                weaveFrequency: 1.0,
                maxHeight: 12000
            },
            
            // Light particles (Layer 3)
            light: {
                enabled: true,
                count: 800,  // Increased 4x
                color: 0xffff88,
                size: 300.0,  // Increased 10x more
                shape: 'circle',
                speed: 300.0,  // Faster
                acceleration: 30.0,  // Stronger
                deceleration: 0.99,
                fadeTime: 10.0,  // Longest lifetime
                glow: true,
                glitter: true,
                haze: true,
                opacity: 0.6,
                flowHeightMin: 3000, // Min height above ground
                flowHeightMax: 12000, // Max height (full building)
                twinkleSpeed: 2.0,
                twinkleIntensity: 0.5
            }
        };
    }
    
    // Initialize the particle system
    init() {
        if (!this.boundingBox) {
            console.warn('No bounding box provided for particle system');
            return;
        }
        
        this.createHeavyParticles();
        this.createMediumParticles();
        this.createLightParticles();
        
        console.log('Oscillating particle system initialized');
    }
    
    // Create heavy particles (Layer 1)
    createHeavyParticles() {
        const settings = this.settings.heavy;
        if (!settings.enabled) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const lifetimes = [];
        const initialPositions = [];
        
        const border = this.getBorderBounds();
        
        const maxHeight = settings.maxHeight || 12000;
        
        for (let i = 0; i < settings.count; i++) {
            // Random position along the border perimeter
            const pos = this.getRandomBorderPosition(border);
            // Spawn at random heights to cover full building
            pos.y = border.groundY + Math.random() * maxHeight;
            positions.push(pos.x, pos.y, pos.z);
            initialPositions.push(pos.x, pos.y, pos.z);
            
            // Initial velocity (upward with slight randomness)
            velocities.push(
                (Math.random() - 0.5) * 50,
                settings.speed * (0.8 + Math.random() * 0.4),
                (Math.random() - 0.5) * 50
            );
            
            // Random lifetime
            lifetimes.push(Math.random() * settings.fadeTime);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.Float32BufferAttribute(lifetimes, 1));
        geometry.setAttribute('initialPosition', new THREE.Float32BufferAttribute(initialPositions, 3));
        
        const material = this.createParticleMaterial(settings);
        
        this.heavyParticles = new THREE.Points(geometry, material);
        this.heavyParticles.frustumCulled = false;
        this.scene.add(this.heavyParticles);
    }
    
    // Create medium particles (Layer 2)
    createMediumParticles() {
        const settings = this.settings.medium;
        if (!settings.enabled) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const lifetimes = [];
        const initialPositions = [];
        const phases = []; // For weaving motion
        
        const border = this.getBorderBounds();
        
        const maxHeight = settings.maxHeight || 12000;
        
        for (let i = 0; i < settings.count; i++) {
            const pos = this.getRandomBorderPosition(border);
            // Spawn at random heights
            pos.y = border.groundY + Math.random() * maxHeight;
            positions.push(pos.x, pos.y, pos.z);
            initialPositions.push(pos.x, pos.y, pos.z);
            
            velocities.push(
                (Math.random() - 0.5) * 100,
                settings.speed * (0.8 + Math.random() * 0.4),
                (Math.random() - 0.5) * 100
            );
            
            lifetimes.push(Math.random() * settings.fadeTime);
            phases.push(Math.random() * Math.PI * 2); // Random phase for weaving
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.Float32BufferAttribute(lifetimes, 1));
        geometry.setAttribute('initialPosition', new THREE.Float32BufferAttribute(initialPositions, 3));
        geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
        
        const material = this.createParticleMaterial(settings);
        
        this.mediumParticles = new THREE.Points(geometry, material);
        this.mediumParticles.frustumCulled = false;
        this.scene.add(this.mediumParticles);
    }
    
    // Create light particles (Layer 3)
    createLightParticles() {
        const settings = this.settings.light;
        if (!settings.enabled) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const lifetimes = [];
        const initialPositions = [];
        const twinklePhases = [];
        
        const border = this.getBorderBounds();
        
        const minHeight = settings.flowHeightMin || 3000;
        const maxHeight = settings.flowHeightMax || 12000;
        
        for (let i = 0; i < settings.count; i++) {
            const pos = this.getRandomBorderPosition(border);
            // Spawn across upper height range
            pos.y = border.groundY + minHeight + Math.random() * (maxHeight - minHeight);
            positions.push(pos.x, pos.y, pos.z);
            initialPositions.push(pos.x, pos.y, pos.z);
            
            velocities.push(
                (Math.random() - 0.5) * 200,
                settings.speed * (0.5 + Math.random() * 0.5),
                (Math.random() - 0.5) * 200
            );
            
            lifetimes.push(Math.random() * settings.fadeTime);
            twinklePhases.push(Math.random() * Math.PI * 2);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.Float32BufferAttribute(lifetimes, 1));
        geometry.setAttribute('initialPosition', new THREE.Float32BufferAttribute(initialPositions, 3));
        geometry.setAttribute('twinklePhase', new THREE.Float32BufferAttribute(twinklePhases, 1));
        
        const material = this.createParticleMaterial(settings);
        
        this.lightParticles = new THREE.Points(geometry, material);
        this.lightParticles.frustumCulled = false;
        this.scene.add(this.lightParticles);
    }
    
    // Create particle material based on settings
    createParticleMaterial(settings) {
        const texture = this.createParticleTexture(settings.shape, settings.glitter);
        
        const material = new THREE.PointsMaterial({
            size: settings.size,
            color: settings.color,
            transparent: true,
            opacity: settings.opacity,
            map: texture,
            blending: settings.glow ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false,
            vertexColors: false,
            sizeAttenuation: true
        });
        
        return material;
    }
    
    // Create particle texture based on shape
    createParticleTexture(shape, glitter) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const centerX = 32;
        const centerY = 32;
        const radius = 28;
        
        // Create gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        
        switch (shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'square':
                ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
                break;
                
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - radius);
                ctx.lineTo(centerX + radius, centerY + radius);
                ctx.lineTo(centerX - radius, centerY + radius);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'star':
                this.drawStar(ctx, centerX, centerY, 5, radius, radius * 0.5);
                ctx.fill();
                break;
        }
        
        // Add glitter effect
        if (glitter) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * 64;
                const y = Math.random() * 64;
                const size = Math.random() * 2 + 1;
                ctx.fillRect(x, y, size, size);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    // Helper to draw star shape
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }
    
    // Get border bounds with spacing
    getBorderBounds() {
        const box = this.boundingBox;
        const spacing = this.settings.borderSpacing;
        
        return {
            minX: box.min.x - spacing,
            maxX: box.max.x + spacing,
            minZ: box.min.z - spacing,
            maxZ: box.max.z + spacing,
            groundY: box.min.y
        };
    }
    
    // Get random position within the entire border area (not just perimeter)
    getRandomBorderPosition(border) {
        const pos = new THREE.Vector3();
        
        pos.y = border.groundY;
        
        // Random position anywhere within the expanded bounding box
        pos.x = border.minX + Math.random() * (border.maxX - border.minX);
        pos.z = border.minZ + Math.random() * (border.maxZ - border.minZ);
        
        return pos;
    }
    
    // Update particle system
    update(deltaTime) {
        if (!this.enabled) return;
        
        this.time += deltaTime;
        
        if (this.heavyParticles && this.settings.heavy.enabled) {
            this.updateHeavyParticles(deltaTime);
        }
        
        if (this.mediumParticles && this.settings.medium.enabled) {
            this.updateMediumParticles(deltaTime);
        }
        
        if (this.lightParticles && this.settings.light.enabled) {
            this.updateLightParticles(deltaTime);
        }
    }
    
    // Update heavy particles
    updateHeavyParticles(deltaTime) {
        const geometry = this.heavyParticles.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const lifetimes = geometry.attributes.lifetime.array;
        const initialPositions = geometry.attributes.initialPosition.array;
        const settings = this.settings.heavy;
        const border = this.getBorderBounds();
        
        for (let i = 0; i < settings.count; i++) {
            const i3 = i * 3;
            
            // Update lifetime
            lifetimes[i] += deltaTime;
            
            // Reset if lifetime exceeded OR if too high
            const maxHeight = settings.maxHeight || 12000;
            if (lifetimes[i] > settings.fadeTime || positions[i3 + 1] > border.groundY + maxHeight) {
                lifetimes[i] = 0;
                const newPos = this.getRandomBorderPosition(border);
                newPos.y = border.groundY + Math.random() * maxHeight;
                positions[i3] = newPos.x;
                positions[i3 + 1] = newPos.y;
                positions[i3 + 2] = newPos.z;
                initialPositions[i3] = newPos.x;
                initialPositions[i3 + 1] = newPos.y;
                initialPositions[i3 + 2] = newPos.z;
                velocities[i3 + 1] = settings.speed * (0.8 + Math.random() * 0.4);
            }
            
            // Apply acceleration
            velocities[i3 + 1] += settings.acceleration * deltaTime;
            
            // Apply deceleration
            velocities[i3] *= settings.deceleration;
            velocities[i3 + 1] *= settings.deceleration;
            velocities[i3 + 2] *= settings.deceleration;
            
            // Update position
            positions[i3] += velocities[i3] * deltaTime;
            positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
            positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.lifetime.needsUpdate = true;
        
        // Update opacity based on lifetime
        this.updateParticleOpacity(this.heavyParticles, settings);
    }
    
    // Update medium particles with weaving
    updateMediumParticles(deltaTime) {
        const geometry = this.mediumParticles.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const lifetimes = geometry.attributes.lifetime.array;
        const initialPositions = geometry.attributes.initialPosition.array;
        const phases = geometry.attributes.phase.array;
        const settings = this.settings.medium;
        const border = this.getBorderBounds();
        
        for (let i = 0; i < settings.count; i++) {
            const i3 = i * 3;
            
            lifetimes[i] += deltaTime;
            
            const maxHeight = settings.maxHeight || 12000;
            if (lifetimes[i] > settings.fadeTime || positions[i3 + 1] > border.groundY + maxHeight) {
                lifetimes[i] = 0;
                const newPos = this.getRandomBorderPosition(border);
                newPos.y = border.groundY + Math.random() * maxHeight;
                positions[i3] = newPos.x;
                positions[i3 + 1] = newPos.y;
                positions[i3 + 2] = newPos.z;
                initialPositions[i3] = newPos.x;
                initialPositions[i3 + 1] = newPos.y;
                initialPositions[i3 + 2] = newPos.z;
                velocities[i3 + 1] = settings.speed * (0.8 + Math.random() * 0.4);
                phases[i] = Math.random() * Math.PI * 2;
            }
            
            velocities[i3 + 1] += settings.acceleration * deltaTime;
            velocities[i3] *= settings.deceleration;
            velocities[i3 + 1] *= settings.deceleration;
            velocities[i3 + 2] *= settings.deceleration;
            
            // Add weaving motion
            const weaveOffset = Math.sin(this.time * settings.weaveFrequency + phases[i]) * settings.weaveAmplitude;
            
            positions[i3] += velocities[i3] * deltaTime + weaveOffset * deltaTime;
            positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
            positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.lifetime.needsUpdate = true;
        
        this.updateParticleOpacity(this.mediumParticles, settings);
    }
    
    // Update light particles with twinkling
    updateLightParticles(deltaTime) {
        const geometry = this.lightParticles.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const lifetimes = geometry.attributes.lifetime.array;
        const initialPositions = geometry.attributes.initialPosition.array;
        const twinklePhases = geometry.attributes.twinklePhase.array;
        const settings = this.settings.light;
        const border = this.getBorderBounds();
        
        for (let i = 0; i < settings.count; i++) {
            const i3 = i * 3;
            
            lifetimes[i] += deltaTime;
            
            const minHeight = settings.flowHeightMin || 3000;
            const maxHeight = settings.flowHeightMax || 12000;
            
            if (lifetimes[i] > settings.fadeTime || positions[i3 + 1] > border.groundY + maxHeight) {
                lifetimes[i] = 0;
                const newPos = this.getRandomBorderPosition(border);
                newPos.y = border.groundY + minHeight + Math.random() * (maxHeight - minHeight);
                positions[i3] = newPos.x;
                positions[i3 + 1] = newPos.y;
                positions[i3 + 2] = newPos.z;
                initialPositions[i3] = newPos.x;
                initialPositions[i3 + 1] = newPos.y;
                initialPositions[i3 + 2] = newPos.z;
                velocities[i3 + 1] = settings.speed * (0.5 + Math.random() * 0.5);
                twinklePhases[i] = Math.random() * Math.PI * 2;
            }
            
            velocities[i3 + 1] += settings.acceleration * deltaTime;
            velocities[i3] *= settings.deceleration;
            velocities[i3 + 1] *= settings.deceleration;
            velocities[i3 + 2] *= settings.deceleration;
            
            positions[i3] += velocities[i3] * deltaTime;
            positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
            positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
            
            // Float within height range with variation
            const midHeight = (minHeight + maxHeight) / 2;
            const heightVariation = Math.sin(this.time * settings.twinkleSpeed + twinklePhases[i]) * 1000;
            const targetHeight = border.groundY + midHeight + heightVariation;
            // Gently pull towards target height
            positions[i3 + 1] = positions[i3 + 1] * 0.95 + targetHeight * 0.05;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.lifetime.needsUpdate = true;
        
        // Apply twinkling effect
        this.updateTwinkleOpacity(this.lightParticles, settings);
    }
    
    // Update particle opacity based on lifetime
    updateParticleOpacity(particleSystem, settings) {
        const material = particleSystem.material;
        const geometry = particleSystem.geometry;
        const lifetimes = geometry.attributes.lifetime.array;
        
        // Calculate average fade factor
        let totalFade = 0;
        for (let i = 0; i < lifetimes.length; i++) {
            const fade = 1 - Math.min(lifetimes[i] / settings.fadeTime, 1);
            totalFade += fade;
        }
        const avgFade = totalFade / lifetimes.length;
        
        material.opacity = settings.opacity * avgFade;
    }
    
    // Update twinkle opacity
    updateTwinkleOpacity(particleSystem, settings) {
        const material = particleSystem.material;
        const twinkle = Math.sin(this.time * settings.twinkleSpeed) * settings.twinkleIntensity;
        material.opacity = settings.opacity * (1 + twinkle);
    }
    
    // Enable/disable the system
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (this.heavyParticles) this.heavyParticles.visible = enabled && this.settings.heavy.enabled;
        if (this.mediumParticles) this.mediumParticles.visible = enabled && this.settings.medium.enabled;
        if (this.lightParticles) this.lightParticles.visible = enabled && this.settings.light.enabled;
    }
    
    // Update settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Recreate particles if needed
        if (this.enabled) {
            this.dispose();
            this.init();
            this.setEnabled(true);
        }
    }
    
    // Dispose of resources
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
    }
}

// Export for use in viewer3d.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OscillatingParticleSystem;
}
