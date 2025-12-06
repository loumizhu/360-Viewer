// Loader Integration Script
// This script patches the viewer to dispatch events for the page loader

(function() {
    'use strict';
    
    let firstImageShown = false;
    let viewer3dReady = false;
    
    // Wait for ProductViewer to be defined
    const checkViewer = setInterval(() => {
        if (typeof ProductViewer !== 'undefined') {
            clearInterval(checkViewer);
            patchViewer();
        }
    }, 100);
    
    // Wait for Viewer3D to be defined
    const checkViewer3D = setInterval(() => {
        if (typeof Viewer3D !== 'undefined') {
            clearInterval(checkViewer3D);
            patchViewer3D();
        }
    }, 100);
    
    function patchViewer() {
        // Patch the showImage method to dispatch firstImageLoaded event
        const originalShowImage = ProductViewer.prototype.showImage;
        
        ProductViewer.prototype.showImage = function(...args) {
            const result = originalShowImage.apply(this, args);
            
            if (!firstImageShown) {
                firstImageShown = true;
                console.log('[Loader] First image shown, dispatching event');
                window.dispatchEvent(new Event('firstImageLoaded'));
            }
            
            return result;
        };
    }
    
    function patchViewer3D() {
        // Patch the init method to dispatch viewer3dReady event
        const originalInit = Viewer3D.prototype.init;
        
        Viewer3D.prototype.init = async function(...args) {
            const result = await originalInit.apply(this, args);
            
            if (!viewer3dReady) {
                viewer3dReady = true;
                console.log('[Loader] 3D viewer ready, dispatching event');
                window.dispatchEvent(new Event('viewer3dReady'));
            }
            
            return result;
        };
    }
})();
