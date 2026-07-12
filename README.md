# Orbit Lab

Orbit Lab is a production-ready, interactive Earth–Sun model for exploring why daylight length changes with season and latitude. It connects a realistic Three.js globe, annual orbit, city-level daylight readout, and multi-city comparison chart in one science-museum-style experience.

## What learners can do

- Select a city and focus the globe on its latitude/longitude
- Play or scrub through a year at four speeds
- Watch a NASA Blue Marble / Black Marble shader reveal the day–night boundary
- Compare up to four daylight curves and inspect the equinoxes/solstices
- Explore polar day, polar night, opposite hemispheres, and equatorial stability
- Change Earth’s axial tilt from 0° to 45° as a thought experiment
- Switch between close globe and full orbit cameras, then drag/zoom freely
- Launch ten guided, prediction-first discoveries designed for a 10-year-old

The full product contract and acceptance scenarios live in [`docs/PRODUCT.md`](docs/PRODUCT.md).

## Local development

Requires Node 20, 22, or 24 LTS (Node 25 currently builds the app but Firebase CLI reports an engine warning for one transitive package).

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Verification

```bash
npm run check
```

This runs ESLint, Vitest science tests, TypeScript, and the production Vite build.

## Firebase Hosting

The repository is configured for Firebase project `earthmodel-orbit-lab`.

```bash
npm run build
npx firebase-tools@latest deploy --only hosting
```

## Science and visual assets

The orbit view is compressed and explicitly labeled as not to scale. Daylight uses the conventional apparent-sunrise altitude of -0.833°, accounting approximately for refraction and the Sun’s visible radius. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for equations and [`docs/ASSETS.md`](docs/ASSETS.md) for NASA imagery provenance.

## Persistent project memory

Every coding agent should read [`AGENTS.md`](AGENTS.md) first. [`CLAUDE.md`](CLAUDE.md) simply points to the same provider-independent memory.

