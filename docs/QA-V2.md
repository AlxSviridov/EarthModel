# Orbit Lab v2 — Browser QA Ledger

Date: 2026-07-12 · Browser: Codex in-app Chromium · Local release candidate

## Automated gate

- ESLint: pass
- Vitest: 11 astronomy tests pass
- TypeScript: pass
- Vite production build: pass
- Expected notice only: initial Three.js bundle exceeds Vite’s generic 500 kB uncompressed chunk threshold (328 kB gzip)

## Playback matrix

### Year journey — fixed local solar time

Starting at 1 January, London, local solar noon. Each run was paused and reset before the next.

| Speed | Observed date after short run | Observed local solar time | Result |
|---|---:|---:|---|
| 1 day/s | 2 Jan | 12:00 | Pass |
| 7 days/s | 6 Jan | 12:00 | Pass |
| 30 days/s | 21 Jan | 12:00 | Pass |
| 90 days/s | 3 Mar | 12:00 | Pass |

The Earth did not perform aliased daily spins. Date/orbital phase and the bright chart trace advanced while the selected clock time stayed fixed.

### One day — fixed date

Starting at 00:00 on 1 January. Each run was paused and returned to midnight before the next.

| Speed | Observed local solar time after short run | Date slider | Result |
|---|---:|---:|---|
| ¼ solar h/s | 00:13 | 0 / 1 Jan | Pass |
| 1 solar h/s | 00:53 | 0 / 1 Jan | Pass |
| 4 solar h/s | 03:31 | 0 / 1 Jan | Pass |
| 12 solar h/s | 10:34 | 0 / 1 Jan | Pass |

Midnight preset reported Sun below horizon at −61.6°; noon reported Sun above horizon at +15.4°.

## Camera and scene

- Full-orbit preset completed transition and showed the enhanced orbit, event markers, Earth, and procedural granulated Sun.
- Pointer drag changed the orbit from top-down circle to oblique ellipse.
- The oblique composition remained after a 1.2-second wait; the rig did not pull back to preset.
- Clicking the already-active Full orbit preset recalled the original composition.
- Final layering fix sets Drei HTML annotations below controls/drawers; final HTTPS regression remains.
- Local-solar correction: London at 12:00 rendered on the illuminated meridian; the 08:03 sunrise preset placed its marker on the day/night edge instead of at noon.
- Tracked-city daily playback advanced 08:03 → 13:48 while London's label stayed within 9 px of its starting screen position (minor easing/perspective variation only).
- Pointer drag changed the tracking button to unpressed and the scene hint to free-camera instructions.
- The in-scene Full orbit switch exposed the whole orbit; the June seasonal dock moved the date slider to 0.47 and Earth to the named June-solstice point.
- New in-scene view/season controls fit at 390×844 with no horizontal overflow (switch 163 px wide, dock 355 px wide).

## Sky paths

- Same date / places: London, Quito, Tromsø, and Cape Town were added; four legends and four path series rendered.
- Same place / seasons: four equinox/solstice legends and paths rendered; date slider intentionally hidden.
- Animated time cursor advanced from 12:00 to 14:58.
- QA found a 0°/360° azimuth connector in Cape Town; fixed by starting a new SVG subpath whenever adjacent azimuths differ by more than 180°.

## Sundial

- Calibration on current date changed error to `+0m 0s`; calibrated reading matched true mean solar time.
- Equation-of-time curve, current-date cursor, calibration slider, test-date slider, and live shadow rendered.
- Final science refinement uses a polar-aligned gnomon, latitude-dependent 06:00–18:00 hour lines, a ±30-minute graph domain, and repeatable 11 Feb / 15 Apr / 21 Jun / 3 Nov date presets.
- Final HTTPS regression should select London, Quito, and Sydney and confirm the noon line/gnomon points toward the correct celestial pole.

## Responsive matrix

| Requested viewport | Actual content width | Body scroll/client | Chart wrap/SVG | Control presentation | Result |
|---|---:|---:|---:|---|---|
| 390×844 | 375 | 375 / 375 | 355 / 355 | Drawer | Pass |
| 768×900 | 753 | 753 / 753 | 722 / 722 | Drawer | Pass |
| 1024×768 | 1009 | 1009 / 1009 | 608 / 608 | Side panel | Pass |
| 1280×720 | 1265 | 1265 / 1265 | 843 / 843 | Side panel | Pass |
| 1600×900 | 1585 | 1585 / 1585 | 1105 / 1105 | Side panel | Pass |

Mobile Sundial and Orbit screenshots showed the dial/chart contained within the viewport. The control drawer fit within 359 px and exposed an independent scrollbar and close action.

## Final HTTPS regression checklist

Run after Firebase deployment:

- [x] Load base URL and a deep-link refresh with no console errors
- [x] Confirm minimum meaningful DOM label size is ≥11 px
- [x] Open mobile controls and confirm no scene annotation appears over the drawer
- [x] Confirm Cape Town January sky path has no cross-panorama seam
- [x] Switch labs from a scrolled page and confirm each opens at the top
- [x] Test 3 Nov sundial preset after calibration on 11 Feb; observed +30m34s drift
- [x] Select London, Quito, and Sydney and visually inspect latitude-dependent hour lines/gnomon direction
- [x] Re-run body-width/chart-width assertions at 390 and 1280 widths

Final focused live regression after the local-solar release: the public DOM exposed `SOLAR TIME IN LONDON`, tracked-city state, in-scene seasonal navigation, and Full orbit. London sunrise read 08:03 with the marker at the terminator; June jump set year progress to 0.47; body overflow was false; browser console warning/error log was empty. Firebase app-shell and JS/CSS caching now revalidate so releases appear immediately, while bundled textures retain immutable caching.
