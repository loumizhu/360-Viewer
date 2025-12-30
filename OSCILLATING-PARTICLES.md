# Oscillating Particle System - Implementation Summary

## Overview
A sophisticated 3D particle system that mimics the Briggs-Rauscher oscillating reaction, featuring three distinct particle layers with extensive customization options.

## Files Created/Modified

### New Files:
1. **`oscillating-particles.js`** - Main particle system class with three particle layers

### Modified Files:
1. **`settings.json`** - Added oscillatingParticles configuration
2. **`index.html`** - Added script reference for oscillating-particles.js
3. **`viewer3d.js`** - Integrated particle system initialization and updates
4. **`settings.js`** - Fixed UI settings persistence (localStorage priority)

## Features

### Three Particle Layers:

#### 1. Heavy Particles (Layer 1)
- **Purpose**: Slow, heavy particles rising from the ground
- **Characteristics**:
  - Slower speed with gravity-like behavior
  - Larger size
  - Configurable glow and haze effects
  - Fades over time

#### 2. Medium Particles (Layer 2)
- **Purpose**: Faster particles with weaving motion
- **Characteristics**:
  - Faster upward movement
  - Weaving side-to-side motion (sine wave)
  - Configurable weave amplitude and frequency
  - Glitter effect option
  - More spaced out than heavy particles

#### 3. Light Particles (Layer 3)
- **Purpose**: Floating particles at upper level with twinkling
- **Characteristics**:
  - Flow at a specific height
  - Twinkling/pulsing opacity effect
  - Slowest movement
  - Smallest size
  - Creates ambient atmosphere

### Customizable Parameters

Each particle layer has the following tweakable parameters:

- **enabled**: Turn layer on/off
- **count**: Number of particles
- **color**: Particle color (hex number, e.g., 0x4488ff)
- **size**: Particle size in world units
- **shape**: 'circle', 'square', 'triangle', or 'star'
- **speed**: Base upward velocity
- **acceleration**: Upward acceleration rate
- **deceleration**: Velocity damping factor (0-1)
- **fadeTime**: Particle lifetime before respawn
- **glow**: Enable additive blending for glow effect
- **glitter**: Add sparkle texture to particles
- **haze**: Soft gradient edges
- **opacity**: Base opacity (0-1)

#### Layer-Specific Parameters:

**Medium Layer:**
- **weaveAmplitude**: How far particles weave side-to-side
- **weaveFrequency**: How fast they weave

**Light Layer:**
- **flowHeight**: Height at which particles flow
- **twinkleSpeed**: Speed of twinkling effect
- **twinkleIntensity**: Intensity of twinkling (0-1)

### Global Settings:
- **enabled**: Master on/off switch
- **borderSpacing**: Distance from 3D boxes (meters)

## Settings Storage

Settings are saved in **two locations**:

### 1. `settings.json` (Template/Default)
```json
{
  "effects": {
    "oscillatingParticles": {
      "enabled": false,
      "borderSpacing": 10,
      "heavy": { ... },
      "medium": { ... },
      "light": { ... }
    }
  }
}
```

### 2. Browser localStorage (User Preferences)
- Key: `viewerSettings`
- Automatically saved when changes are made via UI
- Takes priority over settings.json on page load
- Persists across browser sessions

## How It Works

### Initialization:
1. Particle system is created after 3D model loads
2. Bounding box of 3D scene is calculated
3. Particles spawn along the border perimeter (10m spacing by default)
4. Three separate particle systems are created (heavy, medium, light)

### Animation Loop:
1. Each frame, particles are updated based on:
   - Velocity and acceleration
   - Lifetime (particles respawn when lifetime expires)
   - Layer-specific effects (weaving, twinkling)
2. Particles move upward from ground level
3. When particles exceed their fadeTime, they respawn at ground level

### Particle Spawning:
- Particles spawn randomly along the 4 sides of the bounding box border
- Each side (front, right, back, left) has equal probability
- Ground level (Y position) is determined from the 3D model's bounding box

## Usage

### Enable/Disable via Console:
```javascript
// Enable the system
window.viewer3d.oscillatingParticles.setEnabled(true);

// Disable the system
window.viewer3d.oscillatingParticles.setEnabled(false);
```

### Update Settings via Console:
```javascript
// Change heavy particle color to red
window.viewer3d.oscillatingParticles.updateSettings({
  heavy: {
    color: 0xff0000,
    size: 1.0,
    speed: 3.0
  }
});
```

### Reset to File Defaults:
```javascript
// Clear localStorage and reload from settings.json
window.uiSettings.resetSettings();
```

## Next Steps (UI Controls)

To complete the feature, you'll need to add UI controls in the UI Settings Panel. This would include:

1. **Master Toggle**: Enable/disable oscillating particles
2. **Layer Toggles**: Enable/disable each layer individually
3. **Color Pickers**: For each layer's color
4. **Sliders**: For all numeric parameters (size, speed, count, etc.)
5. **Dropdowns**: For shape selection
6. **Checkboxes**: For glow, glitter, haze options

The UI controls would call `window.viewer3d.oscillatingParticles.updateSettings()` and save to localStorage via `window.uiSettings.saveSettings()`.

## Technical Details

### Performance Considerations:
- Particles use `THREE.Points` for efficient rendering
- Particle count is configurable (default: 500 heavy, 300 medium, 200 light)
- Uses BufferGeometry for optimal performance
- Additive blending for glow effects (no post-processing required)

### Coordinate System:
- Particles spawn at the bounding box border + spacing
- Y-axis is up (particles rise along Y)
- Ground level is determined from model's minimum Y coordinate

### Texture Generation:
- Particle textures are generated procedurally using Canvas 2D
- Shapes are drawn with radial gradients for soft edges
- Glitter is added as random white pixels

## Color Reference

Default colors (can be changed):
- **Heavy**: `0x4488ff` (Blue) - `4491519` in JSON
- **Medium**: `0x88ff44` (Green) - `8978244` in JSON  
- **Light**: `0xffff88` (Yellow) - `16777096` in JSON

To convert hex to decimal for JSON:
```javascript
parseInt('0x4488ff', 16) // Returns: 4491519
```

## Troubleshooting

### Particles not visible:
1. Check if enabled: `window.viewer3d.oscillatingParticles.enabled`
2. Check particle count > 0
3. Check opacity > 0
4. Check if camera is positioned to see the border area

### Particles not moving:
1. Check speed > 0
2. Check if update() is being called in animate loop
3. Check console for errors

### Performance issues:
1. Reduce particle count
2. Disable glow on some layers
3. Reduce particle size
4. Disable glitter effect

## Files Reference

- **Particle System**: `oscillating-particles.js`
- **Settings**: `settings.json` → `effects.oscillatingParticles`
- **Integration**: `viewer3d.js` → Constructor, loadGLB(), animate()
- **UI Script**: `index.html` → Script tag before viewer3d.js
