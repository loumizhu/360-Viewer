# PARTICLES Module Context

**Files:** `ambient-particles.js`, `box-particles.js`, `cursor-particles.js`

## Boundaries & Contracts
- Particle systems are visual embellishments. They should be self-contained and expose lifecycle methods (`init`, `update`, `dispose`).
- **Namespace:** We are migrating to exposing methods on `window.AppParticles = { ... }`.

## Design Constraints
- Refer to `OSCILLATING-PARTICLES.md` for specific math and shader constraints regarding the particle mechanics.
- Ensure particle rendering hooks into the main animation loop cleanly without creating multiple decoupled `requestAnimationFrame` loops if possible.
