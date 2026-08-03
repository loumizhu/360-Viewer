# 360 Viewer Project - Architecture & Context for AI Agents

Welcome to the 360 Viewer Project! If you are an AI agent analyzing or working on this codebase, this document contains critical architecture guidelines, script load sequences, and system boundaries.
When editing this project, identify which modules is concerned by the changes first, then intervene within the concerned module.

> [!IMPORTANT]
> **RULE**: Whenever you modify the architecture, add a new file, or change module boundaries, you MUST update these `.agents` files to keep them strictly up to date.

## System Overview

This project is a Vanilla JavaScript frontend web application built to display 3D real estate architectural models. It relies heavily on `Three.js` (r128) and local file systems, with dynamic client data fetched via JSON files and a Supabase backend cache integration. 

**Core Philosophies:**
1. **No Frameworks:** Do not use React, Vue, or Angular. This is strict vanilla ES6 JavaScript, HTML, and CSS.
2. **Modular Namespaces:** The app uses strict Namespaces/IIFEs (`window.AppData`, `window.AppUI`, `window.App3D`, `window.AppParticles`) to enforce module boundaries.
3. **Client Configs over Hardcoding:** Features are loaded dynamically based on a `clientID` URL parameter.

## Key Files & Responsibilities

**For deep module specifics, you MUST load the respective context files in `.agents/modules/`.**

### Data Module (`window.AppData`) -> see `.agents/modules/DATA.md`
- **`supabase-client.js`**: Supabase cloud database client wrapper.
- **`unit-database-sync.js`**: Live database synchronization for unit attributes.
- **`settings.js`**: Handles fetching client-specific config files (`settings.json`).

### UI Module (`window.AppUI`) -> see `.agents/modules/UI.md`
- **`viewer-filters.js`**: Handles dynamic filtering logic, audits client directory for assets, controls tabs.
- **`ui-settings.js`**: Generates and manages the Settings UI pane.

### 3D Module (`window.App3D`) -> see `.agents/modules/3D.md`
- **`viewer3d.js`**: Core 3D engine. Scene setup, camera, lights, mesh loading, raycasting.
- **`virtual-visit-360.js`**: Three.js viewer for equirectangular panoramas.

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
