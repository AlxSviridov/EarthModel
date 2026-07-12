import { describe, expect, it } from 'vitest'
import { daylightAt, formatDuration, isLeapYear } from './solar'

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
})

