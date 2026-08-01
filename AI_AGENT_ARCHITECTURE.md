# 360 Viewer Project - Architecture & Context for AI Agents

Welcome to the 360 Viewer Project! If you are an AI agent analyzing or working on this codebase, this document contains critical architecture guidelines, script load sequences, and system boundaries.

## System Overview

This project is a Vanilla JavaScript frontend web application built to display 3D real estate architectural models. It relies heavily on `Three.js` (r128) and local file systems, with dynamic client data fetched via JSON files and a Supabase backend cache integration. 

**Core Philosophies:**
1. **No Frameworks:** Do not use React, Vue, or Angular. This is strict vanilla ES6 JavaScript, HTML, and CSS.
2. **Sequential Script Loading:** The app does NOT use ES Modules (`type="module"`). Scripts are loaded sequentially in the HTML. Global scope is used for passing data (e.g., `window.viewer3D`, `window.uiSettings`). Do not break this load order.
3. **Client Configs over Hardcoding:** Features (like custom logos, themes, and images) are loaded dynamically based on a `clientID` URL parameter, fetching from respective `[clientID]/` folders (e.g. `CLT695425/`).

## Key Files & Responsibilities

- **`index.html`**: The main DOM shell. It initializes the Three.js canvas container, overlay panels (e.g., Location, Virtual Visit), the Toolbar, and the Settings Panel. All `.js` files are loaded at the bottom of the `<body>`.
- **`style.css`**: All styling. Uses CSS variables for dynamic theming (configured in `ui-settings.js`).
- **`viewer3d.js`**: The core 3D engine. Handles scene setup, camera, lights, mesh loading (`GLTFLoader`), raycasting for hover states, and post-processing effects (`EffectComposer`).
- **`ui-settings.js`**: Generates and manages the entire right-sided Settings UI pane. It saves preferences locally using `localStorage` and applies dynamic CSS variables to the DOM.
- **`settings.js`**: Handles fetching client-specific config files (`settings.json`) and overriding default parameters.
- **`viewer-filters.js`**: Handles dynamic filtering logic (e.g., filtering available/sold units), audits the client directory for custom assets (like checking for Virtual Visit images or Location strings), and controls the `tab-visit` / `tab-location` UI buttons.
- **`virtual-visit-360.js`**: A self-contained Three.js viewer specifically designed to project equirectangular 360° panoramas for interior room views.

## Critical Interaction Models

### 3D Raycasting & Hover State (`viewer3d.js`)
Hovering over meshes in the 3D scene uses `Raycaster`.
- **Applying Effects:** When hovered, `applyEffect()` is called. Effects (like Outline or Scan lines) often add helper meshes (e.g. `BoxHelper`) as **children** to the hovered object in the scene graph. 
- **Important Gotcha:** When hovering out, `clearAllEffects()` MUST be called. If you assign a new effect helper, you must first properly dispose of the old one (`geometry.dispose()`, `material.dispose()`) to prevent memory leaks and permanent "ghost" highlights.

### Virtual Visit 360 (`virtual-visit-360.js` vs `viewer-filters.js`)
- The virtual visit relies on auditing the `[clientID]/360-Virtual-Visit/` directory for images like `01-Room1.webp`. 
- `viewer-filters.js` uses `checkClientShowcaseTabs()` to test if these images exist by doing a dry-run `fetch()`. If found, it unhides the `#tab-visit` button in the toolbar and passes the images to `virtualVisit360`.

### UI Settings Initialization
- The `ui-settings.js` script dynamically builds a multi-tab sidebar interface (`buildSettingsUI`). 
- When generating complex layout sections (like Particles or Branding), it expects helper methods (e.g. `createBoxParticlesSection(targetParent)`) to append directly to the DOM parent to avoid rendering unattached DOM trees.

## Making Changes (Agent Rules)

1. **Avoid Syntax Errors in Global Scripts:** Because scripts are executed sequentially, a syntax error in an early script will completely break all scripts loaded after it, leaving the UI half-rendered.
2. **CSS Specificity:** Stick strictly to Vanilla CSS. The app uses complex pseudo-selectors (`:hover`, `:not()`, `.active`) and specific z-indexes (over `1000`) to manage the overlay hierarchy.
3. **Use Tooling Safely:** If searching for code, prefer `grep_search` and `view_file` rather than arbitrary shell commands to avoid encoding/formatting destruction. Always make targeted surgical edits using `replace_file_content`.

## Common Pitfalls
- Do not attempt to use `import / export` syntax. All scripts share `window` scope.
- Do not modify the original `.gltf` model files. All visual changes (like coloring available units green) are done via material overriding at runtime in `viewer3d.js` and `viewer-filters.js`.
