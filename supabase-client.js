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
            .from('units')
            .select('*');

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

/**
 * Example function to get a specific unit by ID
 * @param {string} unitId 
 */
async function getUnitDetails(unitId) {
    const { data, error } = await supabaseClient
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single();

    if (error) {
        console.error(`[Supabase] Error fetching unit ${unitId}:`, error.message);
        return null;
    }

    return data;
}

// Export for use in other scripts if needed (though we're using global scope here for simplicity in a static site)
window.db = {
    client: supabaseClient,
    fetchUnits: fetchUnitsFromDatabase,
    getUnitDetails: getUnitDetails
};
