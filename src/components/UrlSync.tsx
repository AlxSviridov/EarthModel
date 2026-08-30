import { useEffect } from 'react'
import { encodeState, type ShareableState } from '../store/urlState'
import { useSimulation } from '../store/useSimulation'

/** Long enough that dragging a slider does not thrash the history API, short enough that
 *  the address bar is already correct by the time a learner reaches for it. */
const WRITE_INTERVAL_MS = 500

function shareableFrom(state: ReturnType<typeof useSimulation.getState>): ShareableState {
  return {
    activeLab: state.activeLab,
    dateIso: state.dateIso,
    solarHour: state.solarHour,
    tilt: state.tilt,
    selectedCityIds: state.selectedCityIds,
    focusedCityId: state.focusedCityId,
    playbackMode: state.playbackMode,
    cameraMode: state.cameraMode,
    showAxis: state.showAxis,
    showEquator: state.showEquator,
    showTerminator: state.showTerminator,
    skyView: state.skyView,
    skyLayers: state.skyLayers,
    skyTraces: state.skyTraces.map((trace) => ({ cityId: trace.cityId, dateIso: trace.dateIso })),
    sundialCalibration: state.sundialCalibration,
  }
}

/**
 * Keeps the address bar in step with the investigation, so "copy the link" always works.
 *
 * Two deliberate constraints. It uses `replaceState`, never `pushState`, because a
 * scrubbed date is not a navigation step and must not fill the back button. And it stays
 * silent while playback is running: `SimulationTicker` writes the store on every
 * animation frame, so an unguarded writer would call the history API sixty times a
 * second. Pausing flushes the final position.
 */
export function UrlSync() {
  useEffect(() => {
    let last = ''
    let timer: number | null = null

    const write = () => {
      timer = null
      const query = encodeState(shareableFrom(useSimulation.getState()))
      if (query === last) return
      last = query
      window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
    }

    const unsubscribe = useSimulation.subscribe((state) => {
      if (state.playing) return
      if (timer !== null) return
      timer = window.setTimeout(write, WRITE_INTERVAL_MS)
    })

    write()
    return () => {
      unsubscribe()
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [])

  return null
}
