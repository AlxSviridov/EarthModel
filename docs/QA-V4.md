# Version 4 QA

Scope: shareable URL state, globe surface relief, the extended discovery deck, and the
Moon phases lab. Each section is written when its slice lands.

## Shareable URL state

### Automated

`npm run check` — eslint reports 0 problems, vitest passes **36/36** (20 pre-existing plus
16 new), `tsc -b` and `vite build` succeed.

The 16 new cases in `src/store/urlState.test.ts` cover the claims the feature makes: a
default view encodes to the empty string, every field round-trips, the date survives at day
resolution, separators are not percent-encoded, the focus key is dropped when focus is just
the first selected city, unknown cities and unknown enum values are ignored rather than
thrown on, numbers clamp into their real ranges, non-numbers are dropped, pinned traces cap
at the three the lab can show, and empty/malformed/hostile query strings all decode without
throwing.

### Interaction

Driven in Chromium against the dev server.

| Step | Result |
|---|---|
| Fresh load, no saved state | `http://localhost:5173/` — no query written for a default view |
| Switch to Sky paths | `?lab=sky` |
| Switch viewpoint to Look around | `?lab=sky&sv=observer` |
| Turn on the sunrise spread | `?lab=sky&sv=observer&sl=nightArc.hourTicks.horizonBand` |

- **A link reproduces the investigation.** Pasting that URL into a browser context with no
  `localStorage` restored all three: Sky paths active, Look around active, sunrise spread on.
- **The URL beats saved preferences.** With `activeLab: 'sundial'` already persisted from an
  earlier visit, loading `?lab=sky&d=2026-06-21&c=tromso` opened Sky paths reading
  `Tromsø · 21 Jun` — the link won, with no flash of the saved lab first.
- **The back button is not polluted.** `history.length` stayed at 3 across a layer toggle;
  the writer uses `replaceState`, never `pushState`.
- **No history churn during playback.** With `replaceState` instrumented: **1 call across 3
  seconds of playing**, and 2 in total after pausing — the pause flush. Without the playing
  guard this would have been roughly 180, because `SimulationTicker` writes the store on
  every animation frame.
- Separators stay readable: `c=london.quito`, `tr=london_2026-06-21`. No `%2C` anywhere.

### Responsive

All three labs, with every sky layer enabled, measured for horizontal overflow and the
smallest rendered font size on a visible text leaf:

| Viewport | Horizontal overflow | Text below 11 px |
|---|---|---|
| 390 × 844 | 0 px | none |
| 768 × 900 | 0 px | none |
| 1024 × 768 | 0 px | none |
| 1280 × 720 | 0 px | none |
| 1600 × 900 | 0 px | none |

15 lab/viewport combinations, all 0 px. The smallest meaningful text is exactly 11 px
(`.eyebrow`), which is the documented floor rather than a breach of it. The new Copy link
button sits in `.utility-nav`, whose label is already hidden below 1000 px, so it adds no
width at the narrow sizes.

### Known, pre-existing

`GET /favicon.ico` returns 404, unchanged since the first commit and recorded in
`docs/QA-V3.md`. It is browser-initiated, not an application error, and was left alone.

## Globe surface relief

### Automated

`npm run check` — eslint reports 0 problems, vitest passes 36/36, `tsc -b` and `vite build`
succeed. No new tests: the change is a shader and an asset, and the asset's correctness is
asserted by the conversion script's own printed measurements, recorded in `docs/ASSETS.md`.

### The relief map itself

Sampled straight out of the downsampled height field before any normal encoding, to confirm
the source is oriented and scaled the way the shader assumes:

| Probe | Value | Reads as |
|---|---|---|
| Mid-Pacific (0°N 160°W) | 0 | ocean, flat |
| North Atlantic (40°N 40°W) | 0 | ocean, flat |
| Himalaya (28°N 87°E) | 225 | highest sampled land |
| Andes (20°S 68°W) | 166 | high |
| Greenland interior (72°N 40°W) | 145 | ice sheet |
| Rockies (39°N 106°W) | 134 | high |
| Antarctica interior (82°S) | 110 | ice sheet |
| Sahara (23°N 13°E) | 43 | moderate |
| Amazon basin (3°S 60°W) | 1 | near sea level |
| Netherlands (52°N 5°E) | 0 | near sea level |
| Arctic Ocean (89°N) | 0 | ocean, flat |

Arctic Ocean at 0 with Antarctica at 110 confirms row 0 is 90°N, so the north gradient carries
the sign the shader expects. Ocean at 0 everywhere confirms the raster has no bathymetry to mask.

### Interaction

Captured in Chromium with SwiftShader, comparing identical framings with the relief map served
and with it aborted at the network layer.

- **Relief appears where it should.** Diffing on against off over South America lights up the
  Andes as a continuous ridge line and the Sierra Madre and Rockies further north. The Pacific
  is black in the diff: no change at all over water, as the flat-normal ocean requires.
- **It is strongest at grazing light.** At Calgary at local solar 06:42 the twilight band across
  the Canadian Rockies and coast ranges shows clear ridge-and-valley texture with the map on,
  and is smooth and flat with it off. Away from the terminator the two are near-identical.
- **The terminator did not move.** The day/night boundary sits in the same place with the same
  smooth gradient in both captures, with no stippling, no night-lights punched into the day
  side and no islands of daylight in the dark side. On the deterministic camera preset the two
  renders are byte-identical across all 360,000 sampled pixels — a relief leak into the blend
  would have displaced the terminator by pixels there, not by nothing.
- **A missing map degrades to today's globe.** With `/textures/earth-relief-normal.png` aborted,
  the scene renders normally with zero console or page errors and simply loses the relief. The
  texture is loaded outside drei's suspending loader for exactly this reason.
- The persistent scene label now reads `Concept view · sizes, distances & surface relief not to
  scale`, and the About modal explains the exaggeration in a sentence a child can read.

### Limb glow

Fixed in the same commit and called out rather than slipped in: the rim term dotted a
world-space normal against a fixed world +Z, so the glow was pinned to one side of the globe
and slid across the visible disc as the camera orbited, instead of hugging the limb. It now
uses the real view direction. Colour, exponent and the `* daylight` gate are byte-identical, so
only the axis changed. Full orbit renders cleanly at opposite orbital phases (5 January and
5 July) with no errors. No row in `docs/QA-V2.md` or `docs/QA-V3.md` recorded the old
appearance, so nothing previously verified is invalidated.

### Budget

Textures total **3.44 MB** (1.91 day + 0.78 night + 0.89 relief) against the 8 MB target.
