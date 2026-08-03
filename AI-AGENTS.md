# 360-Viewer Project Rules

Welcome to the 360-Viewer project. 

## Primary Documentation
When working on this repository, you MUST always consult the following core documentation files for architectural and style guidelines before making changes:
- `.agents\AI-AGENT-GUIDE.md`
- `.agents\AI_AGENT_ARCHITECTURE.md`

**Hierarchical Module Contexts:**
When working on specific modules, you MUST load and adhere to the module-specific context files:
- UI / DOM / Overlays: `.agents\modules\UI.md`
- 3D / WebGL / Raycasting: `.agents\modules\3D.md`
- Data / Supabase / State: `.agents\modules\DATA.md`
- Particle Effects: `.agents\modules\PARTICLES.md`

## Quick Reference Rules
1. **Vanilla Stack Rule**: Avoid introducing heavy frameworks (React, Vue, Tailwind). Keep components modular in pure JavaScript and CSS.
2. **CSS Specificity**: Stick strictly to Vanilla CSS. 
3. **No Imports/Exports**: Do not attempt to use `import / export` syntax. All scripts share the global `window` scope.
4. **Localization Rule**: When adding new UI text, always add keys to `TRANSLATIONS` in `viewer-filters.js`.
5. **Git Operations**: Use `git-commit.bat` for local commits and `git-push.bat` to sync with GitHub.
6. **Multi-Tenant Safeguard**: Always test changes with explicit `clientID` parameters (this is the main test project `?clientID=CLT695425`).
