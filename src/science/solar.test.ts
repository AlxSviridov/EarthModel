import { describe, expect, it } from 'vitest'
import { calibratedSundialErrorMinutes, dateAtLocalSolarTime, daylightAt, equationOfTimeMinutes, formatClock, formatDuration, horizontalDialHourAngleDegrees, isLeapYear, solarPosition, sundialShadow, sunriseSunsetSolarHours } from './solar'

describe('daylight model', () => {
  it('keeps the equator near 12 hours through the year', () => {
    for (const month of [0, 2, 5, 8, 11]) {
      expect(daylightAt(0, new Date(Date.UTC(2026, month, 21, 12))).hours).toBeGreaterThan(12)
      expect(daylightAt(0, new Date(Date.UTC(2026, month, 21, 12))).hours).toBeLessThan(12.2)
    }
  })

  it('reverses seasons between hemispheres', () => {
    const june = new Date(Date.UTC(2026, 5, 21, 12))
    expect(daylightAt(51.5, june).hours).toBeGreaterThan(daylightAt(-33.87, june).hours)
  })

  it('handles polar day and night', () => {
    expect(daylightAt(69.65, new Date(Date.UTC(2026, 5, 21, 12))).state).toBe('midnight-sun')
    expect(daylightAt(69.65, new Date(Date.UTC(2026, 11, 21, 12))).state).toBe('polar-night')
  })

  it('makes every latitude nearly constant when tilt is zero', () => {
    const january = daylightAt(60, new Date(Date.UTC(2026, 0, 10, 12)), 0).hours
    const july = daylightAt(60, new Date(Date.UTC(2026, 6, 10, 12)), 0).hours
    expect(Math.abs(january - july)).toBeLessThan(0.01)
  })

  it('formats rounded durations and leap years', () => {
    expect(formatDuration(12.5)).toBe('12h 30m')
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(2100)).toBe(false)
  })

  it('places the noon Sun high in London summer and low in winter', () => {
    const summer = solarPosition(51.5074, new Date(Date.UTC(2026, 5, 21)), 12)
    const winter = solarPosition(51.5074, new Date(Date.UTC(2026, 11, 21)), 12)
    expect(summer.altitudeDegrees).toBeGreaterThan(60)
    expect(winter.altitudeDegrees).toBeLessThan(16)
    expect(summer.azimuthDegrees).toBeCloseTo(180, 4)
  })

  it('returns usable local-solar sunrise and sunset times', () => {
    const times = sunriseSunsetSolarHours(51.5074, new Date(Date.UTC(2026, 5, 21)))
    expect(times.sunrise).toBeGreaterThan(3.5)
    expect(times.sunrise).toBeLessThan(4.5)
    expect(times.sunset).toBeGreaterThan(19.5)
    expect(times.sunset).toBeLessThan(20.5)
  })

  it('models the equation of time and calibration drift', () => {
    const february = new Date(Date.UTC(2026, 1, 11))
    const november = new Date(Date.UTC(2026, 10, 3))
    expect(equationOfTimeMinutes(february)).toBeLessThan(-13)
    expect(equationOfTimeMinutes(november)).toBeGreaterThan(15)
    expect(calibratedSundialErrorMinutes(november, february)).toBeGreaterThan(28)
  })

  it('casts a shorter noon shadow when the Sun is higher', () => {
    const date = new Date(Date.UTC(2026, 2, 20))
    expect(sundialShadow(0, date, 12).length).toBeLessThan(sundialShadow(51.5, date, 12).length)
    expect(sundialShadow(51.5, date, 0).visible).toBe(false)
  })

  it('lays out horizontal sundial hour lines symmetrically by latitude', () => {
    const londonMorning = horizontalDialHourAngleDegrees(51.5, 9)
    const londonAfternoon = horizontalDialHourAngleDegrees(51.5, 15)
    expect(londonMorning).toBeCloseTo(-londonAfternoon, 8)
    expect(londonMorning).toBeLessThan(-35)
    expect(Math.abs(horizontalDialHourAngleDegrees(0.1, 9))).toBeLessThan(1)
  })

  it('maps local solar time onto UTC and formats clocks', () => {
    const date = dateAtLocalSolarTime(new Date(Date.UTC(2026, 0, 1)), 30, 12)
    expect(date.getUTCHours()).toBe(10)
    expect(formatClock(5.5)).toBe('05:30')
    expect(formatClock(25)).toBe('01:00')
  })
})
