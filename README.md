# 360° Product Viewer

A simple, lightweight web-based 360° product rotation viewer - like those on e-commerce sites!

## Features

- ⚡ **Two-tier loading system** - Fast light images while dragging, HD on release
- 🔄 **Progressive preloading** - Shows first image instantly, loads others in background
- 🔍 **Zoom & Pan** - Scroll to zoom (up to 10x), drag to pan when zoomed
- 🎭 **3D Overlay** - GLB model overlaid on images with camera sync
- 🎯 **Interactive 3D Objects** - Hover to highlight objects in red with tooltip showing object name
- 📸 Cycles through 90 images smoothly
- 🖱️ Responsive mouse drag controls
- 📱 Touch support for mobile devices
- ⌨️ Keyboard navigation (Arrow keys, R to reset zoom)
- 🎨 Clean, fullscreen interface
- ♾️ Infinite rotation (wraps around)
- 📐 Responsive design
- 🎯 Smart priority loading - nearby images load first
- 🖼️ Canvas-based rendering with WebGL 3D overlay

## How to Use

### Step 1: Create Light Images (First Time Setup)

Before using the viewer, you need to create optimized "light" versions of your images:

1. Make sure Python is installed (download from [python.org](https://www.python.org/downloads/))
2. Install Pillow (image library):
```bash
pip install Pillow
```
3. **Double-click** `create-light-images.bat` (Windows) or run:
```bash
python create-light-images.py
```

This will create a `3D-Images/light/` folder with resized 2000px wide images (~80% smaller files).

### Step 2: Starting the Server

**⚠️ Important**: Due to browser security (CORS), you need to run a local web server. You cannot simply open `index.html` directly.

#### Method 1: Using the Provided Script (Easiest)
1. **Double-click** `start-server.bat` (Windows)
2. Your browser will automatically open, or manually go to: `http://localhost:8000`

#### Method 2: Using Python (if installed)
Open a terminal in this folder and run:
```bash
# Python 3
python server.py
```
Then open `http://localhost:8000` in your browser.

#### Method 3: Using Node.js/npx (if installed)
```bash
npx http-server -p 8000
```

#### Method 4: Using VS Code
1. Install the "Live Server" extension
2. Right-click `index.html` and select "Open with Live Server"

### Using the Viewer

1. **First load**:
   - Page shows first image instantly
   - Background preloading starts automatically
   - Nearby images load first (priority)
   - Then remaining images load progressively

2. **Rotate the product**:
   - **Desktop**: Click and drag left/right to spin the product
   - **Mobile**: Touch and swipe left/right to spin
   - **Keyboard**: Use Left/Right arrow keys
   - **Buttons**: Click "Previous" or "Next" at the bottom

3. **Zoom and Pan**:
   - **Scroll wheel**: Zoom in/out (zooms toward cursor position)
   - **Visual feedback**: Animated ripple with +/− shows where zoom happens
   - **When zoomed**: Click and drag to pan around
   - **Keyboard**: Press 'R' or 'Esc' to reset zoom
   - **Zoom range**: 1x to 10x magnification

4. **3D Overlay Interaction**:
   - **Automatic sync**: 3D camera switches match 2D image rotation
   - **Hover detection**: Objects turn red when you hover over them
   - **Transparent rendering**: 3D objects rendered semi-transparent
   - **90 cameras**: Each image has a corresponding 3D viewpoint

5. **How the two-tier system works**:
   - **While dragging**: Uses fast-loading light images (2000px)
   - **When you stop**: Automatically loads HD version after 300ms
   - You'll see "(HD)" indicator when full-res is shown
   - Drag right → rotates counter-clockwise (previous images)
   - Drag left → rotates clockwise (next images)
   - The rotation loops infinitely in both directions

## Technical Details

### Files Structure
- `index.html` - Main HTML page
- `style.css` - Styling and layout
- `viewer.js` - Core 2D viewer logic (pure JavaScript)
- `viewer3d.js` - 3D overlay manager (Three.js)
- `3D/` - Folder containing GLB 3D model
- `3D-Images/` - Folder containing full-res product images (90 frames)
- `3D-Images/light/` - Optimized light versions (auto-generated)
- `create-light-images.py` - Script to generate light images
- `create-light-images.bat` - Windows launcher for image generator
- `server.py` - Local web server (Python)
- `start-server.bat` - Quick start script (Windows)

### Technologies Used
- **Vanilla JavaScript** - No frameworks for 2D viewer
- **Three.js (r128)** - WebGL 3D rendering and GLB loading
- **CSS3** - Modern styling with glassmorphism effects
- **HTML5 Canvas** - Dual canvas setup (2D + 3D layers)

### How It Works
1. **Instant Start**: Loads and displays first light image immediately
2. **Progressive Preload**: Background loading starts automatically
   - Priority 1: Nearby images (10 before/after)
   - Priority 2: All remaining light images
   - Priority 3: Full-res HD images (when bandwidth available)
3. **Two-Tier Rendering**: 
   - Light images (2000px) for smooth dragging
   - Full-res images load when user stops dragging
4. **Canvas Rendering**: 
   - Hardware-accelerated canvas drawing (zero flashing)
   - Transform matrix for zoom and pan
   - Dual-layer canvas (2D image + 3D WebGL overlay)
5. **3D Integration**:
   - Three.js WebGL renderer with transparent background
   - GLB model loader with camera and mesh extraction
   - Raycasting for hover detection
   - Material switching (transparent ↔ red highlight)
   - Automatic camera sync with image rotation
6. **Smart Switching**: Tracks mouse/touch drag distance
7. **Zoom System**: 
   - Cursor-relative zooming (zooms toward mouse position)
   - Smooth pan with bounds
   - Context transforms for performance
8. **Infinite Loop**: Cycles seamlessly from last to first image

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Notes

- **Two image sets**: Full-res in `3D-Images/`, light versions in `3D-Images/light/`
- Light images are ~2000px wide, typically 70-80% smaller file size
- First image shows instantly, rest preload in background
- Page is usable immediately, no waiting for all images
- Images are named: `modif_animated (1).jpg` through `modif_animated (90).jpg`
- Works as static files - can be hosted anywhere
- Progressive loading means fast initial load even on slow connections

## Customization

### Viewer Behavior (`viewer.js`)
- **Drag sensitivity**: Change `this.sensitivity = 15;` (pixels to drag before switching image)
  - Lower = more sensitive (switches images faster)
  - Higher = less sensitive (need more drag to switch)
- **Zoom limits**: Change `this.minZoom = 1.0;` and `this.maxZoom = 10.0;`
- **Zoom speed**: Adjust `zoomFactor` (0.9 and 1.1) in `onWheel()` method
- **Full-res delay**: Change `setTimeout(..., 300)` in `onMouseUp()` (milliseconds)
- **Priority loading range**: Change `getSpiralOrder(this.currentImageIndex, 10)` (number of nearby images)
- **Image count**: Update `this.totalImages = 90;`
- **Rotation direction**: Swap `nextImage()` and `previousImage()` calls in `onMouseMove()`

### 3D Viewer Sync (`viewer3d.js` - CONFIG_3D)

**Zoom & Pan Alignment:**
- **Zoom**: Camera FOV is adjusted inversely to zoom level (lower FOV = more zoom)
- **Pan**: CSS transforms shift the canvas to match 2D viewer pan
- This hybrid approach provides close alignment between 2D and 3D viewers

**Camera Settings:**
- **CAMERA_NEAR_CLIP**: `0.00001` - Near clipping plane base value (objects closer are not rendered)
  - If objects still clip when zooming in, **decrease this** (try 0.000001)
  - Lower values = render objects closer to camera
- **CAMERA_FAR_CLIP**: `10000000` - Far clipping plane (objects farther are not rendered)
  - If distant objects disappear, **increase this** (try 20000000)
  - Higher values = render objects farther from camera
- **DYNAMIC_CLIPPING**: `true` - Automatically adjust clipping planes based on scene and zoom level
  - **Recommended: keep this enabled**
  - Dynamically calculates optimal near/far planes to prevent clipping at any zoom level
  - Near plane gets smaller as you zoom in to prevent clipping
  - Set to `false` to use fixed CAMERA_NEAR_CLIP and CAMERA_FAR_CLIP values
- **NEAR_CLIP_ZOOM_FACTOR**: `2.0` - How aggressively near plane reduces with zoom
  - `1.0` = linear reduction (near ÷ zoom)
  - `2.0` = squared reduction (near ÷ zoom²) - **default, works well for most scenes**
  - `3.0` = cubed reduction (near ÷ zoom³) - more aggressive if still clipping
  - Higher values = more aggressive near plane reduction when zoomed in

**Visual Settings:**
- **DEFAULT_OPACITY**: `0.0` - Default 3D object transparency (0.0 = invisible)
- **HOVER_OPACITY**: `0.75` - Opacity when hovering over objects (0.75 = 25% transparent)
- **HOVER_COLOR**: `0xff0000` - Hover highlight color (red)
- **AMBIENT_LIGHT_INTENSITY**: `1.5` - Overall scene brightness

**Tooltip Settings:**
- **SHOW_TOOLTIP**: `true` - Show tooltip with object name on hover
- **TOOLTIP_OFFSET_X**: `15` - Horizontal offset from cursor (pixels)
- **TOOLTIP_OFFSET_Y**: `15` - Vertical offset from cursor (pixels)
- **TOOLTIP_BG_COLOR**: `'rgba(0, 0, 0, 0.85)'` - Background color
- **TOOLTIP_TEXT_COLOR**: `'#ffffff'` - Text color
- **TOOLTIP_FONT_SIZE**: `'14px'` - Font size
- **TOOLTIP_PADDING**: `'8px 12px'` - Padding
- **TOOLTIP_BORDER_RADIUS**: `'6px'` - Border radius
- **TOOLTIP_MAX_WIDTH**: `'250px'` - Maximum width

**Debug:**
- **SHOW_ZOOM_PIVOT**: `false` - Show red crosshair at 3D zoom pivot (for debugging zoom alignment)
  - Red crosshair appears when zoomed, showing where 3D is zooming toward
  - Compare with 2D zoom ripple (+/−) to check alignment
  - Set to `false` to hide in production
- **ENABLE_CLIPPING_LOGGING**: `false` - Log camera clipping plane adjustments to console
  - Shows near/far plane values for each camera when switching or zooming
  - Useful for debugging clipping issues
  - Set to `true` to see clipping calculations

### Light Image Generation (`create-light-images.py`)
- **Target width**: Change `TARGET_WIDTH = 2000` (pixels)
- **JPEG quality**: Change `QUALITY = 85` (1-100)
  - 85 = Good balance of quality and size
  - 75 = Smaller files, slightly lower quality
  - 95 = Higher quality, larger files

## Performance Tips

### Full-Res Images (3D-Images/)
- Keep original high-quality images here (4K, 6K+)
- These load progressively in background
- Users only see them when they stop dragging

### Light Images (3D-Images/light/)
- Generated automatically by `create-light-images.py`
- Target: 2000px width, 85% JPEG quality
- These load first for immediate interaction
- Aim for 100-300KB per light image

### Overall
- Light images set should be < 20MB total (loads in ~5 seconds on 4G)
- Full-res images can be larger (background loading)
- First image shows in < 1 second
- Page is interactive immediately

## Creating Your Own Product Images

To create images for this viewer:
1. Take photos of your product from all angles (rotating in a circle)
2. Use consistent lighting and background
3. Take at least 36 photos for smooth rotation (more = smoother)
4. Name them sequentially: `modif_animated (1).jpg`, `modif_animated (2).jpg`, etc.
5. Place them in the `3D-Images/` folder

Enjoy spinning your products! 🎉

