/**
 * Builds the globe's surface-relief normal map from NASA's elevation raster.
 *
 * Run from the repository root:
 *
 *   mkdir -p tools/.cache
 *   curl -L -o tools/.cache/gebco_elev.png \
 *     https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png
 *   npm install --no-save sharp
 *   node tools/make-relief-normal.mjs
 *
 * `sharp` is installed with --no-save on purpose. It is a platform-specific binary and
 * this script runs once per asset refresh; committing it to devDependencies would risk
 * an install failure on any machine without a prebuilt binary, for no ongoing benefit.
 *
 * Conventions that matter, and why:
 *
 * - The height field is downsampled BEFORE it is differentiated. Differentiating at
 *   21600 px and shrinking afterwards would encode slopes the output cannot represent,
 *   and they alias into speckle.
 * - The east gradient carries a 1/cos(latitude) metric correction. An equirectangular
 *   pixel covers less ground east-west as it approaches a pole, so without this term
 *   relief at 60 degrees is stretched about twice as wide as it should be.
 * - Output is OpenGL / green-up (+U east, +V north), which is what the sphere's own UV
 *   mapping requires: with T = cross(worldUp, N) the bitangent comes out pointing north.
 *   Inverting green would turn every mountain into a pit, which is remarkably hard to
 *   spot in review.
 * - The ocean in this source is already flat at 0, so it needs no masking and encodes to
 *   exactly (128, 128, 255) - a flat normal, no shading, which is what a sea surface is.
 */
import { statSync } from 'node:fs'
import sharp from 'sharp'

const SOURCE = 'tools/.cache/gebco_elev.png'
const OUT_BASE = 'public/textures/earth-relief-normal'
const WIDTH = 2048   // matches earth-day.png exactly, so UVs are 1:1
const HEIGHT = 1024
const TARGET_RMS_SLOPE_DEGREES = 5
const MIN_COS_LATITUDE = 0.12   // ~83 degrees; the shader also fades relief out at the poles

const toRadians = (degrees) => (degrees * Math.PI) / 180

console.log(`reading ${SOURCE}`)
const { data: height } = await sharp(SOURCE)
  .greyscale()
  .resize(WIDTH, HEIGHT, { kernel: 'lanczos3' })
  .raw()
  .toBuffer({ resolveWithObject: true })

// Row 0 is 90 degrees north. Longitude wraps; latitude clamps at the caps.
const sample = (x, y) => height[Math.min(HEIGHT - 1, Math.max(0, y)) * WIDTH + ((x % WIDTH) + WIDTH) % WIDTH]

const gradientEast = new Float32Array(WIDTH * HEIGHT)
const gradientNorth = new Float32Array(WIDTH * HEIGHT)
let land = 0
let sumOfSquares = 0

for (let y = 0; y < HEIGHT; y++) {
  const latitude = 90 - ((y + 0.5) / HEIGHT) * 180
  const cosLatitude = Math.max(Math.cos(toRadians(latitude)), MIN_COS_LATITUDE)
  for (let x = 0; x < WIDTH; x++) {
    const index = y * WIDTH + x
    const east = (sample(x + 1, y) - sample(x - 1, y)) / (2 * cosLatitude)
    const north = (sample(x, y - 1) - sample(x, y + 1)) / 2   // row 0 is north, so this is +north
    gradientEast[index] = east
    gradientNorth[index] = north
    if (sample(x, y) > 0) {
      land++
      sumOfSquares += east * east + north * north
    }
  }
}

// One scale factor, chosen so the RMS slope over land hits the target. Everything about
// how strong the relief looks lives in this number plus RELIEF_STRENGTH in the shader.
const rmsRaw = Math.sqrt(sumOfSquares / Math.max(land, 1))
const scale = Math.tan(toRadians(TARGET_RMS_SLOPE_DEGREES)) / rmsRaw

let peakSlope = 0
const rgb = Buffer.alloc(WIDTH * HEIGHT * 3)
for (let index = 0; index < WIDTH * HEIGHT; index++) {
  const nx = -gradientEast[index] * scale
  const ny = -gradientNorth[index] * scale
  const length = Math.hypot(nx, ny, 1)
  peakSlope = Math.max(peakSlope, Math.hypot(nx, ny))
  rgb[index * 3] = Math.round(((nx / length) + 1) * 127.5)
  rgb[index * 3 + 1] = Math.round(((ny / length) + 1) * 127.5)
  rgb[index * 3 + 2] = Math.round(((1 / length) + 1) * 127.5)
}

const raw = { raw: { width: WIDTH, height: HEIGHT, channels: 3 } }
// PNG, not JPEG. The lossless file came out at 888 KB, which fits the texture budget with
// room to spare, and a normal map is a field of vectors rather than a picture: JPEG ringing
// around a coastline becomes visible lighting noise. (If bytes ever get tight, JPEG at
// quality 90 with chromaSubsampling '4:4:4' measured 178 KB. 4:4:4 would not be optional -
// the default 4:2:0 averages the X and Y vectors across 2x2 blocks and shears ridge lighting.)
await sharp(rgb, raw).png({ compressionLevel: 9 }).toFile(`${OUT_BASE}.png`)

// The mid-Pacific must encode to a flat normal; anything else means the ocean picked up relief.
const flat = rgb[(512 * WIDTH + 114) * 3] === 128 && rgb[(512 * WIDTH + 114) * 3 + 1] === 128

console.log(`land pixels           ${land} (${((100 * land) / (WIDTH * HEIGHT)).toFixed(1)}%)`)
console.log(`RMS land slope        ${TARGET_RMS_SLOPE_DEGREES}deg (scale factor ${scale.toFixed(4)})`)
console.log(`peak slope            ${(Math.atan(peakSlope) * 180 / Math.PI).toFixed(1)}deg`)
console.log(`mid-Pacific is flat   ${flat}`)
console.log(`${OUT_BASE}.png  ${statSync(`${OUT_BASE}.png`).size} bytes`)
