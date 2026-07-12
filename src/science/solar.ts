export const EARTH_TILT_DEGREES = 23.44
export const APPARENT_SUNRISE_ALTITUDE_DEGREES = -0.833
export const MS_PER_DAY = 86_400_000
export const MS_PER_HOUR = 3_600_000

const radians = (degrees: number) => (degrees * Math.PI) / 180
const degrees = (radiansValue: number) => (radiansValue * 180) / Math.PI

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

export function dayOfYear(date: Date): number {
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)
  return Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - yearStart) / MS_PER_DAY) + 1
}

/** NOAA-style fractional-year declination approximation for Earth. */
export function solarDeclination(date: Date): number {
  const yearLength = daysInYear(date.getUTCFullYear())
  const gamma = (2 * Math.PI / yearLength) * (dayOfYear(date) - 1 + (date.getUTCHours() - 12) / 24)
  return (
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)
  )
}

/** Conceptual variable-tilt declination, with March equinox near day 80. */
export function declinationForTilt(date: Date, tiltDegrees: number): number {
  if (Math.abs(tiltDegrees - EARTH_TILT_DEGREES) < 0.001) return solarDeclination(date)
  const phase = (2 * Math.PI * (dayOfYear(date) - 80)) / daysInYear(date.getUTCFullYear())
  return Math.asin(Math.sin(radians(tiltDegrees)) * Math.sin(phase))
}

export type SolarState = 'normal' | 'midnight-sun' | 'polar-night'

export interface DaylightResult {
  hours: number
  darknessHours: number
  state: SolarState
  declinationDegrees: number
}

export function daylightAt(latitudeDegrees: number, date: Date, tiltDegrees = EARTH_TILT_DEGREES): DaylightResult {
  const latitude = radians(Math.max(-90, Math.min(90, latitudeDegrees)))
  const declination = declinationForTilt(date, tiltDegrees)
  const altitude = radians(APPARENT_SUNRISE_ALTITUDE_DEGREES)
  const denominator = Math.cos(latitude) * Math.cos(declination)
  const numerator = Math.sin(altitude) - Math.sin(latitude) * Math.sin(declination)

  if (Math.abs(denominator) < 1e-10) {
    const lit = Math.sin(latitude) * Math.sin(declination) > Math.sin(altitude)
    return { hours: lit ? 24 : 0, darknessHours: lit ? 0 : 24, state: lit ? 'midnight-sun' : 'polar-night', declinationDegrees: degrees(declination) }
  }

  const cosineHourAngle = numerator / denominator
  if (cosineHourAngle <= -1) return { hours: 24, darknessHours: 0, state: 'midnight-sun', declinationDegrees: degrees(declination) }
  if (cosineHourAngle >= 1) return { hours: 0, darknessHours: 24, state: 'polar-night', declinationDegrees: degrees(declination) }

  const hours = (24 * Math.acos(cosineHourAngle)) / Math.PI
  return { hours, darknessHours: 24 - hours, state: 'normal', declinationDegrees: degrees(declination) }
}

export function annualDaylight(latitude: number, year: number, tilt = EARTH_TILT_DEGREES): number[] {
  return Array.from({ length: daysInYear(year) }, (_, index) =>
    daylightAt(latitude, new Date(Date.UTC(year, 0, index + 1, 12)), tilt).hours,
  )
}

export function formatDuration(hours: number): string {
  const roundedMinutes = Math.round(hours * 60)
  return `${Math.floor(roundedMinutes / 60)}h ${String(roundedMinutes % 60).padStart(2, '0')}m`
}

export function dateFromYearProgress(year: number, progress: number): Date {
  const clamped = Math.max(0, Math.min(1, progress))
  return new Date(Date.UTC(year, 0, 1, 12) + clamped * (daysInYear(year) - 1) * MS_PER_DAY)
}

export function yearProgress(date: Date): number {
  return (dayOfYear(date) - 1) / (daysInYear(date.getUTCFullYear()) - 1)
}

export function subsolarLongitude(date: Date): number {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  return 180 - utcHours * 15
}

export interface SolarPosition {
  altitudeDegrees: number
  azimuthDegrees: number
  aboveHorizon: boolean
}

/** Sun position for a geographic latitude at apparent local solar time. Azimuth is clockwise from north. */
export function solarPosition(
  latitudeDegrees: number,
  date: Date,
  localSolarHours: number,
  tiltDegrees = EARTH_TILT_DEGREES,
): SolarPosition {
  const latitude = radians(Math.max(-90, Math.min(90, latitudeDegrees)))
  const declination = declinationForTilt(date, tiltDegrees)
  const hourAngle = radians((localSolarHours - 12) * 15)
  const altitude = Math.asin(
    Math.sin(latitude) * Math.sin(declination) +
      Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
  )
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(declination) * Math.cos(latitude),
  )
  const azimuthDegrees = ((degrees(azimuth) + 180) % 360 + 360) % 360
  const altitudeDegrees = degrees(altitude)
  return { altitudeDegrees, azimuthDegrees, aboveHorizon: altitudeDegrees >= APPARENT_SUNRISE_ALTITUDE_DEGREES }
}

export function sunriseSunsetSolarHours(latitude: number, date: Date, tilt = EARTH_TILT_DEGREES): { sunrise: number | null; sunset: number | null; state: SolarState } {
  const result = daylightAt(latitude, date, tilt)
  if (result.state !== 'normal') return { sunrise: null, sunset: null, state: result.state }
  return { sunrise: 12 - result.hours / 2, sunset: 12 + result.hours / 2, state: result.state }
}

/** Approximate difference: apparent solar time minus mean solar time, in minutes. */
export function equationOfTimeMinutes(date: Date): number {
  const gamma = (2 * Math.PI * (dayOfYear(date) - 1)) / daysInYear(date.getUTCFullYear())
  return 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  )
}

export function calibratedSundialErrorMinutes(date: Date, calibrationDate: Date): number {
  return equationOfTimeMinutes(date) - equationOfTimeMinutes(calibrationDate)
}

export interface SundialShadow {
  east: number
  north: number
  length: number
  visible: boolean
}

/** Angle of an hour line from the noon line on a horizontal dial. Morning is negative. */
export function horizontalDialHourAngleDegrees(latitude: number, localSolarHours: number): number {
  const hourAngle = radians((localSolarHours - 12) * 15)
  return degrees(Math.atan(Math.sin(radians(Math.abs(latitude))) * Math.tan(hourAngle)))
}

/** Shadow tip cast by a unit polar-aligned gnomon onto a horizontal dial. */
export function sundialShadow(latitude: number, date: Date, localSolarHours: number): SundialShadow {
  const position = solarPosition(latitude, date, localSolarHours)
  if (position.altitudeDegrees <= 0) return { east: 0, north: 0, length: 0, visible: false }
  const latitudeMagnitude = radians(Math.abs(latitude))
  const poleSign = latitude >= 0 ? 1 : -1
  const gnomonNorth = poleSign * Math.cos(latitudeMagnitude)
  const gnomonUp = Math.sin(latitudeMagnitude)
  const altitude = radians(position.altitudeDegrees)
  const azimuth = radians(position.azimuthDegrees)
  const sunEast = Math.cos(altitude) * Math.sin(azimuth)
  const sunNorth = Math.cos(altitude) * Math.cos(azimuth)
  const rayDistance = gnomonUp / Math.max(Math.sin(altitude), 1e-6)
  const east = -rayDistance * sunEast
  const north = gnomonNorth - rayDistance * sunNorth
  const length = Math.min(Math.hypot(east, north), 12)
  const scale = Math.hypot(east, north) > 12 ? 12 / Math.hypot(east, north) : 1
  return { east: east * scale, north: north * scale, length, visible: true }
}

/** UTC instant whose simplified apparent local solar time matches the requested hour at a longitude. */
export function dateAtLocalSolarTime(date: Date, longitudeDegrees: number, localSolarHours: number): Date {
  const utcHours = localSolarHours - longitudeDegrees / 15
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) + utcHours * MS_PER_HOUR)
}

export function formatClock(hours: number): string {
  const normalized = ((hours % 24) + 24) % 24
  const totalMinutes = Math.round(normalized * 60) % (24 * 60)
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
}

export function isLocationInDaylight(latitude: number, longitude: number, date: Date, tilt = EARTH_TILT_DEGREES): boolean {
  const declination = declinationForTilt(date, tilt)
  const hourAngle = radians(longitude - subsolarLongitude(date))
  const altitude = Math.asin(
    Math.sin(radians(latitude)) * Math.sin(declination) +
      Math.cos(radians(latitude)) * Math.cos(declination) * Math.cos(hourAngle),
  )
  return degrees(altitude) >= APPARENT_SUNRISE_ALTITUDE_DEGREES
}
