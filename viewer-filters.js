/**
 * Viewer Filters & Multilingual Manager
 * Handles Top Toolbar filtering, double-range sliders, fuzzy search, showcase overlays, and translations.
 */

(function() {
    'use strict';

    // Translations Dictionary
    const TRANSLATIONS = {
        en: {
            unitType: "Unit Type",
            allTypes: "All Property Types",
            surface: "Surface Area",
            levels: "Levels / Floors",
            search: "Search Unit",
            searchPlaceholder: "Search unit name...",
            reset: "Reset",
            visit: "Virtual Visit",
            location: "Location",
            contact: "Contact",
            contactUs: "Contact Us",
            projectLocation: "Project Location",
            addressLabel: "Address",
            phoneLabel: "Phone",
            emailLabel: "Email",
            namePlaceholder: "Name",
            emailPlaceholder: "Email",
            phonePlaceholder: "Phone",
            messagePlaceholder: "Message",
            sendBtn: "Send Message",
            soldBadge: "Sold",
            reservedBadge: "Reserved",
            availableBadge: "Available",
            aptDetailsTitle: "Apartment Details",
            aptUnit: "Unit:",
            aptSurfaceInt: "Surface Interior:",
            aptSurfaceExt: "Surface Exterior:",
            aptTerrace: "Terrace:",
            aptType: "Type:",
            aptRooms: "Rooms:",
            aptOrientation: "Orientation:",
            openMaps: "Open Maps"
        },
        fr: {
            unitType: "Type d'Unité",
            allTypes: "Tous les Types",
            surface: "Surface Habitable",
            levels: "Niveaux / Étages",
            search: "Recherche Unité",
            searchPlaceholder: "Rechercher une unité...",
            reset: "Réinitialiser",
            visit: "Visite Virtuelle",
            location: "Localisation",
            contact: "Contact",
            contactUs: "Contactez-nous",
            projectLocation: "Localisation du Projet",
            addressLabel: "Adresse",
            phoneLabel: "Téléphone",
            emailLabel: "E-mail",
            namePlaceholder: "Nom",
            emailPlaceholder: "E-mail",
            phonePlaceholder: "Téléphone",
            messagePlaceholder: "Votre message",
            sendBtn: "Envoyer",
            soldBadge: "Vendu",
            reservedBadge: "Réservé",
            availableBadge: "Disponible",
            aptDetailsTitle: "Détails de l'appartement",
            aptUnit: "Unité:",
            aptSurfaceInt: "Surface Intérieure:",
            aptSurfaceExt: "Surface Extérieure:",
            aptTerrace: "Terrasse:",
            aptType: "Type:",
            aptRooms: "Pièces:",
            aptOrientation: "Orientation:",
            openMaps: "Ouvrir dans Google Maps"
        },
        ar: {
            unitType: "نوع الوحدة",
            allTypes: "جميع الأنواع",
            surface: "المساحة الداخلية",
            levels: "الطوابق / الأدوار",
            search: "بحث عن وحدة",
            searchPlaceholder: "ابحث عن اسم الوحدة...",
            reset: "إعادة ضبط",
            visit: "جولة افتراضية",
            location: "الموقع",
            contact: "اتصل بنا",
            contactUs: "اتصل بنا",
            projectLocation: "موقع المشروع",
            addressLabel: "العنوان",
            phoneLabel: "الهاتف",
            emailLabel: "البريد الإلكتروني",
            namePlaceholder: "الاسم",
            emailPlaceholder: "البريد الإلكتروني",
            phonePlaceholder: "رقم الهاتف",
            messagePlaceholder: "رسالتك",
            sendBtn: "إرسال الرسالة",
            soldBadge: "مباع",
            reservedBadge: "محجوز",
            availableBadge: "متاح",
            aptDetailsTitle: "تفاصيل الشقة",
            aptUnit: "الوحدة:",
            aptSurfaceInt: "المساحة الداخلية:",
            aptSurfaceExt: "المساحة الخارجية:",
            aptTerrace: "شرفة:",
            aptType: "النوع:",
            aptRooms: "الغرف:",
            aptOrientation: "الاتجاه:",
            openMaps: "فتح في خرائط جوجل"
        }
    };

    // App State
    let currentLang = 'en';
    let loadedUnits = [];
    let unitCol = 'Unit Number'; // Dynamically resolved on init
    let activeFilters = {
        propertyType: '', // Selected option
        minSurface: 0,
        maxSurface: 1000,
        minLevel: 0,
        maxLevel: 10,
        searchQuery: ''
    };

    // Bounds calculated dynamically
    let bounds = {
        minSurface: 0,
        maxSurface: 1000,
        minLevel: 0,
        maxLevel: 10
    };

    // Clean and parse numerical values robustly
    function cleanNumber(val) {
        if (val === undefined || val === null) return NaN;
        // Extract first numeric match (handles "Floor 1", "2nd floor", "50 sqm", "50m2")
        const match = String(val).match(/[-+]?[0-9]*\.?[0-9]+/);
        if (match) {
            return parseFloat(match[0]);
        }
        // Fallback for ground floors / RDC
        const str = String(val).toLowerCase().trim();
        if (str === 'rdc' || str === 'ground' || str === 'g' || str === '0') {
            return 0;
        }
        return parseFloat(val);
    }

    // Helper to extract values checking dynamic cased column names
    function getUnitVal(unit, keys, defaultVal = '') {
        for (const k of keys) {
            if (unit[k] !== undefined && unit[k] !== null) {
                return unit[k];
            }
        }
        return defaultVal;
    }

    // Convert string to lowercase and strip all non-alphanumeric characters for robust naming alignment
    function cleanName(str) {
        if (str === undefined || str === null) return '';
        return String(str).toLowerCase().replace(/[^a-z0-9]/gi, '').trim();
    }

    // Helper to format any URL or coordinates string into a Google Maps Embed URL
    function formatGoogleMapsEmbedUrl(url) {
        const defaultCoords = '42.1158762,12.7758299';
        const str = (url && String(url).trim()) ? String(url).trim() : defaultCoords;

        if (str.includes('google.com/maps/embed')) {
            return str;
        }

        const matchAt = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (matchAt) {
            return `https://maps.google.com/maps?q=${matchAt[1]},${matchAt[2]}&t=k&z=18&output=embed`;
        }

        const matchCoords = str.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
        if (matchCoords) {
            return `https://maps.google.com/maps?q=${matchCoords[1]},${matchCoords[2]}&t=k&z=18&output=embed`;
        }

        return `https://maps.google.com/maps?q=${encodeURIComponent(str)}&t=k&z=18&output=embed`;
    }

    // Dynamic dynamic check for files/folders existence
    async function checkFileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) return true;
            // Throw error to trigger Image fallback for 405 Method Not Allowed or 404
            throw new Error('Fallback to Image loader');
        } catch (e) {
            // Fallback for file:/// protocol, CORS issues, or server rejecting HEAD
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
            });
        }
    }

    // Initialize all filters and selectors
    async function initFilters() {
        console.log('[Filters] Initializing Filter System...');

        // 1. Setup double-range sliders UI and listeners
        setupSlider('surface');
        setupSlider('levels');

        // 2. Setup standard listeners
        setupEventListeners();

        // 3. Wait for client-side settings to resolve Logo custom path
        await loadCustomLogo();

        // Resolve dynamic unit column identifier from metadata
        if (window.db && window.db.resolveUnitColumn) {
            try {
                unitCol = await window.db.resolveUnitColumn();
                console.log('[Filters] Dynamic unit column resolved in filters:', unitCol);
            } catch (e) {
                console.warn('[Filters] Failed to resolve dynamic column:', e);
            }
        }

        // 4. Fetch units and setup filters boundaries
        await syncFiltersWithDatabase();

        // 5. Audit optional client folders
        await checkClientShowcaseTabs();

        // 6. Set Default Language from Settings
        const defaultLang = window.uiSettings?.settings?.ui?.toolbar?.defaultLanguage || 'en';
        setLanguage(defaultLang);
        
        // Ensure language dropdown in toolbar matches
        const langSelectInput = document.getElementById('lang-select');
        if (langSelectInput) {
            langSelectInput.value = defaultLang;
        }
    }

    // Dynamically retrieve client settings or logo path
    async function loadCustomLogo() {
        const logoImg = document.getElementById('project-logo');
        if (!logoImg) return;

        try {
            // Check if settings has customized logo path
            if (window.uiSettings) {
                // Ensure settings is loaded from file
                const logoPath = window.uiSettings.getSetting('ui', 'logoPath');
                if (logoPath) {
                    console.log('[Filters] Setting customized logo:', logoPath);
                    logoImg.src = logoPath;
                    return;
                }
            }

            // Fallback: If clientID in URL, try client specific logo e.g. CLT695425/logo.png
            const urlParams = new URLSearchParams(window.location.search);
            const clientID = urlParams.get('clientID');
            if (clientID) {
                const clientLogo = `${clientID}/logo.png`;
                const logoExists = await checkFileExists(clientLogo);
                if (logoExists) {
                    console.log('[Filters] Resolved folder-level client logo:', clientLogo);
                    logoImg.src = clientLogo;
                }
            }
        } catch (e) {
            console.warn('[Filters] Failed loading customized logo:', e);
        }
    }

    // Helper to resolve all 360 Virtual Visit images dynamically
    async function getVirtualVisitImages() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientID = urlParams.get('clientID') || 'CLT695425';
        
        let vvImages = window.clientManifest?.virtual_visit || [];
        const candidateFiles = [
            `${clientID}/360-Virtual-Visit/01-Room1.webp`,
            `${clientID}/360-Virtual-Visit/Room02.webp`,
            `${clientID}/360-Virtual-Visit/Room03.jpg`,
            `${clientID}/360-Virtual-Visit/02-Room2.webp`,
            `${clientID}/360-Virtual-Visit/03-Room3.webp`,
            `${clientID}/360-Virtual-Visit/Room1.webp`,
            `${clientID}/360-Virtual-Visit/Room2.webp`,
            `${clientID}/360-Virtual-Visit/Room3.webp`
        ];

        const checkedSet = new Set(vvImages);
        for (const path of candidateFiles) {
            if (!checkedSet.has(path)) {
                const exists = await checkFileExists(path);
                if (exists) {
                    checkedSet.add(path);
                }
            }
        }
        return Array.from(checkedSet);
    }

    // Audit showcase tabs by directory scanning statistics or direct fetch checks
    async function checkClientShowcaseTabs() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientID = urlParams.get('clientID');
        if (!clientID) return;

        console.log(`[Filters] Checking showcase resources for client: ${clientID}`);

        const visitTab = document.getElementById('tab-visit');
        const locationTab = document.getElementById('tab-location');

        // Verify Location (location.txt or maps settings)
        try {
            const locTextPath = `${clientID}/Location/location.txt`;
            const mapTextPath = `${clientID}/Location/map_url.txt`;
            
            let locUrl = '';
            
            // Try fetching map_url.txt first
            let response = await fetch(mapTextPath).catch(() => null);
            if (response && response.ok) {
                locUrl = (await response.text()).trim();
            } else {
                // Try location.txt
                response = await fetch(locTextPath).catch(() => null);
                if (response && response.ok) {
                    locUrl = (await response.text()).trim();
                }
            }

            if (!locUrl && window.uiSettings?.settings?.ui?.locationUrl) {
                locUrl = window.uiSettings.settings.ui.locationUrl;
            }
            if (!locUrl) {
                locUrl = '42.1158762,12.7758299';
            }

            console.log('[Filters] Resolved Location URL:', locUrl);
            locationTab.classList.remove('hidden');
            
            const streetAddr = window.uiSettings?.settings?.ui?.locationAddress || window.uiSettings?.settings?.ui?.contact?.address || '123 Premium Real Estate Ave, Paris';
            const combinedAddress = `${streetAddr} • ${locUrl}`;

            // Parse or wrap standard address in Google Maps embed
            const iframe = document.getElementById('location-iframe');
            if (iframe) {
                iframe.src = formatGoogleMapsEmbedUrl(locUrl);
            }
            
            // Update address fields in Location Details
            const locValAddress = document.getElementById('loc-val-address');
            if (locValAddress) locValAddress.textContent = combinedAddress;

            const openMapsBtn = document.getElementById('loc-open-maps-btn');
            if (openMapsBtn) {
                if (locUrl.includes('google.com') || locUrl.includes('google.fr')) {
                    openMapsBtn.href = locUrl;
                } else {
                    openMapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locUrl)}`;
                }
            }

            const contactValAddress = document.getElementById('contact-val-address');
            if (contactValAddress) contactValAddress.textContent = streetAddr;
        } catch (err) {
            console.warn('[Filters] Failed auditing Location folder:', err);
        }

        // Verify Virtual Visit
        try {
            const vvImages = await getVirtualVisitImages();

            if (vvImages.length > 0) {
                console.log('[Filters] Resolved 360 Virtual Visit images:', vvImages);
                // Store images on the virtualVisit360 instance for use when user opens the overlay
                if (window.virtualVisit360) {
                    window.virtualVisit360._pendingImages = vvImages;
                }
                visitTab.classList.remove('hidden');
            } else {
                const visitTextPath = `${clientID}/Virtual Visit/visit_url.txt`;
                let visitUrl = '';

                const response = await fetch(visitTextPath).catch(() => null);
                if (response && response.ok) {
                    visitUrl = (await response.text()).trim();
                }

                if (visitUrl) {
                    console.log('[Filters] Resolved Virtual Visit URL:', visitUrl);
                    visitTab.classList.remove('hidden');
                    const iframe = document.getElementById('visit-iframe');
                    if (iframe) iframe.src = visitUrl;
                } else {
                    const visitHtmlPath = `${clientID}/Virtual Visit/index.html`;
                    const htmlExists = await checkFileExists(visitHtmlPath);
                    if (htmlExists) {
                        console.log('[Filters] Resolved physical Virtual Visit index.html:', visitHtmlPath);
                        visitTab.classList.remove('hidden');
                        const iframe = document.getElementById('visit-iframe');
                        if (iframe) iframe.src = visitHtmlPath;
                    } else if (window.clientManifest && window.clientManifest.features && window.clientManifest.features['Virtual Visit']) {
                        visitTab.classList.remove('hidden');
                    }
                }
            }
        } catch (err) {
            console.warn('[Filters] Failed auditing Virtual Visit folder:', err);
        }
    }

    // Sync filters with the fetched Supabase Database cache
    async function syncFiltersWithDatabase() {
        try {
            if (!window.db) {
                console.warn('[Filters] window.db not initialized yet, retrying...');
                setTimeout(syncFiltersWithDatabase, 300);
                return;
            }

            const units = await window.db.fetchUnits();
            if (!units || units.length === 0) {
                console.warn('[Filters] Fetched zero units from database.');
                return;
            }

            loadedUnits = units;

            // Cache units by unit name globally to hydrate viewer3d color lookups (case-insensitive cleaned keys)
            if (!window.currentUnitDataCache) window.currentUnitDataCache = {};
            units.forEach(u => {
                const uNumRaw = u[unitCol];
                if (uNumRaw) {
                    window.currentUnitDataCache[cleanName(uNumRaw)] = u;
                }
            });

            console.log(`[Filters] Synced ${units.length} unit records for filters.`);

            // 1. Calculate boundaries dynamically
            calculateRangesBoundaries(units);

            // 2. Populate unit types dropdown
            populatePropertyTypesDropdown(units);

            // Run initial empty filter block
            runFilters();

        } catch (err) {
            console.error('[Filters] Error syncing with database:', err);
        }
    }

    // Extract boundaries dynamically
    function calculateRangesBoundaries(units) {
        let minS = Infinity, maxS = -Infinity;
        let minL = Infinity, maxL = -Infinity;

        units.forEach(u => {
            // Parse surface
            const sVal = cleanNumber(getUnitVal(u, ['Interior Area', 'surface-interior', 'Surface Area']));
            if (!isNaN(sVal)) {
                if (sVal < minS) minS = sVal;
                if (sVal > maxS) maxS = sVal;
            }

            // Parse levels
            const lVal = cleanNumber(getUnitVal(u, ['Floor', 'floor', 'Level', 'level']));
            if (!isNaN(lVal)) {
                if (lVal < minL) minL = lVal;
                if (lVal > maxL) maxL = lVal;
            }
        });

        // Set fallbacks if invalid
        bounds.minSurface = minS === Infinity ? 0 : Math.floor(minS);
        bounds.maxSurface = maxS === -Infinity ? 500 : Math.ceil(maxS);
        bounds.minLevel = minL === Infinity ? 0 : Math.floor(minL);
        bounds.maxLevel = maxL === -Infinity ? 10 : Math.ceil(maxL);

        console.log('[Filters] Boundaries resolved:', bounds);

        // Adjust Surface Sliders
        const sliderSMin = document.getElementById('slider-surface-min');
        const sliderSMax = document.getElementById('slider-surface-max');
        if (sliderSMin && sliderSMax) {
            sliderSMin.min = bounds.minSurface;
            sliderSMin.max = bounds.maxSurface;
            sliderSMin.value = bounds.minSurface;
            sliderSMax.min = bounds.minSurface;
            sliderSMax.max = bounds.maxSurface;
            sliderSMax.value = bounds.maxSurface;

            activeFilters.minSurface = bounds.minSurface;
            activeFilters.maxSurface = bounds.maxSurface;
        }

        // Adjust Level Sliders
        const sliderLMin = document.getElementById('slider-levels-min');
        const sliderLMax = document.getElementById('slider-levels-max');
        if (sliderLMin && sliderLMax) {
            sliderLMin.min = bounds.minLevel;
            sliderLMin.max = bounds.maxLevel;
            sliderLMin.value = bounds.minLevel;
            sliderLMax.min = bounds.minLevel;
            sliderLMax.max = bounds.maxLevel;
            sliderLMax.value = bounds.maxLevel;

            activeFilters.minLevel = bounds.minLevel;
            activeFilters.maxLevel = bounds.maxLevel;
        }

        updateSliderDisplays('surface');
        updateSliderDisplays('levels');
    }

    // Populate property types dropdown with unique values + customized room configurations
    function populatePropertyTypesDropdown(units) {
        const select = document.getElementById('filter-unit-type');
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = `<option value="" id="opt-all-types">${TRANSLATIONS[currentLang].allTypes}</option>`;

        const uniqueTypes = new Set();
        const customApartments = new Set(); // Apartment layouts

        units.forEach(u => {
            const pType = getUnitVal(u, ['Property Type', 'Asset Class', 'Type']);
            if (pType) {
                uniqueTypes.add(pType.trim());
            }

            // Room specific check: if type contains Apartment or is empty (assumed residential)
            const typeStr = String(pType || '').toLowerCase();
            if (typeStr.includes('apart') || typeStr.includes('resid') || typeStr === '') {
                const rooms = getUnitVal(u, ['Number of Rooms', 'Bedrooms']);
                if (rooms && !isNaN(parseInt(rooms))) {
                    const rNum = parseInt(rooms);
                    if (rNum > 0) {
                        customApartments.add(rNum);
                    }
                }
            }
        });

        // Add standard unique property types
        Array.from(uniqueTypes).sort().forEach(type => {
            const opt = document.createElement('option');
            opt.value = `type:${type}`;
            opt.textContent = type;
            select.appendChild(opt);
        });

        // Add specific room layouts as requested (Apartment F3 (2 rooms + living room))
        // Fx mapping where rooms = x (e.g. F3 means 2 bedrooms + 1 living room = 3 rooms total)
        Array.from(customApartments).sort((a, b) => a - b).forEach(rCount => {
            const opt = document.createElement('option');
            opt.value = `rooms:${rCount}`;
            
            // Generate standard labeling (Apartment F{rooms} with rooms-1 bedrooms + living room)
            const fLabel = `F${rCount}`;
            const bedCount = rCount - 1;
            
            if (currentLang === 'fr') {
                opt.textContent = `Appartement ${fLabel} (${bedCount} chambres + salon)`;
            } else if (currentLang === 'ar') {
                opt.textContent = `شقة ${fLabel} (${bedCount} غرف نوم + صالة)`;
            } else {
                opt.textContent = `Apartment ${fLabel} (${bedCount} bedrooms + living room)`;
            }

            select.appendChild(opt);
        });
    }

    // Set double range slider logic
    function setupSlider(type) {
        const sliderMin = document.getElementById(`slider-${type}-min`);
        const sliderMax = document.getElementById(`slider-${type}-max`);
        const track = document.getElementById(`${type}-track`);

        if (!sliderMin || !sliderMax || !track) return;

        const updateTrack = () => {
            const val1 = parseInt(sliderMin.value);
            const val2 = parseInt(sliderMax.value);
            const minBound = parseInt(sliderMin.min);
            const maxBound = parseInt(sliderMin.max);

            const percent1 = ((val1 - minBound) / (maxBound - minBound)) * 100;
            const percent2 = ((val2 - minBound) / (maxBound - minBound)) * 100;

            if (currentLang === 'ar') {
                track.style.right = percent1 + '%';
                track.style.left = (100 - percent2) + '%';
            } else {
                track.style.left = percent1 + '%';
                track.style.right = (100 - percent2) + '%';
            }
        };

        const handleInput = (e) => {
            const val1 = parseInt(sliderMin.value);
            const val2 = parseInt(sliderMax.value);

            // Prevent handles from overlapping/crossing (enforce min difference of 1 segment/sqm)
            const gap = type === 'surface' ? Math.max(1, Math.round((bounds.maxSurface - bounds.minSurface) * 0.02)) : 1;

            if (e.target === sliderMin) {
                sliderMin.style.zIndex = '5';
                sliderMax.style.zIndex = '4';
                if (val1 > val2 - gap) {
                    sliderMin.value = val2 - gap;
                }
            } else {
                sliderMax.style.zIndex = '5';
                sliderMin.style.zIndex = '4';
                if (val2 < val1 + gap) {
                    sliderMax.value = val1 + gap;
                }
            }

            // Save active values
            if (type === 'surface') {
                activeFilters.minSurface = parseInt(sliderMin.value);
                activeFilters.maxSurface = parseInt(sliderMax.value);
            } else {
                activeFilters.minLevel = parseInt(sliderMin.value);
                activeFilters.maxLevel = parseInt(sliderMax.value);
            }

            updateTrack();
            updateSliderDisplays(type);
            runFilters();
        };

        sliderMin.addEventListener('input', handleInput);
        sliderMax.addEventListener('input', handleInput);

        // Add hover z-index swapping to guarantee unblocked mouse interactions
        sliderMin.addEventListener('mouseover', () => {
            sliderMin.style.zIndex = '5';
            sliderMax.style.zIndex = '4';
        });
        sliderMax.addEventListener('mouseover', () => {
            sliderMax.style.zIndex = '5';
            sliderMin.style.zIndex = '4';
        });
        
        // Initial draw
        setTimeout(updateTrack, 200);
        window.addEventListener('resize', updateTrack);
    }

    // Refresh displays for surface & floor values
    function updateSliderDisplays(type) {
        const display = document.getElementById(`${type}-display`);
        const label = document.getElementById(`${type}-range-display`);
        if (!label) return;

        if (type === 'surface') {
            if (currentLang === 'fr') {
                label.textContent = `Min: ${activeFilters.minSurface} m² - Max: ${activeFilters.maxSurface} m²`;
            } else if (currentLang === 'ar') {
                label.textContent = `الأدنى: ${activeFilters.minSurface} م² - الأقصى: ${activeFilters.maxSurface} م²`;
            } else {
                label.textContent = `Min: ${activeFilters.minSurface} m² - Max: ${activeFilters.maxSurface} m²`;
            }
        } else {
            if (currentLang === 'fr') {
                label.textContent = `Niveau: ${activeFilters.minLevel} à ${activeFilters.maxLevel}`;
            } else if (currentLang === 'ar') {
                label.textContent = `الطابق: ${activeFilters.minLevel} إلى ${activeFilters.maxLevel}`;
            } else {
                label.textContent = `Level: ${activeFilters.minLevel} - ${activeFilters.maxLevel}`;
            }
        }
    }

    // Setup Autocomplete Suggestion Logic & Keyboard Nav State
    let selectedSuggestionIndex = -1;

    function updateAutocompleteSuggestions(queryText) {
        const suggestionsBox = document.getElementById('search-suggestions');
        if (!suggestionsBox) return;

        if (!queryText) {
            suggestionsBox.classList.add('hidden');
            suggestionsBox.innerHTML = '';
            selectedSuggestionIndex = -1;
            return;
        }

        const query = cleanName(queryText);
        if (!query) {
            suggestionsBox.classList.add('hidden');
            suggestionsBox.innerHTML = '';
            selectedSuggestionIndex = -1;
            return;
        }

        // Filter units using fuzzy matching
        const matches = loadedUnits.filter(unit => {
            const uNumRaw = unit[unitCol];
            const uName = uNumRaw ? String(uNumRaw).trim() : '';
            if (!uName) return false;

            const cleanUName = cleanName(uName);
            
            // Exact substring check
            if (cleanUName.includes(query)) {
                return true;
            }

            // Fuzzy order-based fallback match
            let searchIdx = 0;
            for (let i = 0; i < cleanUName.length && searchIdx < query.length; i++) {
                if (cleanUName[i] === query[searchIdx]) {
                    searchIdx++;
                }
            }
            return searchIdx === query.length;
        });

        // Limit matches to top 10 for sleek design
        const limitMatches = matches.slice(0, 10);

        if (limitMatches.length === 0) {
            suggestionsBox.classList.add('hidden');
            suggestionsBox.innerHTML = '';
            selectedSuggestionIndex = -1;
            return;
        }

        // Render matching suggestions
        suggestionsBox.innerHTML = '';
        selectedSuggestionIndex = -1;

        limitMatches.forEach((unit, idx) => {
            const uNumRaw = unit[unitCol];
            const uName = uNumRaw ? String(uNumRaw).trim() : '';
            
            // Get properties to display elegantly
            const surface = cleanNumber(getUnitVal(unit, ['Interior Area', 'surface-interior', 'Surface Area']));
            const pType = getUnitVal(unit, ['Property Type', 'Asset Class', 'Type'], 'Apartment');
            const status = String(getUnitVal(unit, ['Unit Status', 'Status', 'status'])).trim().toLowerCase() || 'available';
            const rooms = parseInt(getUnitVal(unit, ['Number of Rooms', 'Bedrooms']));

            let subtitle = `${pType}`;
            if (!isNaN(rooms)) {
                subtitle += ` • F${rooms}`;
            }
            if (!isNaN(surface)) {
                subtitle += ` • ${surface} m²`;
            }

            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.dataset.index = idx;
            item.dataset.unitName = uName;

            // Render suggestion item content with neon badge
            const badgeClass = ['sold', 'reserved', 'available'].includes(status) ? status : 'available';
            
            // Get translated status badge name
            let badgeText = TRANSLATIONS[currentLang][badgeClass + 'Badge'] || badgeClass;

            item.innerHTML = `
                <div class="suggestion-left">
                    <span class="suggestion-title">${uName}</span>
                    <span class="suggestion-subtitle">${subtitle}</span>
                </div>
                <div class="suggestion-right">
                    <span class="suggestion-badge ${badgeClass}">${badgeText}</span>
                </div>
            `;

            // Click listener
            item.addEventListener('click', () => {
                selectUnitFromSuggestion(uName);
            });

            suggestionsBox.appendChild(item);
        });

        suggestionsBox.classList.remove('hidden');
    }

    function updateActiveSuggestion(items) {
        items.forEach((item, idx) => {
            if (idx === selectedSuggestionIndex) {
                item.classList.add('active');
                // Scroll into view if needed
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    function selectUnitFromSuggestion(unitName) {
        console.log(`[Filters] Autocomplete selected unit: ${unitName}`);
        
        const searchInput = document.getElementById('filter-search');
        const clearBtn = document.getElementById('search-clear');
        const suggestionsBox = document.getElementById('search-suggestions');

        if (searchInput) {
            searchInput.value = unitName;
            activeFilters.searchQuery = unitName;
        }

        if (clearBtn) {
            clearBtn.style.display = 'block';
        }

        if (suggestionsBox) {
            suggestionsBox.classList.add('hidden');
            suggestionsBox.innerHTML = '';
            selectedSuggestionIndex = -1;
        }

        // 1. Run standard filters to isolate/highlight this unit in 3D
        runFilters();

        // 2. Open 2D Plan Panel and Details exactly as if clicked in 3D
        if (window.viewer3D) {
            window.viewer3D.showPlanImage(unitName);
        }

        // 3. Load DB details and dispatch event
        if (window.db && window.db.getUnitDetails) {
            window.db.getUnitDetails(unitName).then(unitData => {
                if (unitData) {
                    console.log('[Filters] Auto-loaded details for suggestion:', unitData);
                    window.currentUnitData = unitData;
                    window.dispatchEvent(new CustomEvent('unitDataLoaded', { detail: unitData }));
                }
            }).catch(e => {
                console.warn('[Filters] Failed auto-loading details for suggestion:', e);
            });
        }
    }

    // Setup basic UI event listeners
    function setupEventListeners() {
        // Property Dropdown
        const typeSelect = document.getElementById('filter-unit-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                activeFilters.propertyType = e.target.value;
                runFilters();
            });
        }

        // Fuzzy Search with Autocomplete suggestions
        const searchInput = document.getElementById('filter-search');
        const clearBtn = document.getElementById('search-clear');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                activeFilters.searchQuery = e.target.value.trim();
                if (clearBtn) {
                    clearBtn.style.display = activeFilters.searchQuery ? 'block' : 'none';
                }
                runFilters();
                updateAutocompleteSuggestions(activeFilters.searchQuery);
            });

            searchInput.addEventListener('focus', () => {
                const query = searchInput.value.trim();
                if (query) {
                    updateAutocompleteSuggestions(query);
                }
            });

            // Handle keyboard navigation
            searchInput.addEventListener('keydown', (e) => {
                const suggestionsBox = document.getElementById('search-suggestions');
                if (!suggestionsBox || suggestionsBox.classList.contains('hidden')) return;

                const items = suggestionsBox.querySelectorAll('.suggestion-item');
                if (items.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedSuggestionIndex++;
                    if (selectedSuggestionIndex >= items.length) {
                        selectedSuggestionIndex = 0;
                    }
                    updateActiveSuggestion(items);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedSuggestionIndex--;
                    if (selectedSuggestionIndex < 0) {
                        selectedSuggestionIndex = items.length - 1;
                    }
                    updateActiveSuggestion(items);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < items.length) {
                        const selectedItem = items[selectedSuggestionIndex];
                        const unitName = selectedItem.dataset.unitName;
                        selectUnitFromSuggestion(unitName);
                    } else if (items.length > 0) {
                        const unitName = items[0].dataset.unitName;
                        selectUnitFromSuggestion(unitName);
                    }
                } else if (e.key === 'Escape') {
                    suggestionsBox.classList.add('hidden');
                    selectedSuggestionIndex = -1;
                }
            });
        }

        if (clearBtn && searchInput) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                activeFilters.searchQuery = '';
                clearBtn.style.display = 'none';
                runFilters();
                updateAutocompleteSuggestions('');
            });
        }

        // Close autocomplete suggestions when clicking outside
        document.addEventListener('click', (e) => {
            const searchWrapper = document.querySelector('.search-input-wrapper');
            const suggestionsBox = document.getElementById('search-suggestions');
            if (searchWrapper && suggestionsBox && !searchWrapper.contains(e.target)) {
                suggestionsBox.classList.add('hidden');
                selectedSuggestionIndex = -1;
            }
        });

        // Reset Filters Button
        const resetBtn = document.getElementById('btn-reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetAllFilters);
        }

        // Showcase Tabs
        const tabVisit = document.getElementById('tab-visit');
        const tabLocation = document.getElementById('tab-location');
        const tabContact = document.getElementById('tab-contact');

        if (tabVisit) tabVisit.addEventListener('click', () => toggleShowcaseOverlay('visit-overlay'));
        if (tabLocation) tabLocation.addEventListener('click', () => toggleShowcaseOverlay('location-overlay'));
        if (tabContact) tabContact.addEventListener('click', () => toggleShowcaseOverlay('contact-overlay'));

        // Contact Form Submission (Toast feedback)
        const contactForm = document.getElementById('toolbar-contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('contact-name')?.value || '';
                
                let successMsg = `Thank you, ${name}! Your request has been sent successfully.`;
                if (currentLang === 'fr') successMsg = `Merci, ${name}! Votre message a été envoyé.`;
                else if (currentLang === 'ar') successMsg = `شكراً لك يا ${name}! تم إرسال رسالتك بنجاح.`;

                showGlobalToast(successMsg, 'success');
                contactForm.reset();
                setTimeout(() => toggleOverlay('contact-overlay', false), 2000);
            });
        }

        // Language Select
        const langSelect = document.getElementById('lang-select');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                const newLang = e.target.value;
                setLanguage(newLang);
                
                // Save it to defaultLanguage in settings!
                if (window.uiSettings && window.uiSettings.settings.ui) {
                    if (!window.uiSettings.settings.ui.toolbar) {
                        window.uiSettings.settings.ui.toolbar = {};
                    }
                    window.uiSettings.settings.ui.toolbar.defaultLanguage = newLang;
                    window.uiSettings.saveSettings();
                }
            });
        }

        // Theme Toggle Button
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                if (window.uiSettings && window.uiSettings.settings.ui) {
                    const currentMode = window.uiSettings.settings.ui.themeMode || 'dark';
                    const newMode = currentMode === 'light' ? 'dark' : 'light';
                    window.uiSettings.settings.ui.themeMode = newMode;
                    window.uiSettings.applySettings();
                    window.uiSettings.saveSettings();
                    
                    // Rebuild Settings UI to show synced selections
                    const uiSettingsPanel = window.uiSettingsPanel || window.settingsPanel;
                    if (uiSettingsPanel && uiSettingsPanel.buildSettingsUI) {
                        uiSettingsPanel.buildSettingsUI();
                    }
                }
            });
        }
    }

    // Reset filters state
    function resetAllFilters() {
        console.log('[Filters] Resetting all filters...');

        // Reset Dropdown
        const typeSelect = document.getElementById('filter-unit-type');
        if (typeSelect) typeSelect.value = '';
        activeFilters.propertyType = '';

        // Reset Search & Autocomplete suggestions
        const searchInput = document.getElementById('filter-search');
        const clearBtn = document.getElementById('search-clear');
        const suggestionsBox = document.getElementById('search-suggestions');
        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        if (suggestionsBox) {
            suggestionsBox.classList.add('hidden');
            suggestionsBox.innerHTML = '';
            selectedSuggestionIndex = -1;
        }
        activeFilters.searchQuery = '';

        // Reset Surface Slider
        const sliderSMin = document.getElementById('slider-surface-min');
        const sliderSMax = document.getElementById('slider-surface-max');
        if (sliderSMin && sliderSMax) {
            sliderSMin.value = bounds.minSurface;
            sliderSMax.value = bounds.maxSurface;
            activeFilters.minSurface = bounds.minSurface;
            activeFilters.maxSurface = bounds.maxSurface;
            triggerInputEvent(sliderSMin);
        }

        // Reset Level Slider
        const sliderLMin = document.getElementById('slider-levels-min');
        const sliderLMax = document.getElementById('slider-levels-max');
        if (sliderLMin && sliderLMax) {
            sliderLMin.value = bounds.minLevel;
            sliderLMax.value = bounds.maxLevel;
            activeFilters.minLevel = bounds.minLevel;
            activeFilters.maxLevel = bounds.maxLevel;
            triggerInputEvent(sliderLMin);
        }

        runFilters();
    }

    function triggerInputEvent(el) {
        const event = new Event('input', { bubbles: true });
        el.dispatchEvent(event);
    }

    // Run dynamic filtering checks
    function runFilters() {
        // Evaluate if any filter is active (differs from total bounds / defaults)
        const isDefaultType = activeFilters.propertyType === '';
        const isDefaultSurface = activeFilters.minSurface === bounds.minSurface && activeFilters.maxSurface === bounds.maxSurface;
        const isDefaultLevel = activeFilters.minLevel === bounds.minLevel && activeFilters.maxLevel === bounds.maxLevel;
        const isDefaultSearch = activeFilters.searchQuery === '';

        const isFilteringActive = !(isDefaultType && isDefaultSurface && isDefaultLevel && isDefaultSearch);
        
        const matchedUnitNames = new Set();

        if (isFilteringActive) {
            loadedUnits.forEach(unit => {
                const uNumRaw = unit[unitCol];
                const uName = uNumRaw ? String(uNumRaw).trim() : '';
                if (!uName) return;

                // 1. Property Type/Rooms Filter
                if (activeFilters.propertyType) {
                    const [filterMode, filterValue] = activeFilters.propertyType.split(':');
                    
                    if (filterMode === 'type') {
                        const uType = String(getUnitVal(unit, ['Property Type', 'Asset Class', 'Type'])).trim();
                        if (uType !== filterValue) return;
                    } else if (filterMode === 'rooms') {
                        const uRooms = parseInt(getUnitVal(unit, ['Number of Rooms', 'Bedrooms']));
                        if (isNaN(uRooms) || uRooms !== parseInt(filterValue)) return;
                    }
                }

                // 2. Surface area filter (skip check if slider remains at default)
                const uSurf = cleanNumber(getUnitVal(unit, ['Interior Area', 'surface-interior', 'Surface Area']));
                if (!isDefaultSurface) {
                    if (isNaN(uSurf) || uSurf < activeFilters.minSurface || uSurf > activeFilters.maxSurface) return;
                }

                // 3. Floors Level filter (skip check if slider remains at default)
                const uFloor = cleanNumber(getUnitVal(unit, ['Floor', 'floor', 'Level', 'level']));
                if (!isDefaultLevel) {
                    if (isNaN(uFloor) || uFloor < activeFilters.minLevel || uFloor > activeFilters.maxLevel) return;
                }

                // 4. Fuzzy Name Search using case-insensitive alphanumeric cleanName helper
                if (activeFilters.searchQuery) {
                    const query = cleanName(activeFilters.searchQuery);
                    const cleanUName = cleanName(uName);
                    
                    // Prioritize standard exact substring match on cleaned names
                    if (!cleanUName.includes(query)) {
                        // Fallback to order-based fuzzy match
                        let searchIdx = 0;
                        for (let i = 0; i < cleanUName.length && searchIdx < query.length; i++) {
                            if (cleanUName[i] === query[searchIdx]) {
                                searchIdx++;
                            }
                        }
                        if (searchIdx < query.length) return; // not all characters matched in order
                    }
                }

                // If passed all checks, it's a match!
                matchedUnitNames.add(uName);
            });

            console.log(`[Filters] Filtering active. Matched ${matchedUnitNames.size} of ${loadedUnits.length} units.`);
        } else {
            console.log('[Filters] Filtering disabled. All units restored.');
        }

        // Notify 3D Viewer of filtered highlights
        window.dispatchEvent(new CustomEvent('updateFilteredHighlight', {
            detail: {
                isFilteringActive: isFilteringActive,
                matchingUnitNames: matchedUnitNames
            }
        }));
    }

    // Toggle sliding showcase overlays
    async function toggleShowcaseOverlay(overlayId) {
        const overlays = ['visit-overlay', 'location-overlay', 'contact-overlay'];
        const activeTabClass = 'active';

        // Get corresponding tab elements
        const tabMap = {
            'visit-overlay': 'tab-visit',
            'location-overlay': 'tab-location',
            'contact-overlay': 'tab-contact'
        };

        const targetOverlay = document.getElementById(overlayId);
        if (!targetOverlay) return;

        const isAlreadyVisible = !targetOverlay.classList.contains('hidden');

        // Close all overlays and deactivate tabs first
        overlays.forEach(id => {
            toggleOverlay(id, false);
            const tBtn = document.getElementById(tabMap[id]);
            if (tBtn) tBtn.classList.remove(activeTabClass);
        });

        // If it wasn't already open, open it!
        if (!isAlreadyVisible) {
            toggleOverlay(overlayId, true);
            const targetTab = document.getElementById(tabMap[overlayId]);
            if (targetTab) targetTab.classList.add(activeTabClass);

            if (overlayId === 'visit-overlay') {
                const iframe = document.getElementById('visit-iframe');
                const panoramaContainer = document.getElementById('panorama-360-container');
                const externalUrl = window.uiSettings?.settings?.ui?.visitUrl;
                
                if (externalUrl) {
                    if (panoramaContainer) panoramaContainer.classList.add('hidden');
                    if (iframe) {
                        iframe.classList.remove('hidden');
                        if (iframe.src !== externalUrl) iframe.src = externalUrl;
                    }
                } else {
                    // Use pre-resolved images (stored during init) or fetch them now
                    const vvImages = window.virtualVisit360?._pendingImages?.length > 0
                        ? window.virtualVisit360._pendingImages
                        : await getVirtualVisitImages();

                    if (vvImages && vvImages.length > 0 && window.virtualVisit360) {
                        if (iframe) iframe.classList.add('hidden');
                        if (panoramaContainer) panoramaContainer.classList.remove('hidden');
                        // Wait one frame so the overlay is fully visible before init
                        // (the container must have non-zero dimensions for the renderer)
                        requestAnimationFrame(() => {
                            window.virtualVisit360.init();
                            window.virtualVisit360.setImages(vvImages);
                            // Force resize after short delay to ensure correct dimensions
                            setTimeout(() => window.virtualVisit360.onWindowResize(), 100);
                        });
                    } else if (iframe && iframe.src) {
                        if (panoramaContainer) panoramaContainer.classList.add('hidden');
                        iframe.classList.remove('hidden');
                    }
                }
            }

            if (overlayId === 'location-overlay') {
                const locUrl = window.uiSettings?.settings?.ui?.locationUrl || '42.1158762,12.7758299';
                const streetAddr = window.uiSettings?.settings?.ui?.locationAddress || window.uiSettings?.settings?.ui?.contact?.address || '123 Premium Real Estate Ave, Paris';
                const combinedAddress = `${streetAddr} • ${locUrl}`;

                const iframe = document.getElementById('location-iframe');
                if (iframe && (!iframe.src || iframe.src === 'about:blank' || iframe.src.includes(window.location.host))) {
                    iframe.src = formatGoogleMapsEmbedUrl(locUrl);
                }

                const locValAddress = document.getElementById('loc-val-address');
                if (locValAddress) locValAddress.textContent = combinedAddress;

                const openMapsBtn = document.getElementById('loc-open-maps-btn');
                if (openMapsBtn) {
                    if (locUrl.includes('google.com') || locUrl.includes('google.fr')) {
                        openMapsBtn.href = locUrl;
                    } else {
                        openMapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locUrl)}`;
                    }
                }
            }
        }
    }

    // Direct show/hide helper for overlays
    function toggleOverlay(id, show) {
        const el = document.getElementById(id);
        if (!el) return;

        if (show) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }

    // Export overlay toggle to global scope so closing button markup onclick works perfectly
    window.toggleOverlay = toggleOverlay;

    // Apply translations on UI elements
    function setLanguage(lang) {
        if (!TRANSLATIONS[lang]) return;
        currentLang = lang;

        // Apply HTML document attributes for RTL support (Arabic)
        const root = document.documentElement;
        const body = document.body;

        if (lang === 'ar') {
            body.classList.add('rtl');
            root.setAttribute('dir', 'rtl');
            root.setAttribute('lang', 'ar');
        } else {
            body.classList.remove('rtl');
            root.removeAttribute('dir');
            root.setAttribute('lang', lang);
        }

        // Translate labels inside toolbar
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            if (lang === 'fr') themeBtn.title = "Basculer le thème Clair/Sombre";
            else if (lang === 'ar') themeBtn.title = "تبديل المظهر الفاتح/الداكن";
            else themeBtn.title = "Toggle Light/Dark Theme";
        }

        const t = TRANSLATIONS[lang];
        
        // Form inputs and titles
        setElText('lbl-unit-type', t.unitType);
        setElText('opt-all-types', t.allTypes);
        setElText('lbl-surface', t.surface);
        setElText('lbl-levels', t.levels);
        setElText('lbl-search', t.search);
        setElText('btn-text-reset', t.reset);
        
        // Tabs
        setElText('tab-text-visit', t.visit);
        setElText('tab-text-location', t.location);
        setElText('tab-text-contact', t.contact);

        // Input Placeholder
        const searchInput = document.getElementById('filter-search');
        if (searchInput) searchInput.placeholder = t.searchPlaceholder;

        // Overlays Titles
        setElText('overlay-title-visit', t.visit);
        setElText('overlay-title-location', t.projectLocation);
        setElText('overlay-title-contact', t.contactUs);
        setElText('loc-open-maps-text', t.openMaps);

        // Contact Address Labels
        setElText('loc-lbl-address', `${t.addressLabel}:`);
        setElText('loc-lbl-phone', `${t.phoneLabel}:`);
        setElText('loc-lbl-email', `${t.emailLabel}:`);

        setElText('contact-lbl-address', t.addressLabel);
        setElText('contact-lbl-phone', t.phoneLabel);
        setElText('contact-lbl-email', t.emailLabel);

        // Form Inputs Placeholders
        setInputPlaceholder('contact-name', t.namePlaceholder);
        setInputPlaceholder('contact-email', t.emailPlaceholder);
        setInputPlaceholder('contact-phone', t.phonePlaceholder);
        setInputPlaceholder('contact-message', t.messagePlaceholder);
        setElText('btn-contact-submit', t.sendBtn);

        // Apartment details
        setElText('lbl-apt-details', t.aptDetailsTitle);
        setElText('lbl-apt-unit', t.aptUnit);
        setElText('lbl-apt-surface-int', t.aptSurfaceInt);
        setElText('lbl-apt-surface-ext', t.aptSurfaceExt);
        setElText('lbl-apt-terrace', t.aptTerrace);
        setElText('lbl-apt-type', t.aptType);
        setElText('lbl-apt-rooms', t.aptRooms);
        setElText('lbl-apt-orientation', t.aptOrientation);

        // Re-populate Property dropdown to translate custom room additions
        populatePropertyTypesDropdown(loadedUnits);
        
        // Re-trigger displays
        updateSliderDisplays('surface');
        updateSliderDisplays('levels');

        // Re-align double slider tracks
        triggerInputEvent(document.getElementById('slider-surface-min'));
        triggerInputEvent(document.getElementById('slider-levels-min'));
    }

    function setElText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function setInputPlaceholder(id, placeholder) {
        const el = document.getElementById(id);
        if (el) el.placeholder = placeholder;
    }

    // Global feedback toast helper
    function showGlobalToast(message, type = 'success') {
        // Check if setup toast exists, else create one
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.bottom = '30px';
            container.style.right = '30px';
            container.style.zIndex = '10000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Minimal visual premium styling
        toast.style.background = type === 'success' ? 'rgba(0, 200, 81, 0.95)' : 'rgba(255, 68, 68, 0.95)';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '13px';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        toast.textContent = message;

        container.appendChild(toast);

        // Slide in
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 50);

        // Disappear
        setTimeout(() => {
            toast.style.transform = 'translateY(-20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Boot filters
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFilters);
    } else {
        initFilters();
    }

})();
