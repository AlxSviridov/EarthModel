import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cityById } from '../data/cities'
import { dateFromYearProgress, EARTH_TILT_DEGREES, yearProgress } from '../science/solar'

export type CameraMode = 'globe' | 'orbit'

interface SimulationState {
  dateIso: string
  playing: boolean
  speed: number
  tilt: number
  selectedCityIds: string[]
  focusedCityId: string
  cameraMode: CameraMode
  showAxis: boolean
  showEquator: boolean
  showTerminator: boolean
  discoveryIndex: number | null
  setPlaying: (playing: boolean) => void
  setSpeed: (speed: number) => void
  setProgress: (progress: number) => void
  setDate: (date: Date) => void
  setTilt: (tilt: number) => void
  setSelectedCities: (ids: string[]) => void
  addCity: (id: string) => void
  removeCity: (id: string) => void
  focusCity: (id: string) => void
  setCameraMode: (mode: CameraMode) => void
  toggleOverlay: (overlay: 'axis' | 'equator' | 'terminator') => void
  setDiscoveryIndex: (index: number | null) => void
  reset: () => void
}

const initialDate = new Date(Date.UTC(2026, 0, 1, 12)).toISOString()

export const useSimulation = create<SimulationState>()(
  persist(
    (set) => ({
      dateIso: initialDate,
      playing: false,
      speed: 30,
      tilt: EARTH_TILT_DEGREES,
      selectedCityIds: ['london'],
      focusedCityId: 'london',
      cameraMode: 'globe',
      showAxis: true,
      showEquator: false,
      showTerminator: true,
      discoveryIndex: null,
      setPlaying: (playing) => set({ playing }),
      setSpeed: (speed) => set({ speed }),
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
      toggleOverlay: (overlay) => set((state) => overlay === 'axis' ? { showAxis: !state.showAxis } : overlay === 'equator' ? { showEquator: !state.showEquator } : { showTerminator: !state.showTerminator }),
      setDiscoveryIndex: (discoveryIndex) => set({ discoveryIndex }),
      reset: () => set({ dateIso: initialDate, playing: false, speed: 30, tilt: EARTH_TILT_DEGREES, selectedCityIds: ['london'], focusedCityId: 'london', cameraMode: 'globe', showAxis: true, showEquator: false, showTerminator: true, discoveryIndex: null }),
    }),
    { name: 'orbit-lab-simulation', partialize: (state) => ({ speed: state.speed, tilt: state.tilt, selectedCityIds: state.selectedCityIds, focusedCityId: state.focusedCityId, cameraMode: state.cameraMode, showAxis: state.showAxis, showEquator: state.showEquator, showTerminator: state.showTerminator }) },
  ),
)

export const selectProgress = (state: SimulationState) => yearProgress(new Date(state.dateIso))
