import { describe, expect, it } from 'vitest'
import { decodeState, encodeState, SHAREABLE_DEFAULTS, type ShareableState } from './urlState'

const withState = (patch: Partial<ShareableState>): ShareableState => ({ ...SHAREABLE_DEFAULTS, ...patch })

describe('shareable url state', () => {
  it('writes nothing for a freshly opened app', () => {
    expect(encodeState(SHAREABLE_DEFAULTS)).toBe('')
  })

  it('omits every field still at its default', () => {
    const encoded = encodeState(withState({ activeLab: 'sundial' }))
    expect(encoded).toBe('lab=sundial')
  })

  it('round-trips a full investigation', () => {
    const state = withState({
      activeLab: 'sky',
      dateIso: new Date(Date.UTC(2026, 5, 21, 12)).toISOString(),
      solarHour: 6.5,
      tilt: 40,
      selectedCityIds: ['tromso', 'quito'],
      focusedCityId: 'quito',
      playbackMode: 'day',
      cameraMode: 'orbit',
      showAxis: false,
      showEquator: true,
      showTerminator: false,
      skyView: 'observer',
      skyLayers: { nightArc: false, hourTicks: true, yearFan: true, horizonBand: true },
      skyTraces: [{ cityId: 'london', dateIso: new Date(Date.UTC(2026, 11, 21, 12)).toISOString() }],
      sundialCalibration: 0.5,
    })
    const decoded = decodeState(encodeState(state))
    expect({ ...SHAREABLE_DEFAULTS, ...decoded }).toEqual(state)
  })

  it('keeps the date to day resolution, which is lossless here', () => {
    const state = withState({ dateIso: new Date(Date.UTC(2026, 5, 21, 12)).toISOString() })
    expect(encodeState(state)).toContain('d=2026-06-21')
    expect(decodeState(encodeState(state)).dateIso).toBe(state.dateIso)
  })

  it('stays readable rather than percent-encoding its separators', () => {
    const encoded = encodeState(withState({ selectedCityIds: ['london', 'quito'], focusedCityId: 'london' }))
    expect(encoded).toContain('c=london.quito')
    expect(encoded).not.toContain('%')
  })

  it('drops the focus key when focus is simply the first selected city', () => {
    const encoded = encodeState(withState({ selectedCityIds: ['quito', 'london'], focusedCityId: 'quito' }))
    expect(encoded).not.toContain('f=')
    expect(decodeState(encoded).focusedCityId).toBe('quito')
  })

  it('reads a hand-written link', () => {
    const decoded = decodeState('?lab=sky&d=2026-12-21&c=tromso&sv=observer')
    expect(decoded.activeLab).toBe('sky')
    expect(decoded.selectedCityIds).toEqual(['tromso'])
    expect(decoded.focusedCityId).toBe('tromso')
    expect(decoded.skyView).toBe('observer')
    expect(new Date(decoded.dateIso!).getUTCMonth()).toBe(11)
  })

  it('accepts a leading question mark or none', () => {
    expect(decodeState('?lab=sundial')).toEqual(decodeState('lab=sundial'))
  })

  it('ignores unknown cities instead of throwing', () => {
    expect(decodeState('c=atlantis')).toEqual({})
    expect(decodeState('c=atlantis.london').selectedCityIds).toEqual(['london'])
    expect(decodeState('f=atlantis').focusedCityId).toBeUndefined()
  })

  it('ignores unknown enum values', () => {
    expect(decodeState('lab=moon&pm=century&cam=drone&sv=upsidedown')).toEqual({})
  })

  it('clamps numbers into their real ranges', () => {
    expect(decodeState('h=99').solarHour).toBe(24)
    expect(decodeState('h=-5').solarHour).toBe(0)
    expect(decodeState('t=900').tilt).toBe(40)
    expect(decodeState('cal=7').sundialCalibration).toBe(1)
  })

  it('drops numbers that are not numbers', () => {
    expect(decodeState('h=noon&t=steep&cal=later')).toEqual({})
  })

  it('survives empty, malformed and hostile input', () => {
    for (const input of ['', '?', '&&&', '=', '?=&=', 'd=yesterday', 'tr=', 'tr=london', 'tr=_', 'sl=', 'ov=']) {
      expect(() => decodeState(input)).not.toThrow()
    }
    expect(decodeState('d=yesterday').dateIso).toBeUndefined()
    expect(decodeState('tr=london').skyTraces).toEqual([])
  })

  it('treats an empty overlay list as everything off, not as absent', () => {
    const decoded = decodeState('ov=')
    expect(decoded.showAxis).toBe(false)
    expect(decoded.showEquator).toBe(false)
    expect(decoded.showTerminator).toBe(false)
  })

  it('caps pinned traces at the three the lab can show', () => {
    const many = Array.from({ length: 6 }, () => ({ cityId: 'london', dateIso: SHAREABLE_DEFAULTS.dateIso }))
    expect(decodeState(encodeState(withState({ skyTraces: many }))).skyTraces).toHaveLength(3)
  })

  it('keeps a trace list readable and drops only the broken entries', () => {
    const decoded = decodeState('tr=london_2026-06-21.atlantis_2026-06-21.quito_nonsense')
    expect(decoded.skyTraces).toEqual([{ cityId: 'london', dateIso: '2026-06-21T12:00:00.000Z' }])
  })
})
