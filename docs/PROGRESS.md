# Progress Ledger

Last updated: 2026-07-12 (Europe/London)

## Current status

Release candidate implemented, browser-verified, and live on Firebase Hosting. Core science, 3D scene, annual playback, progressive city-comparison chart, guided discoveries, responsive UI, local assets, and release configuration are complete. Remaining release actions: final post-change check/redeploy, commit, and push.

## Milestones

- [x] Confirm empty repository and correct Git remote
- [x] Define mission, scientific language contract, ten learning scenarios, architecture, and working rules
- [x] Create provider-independent `AGENTS.md` and `CLAUDE.md` pointer
- [x] Scaffold React/TypeScript/Three.js project
- [x] Implement/test astronomy functions and simulation state
- [x] Implement realistic Earth–Sun scene and camera modes
- [x] Implement city focus, playback, charts, comparisons, and discoveries
- [x] Bundle and document production textures
- [x] Responsive/accessibility pass
- [x] Automated checks and browser QA
- [ ] GitHub commit and push
- [x] Firebase configure, deploy, and verify

## Known environment state

- Node: v25.8.1; npm: 11.11.0
- Git remote: `https://github.com/AlxSviridov/EarthModel.git`
- Repository default branch: `main`; remote repository was empty at clone time
- `gh auth status` reports the saved GitHub token invalid. Plain Git credential helper has not yet been tested for push.
- Firebase CLI is available through `npx firebase-tools@latest`; signed-in account verified.
- Dedicated Firebase project created: `earthmodel-orbit-lab` (project number `652009410953`).

## Next concrete action

Run final `npm run check`, redeploy the progressive-chart refinement, verify the public URL, then commit/push `main`.

## Decision log

- 2026-07-12 — Chose React + TypeScript + Vite + R3F/Drei + Zustand + custom SVG chart.
- 2026-07-12 — Circular, compressed orbit selected for teaching clarity; real 23.44° axial behavior retained and view labeled not to scale.
- 2026-07-12 — Daylight uses conventional -0.833° apparent sunrise altitude; equinox described as near-equal rather than exactly 12 h.
- 2026-07-12 — NASA Blue Marble / Black Marble selected as preferred production imagery, bundled locally with provenance.
- 2026-07-12 — Browser QA fixed mirrored city coordinates, globe annotation collisions, and incomplete camera transitions; verified desktop and 390×844 mobile layouts.
- 2026-07-12 — Created dedicated Firebase project `earthmodel-orbit-lab`; configured immutable asset caching and SPA fallback.
- 2026-07-12 — First live deployment verified at `https://earthmodel-orbit-lab.web.app/` with the WebGL scene and local textures loaded successfully.
