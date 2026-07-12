import { useEffect, useRef } from 'react'
import { MS_PER_DAY } from '../science/solar'
import { useSimulation } from '../store/useSimulation'

export function SimulationTicker() {
  const playing = useSimulation((state) => state.playing)
  const speed = useSimulation((state) => state.speed)
  const dateIso = useSimulation((state) => state.dateIso)
  const setDate = useSimulation((state) => state.setDate)
  const frame = useRef<number | null>(null)
  const lastTime = useRef<number | null>(null)
  const dateRef = useRef(dateIso)

  useEffect(() => { dateRef.current = dateIso }, [dateIso])

  useEffect(() => {
    if (!playing) {
      lastTime.current = null
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      return
    }
    const tick = (time: number) => {
      if (lastTime.current !== null) {
        const elapsed = Math.min(0.05, (time - lastTime.current) / 1000)
        const current = new Date(dateRef.current)
        const year = current.getUTCFullYear()
        const next = new Date(current.getTime() + elapsed * speed * MS_PER_DAY)
        if (next.getUTCFullYear() !== year) next.setUTCFullYear(year, 0, 1)
        dateRef.current = next.toISOString()
        setDate(next)
      }
      lastTime.current = time
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current) }
  }, [playing, setDate, speed])
  return null
}

