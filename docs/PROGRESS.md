# Progress Ledger

Last updated: 2026-07-12 (Europe/London)

## Current status

Version 2 is implemented, verified, and live at `https://earthmodel-orbit-lab.web.app/`. Extensive browser QA covers all eight playback speeds, date/time invariants, camera tracking/release/recall, both Sky paths comparison modes, Sundial calibration, five responsive sizes, chart fit, and zero horizontal overflow. The focused-city scene uses true local solar geometry rather than UTC spin, tracking can keep a city centred, and the scene exposes Full orbit plus direct equinox/solstice jumps. Automated checks and the final live regression pass with no browser errors.

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
- [x] GitHub commit and push
- [x] Firebase configure, deploy, and verify

### Version 2

- [x] Convert feedback into interaction/science/responsive acceptance contracts
- [x] Extend astronomy engine for solar position, local solar time, equation of time, sundial error, polar gnomon shadow, and dial hour lines
- [x] Split playback into Year journey and One day modes
- [x] Rebuild adaptive typography/layout/chart
- [x] Upgrade procedural Sun, orbit visibility, and camera behavior
- [x] Correct focused-city local solar rotation, add releasable city tracking, and expose seasonal orbit navigation
- [x] Build comparative Sky paths lab
- [x] Build Sundial calibration/error lab
- [x] Automated and exhaustive browser QA matrix
- [x] Firebase deploy/live verification
- [~] GitHub commit/push and final ledger update

## Known environment state

- Node: v25.8.1; npm: 11.11.0
- Git remote: `https://github.com/AlxSviridov/EarthModel.git`
- Repository default branch: `main`; remote repository was empty at clone time
- `gh auth status` reports the saved GitHub token invalid. Plain Git credential helper has not yet been tested for push.
- Firebase CLI is available through `npx firebase-tools@latest`; signed-in account verified.
- Dedicated Firebase project created: `earthmodel-orbit-lab` (project number `652009410953`).

## Next concrete action

Commit the completed v2 release, push `main`, and confirm a clean synchronized worktree.

## Decision log

- 2026-07-12 — Chose React + TypeScript + Vite + R3F/Drei + Zustand + custom SVG chart.
- 2026-07-12 — Circular, compressed orbit selected for teaching clarity; real 23.44° axial behavior retained and view labeled not to scale.
- 2026-07-12 — Daylight uses conventional -0.833° apparent sunrise altitude; equinox described as near-equal rather than exactly 12 h.
- 2026-07-12 — NASA Blue Marble / Black Marble selected as preferred production imagery, bundled locally with provenance.
- 2026-07-12 — Browser QA fixed mirrored city coordinates, globe annotation collisions, and incomplete camera transitions; verified desktop and 390×844 mobile layouts.
- 2026-07-12 — Created dedicated Firebase project `earthmodel-orbit-lab`; configured immutable asset caching and SPA fallback.
- 2026-07-12 — First live deployment verified at `https://earthmodel-orbit-lab.web.app/` with the WebGL scene and local textures loaded successfully.
- 2026-07-12 — Final progressive-chart release verified live (trace growth, pause state, and direct-link refresh), committed as `eed8613`, and pushed to GitHub `main`.
- 2026-07-12 — Version 2 design separates annual and daily time scales; rejects velocity-sensitive combined scrubbing in favour of explicit, repeatable date and local-solar-time controls.
- 2026-07-12 — Version 2 adds connected Orbit, Sky paths, and Sundial labs with an explicit browser QA matrix and 11 px minimum meaningful text.
- 2026-07-12 — Browser QA confirmed annual playback holds 12:00 across 1/7/30/90 days/s; daily playback holds the date across ¼/1/4/12 h/s; camera drag persists and active preset recalls; 390/768/1024/1280/1600-width layouts have no horizontal overflow and measured charts fit their containers.
- 2026-07-12 — Consolidated QA fixes: north-azimuth path seam, low-z scene labels, lab scroll reset, final 11 px label floor, right-edge chart label anchoring, true latitude-dependent sundial hour lines/polar gnomon, ±30-minute chart domain, and sundial date presets.
- 2026-07-12 — Final deployment blocked when automatic approval review reported the Codex usage limit reached; do not reattempt until approvals are available.
- 2026-07-12 — Corrected the scene's time reference: the focused city's longitude and selected local solar hour now determine Earth spin relative to the current Sun direction. Added explicit tracked-city camera mode (released by drag) and an in-scene orbit/season navigator.
- 2026-07-12 — Final v2 release deployed and verified live. Fixed Firebase caching so the app shell and code revalidate on release; textures remain immutable. Live London sunrise/tracking/orbit checks and console log passed.
