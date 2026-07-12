# EarthModel — Persistent Project Memory

This is the canonical, provider-independent memory for every coding agent working in this repository. Read this file first, then `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/PROGRESS.md`. Update `docs/PROGRESS.md` whenever a tracked slice is completed or a material decision changes.

## Mission

Build **Orbit Lab**, a production-quality, browser-based educational model that helps a curious 10-year-old understand why daylight changes through the year and with latitude. It must be scientifically honest, extremely visual, tactile, and enjoyable without requiring prior astronomy knowledge.

## Non-negotiable outcomes

- A realistic Three.js Earth with distinct NASA-derived daytime and nighttime imagery, atmospheric glow, clouds, a Sun, and a star field.
- City selection focuses the camera and places a readable marker.
- Annual timelapse shows orbit, axial tilt, rotation, local day/night state, and builds a daylight-length chart as time advances.
- Multiple cities can be compared with stacked/overlaid charts.
- Equinoxes are visually prominent. Teaching copy must say **approximately equal** day length: atmospheric refraction and the Sun's angular diameter make observed sunrise-to-sunset slightly longer than 12 hours.
- Playback speed, date scrubbing, camera orbit/zoom, and explanatory overlays.
- Responsive and keyboard-accessible controls, reduced-motion support, loading/error states, no required backend.
- Ten learning scenarios in `docs/PRODUCT.md` must be possible.
- Production build, browser QA, GitHub sync, and Firebase Hosting deployment.
- Version 2 has three first-class labs: **Orbit**, **Sky paths**, and **Sundial**. Shared city/date state should make moving between them feel like continuing one investigation.
- Annual playback holds local solar time fixed; daily playback holds the date fixed. Never visually alias many Earth rotations into a flickering annual timelapse.

## Working rules

1. Preserve scientific correctness over visual shortcuts. If the visualization is not to scale, label it.
2. The Earth’s axial direction stays fixed in inertial space as it orbits; do not tilt it toward the Sun all year.
3. Astronomy calculations use UTC internally. Learner-facing time in the Orbit and Sky paths labs is **local solar time**, because it maps noon directly to the Sun crossing the local meridian. Civil time zones and daylight-saving time remain out of scope.
4. Day length uses a standard solar-declination / sunrise-hour-angle model. Polar day/night must be handled without `NaN`.
5. Keep rendering code separate from astronomy/math. Pure science functions require tests.
6. Do not hotlink production textures. Bundle optimized assets and document origin/license in `docs/ASSETS.md`.
7. Keep the experience usable if WebGL or an individual texture fails.
8. Never commit credentials, Firebase tokens, or local environment files.
9. Run checks proportionate to changes: `npm run check` for ordinary code; browser interaction and visual QA for user-facing changes.
10. Update the progress ledger after meaningful work. Use `[x]`, `[~]`, `[ ]`, and record the next concrete action.
11. Text smaller than 11 CSS px is prohibited for meaningful UI; default body/controls target 13–15 px. The layout must be checked at 390×844, 768×900, 1024×768, 1280×720, and a wide desktop viewport.
12. Camera buttons are recallable presets. Focus City also enables explicit city tracking, which keeps the chosen place centred while Earth/light move; any pointer drag releases tracking and returns camera ownership to the learner.
13. The focused city defines the 3D scene's local solar clock. At 12:00 its meridian faces the Sun; at its computed sunrise/sunset it sits at the day edge. Pinned comparison cities are evaluated at the same local solar hour in each city's own sky, not at one simultaneous UTC instant.

## Intended commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
firebase deploy --only hosting
```

## Repository map

- `src/science/` — pure astronomy, coordinates, date helpers
- `src/scene/` — Three.js/R3F scene and shaders
- `src/components/` — interface and chart components
- `src/data/` — curated city and story/scenario data
- `src/styles/` — design tokens and responsive layout
- `public/textures/` — optimized, bundled image assets
- `docs/PRODUCT.md` — users, scenarios, feature/acceptance contract
- `docs/ARCHITECTURE.md` — implementation and science decisions
- `docs/PROGRESS.md` — resumable ledger, current status, next steps
- `docs/ASSETS.md` — provenance, licenses, processing notes

## Product voice and visual direction

Premium science-museum exhibit, not a dashboard template: deep ink space, warm solar amber, icy daylight blue, restrained glass panels, editorial typography, large readable numbers, and short child-friendly explanations. Prefer direct manipulation and guided discoveries to settings-heavy UI.
