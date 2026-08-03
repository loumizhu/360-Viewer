# UI Module Context

**Files:** `ui-interactions.js`, `ui-settings.js`, `viewer-filters.js`, `plan-panel-interactions.js`, `image-info-updater.js`

## Boundaries & Contracts
- The UI layer MUST NOT directly mutate the 3D scene or Data layer.
- **Event Bus:** UI components should dispatch custom events (e.g., `document.dispatchEvent(new CustomEvent('updateFilteredHighlight', { detail: ... }))`) to communicate state changes to the 3D and Data modules.
- **Namespace:** We are migrating to exposing methods on `window.AppUI = { ... }`.

## Design Constraints
1. **Vanilla Stack:** Use strict vanilla JS and CSS. No React, Vue, or Tailwind.
2. **CSS Specificity:** Maintain the existing complex pseudo-selectors and overlay z-index hierarchy (1000+).
3. **Localization:** Any new UI text MUST be added to `TRANSLATIONS` in `viewer-filters.js` and wired in `setLanguage()`.
