let cachedSupport: boolean | null = null

/** One-off probe: an unavailable WebGL context should degrade the lab, never crash it. */
export function webglAvailable(): boolean {
  if (cachedSupport !== null) return cachedSupport
  try {
    const canvas = document.createElement('canvas')
    cachedSupport = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    cachedSupport = false
  }
  return cachedSupport
}
