import { Check, Link2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { encodeState } from '../store/urlState'
import { useSimulation } from '../store/useSimulation'

/** Copies a link to exactly what is on screen, so an investigation can be handed on.
 *  Falls back to a hidden textarea where the async clipboard API is unavailable. */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])

  const copy = async () => {
    const state = useSimulation.getState()
    const query = encodeState({
      activeLab: state.activeLab,
      dateIso: state.dateIso,
      solarHour: state.solarHour,
      tilt: state.tilt,
      selectedCityIds: state.selectedCityIds,
      focusedCityId: state.focusedCityId,
      playbackMode: state.playbackMode,
      cameraMode: state.cameraMode,
      showAxis: state.showAxis,
      showEquator: state.showEquator,
      showTerminator: state.showTerminator,
      skyView: state.skyView,
      skyLayers: state.skyLayers,
      skyTraces: state.skyTraces.map((trace) => ({ cityId: trace.cityId, dateIso: trace.dateIso })),
      sundialCalibration: state.sundialCalibration,
    })
    const url = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}`

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const field = document.createElement('textarea')
      field.value = url
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      try { document.execCommand('copy') } catch { /* clipboard unavailable; the URL is still in the address bar */ }
      document.body.removeChild(field)
    }

    setCopied(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2200)
  }

  return (
    <button onClick={copy} aria-label="Copy a link to this view">
      {copied ? <Check /> : <Link2 />} <span>{copied ? 'Link copied' : 'Copy link'}</span>
      <span className="visually-hidden" role="status" aria-live="polite">{copied ? 'Link copied to the clipboard' : ''}</span>
    </button>
  )
}
