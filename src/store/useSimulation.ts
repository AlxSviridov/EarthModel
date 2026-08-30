import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cityById } from '../data/cities'
import { DEFAULT_SKY_LAYERS, MAX_SKY_TRACES, type SkyLayers, type SkyTrace, type SkyView } from '../data/skyTraces'
import { dateFromYearProgress, EARTH_TILT_DEGREES, yearProgress } from '../science/solar'

export type CameraMode = 'globe' | 'orbit'
export type PlaybackMode = 'year' | 'day'
export type Lab = 'orbit' | 'sky' | 'sundial'

interface SimulationState {
  dateIso: string
  activeLab: Lab
  playing: boolean
  playbackMode: PlaybackMode
  yearSpeed: number
  daySpeed: number
  solarHour: number
  tilt: number
  selectedCityIds: string[]
  focusedCityId: string
  cameraMode: CameraMode
  trackCity: boolean
  cameraResetNonce: number
  showAxis: boolean
  showEquator: boolean
  showTerminator: boolean
  discoveryIndex: number | null
  skyTraces: SkyTrace[]
  skyView: SkyView
  skyLayers: SkyLayers
  sundialCalibration: number
  setPlaying: (playing: boolean) => void
  setActiveLab: (lab: Lab) => void
  setPlaybackMode: (mode: PlaybackMode) => void
  setYearSpeed: (speed: number) => void
  setDaySpeed: (speed: number) => void
  setSolarHour: (hour: number) => void
  setProgress: (progress: number) => void
  setDate: (date: Date) => void
  setTilt: (tilt: number) => void
  setSelectedCities: (ids: string[]) => void
  addCity: (id: string) => void
  removeCity: (id: string) => void
  focusCity: (id: string) => void
  setCameraMode: (mode: CameraMode) => void
  setTrackCity: (track: boolean) => void
  recallCamera: (mode: CameraMode) => void
  toggleOverlay: (overlay: 'axis' | 'equator' | 'terminator') => void
  setDiscoveryIndex: (index: number | null) => void
  pinSkyTrace: (cityId: string, dateIso: string) => void
  updateSkyTrace: (id: string, patch: Partial<Omit<SkyTrace, 'id'>>) => void
  removeSkyTrace: (id: string) => void
  clearSkyTraces: () => void
  setSkyView: (view: SkyView) => void
  setSkyLayers: (layers: Partial<SkyLayers>) => void
  toggleSkyLayer: (layer: keyof SkyLayers) => void
  setSundialCalibration: (progress: number) => void
  reset: () => void
}

const initialDate = new Date(Date.UTC(2026, 0, 1, 12)).toISOString()

/** 15 April in a 365-day year: the calibration date the sundial lab has always opened on. */
const DEFAULT_SUNDIAL_CALIBRATION = 104 / 364

/** What actually reaches localStorage. Playback, camera nonces and the current date are
 *  deliberately excluded: reopening the app should restore a setup, not a moment. */
const partialize = (state: SimulationState) => ({
  activeLab: state.activeLab,
  playbackMode: state.playbackMode,
  yearSpeed: state.yearSpeed,
  daySpeed: state.daySpeed,
  solarHour: state.solarHour,
  tilt: state.tilt,
  selectedCityIds: state.selectedCityIds,
  focusedCityId: state.focusedCityId,
  cameraMode: state.cameraMode,
  trackCity: state.trackCity,
  showAxis: state.showAxis,
  showEquator: state.showEquator,
  showTerminator: state.showTerminator,
  skyTraces: state.skyTraces,
  skyView: state.skyView,
  skyLayers: state.skyLayers,
  sundialCalibration: state.sundialCalibration,
})

type PersistedSimulation = ReturnType<typeof partialize>

export const useSimulation = create<SimulationState>()(
  persist(
    (set) => ({
      dateIso: initialDate,
      activeLab: 'orbit',
      playing: false,
      playbackMode: 'year',
      yearSpeed: 30,
      daySpeed: 4,
      solarHour: 12,
      tilt: EARTH_TILT_DEGREES,
      selectedCityIds: ['london'],
      focusedCityId: 'london',
      cameraMode: 'globe',
      trackCity: true,
      cameraResetNonce: 0,
      showAxis: true,
      showEquator: false,
      showTerminator: true,
      discoveryIndex: null,
      skyTraces: [],
      skyView: 'whole',
      skyLayers: DEFAULT_SKY_LAYERS,
      sundialCalibration: DEFAULT_SUNDIAL_CALIBRATION,
      setPlaying: (playing) => set({ playing }),
      setActiveLab: (activeLab) => set({ activeLab, playing: false }),
      setPlaybackMode: (playbackMode) => set({ playbackMode, playing: false }),
      setYearSpeed: (yearSpeed) => set({ yearSpeed }),
      setDaySpeed: (daySpeed) => set({ daySpeed }),
      setSolarHour: (solarHour) => set({ solarHour: ((solarHour % 24) + 24) % 24 }),
      setProgress: (progress) => set((state) => ({ dateIso: dateFromYearProgress(new Date(state.dateIso).getUTCFullYear(), progress).toISOString() })),
      setDate: (date) => set({ dateIso: date.toISOString() }),
      setTilt: (tilt) => set({ tilt }),
      setSelectedCities: (ids) => set({ selectedCityIds: ids.slice(0, 4), focusedCityId: ids[0] ?? 'london' }),
      addCity: (id) => set((state) => ({ selectedCityIds: state.selectedCityIds.includes(id) ? state.selectedCityIds : [...state.selectedCityIds, id].slice(-4), focusedCityId: id })),
      removeCity: (id) => set((state) => {
        const selectedCityIds = state.selectedCityIds.filter((cityId) => cityId !== id)
        const safeIds = selectedCityIds.length ? selectedCityIds : ['london']
        return { selectedCityIds: safeIds, focusedCityId: state.focusedCityId === id ? safeIds[0] : state.focusedCityId }
      }),
      focusCity: (id) => set((state) => ({ focusedCityId: cityById(id).id, selectedCityIds: state.selectedCityIds.includes(id) ? state.selectedCityIds : [...state.selectedCityIds, id].slice(-4) })),
      setCameraMode: (cameraMode) => set({ cameraMode }),
      setTrackCity: (trackCity) => set({ trackCity }),
      recallCamera: (cameraMode) => set((state) => ({ cameraMode, trackCity: cameraMode === 'globe', cameraResetNonce: state.cameraResetNonce + 1 })),
      toggleOverlay: (overlay) => set((state) => overlay === 'axis' ? { showAxis: !state.showAxis } : overlay === 'equator' ? { showEquator: !state.showEquator } : { showTerminator: !state.showTerminator }),
      setDiscoveryIndex: (discoveryIndex) => set({ discoveryIndex }),
      pinSkyTrace: (cityId, dateIso) => set((state) => ({ skyTraces: [...state.skyTraces, { id: `${cityId}-${dateIso}-${state.skyTraces.length}-${Date.now()}`, cityId, dateIso }].slice(-(MAX_SKY_TRACES - 1)) })),
      updateSkyTrace: (id, patch) => set((state) => ({ skyTraces: state.skyTraces.map((trace) => trace.id === id ? { ...trace, ...patch } : trace) })),
      removeSkyTrace: (id) => set((state) => ({ skyTraces: state.skyTraces.filter((trace) => trace.id !== id) })),
      clearSkyTraces: () => set({ skyTraces: [] }),
      setSkyView: (skyView) => set({ skyView }),
      setSkyLayers: (layers) => set((state) => ({ skyLayers: { ...state.skyLayers, ...layers } })),
      toggleSkyLayer: (layer) => set((state) => ({ skyLayers: { ...state.skyLayers, [layer]: !state.skyLayers[layer] } })),
      setSundialCalibration: (progress) => set({ sundialCalibration: Math.max(0, Math.min(1, progress)) }),
      reset: () => set((state) => ({ dateIso: initialDate, skyTraces: [], activeLab: 'orbit', playing: false, playbackMode: 'year', yearSpeed: 30, daySpeed: 4, solarHour: 12, tilt: EARTH_TILT_DEGREES, selectedCityIds: ['london'], focusedCityId: 'london', cameraMode: 'globe', trackCity: true, cameraResetNonce: state.cameraResetNonce + 1, showAxis: true, showEquator: false, showTerminator: true, discoveryIndex: null, skyView: 'whole', skyLayers: DEFAULT_SKY_LAYERS, sundialCalibration: DEFAULT_SUNDIAL_CALIBRATION })),
    }),
    {
      name: 'orbit-lab-simulation-v2',
      version: 1,
      // A version 0 store predates the lifted sky/sundial fields. Returning it unchanged is
      // the whole migration: persist merges it shallowly over the defaults above, so the new
      // keys arrive at their defaults and a learner keeps their saved cities.
      migrate: (persisted) => (persisted ?? {}) as PersistedSimulation,
      partialize,
    },
  ),
)

export const selectProgress = (state: SimulationState) => yearProgress(new Date(state.dateIso))
