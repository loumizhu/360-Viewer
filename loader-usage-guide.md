# 3D Cube Loader Animation - Usage Guide

Extracted from: https://scifi-buttons.netlify.app/style-8

## Files Included

1. **3d-cube-loader.html** - Standalone demo file
2. **3d-cube-loader.css** - CSS-only file for integration
3. **usage-guide.md** - This file

## Quick Start

### Option 1: Use the Standalone HTML File

Simply open `3d-cube-loader.html` in a browser to see the loader in action.

### Option 2: Integrate into Your Project

#### HTML Structure
Add this HTML to your page:

```html
<div class="loader">
    <div class="boxes">
        <div class="box">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <div class="box">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <div class="box">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <div class="box">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
</div>
```

#### CSS
Link the CSS file in your HTML:

```html
<link rel="stylesheet" href="3d-cube-loader.css">
```

Or copy the CSS directly into your stylesheet.

## Customization

### Change Colors
Modify the CSS variables in `.boxes .box > div`:

```css
.boxes .box > div:nth-child(1) {
    --background: #0bb3b3; /* Change this to your color */
}

.boxes .box > div:nth-child(2) {
    --background: rgb(7, 125, 125); /* Darker shade */
}

.boxes .box > div:nth-child(3) {
    --background: rgb(59, 194, 194); /* Lighter shade */
}
```

### Change Size
Modify the `--size` variable in `.boxes`:

```css
.boxes {
    --size: 32px; /* Change to 48px for larger, 24px for smaller */
}
```

### Change Speed
Modify the `--duration` variable in `.boxes`:

```css
.boxes {
    --duration: 800ms; /* Change to 1200ms for slower, 500ms for faster */
}
```

### Change Background Color
Modify the background in `.loader`:

```css
.loader {
    background: #17141d; /* Change to your preferred background */
}
```

## Hide/Show the Loader with JavaScript

### Hide after page load:

```javascript
window.addEventListener('load', function() {
    const loader = document.querySelector('.loader');
    loader.classList.add('fade-out');
    
    // Remove from DOM after fade-out animation
    setTimeout(() => {
        loader.style.display = 'none';
    }, 500);
});
```

### Show loader programmatically:

```javascript
function showLoader() {
    const loader = document.querySelector('.loader');
    loader.style.display = 'flex';
    loader.classList.remove('fade-out');
}

function hideLoader() {
    const loader = document.querySelector('.loader');
    loader.classList.add('fade-out');
    setTimeout(() => {
        loader.style.display = 'none';
    }, 500);
}
```

### Use with async operations:

```javascript
async function loadData() {
    showLoader();
    
    try {
        const response = await fetch('your-api-endpoint');
        const data = await response.json();
        // Process your data
    } catch (error) {
        console.error('Error:', error);
    } finally {
        hideLoader();
    }
}
```

## Integration Examples

### For Your 360 Viewer
Add to your `index.html` before the closing `</body>` tag, and hide it once images are loaded:

```javascript
// In your viewer.js
function initViewer() {
    showLoader();
    
    // Your existing image loading code
    loadImages().then(() => {
        hideLoader();
    });
}
```

### As a Page Preloader
Place the loader HTML at the top of your `<body>` tag and hide it when everything is ready:

```javascript
window.addEventListener('load', function() {
    hideLoader();
});
```

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)
- ⚠️ IE11 (requires prefixes, not recommended)

## Features

- ✨ Pure CSS animation (no JavaScript required for animation)
- 🎨 Fully customizable colors, size, and speed
- 📱 Responsive and works on all screen sizes
- 🚀 Lightweight (< 2KB CSS)
- ♿ Accessible (can be hidden from screen readers when not active)

## Notes

- The loader uses 3D transforms, so it requires a browser with CSS 3D transform support
- The animation is GPU-accelerated for smooth performance
- The loader covers the entire viewport by default (position: fixed)
