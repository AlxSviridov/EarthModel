import { CalendarDays, ChevronDown, Clock3, Eye, Gauge, Globe2, LocateFixed, Orbit, Pause, Play, RotateCcw, Search, Sparkles, SunMedium, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cities, cityById } from '../data/cities'
import { daylightAt, formatClock, formatDuration, solarPosition, sunriseSunsetSolarHours, yearProgress } from '../science/solar'
import { useSimulation } from '../store/useSimulation'

const yearSpeeds = [1, 7, 30, 90]
const daySpeeds = [0.25, 1, 4, 12]

export function ControlPanel({ onOpenDiscoveries, onClose }: { onOpenDiscoveries: () => void; onClose?: () => void }) {
  const dateIso = useSimulation((state) => state.dateIso)
  const playing = useSimulation((state) => state.playing)
  const playbackMode = useSimulation((state) => state.playbackMode)
  const yearSpeed = useSimulation((state) => state.yearSpeed)
  const daySpeed = useSimulation((state) => state.daySpeed)
  const solarHour = useSimulation((state) => state.solarHour)
  const tilt = useSimulation((state) => state.tilt)
  const selectedIds = useSimulation((state) => state.selectedCityIds)
  const focusedId = useSimulation((state) => state.focusedCityId)
  const cameraMode = useSimulation((state) => state.cameraMode)
  const trackCity = useSimulation((state) => state.trackCity)
  const showAxis = useSimulation((state) => state.showAxis)
  const showEquator = useSimulation((state) => state.showEquator)
  const showTerminator = useSimulation((state) => state.showTerminator)
  const { setPlaying, setPlaybackMode, setYearSpeed, setDaySpeed, setSolarHour, setProgress, setTilt, addCity, removeCity, focusCity, setTrackCity, recallCamera, toggleOverlay, reset } = useSimulation()
  const [cityMenu, setCityMenu] = useState(false)
  const [query, setQuery] = useState('')
  const date = useMemo(() => new Date(dateIso), [dateIso])
  const city = cityById(focusedId)
  const daylight = daylightAt(city.latitude, date, tilt)
  const sun = solarPosition(city.latitude, date, solarHour, tilt)
  const riseSet = sunriseSunsetSolarHours(city.latitude, date, tilt)
  const filtered = cities.filter((item) => `${item.name} ${item.country}`.toLowerCase().includes(query.toLowerCase()))
  const activeSpeed = playbackMode === 'year' ? yearSpeed : daySpeed
  const speeds = playbackMode === 'year' ? yearSpeeds : daySpeeds

  const chooseCity = (id: string) => {
    addCity(id)
    focusCity(id)
    recallCamera('globe')
    setCityMenu(false)
    setQuery('')
  }

  return (
    <aside className="control-panel" aria-label="Simulation controls">
      {onClose && <button className="panel-close" onClick={onClose} aria-label="Close controls"><X /></button>}
      <button className="discovery-button" onClick={onOpenDiscoveries}><Sparkles size={20} /><span><small>GUIDED MODE</small>Try a discovery</span><span aria-hidden>→</span></button>

      <div className="panel-section city-section">
        <span className="eyebrow"><LocateFixed size={15} /> OBSERVING FROM</span>
        <button className="city-select" onClick={() => setCityMenu((open) => !open)} aria-expanded={cityMenu}><span><strong>{city.name}</strong><small>{city.country} · {Math.abs(city.latitude).toFixed(1)}°{city.latitude >= 0 ? 'N' : 'S'}</small></span><ChevronDown size={20} /></button>
        {cityMenu && <div className="city-menu">
          <label><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a city…" /></label>
          <div>{filtered.map((item) => <button key={item.id} onClick={() => chooseCity(item.id)}><i style={{ background: item.color }} /><span><strong>{item.name}</strong><small>{item.country} · {Math.abs(item.latitude).toFixed(1)}°{item.latitude >= 0 ? 'N' : 'S'}</small></span>{selectedIds.includes(item.id) && <span className="pinned">PINNED</span>}</button>)}</div>
        </div>}
        <div className="city-chips">{selectedIds.map((id) => { const item = cityById(id); return <button key={id} className={id === focusedId ? 'active' : ''} onClick={() => { focusCity(id); recallCamera('globe') }} style={{ '--city-color': item.color } as React.CSSProperties}><i />{item.name}{selectedIds.length > 1 && <span role="button" tabIndex={0} aria-label={`Remove ${item.name}`} onClick={(event) => { event.stopPropagation(); removeCity(id) }} onKeyDown={(event) => { if (event.key === 'Enter') removeCity(id) }}><X size={14} /></span>}</button> })}<button className="add-chip" onClick={() => setCityMenu(true)}>+ Compare</button></div>
      </div>

      <div className="daylight-readout">
        <div><span className={sun.aboveHorizon ? 'status-dot is-day' : 'status-dot'} />{sun.aboveHorizon ? 'SUN ABOVE THE HORIZON' : 'SUN BELOW THE HORIZON'}</div>
        <strong>{formatDuration(daylight.hours)}</strong>
        <span>daylight today · {formatDuration(daylight.darknessHours)} dark</span>
        <div className="readout-metrics"><span><b>{formatClock(solarHour)}</b> local solar time</span><span><b>{sun.altitudeDegrees.toFixed(1)}°</b> Sun altitude</span></div>
        {daylight.state !== 'normal' && <em>{daylight.state === 'midnight-sun' ? 'The Sun does not set today' : 'The Sun does not rise today'}</em>}
      </div>

      <div className="panel-section playback-section">
        <span className="eyebrow"><Gauge size={15} /> WHAT SHOULD MOVE?</span>
        <div className="mode-cards">
          <button className={playbackMode === 'year' ? 'active' : ''} onClick={() => setPlaybackMode('year')}><CalendarDays /><span><strong>Year journey</strong><small>Date moves · clock stays fixed</small></span></button>
          <button className={playbackMode === 'day' ? 'active' : ''} onClick={() => setPlaybackMode('day')}><Clock3 /><span><strong>One day</strong><small>Clock moves · date stays fixed</small></span></button>
        </div>
        <p className="mode-explanation">{playbackMode === 'year' ? `Watching the seasons at ${formatClock(solarHour)} in ${city.name}. No rapid daily flashing.` : `Watching one full rotation on ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })}.`}</p>
      </div>

      <div className="panel-section time-section">
        <div className="section-row"><span className="eyebrow"><CalendarDays size={15} /> DATE</span><strong>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</strong></div>
        <input className="year-slider" type="range" min="0" max="1" step="0.001" value={yearProgress(date)} onChange={(event) => setProgress(Number(event.target.value))} aria-label="Day of year" />
        <div className="month-row"><span>JAN</span><span>MAR</span><span>JUN</span><span>SEP</span><span>DEC</span></div>
        <div className="event-jumps"><button onClick={() => setProgress(79 / 365)}>Mar equinox</button><button onClick={() => setProgress(171 / 365)}>Jun solstice</button><button onClick={() => setProgress(265 / 365)}>Sep equinox</button><button onClick={() => setProgress(355 / 365)}>Dec solstice</button></div>
      </div>

      <div className="panel-section solar-time-section">
        <div className="section-row"><span className="eyebrow"><SunMedium size={15} /> SOLAR TIME IN {city.name.toUpperCase()}</span><strong>{formatClock(solarHour)}</strong></div>
        <input className="solar-time-slider" type="range" min="0" max="24" step="0.02" value={solarHour} onChange={(event) => setSolarHour(Number(event.target.value))} aria-label="Local solar time" />
        <div className="time-of-day-row"><span>00</span><span>06</span><span>NOON</span><span>18</span><span>24</span></div>
        <div className="time-presets">
          <button disabled={riseSet.sunrise === null} onClick={() => riseSet.sunrise !== null && setSolarHour(riseSet.sunrise)}>Sunrise{riseSet.sunrise !== null && <small>{formatClock(riseSet.sunrise)}</small>}</button>
          <button onClick={() => setSolarHour(12)}>Solar noon<small>12:00</small></button>
          <button disabled={riseSet.sunset === null} onClick={() => riseSet.sunset !== null && setSolarHour(riseSet.sunset)}>Sunset{riseSet.sunset !== null && <small>{formatClock(riseSet.sunset)}</small>}</button>
          <button onClick={() => setSolarHour(0)}>Midnight<small>00:00</small></button>
        </div>
        <p className="solar-clock-help">This clock follows the Sun, not a time zone: noon means the Sun crosses {city.name}’s meridian. Comparison cities use the same local solar hour in their own sky.</p>
      </div>

      <div className="panel-section transport-section">
        <div className="transport-row">
          <button className="play-button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause simulation' : 'Play simulation'}>{playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button>
          <div className="speed-control"><span>{playbackMode === 'year' ? 'DAYS PER SECOND' : 'SOLAR HOURS PER SECOND'}</span><div>{speeds.map((option) => <button key={option} className={activeSpeed === option ? 'active' : ''} onClick={() => playbackMode === 'year' ? setYearSpeed(option) : setDaySpeed(option)} aria-label={`${option} ${playbackMode === 'year' ? 'days per second' : 'solar hours per second'}`}>{option === .25 ? '¼' : option}</button>)}</div></div>
        </div>
      </div>

      <div className="panel-section experiment-section">
        <div className="section-row"><span className="eyebrow"><Orbit size={15} /> AXIAL TILT</span><strong>{tilt.toFixed(1)}°</strong></div>
        <input type="range" min="0" max="45" step="0.1" value={tilt} onChange={(event) => setTilt(Number(event.target.value))} aria-label="Axial tilt in degrees" />
        <div className="tilt-presets"><button onClick={() => setTilt(0)}>0° · no tilt</button><button className={Math.abs(tilt - 23.44) < 0.1 ? 'active' : ''} onClick={() => setTilt(23.44)}>23.4° · Earth</button><button onClick={() => setTilt(40)}>40° · extreme</button></div>
      </div>

      <div className="panel-section view-section">
        <span className="eyebrow"><Eye size={15} /> CAMERA PRESETS</span>
        <div className="segmented"><button className={cameraMode === 'globe' ? 'active' : ''} onClick={() => recallCamera('globe')}><Globe2 size={17} />Focus city</button><button className={cameraMode === 'orbit' ? 'active' : ''} onClick={() => recallCamera('orbit')}><Orbit size={17} />Full orbit</button></div>
        <button className={`track-city-toggle ${trackCity ? 'active' : ''}`} onClick={() => cameraMode === 'globe' ? setTrackCity(!trackCity) : recallCamera('globe')} aria-pressed={trackCity}><LocateFixed size={17} /><span><strong>Track {city.name}</strong><small>{trackCity ? 'City stays centred while Earth and sunlight move' : 'Free camera · turn tracking back on'}</small></span></button>
        <p className="camera-help">Dragging releases city tracking. Click Focus city or the tracking button to return.</p>
        <div className="toggle-grid"><button className={showAxis ? 'active' : ''} onClick={() => toggleOverlay('axis')}>Axis</button><button className={showEquator ? 'active' : ''} onClick={() => toggleOverlay('equator')}>Equator</button><button className={showTerminator ? 'active' : ''} onClick={() => toggleOverlay('terminator')}>Day edge</button><button onClick={reset}><RotateCcw size={15} /> Reset lab</button></div>
      </div>
    </aside>
  )
}
