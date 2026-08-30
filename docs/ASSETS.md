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
| `public/textures/earth-relief-normal.png` | 2048×1024 equirectangular tangent-space normal map, for surface relief shading | [NASA Visible Earth image 73934, *Topography*](https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png) — NASA Earth Observatory; land elevation from SRTM30/GTOPO30, ocean floor from GEBCO_08 | NASA media usage guidance | Derived, not bundled unchanged. `node tools/make-relief-normal.mjs` (committed) — see below (888 KB) |

### Deriving `earth-relief-normal.png`

The source is a 21600×10800 8-bit grayscale elevation raster, 18.4 MB, and is the only size
NASA publishes for this record; the smaller variants all 404. It is a build-time input and is
**not committed** — `tools/.cache/` is git-ignored. To rebuild:

```bash
mkdir -p tools/.cache
curl -L -o tools/.cache/gebco_elev.png \
  https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png
npm install --no-save sharp
node tools/make-relief-normal.mjs
```

`sharp` is installed with `--no-save` deliberately: it is a platform-specific binary and this
script runs once per asset refresh, so committing it to `devDependencies` would risk an
install failure on a machine without a prebuilt binary for no ongoing benefit.

Measured on the run that produced the committed file:

| Property | Value |
|---|---|
| Land pixels (elevation > 0) | 694,567 — 33.1% of the raster |
| RMS slope over land | 5° by construction (scale factor 0.0083) |
| Peak slope | 57.4° |
| Mid-Pacific encodes to `(128, 128, 255)` | yes — a flat normal, no shading over water |
| Output | PNG, 909,706 bytes |

Notes on the conversion, each of which is a way it could have gone quietly wrong:

- **The ocean in this source is already flat at 0**, so it needs no masking. Had it carried
  real bathymetry, the mid-Atlantic ridge would have embossed straight through Blue Marble's
  flat blue ocean, which would be simply false — a sea surface is flat.
- The height field is **downsampled before it is differentiated**. Differentiating at 21600 px
  and shrinking afterwards would encode slopes the output cannot represent, which alias into
  speckle.
- The east gradient carries a **1/cos(latitude) metric correction**. An equirectangular pixel
  covers less ground east–west near a pole, so without it relief at 60° would be stretched
  about twice as wide as it should be.
- Encoding is **OpenGL / green-up** (+U east, +V north), which is what the sphere's own UV
  mapping requires. Inverting green would turn every mountain into a pit, which is remarkably
  hard to catch in review.
- PNG rather than JPEG: the lossless file fits the budget, and a normal map is a field of
  vectors rather than a picture, so JPEG ringing around a coastline would become visible
  lighting noise. (JPEG at quality 90 with `chromaSubsampling: '4:4:4'` measured 178 KB if
  bytes ever get tight. 4:4:4 would not be optional — the default 4:2:0 averages the X and Y
  vectors across 2×2 blocks and shears ridge lighting.)

Total bundled textures: **3.44 MB**, against the 8 MB budget in `docs/ARCHITECTURE.md`.

## Procedural visuals

The star field, Sun disc/glow, atmosphere, orbit guide, axis, equator, terminator blend, and city markers are generated in code and have no external asset dependency. No production page requests imagery or fonts from a third-party CDN.

## References

- [NASA Blue Marble overview](https://science.nasa.gov/earth/earth-observatory/the-blue-marble/)
- [NASA Black Marble flat maps](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/)
- [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
