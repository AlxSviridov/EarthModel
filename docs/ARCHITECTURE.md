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

Solar sky paths use standard altitude/azimuth conversion from latitude, declination, and local hour angle. Azimuth is measured clockwise from north over `[0, 360)`.

### Sky dome frame and conventions (version 3)

The dome uses `+X = east`, `+Y = up`, `-Z = north`, so a sky direction is `x = cos(alt)·sin(az)`, `y = sin(alt)`, `z = -cos(alt)·cos(az)`. That mapping lives in the tested pure function `skyVector` rather than inline in the scene. A dome removes the 0°/360° seam by construction: the flat panorama had to break its SVG subpath whenever adjacent azimuths differed by more than 180°, which suppressed the wrong connector but still severed the arc.

One horizon convention is used everywhere: the apparent `-0.833°` altitude that already backs `daylightAt` and `sunriseSunsetSolarHours`. `SunSample.aboveHorizon` and `solarPosition` share it, so the drawn arc splits at exactly the altitude whose time the readout quotes. The earlier lab filtered its arc at `>= 0` while quoting `-0.833°` times, and the two disagreed by a few minutes.

Two numerical caveats are handled explicitly rather than hidden:

- **Near-zenith transits make azimuth ill-conditioned.** At Quito on the equinox the Sun passes 89.7° and the azimuth swings about 77° within one five-minute sample. In 3D the points stay adjacent so the dome is smooth, but the flat panorama would draw a spike; `SkyPathChart` subdivides any interval whose azimuth step exceeds 6°. No north/south verdict is asserted within 3° of the zenith — the readout says the Sun passes almost straight overhead instead.
- **The annual sunrise band degenerates towards the poles.** London's sunrise azimuth spans about 80° of horizon; Tromsø's spans about 169° and vanishes for roughly a third of the year. `annualSunriseAzimuthRange` therefore also returns `daysWithoutSunrise`, and the lab annotates the band instead of implying the Sun rises somewhere on every day of the year.

The dome has two control schemes, because one cannot do both jobs. "Whole sky" and "From above" use `OrbitControls`, which swings the camera around a target — right for inspecting the dome as an object. "Look around" uses a first-person controller instead: the camera is pinned to the observer's eye point at the centre and dragging changes only its heading and pitch, so it turns on the spot like Street View rather than orbiting a point ahead of it. Yaw maps to compass azimuth as `yaw = -azimuth` in radians, because the camera looks down `-Z` and `-Z` is north under a `YXZ` rotation order. Dragging follows the sky rather than the camera — drag right and the heading swings left — and the wheel changes field of view rather than distance, since there is no distance to change.

Rising north of due east and crossing the east–west line are separate facts, and the readouts keep them separate. Sunrise azimuth below 90° follows from positive declination alone, so it holds at every latitude in both hemispheres. Crossing additionally requires the midday Sun on the far side of the prime vertical, which depends on latitude — near the equator the Sun can rise north of east and stay north all day. A single "crosses" verdict would be false at low latitudes.

The sundial lab models a polar-aligned gnomon on a horizontal dial, including latitude-dependent hour-line angles, and uses the NOAA-style equation-of-time approximation. A dial calibrated on date `C` has annual reading error `E(date) - E(C)` relative to local mean solar time; longitude/civil-zone offsets are explained separately and not conflated with this seasonal drift.

## Rendering layers

1. Procedural star field and subtle nebular backdrop
2. Sun mesh with animated multi-octave procedural granulation, limb variation, corona shells/sprites, and point illumination
3. Orbit path, month ticks, seasonal event labels, and fixed-axis guide
4. Earth shader blending day and night textures from the light direction, with elevation relief on the lit side
5. Rim atmosphere, terminator edge, latitude/equator and axis overlays
6. City pin: a 3D anchor, a constant-size label, and a day/night state cue
7. Post-processing kept restrained and adaptive to device capability

Layer 5 previously listed a cloud shell. There has never been one in the code; the entry was
aspirational and has been corrected rather than left to mislead. Layer 6's "day-state cue" was
aspirational in the same way; rather than delete it, it has now been built.

## The city pin

The anchor is 3D and scales with the globe, because it marks a real place on a real sphere.
The label does not: it carries no `distanceFactor`, so it stays a constant pixel size the way
a map pin does. drei scales such labels by `distanceFactor / (2·tan(fov/2)·distance)`, a pure
1/distance law, which over the camera's 2.4-40 range swung the city name more than sixteenfold
— about 32 px close up and under 3 px at the full-orbit preset, so it was simultaneously
overbearing and, at the far end, below the 11 px floor the product contract sets. The sky
dome's labels had always omitted the prop; the Earth scene now matches them.

Visibility on the far side is a dot product between the city's world normal and the direction
to the camera, faded over the last few degrees before the limb. Not a raycast: the anchor sits
0.025 above the surface and drei's raycast occlusion compares distances with no epsilon, so it
flickers there. Not `occlude="blending"` either, which rewrites the canvas z-index and would
undo the deliberate low-z label layering an earlier QA pass established.

The day/night dot is computed from the same geometry the Earth shader uses — the Sun is at the
world origin, so the direction to it is just the negated world position — rather than from
`isLocationInDaylight` in `solar.ts`, which works in UTC. Taking it from the scene guarantees
the dot agrees with the terminator the learner can actually see instead of drifting against it.

## Surface relief

The globe carries an elevation-derived normal map (`docs/ASSETS.md` records its provenance and
conversion). Four decisions in the Earth shader are load-bearing:

**The tangent frame is built in object space.** On the sphere the pole really is +Y there, so
`cross(+Y, N)` is exactly the direction of increasing U. In world space the mesh sits inside the
axial-tilt group, so world +Y is up to 40° away from the pole; a world-space frame would twist,
lighting every ridge from the wrong angle and changing as the learner drags the tilt slider.
The frame is rotated to world space in the vertex shader, because `modelMatrix` is available
only there.

**The day/night blend keeps the geometric normal.** With the sharp terminator on, the blend band
is about 2° of arc. A 5° slope in the relief map would displace its midpoint by more than twice
that, shattering the terminator into night-lights punched through the Andes and islands of
daylight floating in the dark side. The perturbed normal earns exactly one job: a bounded
difference added to the diffuse term, weighted toward grazing light. Overall globe brightness is
unchanged.

**Relief is invisible on the night side, deliberately.** The night branch has no lighting term,
and it should not gain one: the night side is not lit by the Sun, and Black Marble is an
emissive radiance measurement — multiplying it by a relief term would darken genuinely lit
valleys and brighten genuinely dark ridges, inventing signal in data. The visible consequence is
the honest one, and it is the lesson: you can only see mountains where the sunlight comes in
sideways, which is why they appear along the day/night line and nowhere else.

**The texture is optional.** `useOptionalTexture` resolves to null on failure rather than
throwing, so a missing relief map costs one visual effect instead of the whole Canvas. drei's
`useTexture` suspends and rethrows, which is why the day and night maps still take down the
scene — a follow-up slice should route them through the same hook.

Relief is exaggerated roughly a hundredfold: Everest is 0.14% of Earth's radius, so any visible
relief is a large lie about scale. The persistent scene label and the About modal both say so.

The limb glow was fixed at the same time. It dotted the world-space normal against a fixed world
+Z, which is not a view-dependent rim: the glow stayed pinned to one side of the globe and slid
across the visible disc as the camera orbited. It now uses the real view direction.

## Performance budget

- Initial compressed assets target under 8 MB total; no runtime hotlinks.
- Clamp device pixel ratio to 1.75 desktop / 1.35 compact devices.
- Pause or reduce animation when page is hidden or reduced motion is requested.
- Avoid per-frame React state updates; mutate scene transforms in the render loop and sample UI time at a lower cadence.
- Target 55–60 fps on a recent laptop and graceful 30 fps on a mid-range mobile device.

## Accessibility and resilience

The canvas is supplementary: date, daylight length, city, and explanation always exist in semantic HTML. Buttons have names and pressed state; sliders expose values; chart has a text summary/table alternative. A WebGL failure replaces the canvas with a styled explanatory panel while chart learning remains functional.

Version 3 makes that real rather than aspirational. `SceneBoundary` is an error boundary wrapping both 3D scenes; it probes for a WebGL context and renders an `error-card` panel on failure or on a render error. Because the sky dome and the flat panorama are both on screen, losing the dome leaves the Sky paths lab fully usable. `SkyPathChart` carries the `title`/`desc` pair and a visually hidden summary table that the accessibility contract had promised but never shipped. `usePrefersReducedMotion` reads the media query in JavaScript, which CSS alone cannot do: it suppresses playback in `SimulationTicker` and snaps camera presets instead of easing them. The dome is keyboard operable in every viewpoint — arrow keys turn or orbit, `+`/`-` zoom.

## Version 2 responsive chart

`DaylightChart` observes its own container with `ResizeObserver` and calculates the SVG coordinate system from actual CSS pixels. Text therefore stays legible instead of being scaled down inside a fixed 1000-unit viewBox. Month-label density reduces on narrow widths while all curves and event guides remain visible.

## Camera ownership

Preset selection increments a reset nonce. Focus City enables tracking: the camera follows the focused surface normal so the city stays centred while Earth rotates and orbits. Starting a pointer gesture immediately releases tracking; the camera then follows only Earth's orbital translation and preserves the learner's chosen relative angle. Full Orbit is always free. Clicking a preset recalls its composition.
