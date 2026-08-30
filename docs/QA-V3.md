# Version 3 QA — 3D Sky Dome

Scope: the rebuilt Sky paths lab (3D dome + flat panorama), the new pure astronomy
functions, the scene error boundary, and reduced-motion support.

## Automated

`npm run check` — eslint reports 0 problems, vitest passes **20/20** (11 pre-existing plus
9 new), `tsc -b` and `vite build` succeed.

Nine new cases in `src/science/solar.test.ts` cover every claim the interface makes in
words: London's June/December sunrise azimuths, the declination rule holding in both
hemispheres, equinox sunrise near but not exactly due east, the Quito case where the Sun
rises north of east yet never crosses the east–west line, London's genuine crossing,
Tromsø's midnight sun and polar night, whole-day sampling with no `NaN` at either pole, and
the compass/offset boundaries.

## Readouts against independently computed values

Each row was computed directly from the repository's own declination model before the
interface was built, then read back out of the running app. They agree.

| Case | Readout |
|---|---|
| London 21 Jun | Rises 48.9° NE — 41° north of due east · Crosses to the south side at midday · 03:41–20:19 · 61.9° · 16h 39m |
| London 21 Dec | Rises 128.3° SE — 38° south of due east · Stays on the south side all day · 08:05–15:57 · 15.1° · 7h 50m |
| Quito 21 Jun | Rises 66.5° ENE — 23° north of due east · **Stays on the north side all day** · 05:57–18:03 · 66.4° |
| Quito 20 Mar | Rises 90.5° — almost exactly due east · Passes almost straight overhead at midday · 89.7° |
| Tromsø 21 Jun | Never rises or sets — it circles all the way round · closed loop above the ground disc · 43.8° · 24h |
| Tromsø 21 Dec | Never rises today · the whole path stays under the ground · −3.1° · 0h |

The Quito June row is the reason the lab prints two separate lines instead of one
"crosses" verdict: a single verdict would have been false there.

## Interaction

- Pin, edit and remove traces all work; two traces survive a lab switch and a full page
  reload (persisted through the store).
- Day playback advanced the clock from 12:00 to 14:48 over roughly 2.5 s at 4 h/s, with
  Sun markers moving on every trace.
- All three viewpoints recall correctly. "From the east" was removed during QA: looking
  along the east–west axis projects out the east–west component, so the symmetric morning
  and afternoon halves collapse onto one another. "Whole sky" replaced it and is the
  default, because a June arc at London spans 262° of azimuth and 62° of altitude and
  cannot be seen whole from inside the dome.
- Layer toggles verified on and off. At Tromsø the sunrise-spread band is annotated with
  the number of days that have no sunrise at all, rather than implying a sunrise every day.

## Resilience

- WebGL forced unavailable: the `error-card` panel renders with its explanation, the flat
  panorama still draws its paths, the trace cards still read out, and no page errors are
  raised.
- `prefers-reduced-motion: reduce`: pressing play left the clock at 12:00.

## Responsive

Measured horizontal overflow and the smallest rendered font size across the required
viewports, with all layers on and a pinned trace:

| Viewport | Horizontal overflow | Text below 11 px |
|---|---|---|
| 390 × 844 | 0 px | none |
| 768 × 900 | 0 px | none |
| 1024 × 768 | 0 px | none |
| 1280 × 720 | 0 px | none |
| 1600 × 900 | 0 px | none |

An earlier run showed 171 px of overflow at 390 px: the screen-reader summary table used
`display: table`, which ignores `width: 1px`, so it forced 526 px of layout despite being
clipped. Wrapping it in a block element fixed it.

## Known, pre-existing

`GET /favicon.ico` returns 404. `index.html` has never linked an icon, going back to the
first commit (`eed8613`). It is a browser-initiated request rather than an application
error, and was left alone rather than changing branding as a side effect of this work.
