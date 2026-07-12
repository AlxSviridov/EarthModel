# Visual Asset Provenance

This ledger must be updated with exact source URLs, creator/agency credit, license/usage basis, original filename, processing command, and resulting local path before deployment.

## Planned sources

- Day Earth: NASA Visible Earth “Blue Marble” global true-color imagery.
- Night Earth: NASA Earth Observatory “Black Marble” global night-lights imagery.
- Sun: NASA/SDO imagery if used as a texture; a procedural shader may be used instead.
- Stars: procedural points preferred, avoiding an unnecessary third-party texture.
- Clouds/specular/topography: NASA-derived or permissively licensed source only.

NASA content usage must follow NASA Media Usage Guidelines. No NASA insignia is used to imply endorsement.

## Asset ledger

| Local file | Purpose | Source / credit | Usage | Processing |
|---|---|---|---|---|
| `public/textures/earth-day.png` | 2048×1024 equirectangular day map | [NASA Blue Marble](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png) — image by Reto Stöckli, render by Robert Simmon, based on MODIS Science Team data | NASA media usage guidance | Original NASA PNG bundled unchanged (1.8 MB) |
| `public/textures/earth-night.jpg` | 3600×1800 equirectangular night-lights map | [NASA Earth at Night / Black Marble 2016](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg) — NASA Earth Observatory / Suomi NPP data | NASA media usage guidance | Original NASA JPEG bundled unchanged (762 KB) |

## Procedural visuals

The star field, Sun disc/glow, atmosphere, orbit guide, axis, equator, terminator blend, and city markers are generated in code and have no external asset dependency. No production page requests imagery or fonts from a third-party CDN.

## References

- [NASA Blue Marble overview](https://science.nasa.gov/earth/earth-observatory/the-blue-marble/)
- [NASA Black Marble flat maps](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/)
- [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
