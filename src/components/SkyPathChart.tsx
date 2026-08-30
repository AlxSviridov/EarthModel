import { useEffect, useMemo, useRef, useState } from 'react'
import { readTrace, type ResolvedTrace } from '../data/skyTraces'
import { solarPosition, sunTrack, type SunSample } from '../science/solar'

const plotHeight = 430

/**
 * Near a zenith transit the azimuth swings almost 180° in minutes, so a fixed step draws a spike.
 * Halving the interval wherever neighbouring samples jump keeps the drawn curve on the real path.
 */
function refine(trace: ResolvedTrace, samples: SunSample[]): SunSample[] {
  const refined: SunSample[] = []
  for (let index = 0; index < samples.length; index += 1) {
    refined.push(samples[index])
    const next = samples[index + 1]
    if (!next) continue
    let gap = Math.abs(next.azimuthDegrees - samples[index].azimuthDegrees)
    if (gap > 180) gap = 360 - gap
    if (gap < 6) continue
    for (let step = 1; step < 8; step += 1) {
      const hour = samples[index].hour + ((next.hour - samples[index].hour) * step) / 8
      refined.push({ hour, ...solarPosition(trace.city.latitude, trace.date, hour, trace.tilt) })
    }
  }
  return refined
}

export function SkyPathChart({ traces, highlightId, solarHour, onHighlight }: { traces: ResolvedTrace[]; highlightId: string | null; solarHour: number; onHighlight: (id: string | null) => void }) {
  const [width, setWidth] = useState(920)
  const wrap = useRef<HTMLDivElement>(null)
  const pad = { left: width < 560 ? 40 : 58, right: 18, top: 30, bottom: 52 }
  const x = (azimuth: number) => pad.left + (azimuth / 360) * (width - pad.left - pad.right)
  const y = (altitude: number) => pad.top + ((90 - altitude) / 90) * (plotHeight - pad.top - pad.bottom)

  useEffect(() => {
    if (!wrap.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, Math.round(entry.contentRect.width))))
    observer.observe(wrap.current)
    return () => observer.disconnect()
  }, [])

  const drawn = useMemo(() => traces.map((trace) => {
    const scaleX = (azimuth: number) => pad.left + (azimuth / 360) * (width - pad.left - pad.right)
    const scaleY = (altitude: number) => pad.top + ((90 - altitude) / 90) * (plotHeight - pad.top - pad.bottom)
    const daylit = refine(trace, sunTrack(trace.city.latitude, trace.date, 5, trace.tilt)).filter((sample) => sample.aboveHorizon)
    let previousAzimuth: number | null = null
    const path = daylit.map((sample, index) => {
      const seam = previousAzimuth !== null && Math.abs(sample.azimuthDegrees - previousAzimuth) > 180
      previousAzimuth = sample.azimuthDegrees
      return `${index && !seam ? 'L' : 'M'}${scaleX(sample.azimuthDegrees).toFixed(1)},${scaleY(Math.max(sample.altitudeDegrees, 0)).toFixed(1)}`
    }).join(' ')
    const hours = daylit.filter((sample) => Number.isInteger(sample.hour))
    return { trace, path, hours, reading: readTrace(trace) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pad is derived from width, which is tracked.
  }), [traces, width])

  return (
    <div className="sky-plot-wrap" ref={wrap}>
      <svg width={width} height={plotHeight} viewBox={`0 0 ${width} ${plotHeight}`} role="img" aria-labelledby="sky-chart-title sky-chart-desc">
        <title id="sky-chart-title">Sun paths by compass direction and height above the horizon</title>
        <desc id="sky-chart-desc">{drawn.map(({ trace, reading }) => `${trace.label} on ${trace.dateLabel}: ${reading.riseLine}. ${reading.sideLine}. Highest ${reading.highestText}. Daylight ${reading.daylightText}.`).join(' ')}</desc>
        <defs><linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#092541" /><stop offset=".65" stopColor="#22577a" /><stop offset="1" stopColor="#f0a55b" stopOpacity=".55" /></linearGradient><filter id="sun-glow"><feGaussianBlur stdDeviation="5" /></filter></defs>
        <rect x={pad.left} y={pad.top} width={width - pad.left - pad.right} height={plotHeight - pad.top - pad.bottom} rx="10" fill="url(#sky-gradient)" />
        {[0, 30, 60, 90].map((altitude) => <g key={altitude}><line x1={pad.left} x2={width - pad.right} y1={y(altitude)} y2={y(altitude)} className="sky-grid" /><text x={pad.left - 10} y={y(altitude) + 5} textAnchor="end" className="sky-axis">{altitude}°</text></g>)}
        {[0, 90, 180, 270, 360].map((azimuth, index) => <g key={azimuth}><line x1={x(azimuth)} x2={x(azimuth)} y1={pad.top} y2={plotHeight - pad.bottom} className={azimuth === 90 || azimuth === 270 ? 'sky-grid sky-grid--east' : 'sky-grid sky-grid--vertical'} /><text x={x(azimuth)} y={plotHeight - 22} textAnchor="middle" className="sky-compass">{['N', 'E', 'S', 'W', 'N'][index]}</text></g>)}
        <path d={`M${pad.left},${plotHeight - pad.bottom} Q${width * .2},${plotHeight - pad.bottom - 28} ${width * .34},${plotHeight - pad.bottom} T${width * .67},${plotHeight - pad.bottom} T${width - pad.right},${plotHeight - pad.bottom}`} fill="none" stroke="#07141b" strokeWidth="28" opacity=".72" />
        {drawn.map(({ trace, path, hours, reading }) => {
          const dimmed = highlightId !== null && highlightId !== trace.id
          return (
            <g key={trace.id} onMouseEnter={() => onHighlight(trace.id)} onMouseLeave={() => onHighlight(null)}>
              <path d={path} fill="none" stroke={trace.color} strokeWidth={dimmed ? 2 : 3.4} strokeLinecap="round" opacity={dimmed ? .38 : .95} />
              {!dimmed && hours.map((sample) => <circle key={sample.hour} cx={x(sample.azimuthDegrees)} cy={y(Math.max(sample.altitudeDegrees, 0))} r="2.6" fill={trace.color} opacity=".8" />)}
              {!dimmed && reading.state === 'normal' && [reading.sunriseAzimuth, reading.sunsetAzimuth].map((azimuth, index) => azimuth === null ? null : (
                <g key={index}><line x1={x(azimuth)} x2={x(azimuth)} y1={y(0) - 13} y2={y(0) + 5} stroke={trace.color} strokeWidth="2" opacity=".85" /><text x={x(azimuth)} y={y(0) - 18} textAnchor="middle" className="sky-axis">{azimuth.toFixed(0)}°</text></g>
              ))}
            </g>
          )
        })}
        {traces.map((trace) => {
          const position = solarPosition(trace.city.latitude, trace.date, solarHour, trace.tilt)
          if (!position.aboveHorizon) return null
          return (
            <g key={`${trace.id}-sun`}>
              <circle cx={x(position.azimuthDegrees)} cy={y(Math.max(position.altitudeDegrees, 0))} r="13" fill={trace.color} opacity=".25" filter="url(#sun-glow)" />
              <circle cx={x(position.azimuthDegrees)} cy={y(Math.max(position.altitudeDegrees, 0))} r="7" fill={trace.color} stroke="#fff5d6" strokeWidth="2" />
            </g>
          )
        })}
      </svg>
      <div className="visually-hidden">
        <table>
          <caption>Sun path summary for each compared trace</caption>
          <thead><tr><th scope="col">Trace</th><th scope="col">Sunrise</th><th scope="col">Sunset</th><th scope="col">Highest</th><th scope="col">Daylight</th></tr></thead>
          <tbody>{drawn.map(({ trace, reading }) => <tr key={trace.id}><th scope="row">{trace.label} · {trace.dateLabel}</th><td>{reading.sunriseText}</td><td>{reading.sunsetText}</td><td>{reading.highestText}</td><td>{reading.daylightText}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}
