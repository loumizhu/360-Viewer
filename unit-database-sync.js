/**
 * Unit Database Sync
 * Synchronizes Supabase data with the UI elements in the viewer
 */

(function() {
    'use strict';

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
        // We assume the 'units' table has a column 'client_id' or 'id' that matches our clientID
        try {
            const { data, error } = await window.db.client
                .from('units')
                .select('*')
                .or(`client_id.eq.${clientID},id.eq.${clientID}`)
                .single();

            if (error) {
                console.warn('[Sync] Unit not found in database or error:', error.message);
                return;
            }

            if (data) {
                console.log('[Sync] Data found:', data);
                updateUI(data);
            }
        } catch (err) {
            console.error('[Sync] Error during fetch:', err);
        }
    }

    function updateUI(unit) {
        // Mapping database columns to UI element IDs
        const mapping = {
            'unit_name': 'unit-value',
            'surface_interior': 'surface-interior-value',
            'surface_exterior': 'surface-exterior-value',
            'terrace': 'terrace-value',
            'unit_type': 'type-value',
            'rooms': 'rooms-value',
            'orientation': 'orientation-value'
        };

        // Update text elements
        for (const [column, elementId] of Object.entries(mapping)) {
            const el = document.getElementById(elementId);
            if (el && unit[column] !== undefined) {
                el.textContent = unit[column];
                
                // Add a subtle "synced" animation or class if desired
                el.classList.add('synced-value');
            }
        }

        // Update plan image if available
        if (unit.plan_2d_url) {
            const planImg = document.getElementById('plan-image');
            if (planImg) {
                planImg.src = unit.plan_2d_url;
            }
        }

        // Store globally for other scripts to use
        window.currentUnitData = unit;
        
        // Dispatch event so other components know data is ready
        window.dispatchEvent(new CustomEvent('unitDataLoaded', { detail: unit }));
    }

    // Initialize sync
    function init() {
        // 1. Check if data is already loaded globally
        if (window.currentUnitData) {
            updateUI(window.currentUnitData);
        }

        // 2. Listen for future data loads (from viewer3d.js or elsewhere)
        window.addEventListener('unitDataLoaded', (event) => {
            console.log('[Sync] Received unitDataLoaded event:', event.detail);
            updateUI(event.detail);
        });

        // 3. Fallback: If viewer3d isn't active, fetch manually
        setTimeout(() => {
            if (!window.currentUnitData && window.db && window.db.client) {
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
