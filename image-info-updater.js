// Image Information Panel Updater
// Updates the UI Settings panel with real-time image information

(function() {
    'use strict';
    
    let updateInterval = null;
    
    // Wait for viewer and debug panel elements to be ready
    function initImageInfoPanel() {
        const viewer = window.productViewer || window.viewer;
        
        // Check if viewer exists
        if (!viewer || !viewer.totalImages) {
            setTimeout(initImageInfoPanel, 500);
            return;
        }
        
        // Check if debug panel elements exist (they might be created later by viewer3d)
        if (!document.getElementById('total-images-count')) {
            console.log('[ImageInfo] Waiting for debug panel elements...');
            setTimeout(initImageInfoPanel, 500);
            return;
        }
        
        console.log('[ImageInfo] Initializing image info panel');
        
        // Initial update
        updateImageInfo();
        
        // Update every second
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(updateImageInfo, 1000);
        
        // Update on image change (listen for custom events if available)
        if (viewer.canvas) {
            viewer.canvas.addEventListener('mouseup', () => {
                setTimeout(updateImageInfo, 100);
            });
        }
    }
    
    function updateImageInfo() {
        const viewer = window.productViewer || window.viewer;
        if (!viewer) return;
        
        // Update total images count
        updateElement('total-images-count', viewer.totalImages || 0);
        
        // Update current image index (1-based for display)
        updateElement('current-image-index', `${(viewer.currentImageIndex || 0) + 1} / ${viewer.totalImages || 0}`);
        
        // Count loaded images
        const lightLoaded = viewer.lightImageElements ? viewer.lightImageElements.filter(img => img).length : 0;
        const fullLoaded = viewer.fullImageElements ? viewer.fullImageElements.filter(img => img).length : 0;
        
        updateElement('light-images-loaded', `${lightLoaded} / ${viewer.totalImages || 0}`);
        updateElement('full-images-loaded', `${fullLoaded} / ${viewer.totalImages || 0}`);
        
        // Update current image details
        const currentIndex = viewer.currentImageIndex || 0;
        const currentImg = viewer.fullImageElements[currentIndex] || viewer.lightImageElements[currentIndex];
        
        if (currentImg && currentImg.complete) {
            // Resolution
            updateElement('current-image-resolution', `${currentImg.naturalWidth} × ${currentImg.naturalHeight}`);
            
            // Type (light or full)
            const isFullRes = viewer.fullImageElements[currentIndex] && viewer.useFullRes;
            updateElement('current-image-type', isFullRes ? 'Full Resolution' : 'Light');
            
            // Path
            const path = currentImg.src;
            const fileName = path.split('/').pop();
            updateElement('current-image-path', fileName, path);
            
            // Estimate file size (rough calculation based on dimensions)
            const pixels = currentImg.naturalWidth * currentImg.naturalHeight;
            const estimatedSize = formatFileSize(pixels * 3); // Rough estimate: 3 bytes per pixel
            updateElement('current-image-size', estimatedSize);
        } else {
            updateElement('current-image-resolution', 'Loading...');
            updateElement('current-image-type', '-');
            updateElement('current-image-path', '-');
            updateElement('current-image-size', '-');
        }
        
        // Update progress bars
        const lightProgress = viewer.totalImages > 0 ? (lightLoaded / viewer.totalImages * 100) : 0;
        const fullProgress = viewer.totalImages > 0 ? (fullLoaded / viewer.totalImages * 100) : 0;
        
        updateProgressBar('light-progress-bar', 'light-progress-text', lightProgress);
        updateProgressBar('full-progress-bar', 'full-progress-text', fullProgress);
    }
    
    function updateElement(id, value, title = null) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
            if (title) {
                el.title = title;
            }
        }
    }
    
    function updateProgressBar(barId, textId, percentage) {
        const bar = document.getElementById(barId);
        const text = document.getElementById(textId);
        
        if (bar) {
            bar.style.width = percentage + '%';
        }
        if (text) {
            text.textContent = Math.round(percentage) + '%';
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageInfoPanel);
    } else {
        initImageInfoPanel();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    });
})();
