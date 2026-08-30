import { cities } from '../data/cities'
import { DEFAULT_SKY_LAYERS, MAX_SKY_TRACES, type SkyLayers, type SkyView } from '../data/skyTraces'
import { EARTH_TILT_DEGREES } from '../science/solar'
import type { CameraMode, Lab, PlaybackMode } from './useSimulation'

/**
 * The slice of the simulation worth putting in a link. Camera nonces, hover state and
 * transient playback are deliberately absent: a shared link should reproduce what the
 * sender was looking at, not the exact frame they were on.
 */
export interface ShareableState {
  activeLab: Lab
  dateIso: string
  solarHour: number
  tilt: number
  selectedCityIds: string[]
  focusedCityId: string
  playbackMode: PlaybackMode
  cameraMode: CameraMode
  showAxis: boolean
  showEquator: boolean
  showTerminator: boolean
  skyView: SkyView
  skyLayers: SkyLayers
  skyTraces: { cityId: string; dateIso: string }[]
  sundialCalibration: number
}

export const SHAREABLE_DEFAULTS: ShareableState = {
  activeLab: 'orbit',
  dateIso: new Date(Date.UTC(2026, 0, 1, 12)).toISOString(),
  solarHour: 12,
  tilt: EARTH_TILT_DEGREES,
  selectedCityIds: ['london'],
  focusedCityId: 'london',
  playbackMode: 'year',
  cameraMode: 'globe',
  showAxis: true,
  showEquator: false,
  showTerminator: true,
  skyView: 'whole',
  skyLayers: DEFAULT_SKY_LAYERS,
  skyTraces: [],
  sundialCalibration: 104 / 364,
}

const LABS: Lab[] = ['orbit', 'sky', 'sundial']
const PLAYBACK_MODES: PlaybackMode[] = ['year', 'day']
const CAMERA_MODES: CameraMode[] = ['globe', 'orbit']
const SKY_VIEWS: SkyView[] = ['whole', 'observer', 'birdseye']
const LAYER_KEYS: (keyof SkyLayers)[] = ['nightArc', 'hourTicks', 'yearFan', 'horizonBand']
const OVERLAY_KEYS = ['axis', 'equator', 'terminator'] as const

const cityIds = new Set(cities.map((city) => city.id))

/**
 * `URLSearchParams` leaves `A-Za-z0-9*-._` alone and percent-encodes everything else, so
 * lists join on `.` and pairs join on `_`. City ids are lowercase slugs and dates are
 * `YYYY-MM-DD`, which keeps a shared link readable instead of a wall of `%2C`.
 */
const LIST_SEPARATOR = '.'
const PAIR_SEPARATOR = '_'

/** Day resolution is lossless here: the stored date is noon UTC and time of day rides on `solarHour`. */
function toDayStamp(iso: string): string | null {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function fromDayStamp(stamp: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stamp)) return null
  const date = new Date(`${stamp}T12:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))

function readNumber(raw: string | null, low: number, high: number): number | null {
  if (raw === null) return null
  const value = Number(raw)
  return Number.isFinite(value) ? clamp(value, low, high) : null
}

function readOneOf<T extends string>(raw: string | null, allowed: T[]): T | null {
  return raw !== null && (allowed as string[]).includes(raw) ? (raw as T) : null
}

function readCityList(raw: string | null): string[] | null {
  if (raw === null) return null
  const ids = raw.split(LIST_SEPARATOR).filter((id) => cityIds.has(id))
  return ids.length ? ids.slice(0, 4) : null
}

/**
 * Encodes the shareable state, omitting anything still at its default so a plain link
 * stays short and a first-time visitor's address bar does not fill with noise.
 */
export function encodeState(state: ShareableState): string {
  const params = new URLSearchParams()
  const put = (key: string, value: string) => params.set(key, value)

  if (state.activeLab !== SHAREABLE_DEFAULTS.activeLab) put('lab', state.activeLab)

  const day = toDayStamp(state.dateIso)
  if (day && day !== toDayStamp(SHAREABLE_DEFAULTS.dateIso)) put('d', day)

  if (Math.abs(state.solarHour - SHAREABLE_DEFAULTS.solarHour) > 0.005) put('h', state.solarHour.toFixed(2))
  if (Math.abs(state.tilt - SHAREABLE_DEFAULTS.tilt) > 0.005) put('t', state.tilt.toFixed(2))

  const cityList = state.selectedCityIds.filter((id) => cityIds.has(id))
  if (cityList.join(LIST_SEPARATOR) !== SHAREABLE_DEFAULTS.selectedCityIds.join(LIST_SEPARATOR)) {
    put('c', cityList.join(LIST_SEPARATOR))
  }
  // Only worth carrying when focus is not simply the first selected city.
  if (state.focusedCityId !== cityList[0]) put('f', state.focusedCityId)

  if (state.playbackMode !== SHAREABLE_DEFAULTS.playbackMode) put('pm', state.playbackMode)
  if (state.cameraMode !== SHAREABLE_DEFAULTS.cameraMode) put('cam', state.cameraMode)

  const overlays = OVERLAY_KEYS.filter((key) =>
    key === 'axis' ? state.showAxis : key === 'equator' ? state.showEquator : state.showTerminator,
  )
  const defaultOverlays = OVERLAY_KEYS.filter((key) =>
    key === 'axis' ? SHAREABLE_DEFAULTS.showAxis : key === 'equator' ? SHAREABLE_DEFAULTS.showEquator : SHAREABLE_DEFAULTS.showTerminator,
  )
  if (overlays.join(LIST_SEPARATOR) !== defaultOverlays.join(LIST_SEPARATOR)) put('ov', overlays.join(LIST_SEPARATOR))

  if (state.skyView !== SHAREABLE_DEFAULTS.skyView) put('sv', state.skyView)

  const layers = LAYER_KEYS.filter((key) => state.skyLayers[key])
  const defaultLayers = LAYER_KEYS.filter((key) => SHAREABLE_DEFAULTS.skyLayers[key])
  if (layers.join(LIST_SEPARATOR) !== defaultLayers.join(LIST_SEPARATOR)) put('sl', layers.join(LIST_SEPARATOR))

  const traces = state.skyTraces
    .slice(0, MAX_SKY_TRACES - 1)
    .map((trace) => {
      const stamp = toDayStamp(trace.dateIso)
      return cityIds.has(trace.cityId) && stamp ? `${trace.cityId}${PAIR_SEPARATOR}${stamp}` : null
    })
    .filter((entry): entry is string => entry !== null)
  if (traces.length) put('tr', traces.join(LIST_SEPARATOR))

  if (Math.abs(state.sundialCalibration - SHAREABLE_DEFAULTS.sundialCalibration) > 0.0005) {
    put('cal', state.sundialCalibration.toFixed(4))
  }

  return params.toString()
}

/**
 * Decodes whatever is present. Never throws and never returns a partial field: anything
 * unrecognised is dropped so a hand-edited or truncated link still opens the app.
 */
export function decodeState(search: string): Partial<ShareableState> {
  const result: Partial<ShareableState> = {}
  let params: URLSearchParams
  try {
    params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  } catch {
    return result
  }

  const lab = readOneOf(params.get('lab'), LABS)
  if (lab) result.activeLab = lab

  const day = params.get('d')
  const dateIso = day === null ? null : fromDayStamp(day)
  if (dateIso) result.dateIso = dateIso

  const solarHour = readNumber(params.get('h'), 0, 24)
  if (solarHour !== null) result.solarHour = solarHour

  const tilt = readNumber(params.get('t'), 0, 40)
  if (tilt !== null) result.tilt = tilt

  const cityList = readCityList(params.get('c'))
  if (cityList) result.selectedCityIds = cityList

  const focused = params.get('f')
  if (focused && cityIds.has(focused)) result.focusedCityId = focused
  else if (cityList) result.focusedCityId = cityList[0]

  const playbackMode = readOneOf(params.get('pm'), PLAYBACK_MODES)
  if (playbackMode) result.playbackMode = playbackMode

  const cameraMode = readOneOf(params.get('cam'), CAMERA_MODES)
  if (cameraMode) result.cameraMode = cameraMode

  const overlays = params.get('ov')
  if (overlays !== null) {
    const on = new Set(overlays.split(LIST_SEPARATOR))
    result.showAxis = on.has('axis')
    result.showEquator = on.has('equator')
    result.showTerminator = on.has('terminator')
  }

  const skyView = readOneOf(params.get('sv'), SKY_VIEWS)
  if (skyView) result.skyView = skyView

  const layers = params.get('sl')
  if (layers !== null) {
    const on = new Set(layers.split(LIST_SEPARATOR))
    result.skyLayers = LAYER_KEYS.reduce(
      (accumulated, key) => ({ ...accumulated, [key]: on.has(key) }),
      {} as SkyLayers,
    )
  }

  const traces = params.get('tr')
  if (traces !== null) {
    const parsed = traces
      .split(LIST_SEPARATOR)
      .map((entry) => {
        const [cityId, stamp] = entry.split(PAIR_SEPARATOR)
        const traceIso = stamp ? fromDayStamp(stamp) : null
        return cityId && cityIds.has(cityId) && traceIso ? { cityId, dateIso: traceIso } : null
      })
      .filter((entry): entry is { cityId: string; dateIso: string } => entry !== null)
    result.skyTraces = parsed.slice(0, MAX_SKY_TRACES - 1)
  }

  const calibration = readNumber(params.get('cal'), 0, 1)
  if (calibration !== null) result.sundialCalibration = calibration

  return result
}
