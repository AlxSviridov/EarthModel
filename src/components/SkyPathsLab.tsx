import { CalendarDays, Clock3, Compass, Eye, MapPin, Pause, Pin, Play, Sunrise, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cities, cityById } from '../data/cities'
import { MAX_SKY_TRACES, readTrace, resolveTraces, type SkyLayers, type SkyView } from '../data/skyTraces'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { annualSunriseAzimuthRange, dateFromYearProgress, formatClock, solarPosition, yearProgress } from '../science/solar'
import { SkyDomeScene } from '../scene/SkyDomeScene'
import { useSimulation } from '../store/useSimulation'
import { LabCityPicker } from './LabCityPicker'
import { SceneBoundary } from './SceneBoundary'
import { SkyPathChart } from './SkyPathChart'

const VIEWS: { id: SkyView; label: string }[] = [
  { id: 'whole', label: 'Whole sky' },
  { id: 'observer', label: 'Look around' },
  { id: 'birdseye', label: 'From above' },
]

const LAYER_LABELS: { id: keyof SkyLayers; label: string }[] = [
  { id: 'nightArc', label: 'Night path' },
  { id: 'hourTicks', label: 'Hour marks' },
  { id: 'yearFan', label: 'Every month' },
  { id: 'horizonBand', label: 'Sunrise spread' },
]

export function SkyPathsLab() {
  const dateIso = useSimulation((state) => state.dateIso)
  const solarHour = useSimulation((state) => state.solarHour)
  const focusedId = useSimulation((state) => state.focusedCityId)
  const playing = useSimulation((state) => state.playing)
  const daySpeed = useSimulation((state) => state.daySpeed)
  const tilt = useSimulation((state) => state.tilt)
  const pinned = useSimulation((state) => state.skyTraces)
  const layers = useSimulation((state) => state.skyLayers)
  const view = useSimulation((state) => state.skyView)
  const { setSolarHour, setProgress, setPlaying, setPlaybackMode, setDaySpeed, pinSkyTrace, updateSkyTrace, removeSkyTrace, setSkyView, toggleSkyLayer } = useSimulation()
  const [viewNonce, setViewNonce] = useState(0)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  const date = useMemo(() => new Date(dateIso), [dateIso])
  const traces = useMemo(() => resolveTraces(focusedId, dateIso, pinned, tilt), [focusedId, dateIso, pinned, tilt])
  const readings = useMemo(() => traces.map((trace) => ({ trace, reading: readTrace(trace) })), [traces])
  const focusedCity = cityById(focusedId)
  const band = useMemo(() => (layers.horizonBand ? annualSunriseAzimuthRange(focusedCity.latitude, date.getUTCFullYear(), tilt) : null), [layers.horizonBand, focusedCity.latitude, date, tilt])
  const liveReading = readings[0].reading
  const recall = (next: SkyView) => { setSkyView(next); setViewNonce((nonce) => nonce + 1) }

  return (
    <div className="lab-page sky-lab">
      <header className="lab-hero">
        <div><span className="eyebrow"><Sunrise size={16} /> SKY PATHS</span><h1>Watch the Sun<br /><em>cross your sky.</em></h1><p>Stand in one place and look up. In summer the Sun comes up north of east and swings right across the sky; in winter it barely clears the south.</p></div>
        <div className="lab-hero-stat"><span>SUN RIGHT NOW</span><strong>{solarPosition(focusedCity.latitude, date, solarHour, tilt).altitudeDegrees.toFixed(1)}°</strong><small>above the horizon in {focusedCity.name}</small></div>
      </header>

      <section className="lab-toolbar">
        <LabCityPicker />
        <div className="layer-toggles"><span>Show</span><div>{LAYER_LABELS.map((layer) => <button key={layer.id} className={layers[layer.id] ? 'active' : ''} aria-pressed={layers[layer.id]} onClick={() => toggleSkyLayer(layer.id)}>{layer.label}</button>)}</div></div>
      </section>

      <div className="sky-dome-grid">
        <section className="sky-dome-card">
          <div className="plot-heading"><div><span className="eyebrow">YOUR SKY</span><h2>{focusedCity.name} · {readings[0].trace.dateLabel}</h2></div><div className="dome-view-switch" aria-label="Dome viewpoint">{VIEWS.map((option) => <button key={option.id} className={view === option.id ? 'active' : ''} aria-pressed={view === option.id} onClick={() => recall(option.id)}>{option.label}</button>)}</div></div>
          <div className="dome-wrap" aria-label={`Three-dimensional sky dome for ${focusedCity.name}. ${liveReading.riseLine}. ${liveReading.sideLine}.`}>
            <SceneBoundary title="The 3D sky needs WebGL" message="Your browser could not start the 3D view, so the horizon panorama below is showing the same Sun paths.">
              <SkyDomeScene traces={traces} highlightId={highlightId} layers={layers} view={view} viewNonce={viewNonce} reducedMotion={reducedMotion} />
            </SceneBoundary>
          </div>
          {band && <p className="dome-hint dome-hint--band"><Sunrise size={13} /> {band.minAzimuth === null ? `The Sun never rises in ${focusedCity.name} on ${band.daysWithoutSunrise} days of the year, so there is no sunrise spread to show.` : `Across the year the Sun rises anywhere in the amber band, from ${band.minAzimuth.toFixed(0)}° to ${band.maxAzimuth!.toFixed(0)}°${band.daysWithoutSunrise > 0 ? ` — and on ${band.daysWithoutSunrise} days it does not rise at all` : ''}.`}</p>}
          <p className="dome-hint"><Compass size={13} /> {view === 'observer' ? 'You are standing in the middle. Drag to turn your head, scroll to zoom in and out, arrow keys work too.' : 'Drag to turn the dome · scroll to zoom · arrow keys work too.'} The amber line running east–west splits the sky into a north half and a south half.</p>
          <p className="dome-headline" aria-live="polite"><strong>{liveReading.riseLine}.</strong> {liveReading.sideLine}.</p>
        </section>

        <section className="trace-panel" aria-label="Compared sun paths">
          <div className="plot-heading"><div><span className="eyebrow">COMPARING</span><h2>{traces.length} of {MAX_SKY_TRACES}</h2></div></div>
          {readings.map(({ trace, reading }) => (
            <article key={trace.id} className={`trace-card${highlightId === trace.id ? ' is-highlighted' : ''}`} onMouseEnter={() => setHighlightId(trace.id)} onMouseLeave={() => setHighlightId(null)} onFocus={() => setHighlightId(trace.id)} onBlur={() => setHighlightId(null)}>
              <header><i style={{ background: trace.color }} /><strong>{trace.label}</strong><span>{trace.dateLabel}</span>{trace.live ? <em>LIVE</em> : <button className="icon-button icon-button--tiny" onClick={() => removeSkyTrace(trace.id)} aria-label={`Remove ${trace.label} on ${trace.dateLabel}`}><Trash2 size={14} /></button>}</header>
              <p className="trace-readout">{reading.riseLine}</p>
              <p className="trace-readout">{reading.sideLine}</p>
              <dl><div><dt>Sunrise</dt><dd>{reading.sunriseText}</dd></div><div><dt>Sunset</dt><dd>{reading.sunsetText}</dd></div><div><dt>Highest</dt><dd>{reading.highestText}</dd></div><div><dt>Daylight</dt><dd>{reading.daylightText}</dd></div></dl>
              {!trace.live && (
                <div className="trace-edit">
                  <label><span>Place</span><select value={trace.city.id} onChange={(event) => updateSkyTrace(trace.id, { cityId: event.target.value })} aria-label={`Place for the ${trace.label} trace`}>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label>
                  <label><span>Date</span><input type="range" min="0" max="1" step=".002" value={yearProgress(trace.date)} onChange={(event) => updateSkyTrace(trace.id, { dateIso: dateFromYearProgress(trace.date.getUTCFullYear(), Number(event.target.value)).toISOString() })} aria-label={`Date for the ${trace.label} trace`} /></label>
                </div>
              )}
            </article>
          ))}
          <button className="pin-button wide" disabled={traces.length >= MAX_SKY_TRACES} onClick={() => pinSkyTrace(focusedId, dateIso)}><Pin size={15} /> Pin this view to compare</button>
          <p className="trace-hint"><MapPin size={12} /> Pin {focusedCity.name} today, then move the date slider to put two seasons side by side.</p>
        </section>
      </div>

      <section className="sky-plot-card">
        <div className="plot-heading"><div><span className="eyebrow">HORIZON PANORAMA</span><h2>The same paths, flattened</h2></div><div className="chart-legend">{traces.map((trace) => <span key={trace.id} className={highlightId === trace.id ? 'is-focused' : ''}><i style={{ background: trace.color }} />{trace.label} · {trace.dateLabel}</span>)}</div></div>
        <SkyPathChart traces={traces} highlightId={highlightId} solarHour={solarHour} onHighlight={setHighlightId} />
        <div className="sky-caption"><span><b>Altitude</b> is how high the Sun appears.</span><span><b>Azimuth</b> is its compass direction.</span><span><b>Due east is 90°.</b> A smaller number means the Sun rose north of east.</span></div>
      </section>

      <section className="lab-playbar">
        <button className="play-button" onClick={() => { setPlaybackMode('day'); setPlaying(!playing) }} aria-label={playing ? 'Pause sky path animation' : 'Play sky path animation'}>{playing ? <Pause /> : <Play fill="currentColor" />}</button>
        <label className="lab-slider"><span><Clock3 /> Local solar time <strong>{formatClock(solarHour)}</strong></span><input type="range" min="0" max="24" step=".02" value={solarHour} onChange={(event) => setSolarHour(Number(event.target.value))} aria-label="Sky path local solar time" /></label>
        <div className="mini-speeds">{[.25, 1, 4, 12].map((speed) => <button key={speed} className={daySpeed === speed ? 'active' : ''} aria-pressed={daySpeed === speed} onClick={() => setDaySpeed(speed)}>{speed === .25 ? '¼' : speed}h/s</button>)}</div>
        <label className="lab-slider lab-slider--date"><span><CalendarDays /> Date <strong>{readings[0].trace.dateLabel}</strong></span><input type="range" min="0" max="1" step=".001" value={yearProgress(date)} onChange={(event) => setProgress(Number(event.target.value))} aria-label="Sky path date" /></label>
      </section>
      <p className="science-note"><Eye size={13} /> Local solar noon is always 12:00 here: the moment the Sun crosses your north–south line. Pinned places are read at the same local solar hour in their own sky, so shapes compare cleanly without time zones or daylight saving.</p>
    </div>
  )
}
