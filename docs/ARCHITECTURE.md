# Architecture and Science Notes

## Stack

- React 19 + TypeScript + Vite
- Three.js through `@react-three/fiber`; `@react-three/drei` for camera controls and helpers
- Zustand for small, explicit simulation/UI state
- Custom responsive SVG chart to keep animated reveal, comparison bands, event guides, and accessibility under direct control
- Vitest for pure astronomy and state tests
- Firebase Hosting for immutable static delivery with SPA fallback

## State model

One store owns simulation date, playback state/speed, axial tilt, selected/focused cities, camera mode, overlays, and discovery state. Render components subscribe to narrow selectors. The animation loop advances simulation time; science functions remain pure and accept dates/coordinates explicitly.

## Astronomy model

For day-of-year `N`, solar declination uses a compact Fourier approximation (Spencer/NOAA-style) for normal Earth mode. For variable-tilt experiments, declination is derived from ecliptic longitude and the selected obliquity. Sunrise hour angle uses:

`cos(H0) = (sin(h0) - sin(phi) sin(delta)) / (cos(phi) cos(delta))`

where `h0 = -0.833°`. Values below -1 are polar day (24 h); above +1 are polar night (0 h); otherwise day length is `24 * H0 / π`.

The rendered orbit is circular for conceptual clarity. Seasonal distance variation is not the cause being taught. Earth’s axis is fixed in world space as the orbital position changes. One rendered spin represents the selected UTC time of day; fast annual playback may visually slow/summarize daily spin to avoid aliasing.

## Rendering layers

1. Procedural star field and subtle nebular backdrop
2. Sun mesh with animated shader/noise, sprite glow, and point/directional illumination
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

