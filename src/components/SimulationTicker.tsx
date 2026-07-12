import { useEffect, useRef } from 'react'
import { MS_PER_DAY } from '../science/solar'
import { useSimulation } from '../store/useSimulation'

export function SimulationTicker() {
  const playing = useSimulation((state) => state.playing)
  const playbackMode = useSimulation((state) => state.playbackMode)
  const yearSpeed = useSimulation((state) => state.yearSpeed)
  const daySpeed = useSimulation((state) => state.daySpeed)
  const solarHour = useSimulation((state) => state.solarHour)
  const dateIso = useSimulation((state) => state.dateIso)
  const setDate = useSimulation((state) => state.setDate)
  const setSolarHour = useSimulation((state) => state.setSolarHour)
  const frame = useRef<number | null>(null)
  const lastTime = useRef<number | null>(null)
  const dateRef = useRef(dateIso)
  const hourRef = useRef(solarHour)

  useEffect(() => { dateRef.current = dateIso }, [dateIso])
  useEffect(() => { hourRef.current = solarHour }, [solarHour])

  useEffect(() => {
    if (!playing) {
      lastTime.current = null
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      return
    }
    const tick = (time: number) => {
      if (lastTime.current !== null) {
        const elapsed = Math.min(0.05, (time - lastTime.current) / 1000)
        if (playbackMode === 'year') {
          const current = new Date(dateRef.current)
          const year = current.getUTCFullYear()
          const next = new Date(current.getTime() + elapsed * yearSpeed * MS_PER_DAY)
          if (next.getUTCFullYear() !== year) next.setUTCFullYear(year, 0, 1)
          dateRef.current = next.toISOString()
          setDate(next)
        } else {
          hourRef.current = (hourRef.current + elapsed * daySpeed) % 24
          setSolarHour(hourRef.current)
        }
      }
      lastTime.current = time
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current) }
  }, [daySpeed, playbackMode, playing, setDate, setSolarHour, yearSpeed])
  return null
}
