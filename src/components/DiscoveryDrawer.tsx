import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { discoveries } from '../data/discoveries'
import { useSimulation } from '../store/useSimulation'

export function DiscoveryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const discoveryIndex = useSimulation((state) => state.discoveryIndex)
  const { setDiscoveryIndex, setSelectedCities, setDate, setTilt, setPlaying, setCameraMode, setPlaybackMode, setSolarHour } = useSimulation()
  const activeIndex = discoveryIndex ?? 0
  const active = discoveries[activeIndex]

  const launch = (index: number) => {
    const discovery = discoveries[index]
    setDiscoveryIndex(index)
    setSelectedCities(discovery.cityIds)
    setDate(new Date(Date.UTC(2026, discovery.month, discovery.day, 12)))
    setTilt(discovery.tilt ?? 23.44)
    setPlaying(false)
    setPlaybackMode('year')
    setSolarHour(12)
    setCameraMode(index === 7 || index === 8 ? 'orbit' : 'globe')
  }

  if (!open) return null
  return (
    <div className="drawer-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="discovery-drawer" aria-modal="true" role="dialog" aria-labelledby="discovery-title">
        <header><div><span className="eyebrow">DISCOVERY DECK</span><h2 id="discovery-title">Ten ways to follow the light</h2></div><button className="icon-button" onClick={onClose} aria-label="Close discoveries"><X /></button></header>
        <div className="discovery-body">
          <nav aria-label="Discovery list">{discoveries.map((item, index) => <button key={item.id} className={index === activeIndex ? 'active' : ''} onClick={() => launch(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong>{discoveryIndex !== null && index < activeIndex && <Check size={14} />}</button>)}</nav>
          <article>
            <span className="eyebrow">{active.eyebrow}</span>
            <h3>{active.title}</h3>
            <p className="discovery-question">{active.question}</p>
            <div className="prediction-box"><span>MAKE A GUESS</span><p>Say your prediction out loud, then use the globe and chart to look for evidence.</p></div>
            <div className="insight-box"><span>WHAT TO NOTICE</span><p>{active.insight}</p></div>
            <div className="discovery-actions"><button disabled={activeIndex === 0} onClick={() => launch(activeIndex - 1)}><ArrowLeft size={16} /> Previous</button><button className="primary" onClick={() => { launch(activeIndex); onClose() }}>Open in the lab</button><button disabled={activeIndex === discoveries.length - 1} onClick={() => launch(activeIndex + 1)}>Next <ArrowRight size={16} /></button></div>
          </article>
        </div>
      </section>
    </div>
  )
}
