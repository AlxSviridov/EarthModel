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
