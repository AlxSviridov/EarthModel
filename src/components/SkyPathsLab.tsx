import { CalendarDays, Clock3, Pause, Play, Sunrise } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cityById } from '../data/cities'
import { formatClock, solarPosition, sunriseSunsetSolarHours, yearProgress } from '../science/solar'
import { useSimulation } from '../store/useSimulation'
import { LabCityPicker } from './LabCityPicker'

type ComparisonMode = 'places' | 'seasons'
const plotHeight = 430
const seasonalDates = [
  { label: 'March equinox', month: 2, day: 20, color: '#72ddff' },
  { label: 'June solstice', month: 5, day: 21, color: '#ffd166' },
  { label: 'September equinox', month: 8, day: 22, color: '#69e2ad' },
  { label: 'December solstice', month: 11, day: 21, color: '#b8a7ff' },
]

interface SkySeries { id: string; label: string; color: string; latitude: number; date: Date }

export function SkyPathsLab() {
  const dateIso = useSimulation((state) => state.dateIso)
  const solarHour = useSimulation((state) => state.solarHour)
  const selectedIds = useSimulation((state) => state.selectedCityIds)
  const focusedId = useSimulation((state) => state.focusedCityId)
  const playing = useSimulation((state) => state.playing)
  const daySpeed = useSimulation((state) => state.daySpeed)
  const { setSolarHour, setProgress, setPlaying, setPlaybackMode, setDaySpeed } = useSimulation()
  const [mode, setMode] = useState<ComparisonMode>('places')
  const [width, setWidth] = useState(920)
  const wrap = useRef<HTMLDivElement>(null)
  const date = useMemo(() => new Date(dateIso), [dateIso])
  const focusedCity = cityById(focusedId)
  const pad = { left: width < 560 ? 40 : 58, right: 18, top: 30, bottom: 52 }
  const x = (azimuth: number) => pad.left + (azimuth / 360) * (width - pad.left - pad.right)
  const y = (altitude: number) => pad.top + ((90 - altitude) / 90) * (plotHeight - pad.top - pad.bottom)

  useEffect(() => {
    if (!wrap.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, Math.round(entry.contentRect.width))))
    observer.observe(wrap.current)
    return () => observer.disconnect()
  }, [])

  const series: SkySeries[] = mode === 'places'
    ? selectedIds.map((id) => { const city = cityById(id); return { id, label: city.name, color: city.color, latitude: city.latitude, date } })
    : seasonalDates.map((season) => ({ id: season.label, label: season.label, color: season.color, latitude: focusedCity.latitude, date: new Date(Date.UTC(date.getUTCFullYear(), season.month, season.day, 12)) }))

  const pathFor = (item: SkySeries) => {
    const points = Array.from({ length: 289 }, (_, index) => index / 12).map((hour) => ({ hour, position: solarPosition(item.latitude, item.date, hour) })).filter(({ position }) => position.altitudeDegrees >= 0)
    let previousAzimuth: number | null = null
    return points.map(({ position }, index) => {
      const crossesNorthSeam = previousAzimuth !== null && Math.abs(position.azimuthDegrees - previousAzimuth) > 180
      previousAzimuth = position.azimuthDegrees
      return `${index && !crossesNorthSeam ? 'L' : 'M'}${x(position.azimuthDegrees).toFixed(1)},${y(position.altitudeDegrees).toFixed(1)}`
    }).join(' ')
  }

  const riseSet = sunriseSunsetSolarHours(focusedCity.latitude, date)

  return (
    <div className="lab-page sky-lab">
      <header className="lab-hero"><div><span className="eyebrow"><Sunrise size={16} /> SKY PATHS</span><h1>Trace the Sun<br /><em>across your sky.</em></h1><p>Stand in one place and look up. Latitude and season reshape the Sun’s daily arc.</p></div><div className="lab-hero-stat"><span>CURRENT SUN</span><strong>{solarPosition(focusedCity.latitude, date, solarHour).altitudeDegrees.toFixed(1)}°</strong><small>above the horizon in {focusedCity.name}</small></div></header>

      <section className="lab-toolbar">
        <LabCityPicker multi={mode === 'places'} />
        <div className="compare-switch"><span>Compare</span><div><button className={mode === 'places' ? 'active' : ''} onClick={() => setMode('places')}>Same date · places</button><button className={mode === 'seasons' ? 'active' : ''} onClick={() => setMode('seasons')}>Same place · seasons</button></div></div>
      </section>

      <section className="sky-plot-card">
        <div className="plot-heading"><div><span className="eyebrow">HORIZON PANORAMA</span><h2>{mode === 'places' ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : `${focusedCity.name} through the year`}</h2></div><div className="chart-legend">{series.map((item) => <span key={item.id}><i style={{ background: item.color }} />{item.label}</span>)}</div></div>
        <div className="sky-plot-wrap" ref={wrap}>
          <svg width={width} height={plotHeight} viewBox={`0 0 ${width} ${plotHeight}`} role="img" aria-label="Sun trajectories by altitude and compass direction">
            <defs><linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#092541" /><stop offset=".65" stopColor="#22577a" /><stop offset="1" stopColor="#f0a55b" stopOpacity=".55" /></linearGradient><filter id="sun-glow"><feGaussianBlur stdDeviation="5" /></filter></defs>
            <rect x={pad.left} y={pad.top} width={width - pad.left - pad.right} height={plotHeight - pad.top - pad.bottom} rx="10" fill="url(#sky-gradient)" />
            {[0, 30, 60, 90].map((altitude) => <g key={altitude}><line x1={pad.left} x2={width-pad.right} y1={y(altitude)} y2={y(altitude)} className="sky-grid" /><text x={pad.left-10} y={y(altitude)+5} textAnchor="end" className="sky-axis">{altitude}°</text></g>)}
            {[0,90,180,270,360].map((azimuth, index) => <g key={azimuth}><line x1={x(azimuth)} x2={x(azimuth)} y1={pad.top} y2={plotHeight-pad.bottom} className="sky-grid sky-grid--vertical" /><text x={x(azimuth)} y={plotHeight-22} textAnchor="middle" className="sky-compass">{['N','E','S','W','N'][index]}</text></g>)}
            <path d={`M${pad.left},${plotHeight-pad.bottom} Q${width*.2},${plotHeight-pad.bottom-28} ${width*.34},${plotHeight-pad.bottom} T${width*.67},${plotHeight-pad.bottom} T${width-pad.right},${plotHeight-pad.bottom}`} fill="none" stroke="#07141b" strokeWidth="28" opacity=".72" />
            {series.map((item) => <path key={item.id} d={pathFor(item)} fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" opacity=".92" />)}
            {series.map((item) => { const position = solarPosition(item.latitude, item.date, solarHour); return position.altitudeDegrees >= 0 ? <g key={`${item.id}-sun`}><circle cx={x(position.azimuthDegrees)} cy={y(position.altitudeDegrees)} r="13" fill={item.color} opacity=".25" filter="url(#sun-glow)" /><circle cx={x(position.azimuthDegrees)} cy={y(position.altitudeDegrees)} r="7" fill={item.color} stroke="#fff5d6" strokeWidth="2" /></g> : null })}
          </svg>
        </div>
        <div className="sky-caption"><span><b>Altitude</b> is how high the Sun appears.</span><span><b>Azimuth</b> is its compass direction.</span><span>{riseSet.state === 'normal' ? `Today in ${focusedCity.name}: sunrise ${formatClock(riseSet.sunrise!)} · sunset ${formatClock(riseSet.sunset!)}` : riseSet.state === 'midnight-sun' ? 'The path never drops below the horizon today.' : 'The path never rises above the horizon today.'}</span></div>
      </section>

      <section className="lab-playbar">
        <button className="play-button" onClick={() => { setPlaybackMode('day'); setPlaying(!playing) }} aria-label={playing ? 'Pause sky path animation' : 'Play sky path animation'}>{playing ? <Pause /> : <Play fill="currentColor" />}</button>
        <label className="lab-slider"><span><Clock3 /> Local solar time <strong>{formatClock(solarHour)}</strong></span><input type="range" min="0" max="24" step=".02" value={solarHour} onChange={(event) => setSolarHour(Number(event.target.value))} aria-label="Sky path local solar time" /></label>
        <div className="mini-speeds">{[.25,1,4,12].map((speed) => <button key={speed} className={daySpeed === speed ? 'active' : ''} onClick={() => setDaySpeed(speed)}>{speed === .25 ? '¼' : speed}h/s</button>)}</div>
        {mode === 'places' && <label className="lab-slider lab-slider--date"><span><CalendarDays /> Date <strong>{date.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}</strong></span><input type="range" min="0" max="1" step=".001" value={yearProgress(date)} onChange={(event) => setProgress(Number(event.target.value))} aria-label="Sky path date" /></label>}
      </section>
      <p className="science-note">Local solar noon is always 12:00 here: the moment the Sun crosses your north–south meridian. That makes shape comparisons clean, without time zones or daylight-saving changes.</p>
    </div>
  )
}
