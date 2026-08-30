import { cityById, type City } from './cities'
import { compassPoint, eastOffsetDegrees, formatClock, formatDuration, sunDayEvents, sunTrack, type SolarState } from '../science/solar'

export type SkyView = 'observer' | 'birdseye' | 'whole'

export interface SkyLayers {
  nightArc: boolean
  hourTicks: boolean
  yearFan: boolean
  horizonBand: boolean
}

export const DEFAULT_SKY_LAYERS: SkyLayers = { nightArc: true, hourTicks: true, yearFan: false, horizonBand: false }

/** Pinned comparison trace. The live trace is not stored: it follows the shared city and date. */
export interface SkyTrace {
  id: string
  cityId: string
  dateIso: string
}

export const MAX_SKY_TRACES = 4

/** Fixed by slot, so two traces on the same city never share a colour. */
export const TRACE_COLORS = ['#78dcff', '#ffc96d', '#6be3ad', '#b8a7ff']

export interface ResolvedTrace {
  id: string
  city: City
  date: Date
  dateIso: string
  tilt: number
  color: string
  label: string
  dateLabel: string
  live: boolean
}

const DATE_LABEL = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export function resolveTraces(focusedCityId: string, dateIso: string, pinned: SkyTrace[], tilt: number): ResolvedTrace[] {
  const live: ResolvedTrace = {
    id: 'live',
    city: cityById(focusedCityId),
    date: new Date(dateIso),
    dateIso,
    tilt,
    color: TRACE_COLORS[0],
    label: cityById(focusedCityId).name,
    dateLabel: DATE_LABEL.format(new Date(dateIso)),
    live: true,
  }
  return [
    live,
    ...pinned.slice(0, MAX_SKY_TRACES - 1).map((trace, index) => ({
      id: trace.id,
      city: cityById(trace.cityId),
      date: new Date(trace.dateIso),
      dateIso: trace.dateIso,
      tilt,
      color: TRACE_COLORS[(index + 1) % TRACE_COLORS.length],
      label: cityById(trace.cityId).name,
      dateLabel: DATE_LABEL.format(new Date(trace.dateIso)),
      live: false,
    })),
  ]
}

export interface TraceReading {
  state: SolarState
  riseLine: string
  sideLine: string
  sunriseAzimuth: number | null
  sunsetAzimuth: number | null
  sunriseText: string
  sunsetText: string
  highestText: string
  daylightText: string
}

const northOfEastWest = (azimuthDegrees: number) => azimuthDegrees < 90 || azimuthDegrees > 270

/**
 * Two separate facts. Which side of due east the Sun rises depends on the date alone, so it holds
 * at every latitude. Whether it then crosses the east-west line needs the midday Sun on the far
 * side, which depends on latitude — near the equator the Sun can rise north of east and stay north
 * all day.
 */
export function readTrace(trace: ResolvedTrace): TraceReading {
  const events = sunDayEvents(trace.city.latitude, trace.date, trace.tilt)
  const daylit = sunTrack(trace.city.latitude, trace.date, 5, trace.tilt).filter((sample) => sample.aboveHorizon)
  const noonNorth = northOfEastWest(events.noonAzimuthDegrees)
  const crosses = daylit.some((sample) => northOfEastWest(sample.azimuthDegrees)) && daylit.some((sample) => !northOfEastWest(sample.azimuthDegrees))
  const nearZenith = Math.abs(90 - events.noonAltitudeDegrees) < 3

  let riseLine: string
  if (events.state === 'polar-night') riseLine = 'Never rises today — it stays below the horizon'
  else if (events.state === 'midnight-sun') riseLine = 'Never rises or sets — it circles all the way round'
  else {
    const azimuth = events.sunrise!.azimuthDegrees
    const offset = eastOffsetDegrees(azimuth)
    riseLine = Math.abs(offset) < 1.5
      ? `Rises ${azimuth.toFixed(1)}° — almost exactly due east`
      : `Rises ${azimuth.toFixed(1)}° ${compassPoint(azimuth)} — ${Math.abs(offset).toFixed(0)}° ${offset > 0 ? 'north' : 'south'} of due east`
  }

  let sideLine: string
  if (events.state === 'polar-night') sideLine = 'The whole path stays under the ground'
  else if (events.state === 'midnight-sun') sideLine = `Swings right round — ${noonNorth ? 'north' : 'south'} at midday, the opposite way at midnight`
  else if (nearZenith) sideLine = 'Passes almost straight overhead at midday'
  else if (crosses) sideLine = `Crosses to the ${noonNorth ? 'north' : 'south'} side at midday`
  else sideLine = `Stays on the ${noonNorth ? 'north' : 'south'} side all day`

  return {
    state: events.state,
    riseLine,
    sideLine,
    sunriseAzimuth: events.sunrise?.azimuthDegrees ?? null,
    sunsetAzimuth: events.sunset?.azimuthDegrees ?? null,
    sunriseText: events.sunrise ? `${formatClock(events.sunrise.hour)} · ${events.sunrise.azimuthDegrees.toFixed(0)}° ${compassPoint(events.sunrise.azimuthDegrees)}` : '—',
    sunsetText: events.sunset ? `${formatClock(events.sunset.hour)} · ${events.sunset.azimuthDegrees.toFixed(0)}° ${compassPoint(events.sunset.azimuthDegrees)}` : '—',
    highestText: `${events.noonAltitudeDegrees.toFixed(1)}° at 12:00`,
    daylightText: formatDuration(events.daylightHours),
  }
}
