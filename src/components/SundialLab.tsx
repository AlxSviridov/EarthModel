import { CalendarDays, Clock3, Compass, Pause, Play, RotateCcw, SunMedium } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cityById } from '../data/cities'
import { calibratedSundialErrorMinutes, dateFromYearProgress, dayOfYear, daysInYear, equationOfTimeMinutes, formatClock, horizontalDialHourAngleDegrees, solarPosition, sundialShadow, yearProgress } from '../science/solar'
import { useSimulation } from '../store/useSimulation'
import { LabCityPicker } from './LabCityPicker'

const dialSize = 520

function signedMinutes(value: number): string {
  const sign = value >= 0 ? '+' : '−'
  const absolute = Math.abs(value)
  return `${sign}${Math.floor(absolute)}m ${Math.round((absolute % 1) * 60)}s`
}

export function SundialLab() {
  const dateIso = useSimulation((state) => state.dateIso)
  const solarHour = useSimulation((state) => state.solarHour)
  const focusedId = useSimulation((state) => state.focusedCityId)
  const playing = useSimulation((state) => state.playing)
  const daySpeed = useSimulation((state) => state.daySpeed)
  const { setSolarHour, setProgress, setPlaying, setPlaybackMode, setDaySpeed } = useSimulation()
  const date = useMemo(() => new Date(dateIso), [dateIso])
  const year = date.getUTCFullYear()
  const city = cityById(focusedId)
  const [calibrationProgress, setCalibrationProgress] = useState(104 / (daysInYear(year)-1))
  const calibrationDate = dateFromYearProgress(year, calibrationProgress)
  const errorMinutes = calibratedSundialErrorMinutes(date, calibrationDate)
  const apparentHour = solarHour + equationOfTimeMinutes(date) / 60
  const dialReading = solarHour + errorMinutes / 60
  const sun = solarPosition(city.latitude, date, apparentHour)
  const shadow = sundialShadow(city.latitude, date, apparentHour)
  const shadowScale = shadow.visible ? Math.min(175, shadow.length * 46) : 0
  const shadowLength = Math.hypot(shadow.east, shadow.north) || 1
  const shadowX = 260 + (shadow.east / shadowLength) * shadowScale
  const shadowY = 260 - (shadow.north / shadowLength) * shadowScale
  const poleDirection = city.latitude >= 0 ? -1 : 1
  const hourMarks = Array.from({ length: 13 }, (_, index) => index + 6).map((hour) => {
    const theta = horizontalDialHourAngleDegrees(city.latitude, hour) * Math.PI / 180
    return {
      hour,
      innerX: 260 + Math.sin(theta) * 184,
      innerY: 260 + poleDirection * Math.cos(theta) * 184,
      outerX: 260 + Math.sin(theta) * 210,
      outerY: 260 + poleDirection * Math.cos(theta) * 210,
      labelX: 260 + Math.sin(theta) * 158,
      labelY: 266 + poleDirection * Math.cos(theta) * 158,
    }
  })
  const [chartWidth, setChartWidth] = useState(720)
  const chartWrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartWrap.current) return
    const observer = new ResizeObserver(([entry]) => setChartWidth(Math.max(300, Math.round(entry.contentRect.width))))
    observer.observe(chartWrap.current)
    return () => observer.disconnect()
  }, [])

  const annualError = Array.from({ length: daysInYear(year) }, (_, index) => calibratedSundialErrorMinutes(new Date(Date.UTC(year, 0, index + 1)), calibrationDate))
  const chartH = 210
  const cx = (index: number) => 40 + (index / (annualError.length - 1)) * (chartWidth - 54)
  const cy = (minutes: number) => 24 + ((32 - minutes) / 64) * (chartH - 54)
  const errorPath = annualError.map((value,index) => `${index?'L':'M'}${cx(index).toFixed(1)},${cy(value).toFixed(1)}`).join(' ')
  const currentIndex = dayOfYear(date)-1

  return (
    <div className="lab-page sundial-lab">
      <header className="lab-hero"><div><span className="eyebrow"><Compass size={16} /> SUNDIAL LAB</span><h1>A clock made<br /><em>from sunlight.</em></h1><p>Calibrate a dial on one day, then discover why its reading drifts through the year.</p></div><div className={Math.abs(errorMinutes) < 1 ? 'lab-hero-stat is-accurate' : 'lab-hero-stat'}><span>CALIBRATED ERROR</span><strong>{signedMinutes(errorMinutes)}</strong><small>{Math.abs(errorMinutes) < .05 ? 'dial agrees on this date' : `${errorMinutes >= 0 ? 'dial runs ahead' : 'dial runs behind'} on this date`}</small></div></header>

      <section className="lab-toolbar"><LabCityPicker /><div className="sundial-why"><SunMedium /><span><strong>Why does it drift?</strong><small>Earth’s tilt and slightly elliptical orbit make apparent solar days uneven.</small></span></div></section>

      <div className="sundial-grid">
        <section className="dial-card">
          <div className="plot-heading"><div><span className="eyebrow">HORIZONTAL DIAL · {city.name.toUpperCase()}</span><h2>{formatClock(solarHour)} mean solar time</h2></div><span className={sun.aboveHorizon ? 'sun-state is-up' : 'sun-state'}>{sun.aboveHorizon ? `Sun ${sun.altitudeDegrees.toFixed(1)}° high` : 'Sun below horizon'}</span></div>
          <div className="dial-wrap">
            <svg viewBox={`0 0 ${dialSize} ${dialSize}`} role="img" aria-label={`Sundial in ${city.name} with live shadow`}>
              <defs><radialGradient id="dial-face"><stop offset="0" stopColor="#18324a" /><stop offset="1" stopColor="#091724" /></radialGradient><filter id="shadow-blur"><feGaussianBlur stdDeviation="3" /></filter></defs>
              <circle cx="260" cy="260" r="224" fill="url(#dial-face)" stroke="#547795" strokeWidth="2" />
              <circle cx="260" cy="260" r="198" fill="none" stroke="#35516a" strokeWidth="1" />
              {[['N',0,-174],['E',174,0],['S',0,174],['W',-174,0]].map(([label,xOffset,yOffset])=><text key={label as string} x={260+(xOffset as number)} y={267+(yOffset as number)} textAnchor="middle" className="dial-compass">{label as string}</text>)}
              {hourMarks.map((mark)=><g key={mark.hour}><line x1={mark.innerX} y1={mark.innerY} x2={mark.outerX} y2={mark.outerY} stroke={mark.hour%3===0?'#d9eef8':'#6c8aa0'} strokeWidth={mark.hour%3===0?3:1.5} /><text x={mark.labelX} y={mark.labelY} textAnchor="middle" className="dial-hour">{String(mark.hour).padStart(2,'0')}</text></g>)}
              {shadow.visible && <><line x1="260" y1="260" x2={shadowX} y2={shadowY} stroke="#000" strokeWidth="13" opacity=".34" strokeLinecap="round" filter="url(#shadow-blur)" /><line x1="260" y1="260" x2={shadowX} y2={shadowY} stroke="#15202b" strokeWidth="7" opacity=".9" strokeLinecap="round" /><circle cx={shadowX} cy={shadowY} r="7" fill="#071018" /></>}
              <path d={poleDirection < 0 ? 'M260 260 L260 116 L286 260 Z' : 'M260 260 L260 404 L234 260 Z'} fill="#f0b95e" opacity=".92" stroke="#ffe3a8" strokeWidth="2" />
              <line x1="260" y1="260" x2="260" y2={260 + poleDirection * 144} stroke="#fff1be" strokeWidth="3" />
              <circle cx="260" cy="260" r="8" fill="#ffe1a0" />
            </svg>
          </div>
          <div className="clock-comparison"><div><span>TRUE MEAN SOLAR TIME</span><strong>{formatClock(solarHour)}</strong></div><div><span>RAW SUN READING</span><strong>{formatClock(apparentHour)}</strong></div><div className="accent"><span>CALIBRATED DIAL READS</span><strong>{formatClock(dialReading)}</strong></div></div>
        </section>

        <section className="error-card">
          <div className="plot-heading"><div><span className="eyebrow">ANNUAL CALIBRATION ERROR</span><h2>When will the dial agree?</h2></div><button onClick={() => setCalibrationProgress(yearProgress(date))}><RotateCcw /> Calibrate on current date</button></div>
          <div className="error-chart" ref={chartWrap}><svg width={chartWidth} height={chartH} viewBox={`0 0 ${chartWidth} ${chartH}`} role="img" aria-label="Sundial calibration error across the year"><line x1="40" x2={chartWidth-14} y1={cy(0)} y2={cy(0)} className="zero-line" />{[-30,0,30].map(value=><text key={value} x="33" y={cy(value)+4} textAnchor="end" className="axis-label">{value>0?'+':''}{value}m</text>)}<path d={errorPath} fill="none" stroke="#ffc96d" strokeWidth="3" /><line x1={cx(currentIndex)} x2={cx(currentIndex)} y1="24" y2={chartH-30} className="today-line" /><circle cx={cx(currentIndex)} cy={cy(errorMinutes)} r="6" fill="#ffc96d" stroke="#fff3d3" strokeWidth="2" /></svg></div>
          <label className="lab-slider"><span><CalendarDays /> Calibration date <strong>{calibrationDate.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}</strong></span><input type="range" min="0" max="1" step=".001" value={calibrationProgress} onChange={(event)=>setCalibrationProgress(Number(event.target.value))} aria-label="Sundial calibration date" /></label>
          <label className="lab-slider"><span><CalendarDays /> Test date <strong>{date.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}</strong></span><input type="range" min="0" max="1" step=".001" value={yearProgress(date)} onChange={(event)=>setProgress(Number(event.target.value))} aria-label="Sundial test date" /></label>
          <div className="date-presets"><button onClick={() => setProgress(41/(daysInYear(year)-1))}>11 Feb</button><button onClick={() => setProgress(104/(daysInYear(year)-1))}>15 Apr</button><button onClick={() => setProgress(171/(daysInYear(year)-1))}>21 Jun</button><button onClick={() => setProgress(306/(daysInYear(year)-1))}>3 Nov</button></div>
          <div className="equation-explainer"><strong>The equation of time</strong><p>A real sundial follows the actual Sun. A perfect clock follows the average Sun. The gap between them changes by roughly half an hour across the year. Calibration removes the error on one chosen day—not every day.</p></div>
        </section>
      </div>

      <section className="lab-playbar sundial-playbar">
        <button className="play-button" onClick={() => { setPlaybackMode('day'); setPlaying(!playing) }} aria-label={playing ? 'Pause sundial animation' : 'Play sundial animation'}>{playing ? <Pause /> : <Play fill="currentColor" />}</button>
        <label className="lab-slider"><span><Clock3 /> Mean solar time <strong>{formatClock(solarHour)}</strong></span><input type="range" min="0" max="24" step=".02" value={solarHour} onChange={(event)=>setSolarHour(Number(event.target.value))} aria-label="Sundial mean solar time" /></label>
        <div className="mini-speeds">{[.25,1,4,12].map((speed)=><button key={speed} className={daySpeed===speed?'active':''} onClick={()=>setDaySpeed(speed)}>{speed===.25?'¼':speed}h/s</button>)}</div>
      </section>
      <p className="science-note">This lab compares local apparent and local mean solar time. Civil clock time also depends on longitude within a time zone and daylight saving—extra choices humans add on top of the Sun’s motion.</p>
    </div>
  )
}
