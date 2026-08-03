# DATA Module Context

**Files:** `supabase-client.js`, `unit-database-sync.js`, `settings.js`

## Boundaries & Contracts
- The Data layer handles Supabase interactions, state initialization, and local caching.
- It MUST NOT manipulate the DOM or the Three.js scene.
- **Namespace:** We are migrating to exposing methods on `window.AppData = { ... }`.
- **Event Bus:** Emit events like `unitDataLoaded` when data fetching is complete, so the UI and 3D modules can initialize.

## Design Constraints
1. **Multi-Tenant Safeguard:** Always account for the `clientID` parameter (e.g., `?clientID=CLT695425`).
2. **Data Structure:** Keep a clean, separated state object. When the database updates, broadcast the changes to the Event Bus.
