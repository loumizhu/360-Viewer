/**
 * Unit Database Sync
 * Synchronizes Supabase data with the UI elements in the viewer
 */

(function() {
    'use strict';

    let clientManifest = null;

    async function loadClientManifest(forcedClientId = null) {
        try {
            const repoBase = typeof getRepoBasePath === 'function' ? getRepoBasePath() : '/';
            const clientId = forcedClientId || getClientID();
            if (clientId) {
                // If already loaded for this clientId, skip loading again
                if (clientManifest && clientManifest.clientId === clientId) {
                    return;
                }
                const manifestPath = `${repoBase}${clientId}/image-manifest.json`.replace(/\/+/g, '/');
                console.log(`[Sync] Fetching client manifest from: ${manifestPath}`);
                const response = await fetch(manifestPath);
                if (response.ok) {
                    clientManifest = await response.json();
                    clientManifest.clientId = clientId;
                    window.clientManifest = clientManifest;
                    console.log('[Sync] Successfully loaded client manifest:', clientManifest);
                    
                    // Rebuild the manifest file set for O(1) checks
                    if (typeof window.updateManifestFilesSet === 'function') {
                        window.updateManifestFilesSet();
                    }
                } else {
                    console.warn('[Sync] Manifest fetch failed with status:', response.status);
                }
            }
        } catch (e) {
            console.warn('[Sync] Failed to load client manifest:', e);
        }
    }

    async function scanPhotosFolder(folderPath) {
        if (!folderPath) return [];

        const cleanFolderPath = folderPath.replace(/\/$/, '');

        // --- 1. USE COMPREHENSIVE MANIFEST IF AVAILABLE ---
        if (clientManifest && clientManifest.photos) {
            const unitNum = cleanFolderPath.substring(cleanFolderPath.lastIndexOf('/') + 1);
            if (clientManifest.photos[unitNum]) {
                const repoBase = typeof getRepoBasePath === 'function' ? getRepoBasePath() : '/';
                return clientManifest.photos[unitNum].map(p => {
                    let path = p;
                    if (path.startsWith('/') && !path.startsWith('http') && !path.startsWith(repoBase)) {
                        path = (repoBase + path).replace(/\/+/g, '/');
                    } else if (!path.startsWith('/') && !path.startsWith('http')) {
                        path = (repoBase + '/' + path).replace(/\/+/g, '/');
                    }
                    return path;
                });
            }
        }

        try {
            const repoBase = typeof getRepoBasePath === 'function' ? getRepoBasePath() : '/';
            
            // Format path with repository base path for standard hosting
            let fetchPath = cleanFolderPath;
            if (fetchPath.startsWith('/') && !fetchPath.startsWith('http') && !fetchPath.startsWith(repoBase)) {
                fetchPath = (repoBase + fetchPath).replace(/\/+/g, '/');
            }
            
            const response = await fetch(fetchPath + '/?json=1');
            if (response.ok) {
                const files = await response.json();
                
                // Filter for images and sort, ensuring output paths contain repoBase
                const images = files
                    .filter(f => f.type === 'file' && f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
                    .map(f => {
                        const fullPath = cleanFolderPath + '/' + f.name;
                        if (fullPath.startsWith('/') && !fullPath.startsWith('http') && !fullPath.startsWith(repoBase)) {
                            return (repoBase + fullPath).replace(/\/+/g, '/');
                        }
                        return fullPath;
                    })
                    .sort();
                return images;
            }
        } catch (e) {
            console.warn('[Sync] Failed to scan photos folder via server listing:', folderPath, e);
        }

        // --- STATIC PROBING FALLBACK ---
        // On static hosts (GitHub Pages), manifest is authoritative — skip probing
        if (window.location.hostname.includes('.github.io')) {
            return [];
        }

        // Probe standard photo patterns concurrently (Template01.jpg - Template08.jpg, 1.jpg - 8.jpg)
        const possiblePatterns = [];
        for (let i = 1; i <= 8; i++) {
            possiblePatterns.push(`Template0${i}.jpg`);
            possiblePatterns.push(`Template${i}.jpg`);
            possiblePatterns.push(`${i}.jpg`);
        }

        const probePromises = possiblePatterns.map(async (fileName) => {
            const rawPath = `${cleanFolderPath}/${fileName}`;
            const repoBase = typeof getRepoBasePath === 'function' ? getRepoBasePath() : '/';
            let testPath = rawPath;
            if (testPath.startsWith('/') && !testPath.startsWith('http') && !testPath.startsWith(repoBase)) {
                testPath = (repoBase + testPath).replace(/\/+/g, '/');
            }
            const exists = await testImageExists(testPath, 350);
            return exists ? testPath : null;
        });

        const results = await Promise.all(probePromises);
        return results.filter(p => p !== null).sort();
    }

    /**
     * Scan a 3D-Plans unit subfolder (e.g. /CLT695425/3D-Plans/A003/)
     * for a sequence of images.  Returns a sorted array of URLs or [] if the
     * folder does not exist / contains no images.
     */
    async function scanAxoFolder(folderPath) {
        if (!folderPath) return [];

        const cleanFolderPath = folderPath.replace(/\/$/, '');

        // --- 1. USE COMPREHENSIVE MANIFEST IF AVAILABLE ---
        if (clientManifest && clientManifest.plans_3d) {
            const unitNum = cleanFolderPath.substring(cleanFolderPath.lastIndexOf('/') + 1);
            if (clientManifest.plans_3d[unitNum]) {
                const repoBase = typeof getRepoBasePath === 'function' ? getRepoBasePath() : '/';
                return clientManifest.plans_3d[unitNum].map(p => {
                    let path = p;
                    if (path.startsWith('/') && !path.startsWith('http') && !path.startsWith(repoBase)) {
                        path = (repoBase + path).replace(/\/+/g, '/');
                    } else if (!path.startsWith('/') && !path.startsWith('http')) {
                        path = (repoBase + '/' + path).replace(/\/+/g, '/');
                    }
                    return path;
                });
            }
        }

        try {
            const repoBase = typeof getRepoBasePath === 'function' ? getRepoBasePath() : '/';
            
            // Format path with repository base path for standard hosting
            let fetchPath = cleanFolderPath;
            if (fetchPath.startsWith('/') && !fetchPath.startsWith('http') && !fetchPath.startsWith(repoBase)) {
                fetchPath = (repoBase + fetchPath).replace(/\/+/g, '/');
            }
            
            const response = await fetch(fetchPath + '/?json=1');
            if (response.ok) {
                const files = await response.json();
                
                // Ensure output paths contain repoBase
                const images = files
                    .filter(f => f.type === 'file' && f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
                    .map(f => {
                        const fullPath = cleanFolderPath + '/' + f.name;
                        if (fullPath.startsWith('/') && !fullPath.startsWith('http') && !fullPath.startsWith(repoBase)) {
                            return (repoBase + fullPath).replace(/\/+/g, '/');
                        }
                        return fullPath;
                    })
                    .sort();
                return images;
            }
        } catch (e) {
            // Ignore and fall through to static fallback
        }

        // --- STATIC PROBING FALLBACK ---
        // On static hosts (GitHub Pages), manifest is authoritative — skip probing
        if (window.location.hostname.includes('.github.io')) {
            return [];
        }

        // Probe sequence frames 0000 to 0039 concurrently (local dev only)
        const unitNum = cleanFolderPath.substring(cleanFolderPath.lastIndexOf('/') + 1);
        const possiblePatterns = [];
        for (let i = 0; i <= 39; i++) {
            const frameNumStr = String(i).padStart(4, '0');
            possiblePatterns.push(`${unitNum}_${frameNumStr}.jpg`);
        }

        const probePromises = possiblePatterns.map(async (fileName) => {
            const rawPath = `${cleanFolderPath}/${fileName}`;
            const repoBase = typeof getRepoBasePath === 'function' ? getRepoBasePath() : '/';
            let testPath = rawPath;
            if (testPath.startsWith('/') && !testPath.startsWith('http') && !testPath.startsWith(repoBase)) {
                testPath = (repoBase + testPath).replace(/\/+/g, '/');
            }
            const exists = await testImageExists(testPath, 350);
            return exists ? testPath : null;
        });

        const results = await Promise.all(probePromises);
        return results.filter(p => p !== null).sort();
    }

    function updateGalleryStrip(mode, galleryPhotos, currentSrc) {
        const galleryStrip = document.getElementById('photo-gallery-strip');
        if (!galleryStrip) return;

        if (mode === 'photos' && galleryPhotos && galleryPhotos.length > 1) {
            galleryStrip.innerHTML = '';
            galleryPhotos.forEach(photoUrl => {
                const thumb = document.createElement('div');
                thumb.className = 'gallery-thumb';
                if (photoUrl === currentSrc) thumb.classList.add('active');
                
                const img = document.createElement('img');
                img.src = photoUrl;
                thumb.appendChild(img);
                
                thumb.onclick = (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    
                    const planImg = document.getElementById('plan-image');
                    const loader = document.getElementById('image-loader-overlay');
                    
                    // Load new image
                    const preload = new Image();
                    if (loader) loader.classList.remove('hidden');
                    preload.onload = () => {
                        if (planImg) planImg.src = preload.src;
                        if (loader) loader.classList.add('hidden');
                    };
                    preload.onerror = () => {
                        if (loader) loader.classList.add('hidden');
                    };
                    preload.src = photoUrl + '?t=' + new Date().getTime();
                };
                
                galleryStrip.appendChild(thumb);
            });
            galleryStrip.classList.remove('hidden');
        } else {
            galleryStrip.classList.add('hidden');
        }
    }

    async function syncUnitInfo() {
        // 1. Get clientID from URL (this is our primary key/identifier)
        const urlParams = new URLSearchParams(window.location.search);
        const clientID = urlParams.get('clientID');

        if (!clientID) {
            console.log('[Sync] No clientID found in URL, skipping database sync.');
            return;
        }

        console.log(`[Sync] Attempting to sync info for unit: ${clientID}`);

        // 2. Fetch data from Supabase
        // We assume the 'units' table has a column 'ClientID' (PascalCase) based on schema inspection
        try {
            const { data, error } = await window.AppData.client
                .from('Units')
                .select('*')
                .eq('ClientID', clientID) // Use exact match on ClientID only
                .single();


            if (error) {
                console.warn('[Sync] Unit not found in database or error:', error.message);
                return;
            }

            if (data) {
                console.log('[Sync] Data found:', data);
                await updateUI(data);
            }
        } catch (err) {
            console.error('[Sync] Error during fetch:', err);
        }
    }

    async function updateUI(unit) {
        // Ensure manifest is loaded for this unit's client
        const clientId = unit['ClientID'] || unit['client_id'] || 'CLT695425';
        if (!clientManifest || clientManifest.clientId !== clientId) {
            console.log(`[Sync] Manifest missing or for wrong client. Dynamically loading manifest for client: ${clientId}`);
            await loadClientManifest(clientId);
        }

        // Detect the unit identifier column dynamically from the data keys
        // if 'unit_number' is missing.
        let unitCol = 'Unit Number'; // Try the most likely key first (from logs)
        if (unit[unitCol] === undefined) {
             const candidates = ['unit_number', 'unit', 'name', 'unit_name', 'code', 'title', 'ID'];
             for (const c of candidates) {
                 if (unit[c] !== undefined) {
                     unitCol = c;
                     break;
                 }
             }
        }
        
        console.log('[Sync] updateUI called with:', unit);
        console.log('[Sync] Keys available:', Object.keys(unit));

        // Update text elements
        // Mapping database columns to UI element IDs
        // Data keys come from Supabase with spaces (e.g. "Interior Area")
        const mapping = {
            // [unitCol]: 'unit-value', // Handled separately
            'Interior Area': 'surface-interior-value',
            'Balcony Area': 'surface-exterior-value', // Check strictly for 'Balcony Area' first
            'Terrace Area': 'terrace-value',          
            'Sub-type': 'type-value',                 
            'Bedrooms': 'rooms-value',                
            'Orientation': 'orientation-value'
        };

        // Update basic text fields
        for (const [column, elementId] of Object.entries(mapping)) {
            const el = document.getElementById(elementId);
            if (el) {
                // Try exact match
                let val = unit[column];
                
                // --- FALLBACK LOGIC ---
                // If primary mapping failed, try alternatives based on likely DB variations
                
                if (elementId === 'surface-exterior-value' && (val === undefined || val === null || val === '')) {
                     // Try explicit "Surface Exterior" or fallback to terrace if balcony missing
                     val = unit['Surface Exterior'] || unit['Exterior Area'] || unit['Terrace Area'];
                }
                
                if (elementId === 'terrace-value' && (val === undefined || val === null || val === '')) {
                    val = unit['Terrace'];
                }

                if (elementId === 'type-value' && (val === undefined || val === null || val === '')) {
                    // Try 'Property Type', 'Type', 'Asset Class'
                    val = unit['Property Type'] || unit['Type'] || unit['Asset Class'];
                }
                
                if (elementId === 'rooms-value' && (val === undefined || val === null || val === '')) {
                    // Try 'Number of Rooms', 'Rooms'
                    val = unit['Number of Rooms'] || unit['Rooms'];
                }
                
                if (val !== undefined && val !== null && val !== '') {
                    el.textContent = val;
                    el.classList.add('synced-value');
                } else {
                    el.textContent = '-';
                }
            }
        }


        // Handle Unit Selection Dropdown
        const unitEl = document.getElementById('unit-value');
        if (unitEl) {
            // If it's still a span, convert to select or use existing select
            // We want to make it interactive.
            if (unitEl.tagName === 'SPAN') {
                const select = document.createElement('select');
                select.id = 'unit-value';
                select.className = 'unit-selector'; // Add styles for this class
                
                // Force white text and dark background with !important
                select.style.setProperty('padding', '4px 8px', 'important');
                select.style.setProperty('border-radius', '4px', 'important');
                select.style.setProperty('border', '1px solid #444', 'important');
                select.style.setProperty('background-color', '#222', 'important');
                select.style.setProperty('color', '#ffffff', 'important');
                select.style.setProperty('font-size', '14px', 'important');
                select.style.cursor = 'pointer';
                
                // Add default option
                const opt = document.createElement('option');
                opt.value = unit[unitCol];
                opt.textContent = unit[unitCol];
                select.appendChild(opt);
                
                unitEl.parentNode.replaceChild(select, unitEl);
                
                // Fetch all units to populate dropdown if not done
                // This is async, will populate later
                populateUnitDropdown(select, unit[unitCol]);
                
                // Listen for changes
                select.addEventListener('change', (e) => {
                    const newUnitId = e.target.value;
                    handleUnitSelection(newUnitId);
                });
            } else if (unitEl.tagName === 'SELECT') {
                // Ensure text is visible even if CSS is messed up elsewhere
                unitEl.style.setProperty('color', '#ffffff', 'important');
                unitEl.style.setProperty('background-color', '#222', 'important');
                
                unitEl.value = unit[unitCol];
                // Ensure the current unit is in the list
                if (unitEl.selectedIndex === -1) {
                     const opt = document.createElement('option');
                     opt.value = unit[unitCol];
                     opt.textContent = unit[unitCol];
                     unitEl.appendChild(opt);
                     unitEl.value = unit[unitCol];
                }
            }
        }

        // Show all surfaces logic (composite)
        // ALL SURFACES are handled by the generic mapping loop above

        // Handle Plan Images (2D & 3D)
        // Handle Plan Images (2D & 3D)
        const plan2DKeys = ['2D Plan Link', '2d_plan_link', 'plan_link', 'Plan Image', '2D Plan'];
        const plan3DKeys = ['3D Plan Link', '3d_plan_link', '3d_plan', '3D Plan', '3D / Axonometric Link'];
        
        // Helper to find key
        const getVal = (keys) => {
            for (const k of keys) { if (unit[k]) return unit[k]; }
            return null;
        };
        
        let link2D = getVal(plan2DKeys);
        let link3D = getVal(plan3DKeys);

        // --- PHOTOS DETECTION ---
        const photoKeys = ['Photos', 'Images', 'Unit Photos', 'photo_link', 'photos', 'Unit Image'];
        let linkPhotos = getVal(photoKeys);

        // --- IMAGE FALLBACK LOGIC ---
        // If DB links are missing, construct them from convention: /ClientID/Plan 2D/UnitNumber.png
        // clientId is already defined at the start of updateUI
        const uNum = unit[unitCol];

        // Also check if the 3D-Plans subfolder (sequence mode) exists
        let axoSequenceImages = [];
        if (uNum) {
            const axoSubFolder = `/${clientId}/3D-Plans/${uNum}`;
            axoSequenceImages = await scanAxoFolder(axoSubFolder);
        }

        if (clientManifest) {
            // Priority 1: Use exact matches from manifest to avoid speculative 404s
            if (!link2D && uNum && clientManifest.plans_2d && clientManifest.plans_2d[uNum]) {
                link2D = clientManifest.plans_2d[uNum];
            }
            if (!link3D && uNum) {
                if (axoSequenceImages.length > 0) {
                    link3D = axoSequenceImages[0];
                } else if (clientManifest.plans_3d_static && clientManifest.plans_3d_static[uNum]) {
                    link3D = clientManifest.plans_3d_static[uNum];
                }
            }
            if (!linkPhotos && uNum && clientManifest.photos && clientManifest.photos[uNum] && clientManifest.photos[uNum].length > 0) {
                linkPhotos = clientManifest.photos[uNum][0];
            }
        } else {
            // Fallback discovery ONLY if manifest is NOT available (old behavior / backward compatibility)
            if (!link2D && uNum) {
                link2D = `/${clientId}/2D-Plans/${uNum}.jpg`;
            }
            if (!link3D && uNum) {
                if (axoSequenceImages.length > 0) {
                    // Sequence detected — use the first frame as the static fallback URL
                    // (the scrubber will replace the <img> entirely)
                    link3D = axoSequenceImages[0];
                } else {
                    // No subfolder — fall back to a single axonometric image
                    link3D = await resolveWorkingImagePath(`/${clientId}/3D-Plans/${uNum}.jpg`) ||
                             await resolveWorkingImagePath(`/${clientId}/Plan 3D/${uNum}.jpg`);
                }
            }
            if (!linkPhotos && uNum) {
                // Try inside the unit's folder in Photos. Prioritize an image with the unit name,
                // then check Template01.png directly to prevent .jpg 404 errors in the console.
                linkPhotos = await resolveWorkingImagePath(`/${clientId}/Photos/${uNum}/${uNum}.jpg`) || 
                             await resolveWorkingImagePath(`/${clientId}/Photos/${uNum}/Template01.png`) ||
                             await resolveWorkingImagePath(`/${clientId}/Photos/${uNum}/1.jpg`);
            }
        }

        // Robust Image Resolution
        if (link2D) link2D = await resolveWorkingImagePath(link2D);
        if (link3D) link3D = await resolveWorkingImagePath(link3D);
        if (linkPhotos) linkPhotos = await resolveWorkingImagePath(linkPhotos);

        // Fetch additional photos for gallery
        let galleryPhotos = [];
        if (uNum) {
            const folderPath = `/${clientId}/Photos/${uNum}`;
            galleryPhotos = await scanPhotosFolder(folderPath);
        }
        
        console.log('[UI] Plan Links:', { '2D': link2D, '3D': link3D, 'Photos': linkPhotos, 'Gallery': galleryPhotos });

        const planImg = document.getElementById('plan-image');
        
        // Tab elements
        const btn2D = document.querySelector('.plan-tab[data-tab="2d-plan"]');
        const btn3D = document.querySelector('.plan-tab[data-tab="3d-plan"]');
        const btnPhotos = document.querySelector('.plan-tab[data-tab="photos"]');
        
        const has2D = !!link2D;
        const has3D = !!link3D;
        const hasPhotos = !!linkPhotos; 
        
        // Hide/show tabs based on availability
        if (btn2D) btn2D.style.display = has2D ? '' : 'none';
        if (btn3D) btn3D.style.display = has3D ? '' : 'none';
        if (btnPhotos) btnPhotos.style.display = hasPhotos ? '' : 'none';
        
        // Auto-switch tab if current is hidden
        let activeTab = document.querySelector('.plan-tab.active');
        if (activeTab && activeTab.style.display === 'none') {
            activeTab.classList.remove('active');
            activeTab = null;
        }
        
        if (!activeTab) {
            if (has2D && btn2D) {
                btn2D.classList.add('active');
                activeTab = btn2D;
            } else if (has3D && btn3D) {
                btn3D.classList.add('active');
                activeTab = btn3D;
            } else if (hasPhotos && btnPhotos) {
                btnPhotos.classList.add('active');
                activeTab = btnPhotos;
            }
        }

        if (planImg) {
            // Save links to dataset for tab switching
            planImg.setAttribute('data-link2d', link2D || '');
            planImg.setAttribute('data-link3d', link3D || '');
            planImg.setAttribute('data-linkphotos', linkPhotos || '');
            planImg.setAttribute('data-gallery', JSON.stringify(galleryPhotos));

            // Save axonometric sequence (may be empty [] for single-image units)
            planImg.setAttribute('data-axo-sequence', JSON.stringify(axoSequenceImages));
            
            // Determine which tab is active newly
            const mode = activeTab ? activeTab.dataset.tab : 'none';

            // Always deactivate scrubber before deciding what to show
            if (window.axoScrubber) window.axoScrubber.deactivate();

            // Set source based on active tab
            let targetSrc = '';
            if (mode === '3d-plan') targetSrc = link3D;
            else if (mode === '2d-plan') targetSrc = link2D;
            else if (mode === 'photos') targetSrc = linkPhotos;

            // If landing on 3D plan tab and we have a sequence → activate scrubber
            if (mode === '3d-plan' && axoSequenceImages.length > 0) {
                console.log(`[Axo] Activating scrubber with ${axoSequenceImages.length} frames for ${uNum}`);
                const loader = document.getElementById('image-loader-overlay');
                if (loader) loader.classList.add('hidden');
                const galleryStrip = document.getElementById('photo-gallery-strip');
                if (galleryStrip) galleryStrip.classList.add('hidden');
                if (window.axoScrubber) window.axoScrubber.activate(axoSequenceImages);
            } else if (targetSrc) {
                // Show loader
                const loader = document.getElementById('image-loader-overlay');
                if (loader) {
                    loader.classList.remove('hidden');
                    const label = loader.querySelector('.loader-label');
                    if (label) label.textContent = 'in progress';
                }
                planImg.classList.remove('loaded');
                planImg.style.display = 'block';
                
                const preload = new Image();
                preload.onload = () => {
                    console.log(`[UI] updateUI Preload successfully loaded: ${targetSrc}`);
                    planImg.src = preload.src;
                    planImg.style.display = 'block';
                    if (loader) loader.classList.add('hidden');
                    planImg.classList.add('loaded');
                };
                
                preload.onerror = () => {
                    console.error('[UI] updateUI Failed to preload image:', targetSrc);
                    if (loader) loader.classList.add('hidden');
                    planImg.src = '';
                    planImg.alt = 'Resource not found';
                };
                
                console.log(`[UI] updateUI Starting preload for: ${targetSrc}`);
                preload.src = targetSrc + '?t=' + new Date().getTime();
                
                // Update gallery strip
                updateGalleryStrip(mode, galleryPhotos, targetSrc);
            } else {
                planImg.src = '';
                planImg.alt = 'Image not available';
                planImg.style.display = 'none';
                const loader = document.getElementById('image-loader-overlay');
                if (loader) loader.classList.add('hidden');
            }
        }

        // Store globally for other scripts to use
        window.currentUnitData = unit;
    }

    // --- Event Listeners for Plan Tabs ---
    // Moved outside updateUI to prevent multiple bindings
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupTabListeners);
    } else {
        setupTabListeners();
    }

    function setupTabListeners() {
        const tabs = document.querySelectorAll('.plan-tab');
        const planImg = document.getElementById('plan-image');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 1. Toggle Active State
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 2. Always deactivate the scrubber when switching tabs
                if (window.axoScrubber) window.axoScrubber.deactivate();

                // 3. Switch Image
                if (planImg) {
                    const mode = tab.dataset.tab;
                    const loader = document.getElementById('image-loader-overlay');

                    // ── 3D Plan: check for axonometric sequence ──
                    if (mode === '3d-plan') {
                        const axoRaw = planImg.getAttribute('data-axo-sequence');
                        let axoSeq = [];
                        try { axoSeq = axoRaw ? JSON.parse(axoRaw) : []; } catch (e) {}

                        if (axoSeq.length > 0 && window.axoScrubber) {
                            // Sequence mode → activate scrubber
                            console.log(`[Axo] Tab switch to 3D-plan: activating scrubber (${axoSeq.length} frames)`);
                            if (loader) loader.classList.add('hidden');
                            const galleryStrip = document.getElementById('photo-gallery-strip');
                            if (galleryStrip) galleryStrip.classList.add('hidden');
                            window.axoScrubber.activate(axoSeq);
                            return; // Done — scrubber takes over
                        }
                    }

                    let targetSrc = '';
                    if (mode === '2d-plan') targetSrc = planImg.getAttribute('data-link2d');
                    else if (mode === '3d-plan') targetSrc = planImg.getAttribute('data-link3d');
                    else if (mode === 'photos') targetSrc = planImg.getAttribute('data-linkphotos');
                    
                    if (targetSrc) {
                        console.log(`[UI] Switching tab to mode: ${mode}, targetSrc: ${targetSrc}`);
                        
                        // Update gallery strip
                        const galleryData = planImg.getAttribute('data-gallery');
                        const photos = galleryData ? JSON.parse(galleryData) : [];
                        updateGalleryStrip(mode, photos, targetSrc);

                        // Show loader
                        if (loader) {
                            loader.classList.remove('hidden');
                            const label = loader.querySelector('.loader-label');
                            if (label) label.textContent = 'in progress';
                        }
                        planImg.classList.remove('loaded');
                        planImg.style.display = 'block';
                        
                        const preload = new Image();
                        preload.onload = () => {
                            console.log(`[UI] Tab Switch Preload successfully loaded: ${targetSrc}`);
                            planImg.src = preload.src;
                            planImg.style.display = 'block';
                            if (loader) loader.classList.add('hidden');
                            planImg.classList.add('loaded');
                        };
                        
                        preload.onerror = () => {
                            console.error('[UI] Tab Switch Failed to preload image:', targetSrc);
                            if (loader) loader.classList.add('hidden');
                            planImg.src = '';
                            planImg.alt = 'Resource not found';
                        };
                        
                        console.log(`[UI] Tab Switch Starting preload for: ${targetSrc}`);
                        preload.src = targetSrc + '?t=' + new Date().getTime();
                    } else {
                        console.log(`[UI] targetSrc is empty for mode: ${mode}, hiding loader.`);
                        planImg.src = '';
                        planImg.style.display = 'none';
                        if (loader) loader.classList.add('hidden');
                        const galleryStrip = document.getElementById('photo-gallery-strip');
                        if (galleryStrip) galleryStrip.classList.add('hidden');
                    }
                }
            });
        });
    }
    
    // Cache for unit list
    let allUnitsCache = null;

    async function populateUnitDropdown(selectEl, currentUnit) {
        if (!allUnitsCache) {
            try {
                if (window.AppData && window.AppData.fetchUnits) {
                    allUnitsCache = await window.AppData.fetchUnits();
                }
            } catch (e) { console.error(e); }
        }
        
        if (allUnitsCache) {
            // Sort alphanumerically
            allUnitsCache.sort((a,b) => {
                const ua = a['Unit Number'] || a['unit_number'] || '';
                const ub = b['Unit Number'] || b['unit_number'] || '';
                return ua.localeCompare(ub, undefined, {numeric: true, sensitivity: 'base'});
            });

            selectEl.innerHTML = ''; // Clear temporary
            
            const cleanCurrent = currentUnit ? String(currentUnit).trim() : '';
            let found = false;

            allUnitsCache.forEach(u => {
                const uNumRaw = u['Unit Number'] || u['unit_number'];
                const uNum = uNumRaw ? String(uNumRaw).trim() : '';
                
                if (uNum) {
                    const opt = document.createElement('option');
                    opt.value = uNum;
                    opt.textContent = uNum;
                    
                    // Force styling on options for safety
                    opt.style.background = '#222';
                    opt.style.color = '#fff';
                    
                    if (uNum === cleanCurrent) found = true;
                    
                    selectEl.appendChild(opt);
                }
            });
            
            // If the current unit wasn't in the list (mismatch?), add it so it shows up
            if (!found && cleanCurrent) {
                const opt = document.createElement('option');
                opt.value = cleanCurrent;
                opt.textContent = cleanCurrent + ' (Current)';
                opt.style.background = '#222';
                opt.style.color = '#fff';
                selectEl.insertBefore(opt, selectEl.firstChild);
            }

            selectEl.value = cleanCurrent;
        }
    }
    
    async function handleUnitSelection(unitId) {
        console.log(`[UI] User switched to unit: ${unitId}`);

        // Immediate feedback: show loader while data/images fetch
        const loader = document.getElementById('image-loader-overlay');
        const planImg = document.getElementById('plan-image');
        if (loader) loader.classList.remove('hidden');
        if (planImg) planImg.classList.remove('loaded');

        // 1. Fetch details
        try {
            const data = await window.AppData.getUnitDetails(unitId);
            if (data) {
                 // 2. Update UI
                 await updateUI(data);
                 
                 // 3. Notify 3D Viewer to focus/select
                 // We dispatch a custom event that viewer3d.js can listen to
                 // "unitSelectedFromUI"
                 window.dispatchEvent(new CustomEvent('unitSelectedFromUI', { detail: { 
                     unitId: unitId, 
                     unitData: data 
                 }}));
            } else {
                 if (loader) loader.classList.add('hidden');
                 console.warn(`[UI] No data found for unit: ${unitId}`);
                 if (planImg) {
                     planImg.src = '';
                     planImg.alt = 'Unit data not found';
                 }
            }
        } catch (err) {
            console.error('[UI] Error fetching unit details:', err);
            if (loader) loader.classList.add('hidden');
        }
    }


    // Initialize sync
    async function init() {
        // Load the manifest first!
        await loadClientManifest();

        // 1. Check if data is already loaded globally
        if (window.currentUnitData) {
            await updateUI(window.currentUnitData);
        }

        // 2. Listen for future data loads (from viewer3d.js or elsewhere)
        window.addEventListener('unitDataLoaded', async (event) => {
            console.log('[Sync] Received unitDataLoaded event:', event.detail);
            try {
                await updateUI(event.detail);
            } catch (e) {
                console.error('[Sync] Error in updateUI:', e);
                const loader = document.getElementById('image-loader-overlay');
                if (loader) loader.classList.add('hidden');
            }
        });

        // 3. Fallback: If viewer3d isn't active, fetch manually
        setTimeout(() => {
            if (!window.currentUnitData && window.AppData && window.AppData.client) {
                syncUnitInfo();
            }
        }, 2000);
    }

    // Start discovery
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
