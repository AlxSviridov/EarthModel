import { describe, expect, it } from 'vitest'
import { annualSunriseAzimuthRange, calibratedSundialErrorMinutes, compassPoint, dateAtLocalSolarTime, daylightAt, eastOffsetDegrees, equationOfTimeMinutes, formatClock, formatDuration, horizontalDialHourAngleDegrees, isLeapYear, skyVector, solarPosition, sunDayEvents, sundialShadow, sunriseSunsetSolarHours, sunTrack } from './solar'

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

  it('swings London sunrise from the north-east in June to the south-east in December', () => {
    const june = sunDayEvents(51.5074, new Date(Date.UTC(2026, 5, 21, 12)))
    const december = sunDayEvents(51.5074, new Date(Date.UTC(2026, 11, 21, 12)))
    expect(june.sunrise!.azimuthDegrees).toBeGreaterThan(45)
    expect(june.sunrise!.azimuthDegrees).toBeLessThan(55)
    expect(june.sunset!.azimuthDegrees).toBeGreaterThan(305)
    expect(december.sunrise!.azimuthDegrees).toBeGreaterThan(125)
    expect(december.sunrise!.azimuthDegrees).toBeLessThan(132)
    expect(december.sunset!.azimuthDegrees).toBeLessThan(235)
  })

  it('puts sunrise north of due east in June at every latitude, both hemispheres', () => {
    const june = new Date(Date.UTC(2026, 5, 21, 12))
    for (const latitude of [51.5074, -0.18, -33.87, -54.8]) {
      expect(sunDayEvents(latitude, june).sunrise!.azimuthDegrees).toBeLessThan(90)
      expect(eastOffsetDegrees(sunDayEvents(latitude, june).sunrise!.azimuthDegrees)).toBeGreaterThan(0)
    }
  })

  it('rises almost but not exactly due east at the equinox', () => {
    const march = new Date(Date.UTC(2026, 2, 20, 12))
    for (const latitude of [51.5074, 0, -33.87, 69.65]) {
      const azimuth = sunDayEvents(latitude, march).sunrise!.azimuthDegrees
      expect(Math.abs(azimuth - 90)).toBeLessThan(2)
      expect(azimuth).not.toBe(90)
    }
  })

  it('separates rising north of east from crossing the east-west line', () => {
    const june = new Date(Date.UTC(2026, 5, 21, 12))
    const northOf = (sample: { azimuthDegrees: number }) => sample.azimuthDegrees < 90 || sample.azimuthDegrees > 270
    const quito = sunTrack(-0.18, june).filter((sample) => sample.aboveHorizon)
    expect(sunDayEvents(-0.18, june).sunrise!.azimuthDegrees).toBeLessThan(90)
    expect(quito.every(northOf)).toBe(true)
    const london = sunTrack(51.5074, june).filter((sample) => sample.aboveHorizon)
    expect(london.some(northOf)).toBe(true)
    expect(london.some((sample) => !northOf(sample))).toBe(true)
  })

  it('keeps the Tromso Sun up all day in June and down all day in December', () => {
    const june = sunDayEvents(69.65, new Date(Date.UTC(2026, 5, 21, 12)))
    expect(june.state).toBe('midnight-sun')
    expect(june.sunrise).toBeNull()
    expect(sunTrack(69.65, new Date(Date.UTC(2026, 5, 21, 12))).every((sample) => sample.aboveHorizon)).toBe(true)
    const december = sunDayEvents(69.65, new Date(Date.UTC(2026, 11, 21, 12)))
    expect(december.state).toBe('polar-night')
    expect(december.noonAltitudeDegrees).toBeLessThan(0)
    expect(sunTrack(69.65, new Date(Date.UTC(2026, 11, 21, 12))).some((sample) => sample.aboveHorizon)).toBe(false)
  })

  it('samples a whole day without gaps or invalid numbers at the poles', () => {
    const track = sunTrack(90, new Date(Date.UTC(2026, 5, 21, 12)), 60)
    expect(track).toHaveLength(25)
    expect(track[0].hour).toBe(0)
    expect(track[track.length - 1].hour).toBe(24)
    expect(track.every((sample) => Number.isFinite(sample.altitudeDegrees) && Number.isFinite(sample.azimuthDegrees))).toBe(true)
    expect(sunTrack(-90, new Date(Date.UTC(2026, 11, 21, 12)), 60).every((sample) => Number.isFinite(sample.altitudeDegrees))).toBe(true)
  })

  it('names compass directions and measures the offset from due east', () => {
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(45)).toBe('NE')
    expect(compassPoint(90)).toBe('E')
    expect(compassPoint(359)).toBe('N')
    expect(eastOffsetDegrees(49)).toBeCloseTo(41, 8)
    expect(eastOffsetDegrees(128)).toBeCloseTo(-38, 8)
    expect(eastOffsetDegrees(311)).toBeCloseTo(139, 8)
  })

  it('widens the annual sunrise spread towards the poles and counts sunless days', () => {
    const london = annualSunriseAzimuthRange(51.5074, 2026)
    const quito = annualSunriseAzimuthRange(-0.18, 2026)
    const tromso = annualSunriseAzimuthRange(69.65, 2026)
    expect(london.maxAzimuth! - london.minAzimuth!).toBeGreaterThan(quito.maxAzimuth! - quito.minAzimuth!)
    expect(tromso.maxAzimuth! - tromso.minAzimuth!).toBeGreaterThan(london.maxAzimuth! - london.minAzimuth!)
    expect(london.daysWithoutSunrise).toBe(0)
    expect(tromso.daysWithoutSunrise).toBeGreaterThan(60)
  })

  it('points sky vectors at the cardinal directions and the zenith', () => {
    expect(skyVector(0, 0)).toMatchObject({ north: expect.closeTo(1, 8), up: expect.closeTo(0, 8) })
    expect(skyVector(0, 90).east).toBeCloseTo(1, 8)
    expect(skyVector(0, 180).north).toBeCloseTo(-1, 8)
    expect(skyVector(0, 270).east).toBeCloseTo(-1, 8)
    expect(skyVector(90, 0).up).toBeCloseTo(1, 8)
  })
})
