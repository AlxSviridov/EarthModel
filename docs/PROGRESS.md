# Progress Ledger

Last updated: 2026-08-30 (Europe/London)

## Current status

Version 4 is in progress, one feature per commit. The first slice makes an investigation
shareable: the sky viewpoint, sky layer toggles, and sundial calibration date move from
component state into the store, and a tested pure codec puts the whole setup in the query
string. A link opens the same lab, date, cities, viewpoint, layers, and pinned traces in a
browser that has never seen the app, and it overrides saved local preferences without a
flash of the previous session. The writer stays quiet during playback, so scrubbing and
playing never touch browser history.

The second slice gives the globe real surface relief, from a NASA elevation raster converted
to a normal map by a committed script. The perturbed normal only shades the lit side and is
weighted toward grazing light, so mountains appear along the day/night line the way they do
from orbit, while the terminator itself stays a clean arc driven by geometry alone. A missing
texture degrades to the previous flat globe rather than blanking the scene. Still to come:
the extended discovery deck and the Moon phases lab.

Version 3 rebuilds the Sky paths lab around a 3D sky dome: a compass horizon with N-S and
east-west ground lines, the east-west great circle that splits the sky into a north half
and a south half, altitude rings, and up to four comparable traces that are free
(city, date) pairs. Each trace draws its whole 24-hour path with the night portion dimmed
beneath the ground, hour marks, and a Sun marker at the shared local solar hour. Optional
layers add a ghost arc for every month and the annual sunrise band. The flat panorama
remains below the dome, cross-highlighted, and carries the lab if WebGL is unavailable.
Two readout lines per trace keep "rises north of due east" and "crosses the east-west
line" separate, because the first depends only on the date and the second also depends on
latitude. Automated checks pass and the browser QA matrix in `docs/QA-V3.md` is green.

Version 2 was implemented, verified, and live at `https://earthmodel-orbit-lab.web.app/`. Extensive browser QA covers all eight playback speeds, date/time invariants, camera tracking/release/recall, both Sky paths comparison modes, Sundial calibration, five responsive sizes, chart fit, and zero horizontal overflow. The focused-city scene uses true local solar geometry rather than UTC spin, tracking can keep a city centred, and the scene exposes Full orbit plus direct equinox/solstice jumps. Automated checks and the final live regression pass with no browser errors.

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
- [x] GitHub commit/push and final ledger update

### Version 3

- [x] Verify the phenomenon against the repository's own model before designing
- [x] Add tested pure functions for sun tracks, horizon events, compass naming, and the annual sunrise range
- [x] Build the 3D sky dome scene with compass horizon, east-west great circle, and per-trace arcs
- [x] Replace the two fixed comparison modes with free (city, date) traces, one live and up to three pinned
- [x] Extract and fix the flat panorama: memoised paths, adaptive sampling near the zenith, table alternative
- [x] Add the scene error boundary, WebGL probe, and reduced-motion hook
- [x] Add a true first-person "Look around" viewpoint that turns on the spot, Street View style
- [x] Automated checks and the version 3 browser QA matrix
- [x] GitHub commit/push
- [ ] Firebase deploy and live verification — blocked on credentials, see below

### Version 4

- [x] Lift sky viewpoint, sky layers, and sundial calibration from component state into the store
- [x] Add a tested URL codec, startup hydration that beats saved state, a throttled writer, and a Copy link button
- [x] Add bundled NASA elevation relief to the globe shader
- [x] Extend the discovery deck to every scenario and build a real predict-before-reveal
- [ ] Build the Moon phases lab on a tested lunar module
- [ ] Firebase deploy — still blocked on the same missing credentials

## Known environment state

- Node: v25.8.1; npm: 11.11.0
- Git remote: `https://github.com/AlxSviridov/EarthModel.git`
- Repository default branch: `main`; remote repository was empty at clone time
- `gh auth status` reports the saved GitHub token invalid. Plain Git credential helper has not yet been tested for push.
- Firebase CLI is available through `npx firebase-tools@latest`, but **this container holds no Firebase credentials**: `~/.config/configstore/firebase-tools.json` contains only cached MOTD data and no token, and no `FIREBASE_TOKEN` or `GOOGLE_APPLICATION_CREDENTIALS` is set. `firebase deploy` fails with "Failed to authenticate, have you run firebase login?". The earlier "signed-in account verified" note applied to a previous container. Deploying needs an interactive `firebase login` or a CI token/service account supplied to the session.
- Dedicated Firebase project created: `earthmodel-orbit-lab` (project number `652009410953`).

## Next concrete action

Version 4 is in progress on `claude/current-status-qvya12`, landing one feature per commit.
Shareable URL state is done and verified; surface relief, the extended discovery deck, and
the Moon phases lab follow in that order.

The Firebase deploy is still outstanding and still blocked on credentials in this container,
now covering versions 3 and 4 together. Once credentials exist, run
`npx firebase-tools@latest deploy --only hosting` and repeat the London June/December check
on the live URL. For later changes, preserve the dome frame, the single apparent-horizon
convention, and the separation between sunrise direction and east-west crossing recorded in
`AGENTS.md` and `docs/ARCHITECTURE.md`.

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
- 2026-07-12 — Version 2 release committed as `aa65593` and pushed to GitHub `main`.
- 2026-08-30 — Verified the target phenomenon against the repository's own declination model before designing. London rises 48.9° NE on 21 June and 128.5° SE on 21 December, which confirmed the request; Quito rises 66.5° NE in June yet stays north all day, which disproved the single "crosses the east-west line" verdict originally planned.
- 2026-08-30 — Split the readout into two lines. Sunrise north of due east follows from declination alone and holds at every latitude in both hemispheres; crossing the east-west line additionally needs |latitude| > |declination|. One combined verdict would have taught a falsehood near the equator.
- 2026-08-30 — Unified on the apparent -0.833° horizon everywhere. The old lab drew its arc from 0° while quoting -0.833° sunrise times.
- 2026-08-30 — Chose a 3D dome over the flat panorama as the primary view. The 0°/360° seam that QA patched in version 2 is intrinsic to the projection, and near-zenith transits that spike a flat chart are smooth on a dome.
- 2026-08-30 — Dropped the planned "From the east" viewpoint as geometrically degenerate: viewing along the east-west axis collapses the symmetric morning and afternoon halves onto each other. "Whole sky" replaced it and became the default, because a June arc at London spans 262° of azimuth and cannot be seen whole from inside the dome. "Standing here" remains as the immersive view, pitched by the day's noon altitude with a wider lens so horizon and arc share the frame.
- 2026-08-30 — Introduced the first error boundary in the project, with a WebGL probe, wrapping both 3D scenes; and a reduced-motion hook, since the existing CSS-only rule could not stop the animation loop or camera easing.
- 2026-08-30 — Added a real first-person viewpoint after review. The previous "Standing here" preset still used `OrbitControls`, so dragging orbited the camera around a point ahead of the viewer rather than turning it on the spot. "Look around" now pins the camera to the eye point and drives heading and pitch directly, Street View style, with the wheel changing field of view instead of distance. The two outside viewpoints keep `OrbitControls`.
- 2026-08-30 — Version 4 lifts the sky viewpoint, sky layer toggles, and sundial calibration date out of component state into the store. They were unreachable from outside their own lab, which blocked both link sharing and any guided discovery that wants to set them.
- 2026-08-30 — Investigation state is shared through the query string rather than a hash or a route. Firebase already rewrites every path to `index.html`, and a query keeps the link readable. Separators are `.` and `_` because `URLSearchParams` leaves them alone; commas would percent-encode. Defaults are omitted so a first-time visitor sees a clean address bar.
- 2026-08-30 — A shared link overrides saved local preferences, applied synchronously before the first render so there is no flash of the previous session. The writer uses `replaceState` and stays silent while playback runs, because the ticker writes state every animation frame; measured 1 history call across 3 s of playback instead of roughly 180.
- 2026-08-30 — Persisted store gains `version: 1` with a pass-through migration rather than a new storage key, so the added fields arrive at their defaults while a learner keeps their saved cities.
- 2026-08-30 — Globe surface relief uses a real NASA elevation-derived normal map, built by a committed script from the 21600x10800 topography raster. Deriving relief from the day texture's brightness was rejected: brightness is not elevation, and inventing terrain a learner would read as real is the visual shortcut AGENTS.md rule 1 forbids.
- 2026-08-30 — The relief tangent frame is built in object space, not world space. The mesh sits inside the axial-tilt group, so a world-space frame would twist by up to the tilt angle and change as the learner drags the tilt slider.
- 2026-08-30 — The day/night blend keeps the geometric normal; the perturbed normal only adds a bounded diffuse term weighted toward grazing light. With the sharp terminator on the blend band is about 2 degrees of arc, and a 5-degree slope would displace it by more than twice that, shattering the terminator. Relief is left invisible on the night side because Black Marble is an emissive measurement and shading it would invent signal.
- 2026-08-30 — The relief texture loads outside drei's suspending loader, so a missing file costs one visual effect rather than blanking the scene. The Earth boundary message no longer claims WebGL is missing when the real fault was an image.
- 2026-08-30 — Fixed the limb glow, which dotted a world-space normal against a fixed world +Z: the glow was pinned to one side of the globe and slid across the visible disc as the camera orbited. Called out explicitly rather than folded in silently, since it changes an appearance shipped since v1.
- 2026-08-30 — Corrected `docs/ARCHITECTURE.md`, which listed a cloud shell in the rendering layers. There has never been one in the code.
- 2026-08-30 — The discovery deck now covers all 24 learning scenarios, not 10. The `Discovery` type became data-driven because scenarios 11-24 are defined by state the old type could not express: a lab, a playback mode and speed, a sky viewpoint, layer toggles, pinned traces, a sundial calibration date. The old camera rule keyed off array position (`index === 7 || index === 8`), so inserting a scenario would have silently broken it.
- 2026-08-30 — The launch cascade is extracted as a pure `discoveryState()` and tested there. The project has no DOM test environment, and adding jsdom plus a React testing stack to cover one function would have been a large dependency for a small gain.
- 2026-08-30 — Predict-before-reveal is now real. The prompt was previously identical boilerplate on all ten discoveries and the answer rendered beside the question, so nothing was ever withheld; scenario 10's acceptance criterion was met only in wording. Nine discoveries now hold their insight back until the learner picks, and the response is encouraging rather than scored.
- 2026-08-30 — Added Escape-to-close, a focus trap and focus return to the discovery drawer, and gave the Discoveries and How it works buttons `aria-label`s: below 1000 px their text labels are hidden by CSS, which left them as icon buttons with no accessible name.
