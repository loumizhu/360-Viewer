// SVG Glow Effect Methods (Insert into Viewer3D class)

// Add after applyScanEffect method:

applySVGGlowEffect(object) {
    if (!object.geometry) return;
    
    // Create invisible bounding box helper for tracking
    if (!object.userData.svgTrackerBox) {
        const alignedBox = this.createAlignedBoxHelper(object, 0x000000);
        alignedBox.visible = false;
        alignedBox.name = 'SVGTrackerBox';
        object.userData.svgTrackerBox = alignedBox;
    }
    
    // Show SVG path
    if (this.svgOutlinePath) {
        this.svgOutlinePath.style.visibility = 'visible';
        const color = '#' + new THREE.Color(CONFIG_3D.GLOW_COLOR !== undefined ? CONFIG_3D.GLOW_COLOR : CONFIG_3D.HOVER_COLOR).getHexString();
        this.svgOutlinePath.style.stroke = color;
        this.svgOutlinePath.style.filter = `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 10px ${color})`;
    }
}

updateSVGGlowEffect(object) {
    if (!object || !this.svgOutlinePath) return;
    
    // Calculate 8 corners of bounding box
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const min = object.geometry.boundingBox.min;
    const max = object.geometry.boundingBox.max;
    
    const corners = [
        new THREE.Vector3(min.x, min.y, min.z),
        new THREE.Vector3(max.x, min.y, min.z),
        new THREE.Vector3(max.x, min.y, max.z),
        new THREE.Vector3(min.x, min.y, max.z),
        new THREE.Vector3(min.x, max.y, min.z),
        new THREE.Vector3(max.x, max.y, min.z),
        new THREE.Vector3(max.x, max.y, max.z),
        new THREE.Vector3(min.x, max.y, max.z)
    ];
    
    // Transform to World Space
    object.updateMatrixWorld();
    corners.forEach(v => v.applyMatrix4(object.matrixWorld));
    
    // Project to Screen Space
    const screenPoints = corners.map(v => this.projectToScreen(v));
    
    // Build SVG path
    const p = screenPoints;
    const path = `
        M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y} L ${p[2].x} ${p[2].y} L ${p[3].x} ${p[3].y} Z
        M ${p[4].x} ${p[4].y} L ${p[5].x} ${p[5].y} L ${p[6].x} ${p[6].y} L ${p[7].x} ${p[7].y} Z
        M ${p[0].x} ${p[0].y} L ${p[4].x} ${p[4].y}
        M ${p[1].x} ${p[1].y} L ${p[5].x} ${p[5].y}
        M ${p[2].x} ${p[2].y} L ${p[6].x} ${p[6].y}
        M ${p[3].x} ${p[3].y} L ${p[7].x} ${p[7].y}
    `;
    
    this.svgOutlinePath.setAttribute('d', path);
}

projectToScreen(position) {
    const v = position.clone();
    v.project(this.currentCamera);
    
    const x = (v.x * 0.5 + 0.5) * this.canvas.clientWidth;
    const y = (-(v.y * 0.5) + 0.5) * this.canvas.clientHeight;
    
    return { x, y };
}

createSVGGlowControls(container) {
    // Reuse Glow controls
    const info = document.createElement('div');
    info.style.color = 'var(--ui-text-secondary)';
    info.style.fontSize = '12px';
    info.textContent = '(Uses Glow color settings)';
    container.appendChild(info);
}
