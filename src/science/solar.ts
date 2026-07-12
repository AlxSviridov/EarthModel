export const EARTH_TILT_DEGREES = 23.44
export const APPARENT_SUNRISE_ALTITUDE_DEGREES = -0.833
export const MS_PER_DAY = 86_400_000

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

export function isLocationInDaylight(latitude: number, longitude: number, date: Date, tilt = EARTH_TILT_DEGREES): boolean {
  const declination = declinationForTilt(date, tilt)
  const hourAngle = radians(longitude - subsolarLongitude(date))
  const altitude = Math.asin(
    Math.sin(radians(latitude)) * Math.sin(declination) +
      Math.cos(radians(latitude)) * Math.cos(declination) * Math.cos(hourAngle),
  )
  return degrees(altitude) >= APPARENT_SUNRISE_ALTITUDE_DEGREES
}

