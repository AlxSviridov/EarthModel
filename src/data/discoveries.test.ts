import { describe, expect, it } from 'vitest'
import { cities } from './cities'
import { discoveries, discoveryState } from './discoveries'
import { MAX_SKY_TRACES } from './skyTraces'

const cityIds = new Set(cities.map((city) => city.id))
const byId = (id: string) => discoveries.find((discovery) => discovery.id === id)!

describe('discovery deck', () => {
  it('covers every learning scenario in the product plan', () => {
    // docs/PRODUCT.md defines 24 scenarios: 10 for v1, 7 for v2's labs, 7 for the v3 sky dome.
    expect(discoveries).toHaveLength(24)
  })

  it('gives every discovery a unique id', () => {
    expect(new Set(discoveries.map((discovery) => discovery.id)).size).toBe(discoveries.length)
  })

  it('names only cities that exist', () => {
    for (const discovery of discoveries) {
      expect(discovery.cityIds.length).toBeGreaterThan(0)
      for (const id of discovery.cityIds) expect(cityIds.has(id)).toBe(true)
      for (const trace of discovery.traces ?? []) expect(cityIds.has(trace.cityId)).toBe(true)
    }
  })

  it('reaches all three labs', () => {
    const labs = new Set(discoveries.map((discovery) => discovery.lab))
    expect(labs).toEqual(new Set(['orbit', 'sky', 'sundial']))
  })

  it('builds a complete state patch with no undefined fields', () => {
    for (const discovery of discoveries) {
      const state = discoveryState(discovery)
      for (const [key, value] of Object.entries(state)) {
        expect(value, `${discovery.id}.${key}`).toBeDefined()
      }
      expect(Number.isNaN(new Date(state.dateIso).getTime())).toBe(false)
    }
  })

  it('focuses the first named city', () => {
    for (const discovery of discoveries) {
      const state = discoveryState(discovery)
      expect(state.focusedCityId).toBe(discovery.cityIds[0])
      expect(state.selectedCityIds).toContain(state.focusedCityId)
    }
  })

  it('never asks for more traces than the sky lab can show', () => {
    for (const discovery of discoveries) {
      expect(discoveryState(discovery).skyTraces.length).toBeLessThanOrEqual(MAX_SKY_TRACES - 1)
    }
  })

  it('only pins traces in the lab that draws them', () => {
    for (const discovery of discoveries) {
      if (discovery.traces?.length) expect(discovery.lab, discovery.id).toBe('sky')
    }
  })

  it('defaults everything a discovery does not ask for', () => {
    const state = discoveryState(byId('year'))
    expect(state).toMatchObject({
      tilt: 23.44, solarHour: 12, playing: false, playbackMode: 'year',
      yearSpeed: 30, daySpeed: 4, cameraMode: 'globe', skyView: 'whole',
    })
    expect(state.skyLayers).toEqual({ nightArc: true, hourTicks: true, yearFan: false, horizonBand: false })
  })

  it('carries the playback settings the v2 scenarios are defined by', () => {
    // Scenario 11 is "play 30 days a second"; scenario 12 is "play one day slowly".
    const calmYear = discoveryState(byId('calm-year'))
    expect(calmYear).toMatchObject({ playbackMode: 'year', yearSpeed: 30, playing: true, activeLab: 'orbit' })

    const sunrise = discoveryState(byId('one-sunrise'))
    expect(sunrise).toMatchObject({ playbackMode: 'day', daySpeed: 1, playing: true })
    // It has to start before sunrise, or there is no crossing to watch.
    expect(sunrise.solarHour).toBeLessThan(4)
  })

  it('opens the first-person viewpoint for the scenario that is about standing there', () => {
    expect(discoveryState(byId('stand-and-turn')).skyView).toBe('observer')
  })

  it('turns on the sunrise band for the scenario that is about it', () => {
    const state = discoveryState(byId('sunrise-wanders'))
    expect(state.skyLayers.horizonBand).toBe(true)
    // Merged over the defaults, not replacing them.
    expect(state.skyLayers.nightArc).toBe(true)
  })

  it('sets the tilt experiments and leaves every other discovery at 23.44', () => {
    expect(discoveryState(byId('zero-tilt')).tilt).toBe(0)
    expect(discoveryState(byId('big-tilt')).tilt).toBe(40)
    const experiments = new Set(['zero-tilt', 'big-tilt'])
    for (const discovery of discoveries) {
      if (!experiments.has(discovery.id)) expect(discoveryState(discovery).tilt, discovery.id).toBe(23.44)
    }
  })

  it('calibrates the sundial discoveries on 15 April', () => {
    for (const id of ['calibrate', 'dial-latitude']) {
      const state = discoveryState(byId(id))
      expect(state.activeLab).toBe('sundial')
      expect(state.sundialCalibration).toBeCloseTo(104 / 364, 6)
    }
  })

  it('keeps every prediction answerable and correctly keyed', () => {
    const predictions = discoveries.filter((discovery) => discovery.choices)
    expect(predictions.length).toBeGreaterThanOrEqual(8)
    for (const discovery of predictions) {
      expect(discovery.choices).toHaveLength(2)
      expect(discovery.answer, discovery.id).toBeTypeOf('number')
      expect([0, 1]).toContain(discovery.answer)
      expect(discovery.choices![0]).not.toBe(discovery.choices![1])
    }
  })

  it('never ships an answer key without choices to pick from', () => {
    for (const discovery of discoveries) {
      if (discovery.answer !== undefined) expect(discovery.choices, discovery.id).toBeDefined()
    }
  })

  it('writes copy a ten-year-old can read', () => {
    for (const discovery of discoveries) {
      expect(discovery.question.length, discovery.id).toBeLessThan(120)
      expect(discovery.question.endsWith('?'), discovery.id).toBe(true)
      expect(discovery.insight.length, discovery.id).toBeGreaterThan(20)
      expect(discovery.title.length, discovery.id).toBeLessThan(48)
    }
  })

  it('uses real calendar dates', () => {
    for (const discovery of discoveries) {
      expect(discovery.month).toBeGreaterThanOrEqual(0)
      expect(discovery.month).toBeLessThanOrEqual(11)
      expect(discovery.day).toBeGreaterThanOrEqual(1)
      expect(discovery.day).toBeLessThanOrEqual(31)
      const date = new Date(discoveryState(discovery).dateIso)
      expect(date.getUTCMonth(), discovery.id).toBe(discovery.month)
      expect(date.getUTCDate(), discovery.id).toBe(discovery.day)
    }
  })
})
