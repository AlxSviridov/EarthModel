import { CalendarDays, ChevronDown, Eye, Gauge, Globe2, LocateFixed, Orbit, Pause, Play, RotateCcw, Search, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cities, cityById } from '../data/cities'
import { daylightAt, formatDuration, isLocationInDaylight, yearProgress } from '../science/solar'
import { useSimulation } from '../store/useSimulation'

const speedOptions = [1, 7, 30, 90]

export function ControlPanel({ onOpenDiscoveries }: { onOpenDiscoveries: () => void }) {
  const dateIso = useSimulation((state) => state.dateIso)
  const playing = useSimulation((state) => state.playing)
  const speed = useSimulation((state) => state.speed)
  const tilt = useSimulation((state) => state.tilt)
  const selectedIds = useSimulation((state) => state.selectedCityIds)
  const focusedId = useSimulation((state) => state.focusedCityId)
  const cameraMode = useSimulation((state) => state.cameraMode)
  const showAxis = useSimulation((state) => state.showAxis)
  const showEquator = useSimulation((state) => state.showEquator)
  const showTerminator = useSimulation((state) => state.showTerminator)
  const { setPlaying, setSpeed, setProgress, setTilt, addCity, removeCity, focusCity, setCameraMode, toggleOverlay, reset } = useSimulation()
  const [cityMenu, setCityMenu] = useState(false)
  const [query, setQuery] = useState('')
  const date = useMemo(() => new Date(dateIso), [dateIso])
  const city = cityById(focusedId)
  const daylight = daylightAt(city.latitude, date, tilt)
  const litNow = isLocationInDaylight(city.latitude, city.longitude, date, tilt)
  const filtered = cities.filter((item) => `${item.name} ${item.country}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <aside className="control-panel" aria-label="Simulation controls">
      <button className="discovery-button" onClick={onOpenDiscoveries}><Sparkles size={17} /><span><small>GUIDED MODE</small>Try a discovery</span><span aria-hidden>→</span></button>
      <div className="panel-section city-section">
        <span className="eyebrow"><LocateFixed size={13} /> OBSERVING FROM</span>
        <button className="city-select" onClick={() => setCityMenu((open) => !open)} aria-expanded={cityMenu}><span><strong>{city.name}</strong><small>{city.country} · {Math.abs(city.latitude).toFixed(1)}°{city.latitude >= 0 ? 'N' : 'S'}</small></span><ChevronDown size={18} /></button>
        {cityMenu && <div className="city-menu">
          <label><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a city…" /></label>
          <div>{filtered.map((item) => <button key={item.id} onClick={() => { addCity(item.id); focusCity(item.id); setCityMenu(false); setQuery('') }}><i style={{ background: item.color }} /><span><strong>{item.name}</strong><small>{item.country} · {Math.abs(item.latitude).toFixed(1)}°{item.latitude >= 0 ? 'N' : 'S'}</small></span>{selectedIds.includes(item.id) && <span className="pinned">PINNED</span>}</button>)}</div>
        </div>}
        <div className="city-chips">{selectedIds.map((id) => { const item = cityById(id); return <button key={id} className={id === focusedId ? 'active' : ''} onClick={() => focusCity(id)} style={{ '--city-color': item.color } as React.CSSProperties}><i />{item.name}{selectedIds.length > 1 && <span role="button" tabIndex={0} aria-label={`Remove ${item.name}`} onClick={(event) => { event.stopPropagation(); removeCity(id) }} onKeyDown={(event) => { if (event.key === 'Enter') removeCity(id) }}><X size={12} /></span>}</button> })}<button className="add-chip" onClick={() => setCityMenu(true)}>+ Compare</button></div>
      </div>
      <div className="daylight-readout">
        <div><span className={litNow ? 'status-dot is-day' : 'status-dot'} />{litNow ? 'IN DAYLIGHT NOW' : 'IN DARKNESS NOW'}</div>
        <strong>{formatDuration(daylight.hours)}</strong>
        <span>of daylight · {formatDuration(daylight.darknessHours)} dark</span>
        {daylight.state !== 'normal' && <em>{daylight.state === 'midnight-sun' ? 'The Sun does not set' : 'The Sun does not rise'}</em>}
      </div>
      <div className="panel-section time-section">
        <div className="section-row"><span className="eyebrow"><CalendarDays size={13} /> SIMULATION DATE</span><strong>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</strong></div>
        <input className="year-slider" type="range" min="0" max="1" step="0.001" value={yearProgress(date)} onChange={(event) => setProgress(Number(event.target.value))} aria-label="Day of year" />
        <div className="month-row"><span>JAN</span><span>MAR</span><span>JUN</span><span>SEP</span><span>DEC</span></div>
        <div className="transport-row">
          <button className="play-button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause simulation' : 'Play simulation'}>{playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button>
          <div className="speed-control"><span><Gauge size={13} /> DAYS / SECOND</span><div>{speedOptions.map((option) => <button key={option} className={speed === option ? 'active' : ''} onClick={() => setSpeed(option)}>{option}</button>)}</div></div>
        </div>
        <div className="event-jumps"><button onClick={() => setProgress(79 / 365)}>Mar equinox</button><button onClick={() => setProgress(171 / 365)}>Jun solstice</button><button onClick={() => setProgress(265 / 365)}>Sep equinox</button><button onClick={() => setProgress(355 / 365)}>Dec solstice</button></div>
      </div>
      <div className="panel-section experiment-section">
        <div className="section-row"><span className="eyebrow"><Orbit size={13} /> AXIAL TILT</span><strong>{tilt.toFixed(1)}°</strong></div>
        <input type="range" min="0" max="45" step="0.1" value={tilt} onChange={(event) => setTilt(Number(event.target.value))} aria-label="Axial tilt in degrees" />
        <div className="tilt-presets"><button onClick={() => setTilt(0)}>0° · no tilt</button><button className={Math.abs(tilt - 23.44) < 0.1 ? 'active' : ''} onClick={() => setTilt(23.44)}>23.4° · Earth</button><button onClick={() => setTilt(40)}>40° · extreme</button></div>
      </div>
      <div className="panel-section view-section">
        <span className="eyebrow"><Eye size={13} /> VIEW & OVERLAYS</span>
        <div className="segmented"><button className={cameraMode === 'globe' ? 'active' : ''} onClick={() => setCameraMode('globe')}><Globe2 size={15} />Globe</button><button className={cameraMode === 'orbit' ? 'active' : ''} onClick={() => setCameraMode('orbit')}><Orbit size={15} />Orbit</button></div>
        <div className="toggle-grid"><button className={showAxis ? 'active' : ''} onClick={() => toggleOverlay('axis')}>Axis</button><button className={showEquator ? 'active' : ''} onClick={() => toggleOverlay('equator')}>Equator</button><button className={showTerminator ? 'active' : ''} onClick={() => toggleOverlay('terminator')}>Crisp edge</button><button onClick={reset}><RotateCcw size={13} /> Reset</button></div>
      </div>
    </aside>
  )
}
