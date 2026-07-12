# Architecture and Science Notes

## Stack

- React 19 + TypeScript + Vite
- Three.js through `@react-three/fiber`; `@react-three/drei` for camera controls and helpers
- Zustand for small, explicit simulation/UI state
- Custom responsive SVG chart to keep animated reveal, comparison bands, event guides, and accessibility under direct control
- Vitest for pure astronomy and state tests
- Firebase Hosting for immutable static delivery with SPA fallback

## State model

One store owns active lab, simulation date, local solar time, playback mode/state/speed, axial tilt, selected/focused cities, camera mode/tracking/reset nonce, overlays, and discovery state. Render components subscribe to narrow selectors. The animation loop advances either date or time—not both—according to playback mode. Science functions remain pure and accept dates/coordinates explicitly.

## Astronomy model

For day-of-year `N`, solar declination uses a compact Fourier approximation (Spencer/NOAA-style) for normal Earth mode. For variable-tilt experiments, declination is derived from ecliptic longitude and the selected obliquity. Sunrise hour angle uses:

`cos(H0) = (sin(h0) - sin(phi) sin(delta)) / (cos(phi) cos(delta))`

where `h0 = -0.833°`. Values below -1 are polar day (24 h); above +1 are polar night (0 h); otherwise day length is `24 * H0 / π`.

The rendered orbit is circular for conceptual clarity. Seasonal distance variation is not the cause being taught. Earth’s axis is fixed in world space as the orbital position changes. Year playback advances orbital phase at fixed local solar time; One day playback advances rotation at fixed orbital phase. This avoids temporal aliasing rather than merely slowing it.

Earth's rendered spin is solved from the current Earth-to-Sun direction, fixed axial tilt, focused-city longitude, and selected local solar hour. Solar noon therefore puts the focused city's meridian under the Sun at every orbital phase instead of incorrectly treating the local clock as UTC. The focused city owns the scene clock; comparison curves and sky paths intentionally compare the same local solar hour separately in every city. Civil time zones and DST remain outside this teaching model.

Solar sky paths use standard altitude/azimuth conversion from latitude, declination, and local hour angle. The sundial lab models a polar-aligned gnomon on a horizontal dial, including latitude-dependent hour-line angles, and uses the NOAA-style equation-of-time approximation. A dial calibrated on date `C` has annual reading error `E(date) - E(C)` relative to local mean solar time; longitude/civil-zone offsets are explained separately and not conflated with this seasonal drift.

## Rendering layers

1. Procedural star field and subtle nebular backdrop
2. Sun mesh with animated multi-octave procedural granulation, limb variation, corona shells/sprites, and point illumination
3. Orbit path, month ticks, seasonal event labels, and fixed-axis guide
4. Earth shader blending day and night textures from the light direction
5. Cloud shell, rim atmosphere, terminator edge, latitude/equator and axis overlays
6. City marker, label, and local horizon/day-state cue
7. Post-processing kept restrained and adaptive to device capability

## Performance budget

- Initial compressed assets target under 8 MB total; no runtime hotlinks.
- Clamp device pixel ratio to 1.75 desktop / 1.35 compact devices.
- Pause or reduce animation when page is hidden or reduced motion is requested.
- Avoid per-frame React state updates; mutate scene transforms in the render loop and sample UI time at a lower cadence.
- Target 55–60 fps on a recent laptop and graceful 30 fps on a mid-range mobile device.

## Accessibility and resilience

The canvas is supplementary: date, daylight length, city, and explanation always exist in semantic HTML. Buttons have names and pressed state; sliders expose values; chart has a text summary/table alternative. A WebGL failure replaces the canvas with a styled explanatory panel while chart learning remains functional.

## Version 2 responsive chart

`DaylightChart` observes its own container with `ResizeObserver` and calculates the SVG coordinate system from actual CSS pixels. Text therefore stays legible instead of being scaled down inside a fixed 1000-unit viewBox. Month-label density reduces on narrow widths while all curves and event guides remain visible.

## Camera ownership

Preset selection increments a reset nonce. Focus City enables tracking: the camera follows the focused surface normal so the city stays centred while Earth rotates and orbits. Starting a pointer gesture immediately releases tracking; the camera then follows only Earth's orbital translation and preserves the learner's chosen relative angle. Full Orbit is always free. Clicking a preset recalls its composition.
