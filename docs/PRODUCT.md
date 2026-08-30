# Orbit Lab — Product Plan

## Product promise

Orbit Lab turns the abstract phrase “Earth is tilted” into something a child can see, move, predict, and test. The main screen always connects three views of the same fact: the lit 3D globe, the selected city’s current experience, and a year-long daylight curve.

## Primary learner

A curious 10-year-old exploring alongside a parent or teacher. Reading should be short, concrete, and never talk down to the learner. Every unfamiliar term gets a plain-language explanation at the moment it matters.

## Core experience

1. Choose or search for a city.
2. The camera travels to it and a beacon marks its position.
3. Press play to move through a year. Earth orbits with its 23.44° axis fixed in space and spins to show local day/night.
4. The daylight curve draws as the year advances. A live readout reports daylight, darkness, solar season, and whether the city is lit now.
5. Pin additional cities. Their curves appear together, with equinox guides connecting the near-common crossing points.
6. Drag the date, globe, or orbit camera; change speed; toggle teaching overlays.

## Ten learning scenarios and acceptance criteria

1. **My city through a year** — Select London, focus it, press play, and watch the annual curve draw while the marker alternates between day and night.
2. **North versus south** — Compare London and Sydney. Their seasonal curves peak in opposite halves of the year and the explanation identifies reversed seasons.
3. **The equinox handshake** — Compare London, Quito, Tromsø, and Cape Town. March and September guides emphasize that daylight is close to equal worldwide, with a note explaining why measured sunrise-to-sunset is not exactly 12 hours.
4. **Chase the midnight Sun** — Select Tromsø near the June solstice. The readout reaches 24 h daylight and the city marker remains on the lit side through a full local rotation.
5. **Find polar night** — Move Tromsø to December. The readout reaches 0 h daylight and explains that twilight can still occur even when the Sun does not rise.
6. **The equator barely changes** — Compare Quito with London. Quito’s curve remains near 12 h while London’s swings strongly.
7. **Same latitude, same pattern** — Compare London and Calgary (similar northern latitudes). Curves are similar despite longitude differences; longitude changes clock time, not annual day length.
8. **Tilt off thought experiment** — Set axial tilt to 0°. All curves become approximately 12 h all year; restore 23.44° to recover seasons.
9. **Tilt a lot** — Increase tilt to 40°. Seasonal contrast grows, especially at high latitude, making tilt’s effect immediately visible.
10. **Predict before reveal** — Use a guided challenge that asks which of two cities has the longer day on a given date, then reveals the globe and chart evidence.

## Feature scope

### Must ship

- Realistic day/night globe shader and atmosphere
- Annual orbit and daily rotation with fixed-axis visualization
- Curated searchable city selector plus latitude/longitude custom point
- Smooth city camera focus and free orbit controls
- Date scrubber, play/pause, speed choices, jump-to-equinox/solstice controls
- Live daylight/darkness readouts and polar-state handling
- Multi-city comparison chart with legend, focus, remove, and equinox/solstice guides
- Axial-tilt experiment control and reset-to-Earth action
- Orbit/globe camera modes and teaching overlay toggles
- Guided Discoveries covering the ten scenarios
- Responsive desktop/tablet design and useful compact mobile layout
- Accessible controls, visible focus, screen-reader labels, reduced-motion behavior
- Local persistence for selected cities, display preferences, and current discovery
- Asset credits and “model assumptions” information

### Deliberately out of scope for v1

- Weather, live clouds, Moon phases, eclipses, tides, historical calendar systems
- Civil time zones and daylight-saving changes
- Terrain elevation and photorealistic city-level zoom
- Accounts, cloud saves, or multiplayer classrooms

## Scientific language contract

- “Daylight” means geometric sunrise-to-sunset adjusted with the conventional -0.833° solar altitude, representing atmospheric refraction and the Sun’s apparent radius.
- The date model is educational, not an ephemeris. It is accurate enough to show latitude/season patterns and polar day/night.
- The on-screen orbit and body sizes are compressed and not to scale. A persistent label says so.
- Equinox copy avoids claiming every location records exactly 12:00 of daylight.

## Definition of done

All ten scenarios can be completed without developer tools; pure science tests pass; production build has no blocking warnings; critical controls are usable by keyboard; layout is verified at desktop and mobile sizes; textures are bundled and credited; the deployed Firebase URL loads directly and after refresh; repository is pushed cleanly to GitHub.

## Version 2.0 redesign

### Why playback changes

Fast annual playback must not also render hundreds of daily spins. At 30–90 days per second that aliases into blinking and teaches nothing. Version 2 separates the time scales:

- **Year journey** — date advances at 1, 7, 30, or 90 days per second while the selected location stays at a chosen local solar time. The globe/orbit, seasonal lighting, daylight readout, and annual trace change smoothly. Default: local solar noon.
- **One day** — date stays fixed while local solar time advances at 0.25×, 1×, 4×, or 12× conceptual speed. The camera stays with the city and the terminator crosses it visibly.
- **Direct manipulation** — date and local-solar-time have separate large sliders. A learner can drag either without an acceleration gesture or hidden mode switch. Preset sunrise/noon/sunset/midnight actions make repeatable comparisons easy.

The original suggestion of velocity-sensitive nonlinear scrubbing was rejected after design analysis: it is difficult to discover, difficult to repeat, and mixes two independent variables. Explicit date/time scales are more illustrative for a child.

### Three connected labs

1. **Orbit** — realistic Earth/Sun model, day-length chart, Year journey and One day playback, tilt experiments, city comparisons.
2. **Sky paths** — a 3D sky dome you stand inside, with a compass horizon, N–S and east–west ground lines, altitude rings, and the east–west great circle that splits the sky into a north half and a south half. Up to four traces, each a free (city, date) pair: the first follows the shared city and date, the rest are pinned snapshots. Each trace draws the whole 24-hour path — the night portion dimmed beneath the ground — with hour marks and a Sun marker at the shared local solar hour. Optional layers add a ghost arc for every month and the annual sunrise-azimuth band on the horizon. Three viewpoints: **Whole sky** (default, the complete arc seen from outside), **Look around** (first-person from the middle of the dome, turning on the spot like Street View), and **From above**. The flat azimuth/altitude panorama sits below the dome, cross-highlighted with it, and carries the lab on its own if WebGL is unavailable.
3. **Sundial** — horizontal-dial emulator showing gnomon, live shadow, apparent solar reading, mean solar time, calibration date, and annual accumulated error caused by the equation of time.

### Version 2 learning scenarios

11. **Watch one calm year** — Keep London at local noon and play 30 days/s. Earth completes a smooth orbit without daily flashing; the annual trace grows.
12. **Cross one sunrise** — Freeze 21 June and play one London day slowly. The city crosses from darkness into light and the time readout passes sunrise.
13. **Compare noon shadows** — At the same local solar time/date, switch London and Quito and observe different Sun altitude and shadow length.
14. **Four skies, one day** — In Sky paths pin London, Quito, Tromsø, and Cape Town on 21 June; each arc has a distinct height and length.
15. **One sky, two seasons** — In Sky paths pin London on 21 June, then move the date to 21 December and see the two arcs together.
16. **Calibrate a sundial** — Calibrate on 15 April, move through the year, and see the displayed time drift ahead/behind mean solar time.
17. **Latitude changes the dial** — Compare London, Quito, and Sydney dial geometry and live shadow direction while retaining the same calibration date.

### Version 3 learning scenarios

18. **Summer starts in the north-east** — In Sky paths set London to 21 June. The Sun rises 49° NE, climbs to 62°, and sets 311° NW; the arc crosses the amber east–west line twice. Move to 21 December: it rises 128° SE, never reaches 16°, and stays south all day.
19. **Due east, everywhere** — At either equinox, every city's arc starts within about a degree of due east and ends within about a degree of due west, whatever the latitude. The readout says *almost exactly due east*, because the apparent horizon and the calendar date both fall slightly short of the exact equinox instant.
20. **Rising north of east is not the same as crossing** — Quito on 21 June also rises north of east (67° ENE), but the Sun stays on the north side all day and never crosses the east–west line. Whether it rises north of east depends on the date; whether it crosses depends on the latitude.
21. **Mirror skies** — Pin London and Sydney on the same June date. London's arc leans south and is long; Sydney's leans north and is short.
22. **A Sun that never sets** — Tromsø on 21 June draws a closed loop that never touches the ground disc. On 21 December the whole loop sits beneath it, and the readout says the Sun stays below the horizon all day.
23. **Stand in the field and turn round** — In Look around you are in the middle of the dome at eye height. Face south, then drag right to follow the Sun back to where it rose in the north-east, and drag down to tilt up to where it passes overhead at noon.
24. **How far the sunrise wanders** — Turn on the sunrise spread. London's sunrise slides along 80° of horizon through the year; Tromsø's covers nearly the whole horizon and vanishes entirely for part of the year.

### Responsive/readability contract

- No meaningful copy below 11 px; primary controls 13–15 px; key values 26–42 px.
- No horizontal page overflow at 320 px or wider.
- The annual chart always uses the actual measured container width; it never relies on a fixed minimum SVG width.
- At widths below 1000 px the control panel becomes a dismissible drawer and the visualization uses the full viewport width.
- At short desktop heights the page scrolls normally; no control must become unreachable behind a fixed-height region.

### Version 2 acceptance

Test every Year journey speed and every One day speed, both sliders at endpoints and midpoints, camera drag/zoom after both presets, active-preset refocus, all three labs, both Sky paths comparison modes, at least three sundial cities/calibration dates, and the five required viewport sizes. There must be no application console errors.
