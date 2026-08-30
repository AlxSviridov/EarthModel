import { decodeState } from './urlState'
import { useSimulation } from './useSimulation'

/**
 * Applies a shared link to the store. Run once at startup, before the first render:
 * the persist middleware rehydrates at import time, so anything a link carries has to
 * overwrite it rather than race it.
 *
 * Pinned traces are rebuilt here because their ids embed `Date.now()` and are therefore
 * not portable between sessions; only the (city, date) pairs travel in the link.
 */
export function applyUrlState(search: string): boolean {
  const decoded = decodeState(search)
  const { skyTraces, ...rest } = decoded
  if (!Object.keys(decoded).length) return false

  useSimulation.setState({
    ...rest,
    ...(skyTraces
      ? { skyTraces: skyTraces.map((trace, index) => ({ ...trace, id: `${trace.cityId}-${trace.dateIso}-${index}` })) }
      : {}),
  })
  return true
}
