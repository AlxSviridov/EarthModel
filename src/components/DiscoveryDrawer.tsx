import { ArrowLeft, ArrowRight, Check, Lightbulb, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { discoveries, discoveryState } from '../data/discoveries'
import { useSimulation } from '../store/useSimulation'

export function DiscoveryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const discoveryIndex = useSimulation((state) => state.discoveryIndex)
  const setDiscoveryIndex = useSimulation((state) => state.setDiscoveryIndex)
  const setSkyTraces = useSimulation((state) => state.setSkyTraces)
  const activeIndex = discoveryIndex ?? 0
  const active = discoveries[activeIndex]
  const [revealed, setRevealed] = useState(false)
  const [picked, setPicked] = useState<0 | 1 | null>(null)
  const panel = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const returnFocusTo = useRef<Element | null>(null)

  const launch = useCallback((index: number) => {
    const discovery = discoveries[index]
    const { skyTraces, ...state } = discoveryState(discovery)
    setDiscoveryIndex(index)
    // One setState for the whole cascade, so the scene never renders a half-applied setup.
    useSimulation.setState({ ...state, cameraResetNonce: useSimulation.getState().cameraResetNonce + 1 })
    setSkyTraces(skyTraces)
    setRevealed(false)
    setPicked(null)
  }, [setDiscoveryIndex, setSkyTraces])

  // Focus moves into the dialog on open and returns to whatever opened it on close.
  useEffect(() => {
    if (!open) return
    returnFocusTo.current = document.activeElement
    closeButton.current?.focus()
    return () => { (returnFocusTo.current as HTMLElement | null)?.focus?.() }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const isPrediction = Boolean(active.choices)
  const showInsight = !isPrediction || revealed

  return (
    <div className="drawer-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="discovery-drawer" ref={panel} aria-modal="true" role="dialog" aria-labelledby="discovery-title">
        <header><div><span className="eyebrow">DISCOVERY DECK</span><h2 id="discovery-title">{discoveries.length} ways to follow the light</h2></div><button className="icon-button" ref={closeButton} onClick={onClose} aria-label="Close discoveries"><X /></button></header>
        <div className="discovery-body">
          <nav aria-label="Discovery list">{discoveries.map((item, index) => <button key={item.id} className={index === activeIndex ? 'active' : ''} onClick={() => launch(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong>{discoveryIndex !== null && index < activeIndex && <Check size={14} />}</button>)}</nav>
          <article>
            <span className="eyebrow">{String(activeIndex + 1).padStart(2, '0')} · {active.eyebrow}</span>
            <h3>{active.title}</h3>
            <p className="discovery-question">{active.question}</p>

            {isPrediction ? (
              <div className="prediction-box">
                <span>MAKE A GUESS</span>
                {revealed ? (
                  <p>You said <strong>{active.choices![picked!]}</strong>. {picked === active.answer ? 'That matches what the model shows.' : `The model shows ${active.choices![active.answer!]}.`} Either way, go and look at the evidence.</p>
                ) : (
                  <>
                    <p>Choose one, then open the lab and look for evidence.</p>
                    <div className="prediction-choices">
                      {active.choices!.map((choice, index) => (
                        <button key={choice} onClick={() => { setPicked(index as 0 | 1); setRevealed(true) }}>{choice}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="prediction-box"><span>MAKE A GUESS</span><p>Say your prediction out loud, then use the lab to look for evidence.</p></div>
            )}

            {showInsight
              ? <div className="insight-box"><span>WHAT TO NOTICE</span><p>{active.insight}</p></div>
              : <div className="insight-box is-hidden"><span>WHAT TO NOTICE</span><p><Lightbulb size={14} /> Make your guess first.</p></div>}

            <div className="discovery-actions"><button disabled={activeIndex === 0} onClick={() => launch(activeIndex - 1)}><ArrowLeft size={16} /> Previous</button><button className="primary" onClick={() => { launch(activeIndex); onClose() }}>Open in the lab</button><button disabled={activeIndex === discoveries.length - 1} onClick={() => launch(activeIndex + 1)}>Next <ArrowRight size={16} /></button></div>
          </article>
        </div>
      </section>
    </div>
  )
}
