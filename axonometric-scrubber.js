/**
 * Axonometric Scrub Image Viewer
 * ================================
 * Provides a scrub-to-rotate viewer for multi-frame axonometric sequences
 * displayed inside the 3D Plan panel.
 *
 * Design decisions vs. main ProductViewer (viewer.js):
 * ─────────────────────────────────────────────────────
 *  REUSED from ProductViewer:
 *   • `window.productViewer.sensitivity` — the pixels-per-frame threshold so
 *     the user's "Scrub Speed" setting in UI Settings applies here too.
 *   • The drag accumulator pattern (accumulate delta, fire when threshold
 *     crossed, carry the sub-threshold remainder forward) — identical algorithm.
 *   • Direction convention: drag RIGHT → previous frame, drag LEFT → next frame.
 *
 *  REUSED from ImagePanZoom (viewer-pan-zoom.js):
 *   • Zoom math — `window.planPanZoom.zoom(delta, cx, cy)` is called directly
 *     for mouse-wheel events so the same zoom behaviour applies. The existing
 *     +/−/⟲ buttons are re-bound while the scrubber is active.
 *   • `window.planPanZoom.reset()` is called on deactivate so the viewport
 *     is always clean when the regular plan image comes back.
 *
 *  NOT reused (intentional):
 *   • Canvas drawing — the panel uses <img> inside a positioned viewport div,
 *     not a full-screen canvas.
 *   • Two-tier image loading — axo frames are ~150 KB each. All frames are
 *     preloaded into Image objects for instant switching.
 */

(function () {
    'use strict';

    // ─── Internal state ────────────────────────────────────────────────────
    let _images        = [];
    let _imgCache      = [];
    let _currentIndex  = 0;
    let _isActive      = false;

    // Drag accumulator
    let _isDragging    = false;
    let _dragDistance  = 0;
    let _currentDragX  = 0;

    // DOM refs
    let _container  = null;   // absolute-fill overlay inside #plan-image-viewport
    let _imgEl      = null;   // the <img> that shows the current frame
    let _fillEl     = null;   // progress bar fill
    let _labelEl    = null;   // frame counter
    let _hintEl     = null;   // "drag to rotate" bubble

    // Saved zoom-button onclick handlers so we can restore them on deactivate
    let _savedBtnInClick    = null;
    let _savedBtnOutClick   = null;
    let _savedBtnResetClick = null;

    // ─── Sensitivity (shared with main viewer) ─────────────────────────────
    function _sensitivity() {
        return (window.productViewer && window.productViewer.sensitivity) || 15;
    }

    // ─── Public API ────────────────────────────────────────────────────────

    function activate(imageUrls) {
        if (!imageUrls || imageUrls.length === 0) return;

        _images       = imageUrls;
        _imgCache     = new Array(imageUrls.length).fill(null);
        _currentIndex = 0;
        _isActive     = true;
        _dragDistance = 0;

        _ensureDOM();
        _show();
        _showFrame(0);
        _preloadAll();
        _hookZoomButtons();
    }

    function deactivate() {
        if (!_isActive) return;
        _isActive     = false;
        _images       = [];
        _imgCache     = [];
        _dragDistance = 0;
        _isDragging   = false;
        _restoreZoomButtons();
        _hide();
        // Reset the viewport zoom/pan so the regular plan image comes back clean
        if (window.planPanZoom) window.planPanZoom.reset();
    }

    function isActive() { return _isActive; }

    // ─── DOM Bootstrap ─────────────────────────────────────────────────────

    function _ensureDOM() {
        _container = document.getElementById('axo-scrubber-container');

        if (_container) {
            _imgEl   = document.getElementById('axo-scrubber-img');
            _fillEl  = document.getElementById('axo-scrubber-fill');
            _labelEl = document.getElementById('axo-scrubber-label');
            _hintEl  = _container.querySelector('.axo-scrubber-hint');
            _rehideStandardElements();
            _refreshHint();
            return;
        }

        // The scrubber lives INSIDE #plan-image-viewport so it occupies
        // exactly the same space as #plan-image and benefits from the
        // viewport's position:relative / overflow:hidden styling.
        const viewport = document.getElementById('plan-image-viewport');
        if (!viewport) {
            console.warn('[AxoScrubber] #plan-image-viewport not found');
            return;
        }

        _rehideStandardElements();

        // ── Outer fill container ──
        _container = document.createElement('div');
        _container.id = 'axo-scrubber-container';
        _container.className = 'axo-scrubber-container';

        // ── The image that renders each frame ──
        _imgEl = document.createElement('img');
        _imgEl.id = 'axo-scrubber-img';
        _imgEl.alt = '3D Axonometric View';
        _imgEl.draggable = false;

        // ── Progress bar ──
        const track = document.createElement('div');
        track.className = 'axo-scrubber-progress-track';
        _fillEl = document.createElement('div');
        _fillEl.id = 'axo-scrubber-fill';
        _fillEl.className = 'axo-scrubber-fill';
        track.appendChild(_fillEl);

        // ── Frame counter ──
        _labelEl = document.createElement('div');
        _labelEl.id = 'axo-scrubber-label';
        _labelEl.className = 'axo-scrubber-label';

        // ── Drag hint bubble ──
        _hintEl = document.createElement('div');
        _hintEl.className = 'axo-scrubber-hint';
        _hintEl.innerHTML = `
            <span class="axo-hint-arrow">◀</span>
            <span class="axo-hint-text">Drag to rotate</span>
            <span class="axo-hint-arrow">▶</span>`;

        _container.appendChild(_imgEl);
        _container.appendChild(track);
        _container.appendChild(_labelEl);
        _container.appendChild(_hintEl);

        // Prepend so it sits beneath the image-loader-overlay (which is also in .plan-image-viewer)
        viewport.appendChild(_container);

        _attachDragEvents();
        _attachWheelZoom();
        _attachKeyEvents();

        setTimeout(() => { if (_hintEl) _hintEl.classList.add('axo-hint-fade'); }, 2500);
    }

    function _rehideStandardElements() {
        const planImg = document.getElementById('plan-image');
        const loader  = document.getElementById('image-loader-overlay');
        if (planImg) planImg.style.display = 'none';
        if (loader)  loader.classList.add('hidden');
    }

    function _refreshHint() {
        if (!_hintEl) return;
        _hintEl.classList.remove('axo-hint-fade');
        setTimeout(() => { if (_hintEl) _hintEl.classList.add('axo-hint-fade'); }, 2500);
    }

    // ─── Visibility ────────────────────────────────────────────────────────

    function _show() {
        if (_container) _container.style.display = 'flex';
    }

    function _hide() {
        if (_container) _container.style.display = 'none';
        const planImg = document.getElementById('plan-image');
        if (planImg) planImg.style.display = '';
    }

    // ─── Frame display ─────────────────────────────────────────────────────

    function _showFrame(index) {
        if (!_imgEl || _images.length === 0) return;

        _currentIndex = ((index % _images.length) + _images.length) % _images.length;

        const cached = _imgCache[_currentIndex];
        _imgEl.src = (cached && cached.complete && cached.naturalWidth > 0)
            ? cached.src
            : _images[_currentIndex];

        if (_fillEl) {
            const pct = (_currentIndex / Math.max(1, _images.length - 1)) * 100;
            _fillEl.style.width = pct + '%';
        }

        if (_labelEl) {
            _labelEl.textContent = `${_currentIndex + 1} / ${_images.length}`;
        }
    }

    function _stepBy(delta) { _showFrame(_currentIndex + delta); }

    // ─── Preloading ────────────────────────────────────────────────────────

    function _preloadAll() {
        _images.forEach((url, i) => {
            const img = new Image();
            img.onload = () => { _imgCache[i] = img; };
            img.src = url;
        });
    }

    // ─── Zoom — reuses ImagePanZoom from viewer-pan-zoom.js ───────────────
    //
    // The existing ImagePanZoom instance (window.planPanZoom) handles pan/zoom
    // of #plan-image by applying CSS transform to it. We need the same
    // behaviour on #axo-scrubber-img.
    //
    // Strategy: while the scrubber is active —
    //   1. Re-point planPanZoom.img to #axo-scrubber-img so its applyTransform()
    //      targets the right element.
    //   2. Re-bind the +/−/⟲ buttons to call planPanZoom.zoom() / .reset().
    //   3. The wheel handler is attached to the viewport (already handled by
    //      planPanZoom.init() via the viewer), so nothing extra is needed.
    //
    // On deactivate, img is restored to #plan-image and buttons are re-bound.
    //

    function _hookZoomButtons() {
        if (!window.planPanZoom) return;

        // Re-target the ImagePanZoom instance to our image
        window.planPanZoom.img = _imgEl;
        window.planPanZoom.reset();

        const btnIn    = document.getElementById('zoom-in');
        const btnOut   = document.getElementById('zoom-out');
        const btnReset = document.getElementById('zoom-reset');

        // Save originals
        _savedBtnInClick    = btnIn    ? btnIn.onclick    : null;
        _savedBtnOutClick   = btnOut   ? btnOut.onclick   : null;
        _savedBtnResetClick = btnReset ? btnReset.onclick : null;

        if (btnIn)    btnIn.onclick    = () => window.planPanZoom.zoom(1.2);
        if (btnOut)   btnOut.onclick   = () => window.planPanZoom.zoom(0.8);
        if (btnReset) btnReset.onclick = () => window.planPanZoom.reset();
    }

    function _restoreZoomButtons() {
        if (!window.planPanZoom) return;

        // Restore target to the original plan image
        const planImg = document.getElementById('plan-image');
        if (planImg) window.planPanZoom.img = planImg;

        const btnIn    = document.getElementById('zoom-in');
        const btnOut   = document.getElementById('zoom-out');
        const btnReset = document.getElementById('zoom-reset');

        if (btnIn)    btnIn.onclick    = _savedBtnInClick;
        if (btnOut)   btnOut.onclick   = _savedBtnOutClick;
        if (btnReset) btnReset.onclick = _savedBtnResetClick;
    }

    /**
     * The ImagePanZoom wheel listener is already bound to #plan-image-viewport
     * via viewer-pan-zoom.js. Since we re-point planPanZoom.img to _imgEl
     * (above), the existing wheel handler automatically zooms the right element.
     * We only need this extra listener to prevent the main viewer canvas from
     * consuming wheel events when the panel is open.
     */
    function _attachWheelZoom() {
        const viewport = document.getElementById('plan-image-viewport');
        if (!viewport) return;
        // The existing ImagePanZoom wheel listener handles everything.
        // No extra listener needed here — re-pointing planPanZoom.img is sufficient.
    }

    // ─── Drag events ───────────────────────────────────────────────────────

    function _attachDragEvents() {
        _container.removeEventListener('mousedown',  _onMouseDown);
        _container.removeEventListener('touchstart', _onTouchStart);
        window.removeEventListener('mousemove', _onMouseMove);
        window.removeEventListener('mouseup',   _onMouseUp);
        window.removeEventListener('touchmove', _onTouchMove);
        window.removeEventListener('touchend',  _onMouseUp);

        _container.addEventListener('mousedown',  _onMouseDown);
        _container.addEventListener('touchstart', _onTouchStart, { passive: true });
        window.addEventListener('mousemove', _onMouseMove);
        window.addEventListener('mouseup',   _onMouseUp);
        window.addEventListener('touchmove', _onTouchMove, { passive: true });
        window.addEventListener('touchend',  _onMouseUp);
    }

    function _onMouseDown(e) {
        if (!_isActive) return;
        if (e.button !== 0) return;
        _isDragging   = true;
        _dragDistance = 0;
        _currentDragX = e.clientX;
        _container.classList.add('axo-dragging');
        e.preventDefault();
        e.stopPropagation(); // prevent bubble to ImagePanZoom pan handler on viewport
    }

    function _onMouseMove(e) {
        if (!_isDragging || !_isActive) return;
        _processDelta(e.clientX);
    }

    function _onMouseUp() {
        if (!_isDragging) return;
        _isDragging   = false;
        _dragDistance = 0;
        if (_container) _container.classList.remove('axo-dragging');
    }

    function _onTouchStart(e) {
        if (!_isActive || !e.touches.length) return;
        _isDragging   = true;
        _dragDistance = 0;
        _currentDragX = e.touches[0].clientX;
        e.stopPropagation(); // prevent bubble to ImagePanZoom pan handler on viewport
    }

    function _onTouchMove(e) {
        if (!_isDragging || !_isActive || !e.touches.length) return;
        _processDelta(e.touches[0].clientX);
    }

    /**
     * Core scrub — mirrors ProductViewer.onMouseMove scrubbing section.
     * Accumulates delta, fires frame steps when sensitivity threshold is crossed,
     * carries remainder forward for smooth sub-pixel scrubbing feel.
     */
    function _processDelta(newX) {
        const deltaX   = newX - _currentDragX;
        _dragDistance += deltaX;
        _currentDragX  = newX;

        const sens = _sensitivity();

        if (Math.abs(_dragDistance) >= sens) {
            let frames = Math.floor(Math.abs(_dragDistance) / sens);
            frames = Math.min(frames, Math.max(1, Math.floor(_images.length / 2)));

            const direction = _dragDistance > 0 ? -1 : 1;
            const remainder = Math.abs(_dragDistance) - (frames * sens);
            _dragDistance   = _dragDistance > 0 ? remainder : -remainder;

            _stepBy(direction * frames);
        }
    }

    // ─── Keyboard navigation ───────────────────────────────────────────────

    let _keyListenerAttached = false;

    function _attachKeyEvents() {
        if (_keyListenerAttached) return;
        document.addEventListener('keydown', _onKeyDown);
        _keyListenerAttached = true;
    }

    function _onKeyDown(e) {
        if (!_isActive) return;
        const panel = document.getElementById('plan-image-panel');
        if (!panel || panel.classList.contains('hidden')) return;
        const activeTab = document.querySelector('.plan-tab.active');
        if (!activeTab || activeTab.dataset.tab !== '3d-plan') return;

        if (e.key === 'ArrowRight') {
            _stepBy(1);
            e.preventDefault();
            e.stopPropagation();
        } else if (e.key === 'ArrowLeft') {
            _stepBy(-1);
            e.preventDefault();
            e.stopPropagation();
        } else if (e.key === '+' || e.key === '=') {
            if (window.planPanZoom) window.planPanZoom.zoom(1.2);
            e.preventDefault();
        } else if (e.key === '-') {
            if (window.planPanZoom) window.planPanZoom.zoom(0.8);
            e.preventDefault();
        } else if (e.key === '0') {
            if (window.planPanZoom) window.planPanZoom.reset();
            e.preventDefault();
        }
    }

    // ─── Expose on window ──────────────────────────────────────────────────

    window.axoScrubber = { activate, deactivate, isActive };

})();
