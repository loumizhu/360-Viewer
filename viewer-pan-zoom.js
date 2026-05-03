/**
 * Lightweight Pan and Zoom component for the Plan Images
 */
class ImagePanZoom {
    constructor(viewerId, imageId) {
        this.viewer = document.getElementById(viewerId);
        this.img = document.getElementById(imageId);
        if (!this.viewer || !this.img) return;

        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;

        this.init();
    }

    init() {
        // Wheel to zoom
        this.viewer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta, e.clientX, e.clientY);
        }, { passive: false });

        // Prevent browser's default drag-and-drop behavior on the image
        this.img.addEventListener('dragstart', (e) => e.preventDefault());

        // Mouse events for pan
        this.viewer.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Left click only
            e.preventDefault(); // Prevents default browser behaviors like selecting text or dragging
            this.isDragging = true;
            this.startX = e.clientX - this.translateX;
            this.startY = e.clientY - this.translateY;
            this.viewer.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            this.translateX = e.clientX - this.startX;
            this.translateY = e.clientY - this.startY;
            this.applyTransform();
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.viewer.style.cursor = 'grab';
            }
        });

        // Touch events for mobile
        let lastTouchDist = 0;
        this.viewer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.startX = e.touches[0].clientX - this.translateX;
                this.startY = e.touches[0].clientY - this.translateY;
            } else if (e.touches.length === 2) {
                lastTouchDist = this.getTouchDist(e.touches);
            }
        });

        this.viewer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && this.isDragging) {
                this.translateX = e.touches[0].clientX - this.startX;
                this.translateY = e.touches[0].clientY - this.startY;
                this.applyTransform();
            } else if (e.touches.length === 2) {
                const dist = this.getTouchDist(e.touches);
                const delta = dist / lastTouchDist;
                lastTouchDist = dist;
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                this.zoom(delta, midX, midY);
            }
        }, { passive: false });

        this.viewer.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        // Public controls
        const btnIn = document.getElementById('zoom-in');
        const btnOut = document.getElementById('zoom-out');
        const btnReset = document.getElementById('zoom-reset');

        if (btnIn) btnIn.onclick = () => this.zoom(1.2);
        if (btnOut) btnOut.onclick = () => this.zoom(0.8);
        if (btnReset) btnReset.onclick = () => this.reset();

        // Auto-reset when image changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'src') {
                    this.reset();
                }
            });
        });
        observer.observe(this.img, { attributes: true });
    }

    getTouchDist(touches) {
        return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    }

    zoom(delta, centerX, centerY) {
        const rect = this.viewer.getBoundingClientRect();
        
        // If no centers provided, use middle of viewer
        if (centerX === undefined) centerX = rect.left + rect.width / 2;
        if (centerY === undefined) centerY = rect.top + rect.height / 2;

        const oldScale = this.scale;
        this.scale *= delta;
        
        // Clamp scale
        this.scale = Math.min(Math.max(this.scale, 0.5), 10);

        // Adjust translate to keep point under mouse
        const zoomPointX = (centerX - rect.left - this.translateX) / oldScale;
        const zoomPointY = (centerY - rect.top - this.translateY) / oldScale;
        
        this.translateX = centerX - rect.left - zoomPointX * this.scale;
        this.translateY = centerY - rect.top - zoomPointY * this.scale;

        this.applyTransform();
    }

    reset() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        
        // Center image
        if (this.img.complete) {
            this.centerImage();
        } else {
            this.img.onload = () => {
                this.centerImage();
                // Ensure the sync script's onload also runs
            }
        }
        
        this.applyTransform();
    }

    centerImage() {
        // Standard CSS flex centering handles this if scale is 1 and translate is 0,
        // but we'll ensure everything is zeroed out.
        this.translateX = 0;
        this.translateY = 0;
        this.applyTransform();
    }

    applyTransform() {
        // We use the parent viewport for coordinates, but transform the image
        this.img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        this.img.style.transformOrigin = '0 0';
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.planPanZoom = new ImagePanZoom('plan-image-viewport', 'plan-image');
});
