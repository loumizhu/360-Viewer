/**
 * Supabase Client Configuration
 * This file initializes the connection to your Supabase database.
 */

// Replace 'YOUR_SUPABASE_ANON_KEY' with your actual anon public key from Supabase settings
// Replace 'YOUR_SUPABASE_ANON_KEY' with your actual public key from Supabase settings
const SUPABASE_URL = 'https://exxkpokuewxvpixrmofo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WSIAr3oQA_EwTO-L1D9baA_MfRYeBCX'; 

// Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetches unit information from the 'units' table
 * @returns {Promise<Array>} List of units
 */
async function fetchUnitsFromDatabase() {
    try {
        const { data, error } = await supabaseClient
            .from('Units')
            .select('*')
            // Add deterministic sorting so rows don't jump around after updates
            .order('ID', { ascending: true });

        if (error) {
            console.error('[Supabase] Error fetching units:', error.message);
            return [];
        }

        console.log('[Supabase] Units loaded successfully:', data);
        return data;
    } catch (err) {
        console.error('[Supabase] Unexpected error:', err);
        return [];
    }
}

// Cache the resolved column name to avoid repeated discovery
let cachedUnitColumn = null;

/**
 * Helper to find the column that holds the unit identifier (e.g. "A009")
 */
async function resolveUnitColumn() {
    if (cachedUnitColumn) return cachedUnitColumn;

    console.log('[Supabase] Resolving unit column name...');
    try {
        // Fetch one row to inspect keys
        const { data, error } = await supabaseClient
            .from('Units')
            .select('*')
            .limit(1)
            .single();

        if (error || !data) {
            console.warn('[Supabase] Could not fetch sample row to resolve column:', error);
            // Fallback
            return 'unit_number';
        }

        const keys = Object.keys(data);
        console.log('[Supabase] Available columns:', keys);

        // Candidates in order of likelihood based on user feedback and common naming
        // User's DB has "Unit Number" (with space) or "Property Name"
        const candidates = ['Unit Number', 'Property Name', 'unit_number', 'unit', 'name', 'code', 'title', 'formatted_name', 'unit_name'];
        
        for (const candidate of candidates) {
            if (keys.includes(candidate)) {
                console.log(`[Supabase] Resolved unit column as: '${candidate}'`);
                // If the column has spaces, we need to handle it carefully in queries
                cachedUnitColumn = candidate;
                return candidate;
            }
        }
        
        // If we still haven't found a match, check for *any* column containing 'unit'
        const wildCard = keys.find(k => k.includes('unit') && k !== 'id');
        if (wildCard) {
            console.log(`[Supabase] resolved wildcard unit column as: '${wildCard}'`);
            cachedUnitColumn = wildCard;
            return wildCard;
        }

        console.warn('[Supabase] Could not identify unit column, defaulting to unit_number');
        return 'unit_number';

    } catch (err) {
        console.error('[Supabase] Error resolving column:', err);
        return 'unit_number';
    }
}

/**
 * Example function to get a specific unit by ID or Unit Number
 * @param {string} unitId 
 */
async function getUnitDetails(unitId) {
    console.log(`[Supabase] Fetching details for: "${unitId}"`);
    
    const targetColumn = await resolveUnitColumn();
    
    // We search by the resolved column (case-insensitive)
    // If the column has spaces (e.g. "Unit Number"), we must quote it for the query builder
    const queryColumn = targetColumn.includes(' ') ? `"${targetColumn}"` : targetColumn;
    
    const { data, error } = await supabaseClient
        .from('Units')
        .select('*')
        .ilike(queryColumn, unitId)
        .single();
    
    if (data) console.log('[Supabase] Match found:', data);
    else console.warn(`[Supabase] No match found for: ${unitId} in column: ${targetColumn}`);

    if (error) {
        console.error(`[Supabase] Error fetching unit ${unitId}:`, error.message);
        return null;
    }

    return data;
}

// Export for use in other scripts
window.db = {
    client: supabaseClient,
    fetchUnits: fetchUnitsFromDatabase,
    getUnitDetails: getUnitDetails,
    resolveUnitColumn: resolveUnitColumn
};

