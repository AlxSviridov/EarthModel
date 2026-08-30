import { useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * Loads a texture the scene can do without.
 *
 * drei's `useTexture` suspends and rethrows on failure, so a single missing file tears
 * down the whole Canvas and surfaces as "the 3D Earth needs WebGL" — which is not what
 * went wrong. This resolves to null instead, so a missing optional map costs one visual
 * effect rather than the entire scene.
 *
 * Defaults to `NoColorSpace`: a normal map is a field of vectors, not a picture, and
 * decoding it as sRGB would skew every normal in a way that still looks plausible.
 */
export function useOptionalTexture(url: string, anisotropy = 8): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    let loaded: THREE.Texture | null = null

    new THREE.TextureLoader().load(
      url,
      (result) => {
        if (cancelled) { result.dispose(); return }
        result.colorSpace = THREE.NoColorSpace
        result.anisotropy = anisotropy
        loaded = result
        setTexture(result)
      },
      undefined,
      () => { if (!cancelled) setTexture(null) },
    )

    return () => {
      cancelled = true
      loaded?.dispose()
      setTexture(null)
    }
  }, [url, anisotropy])

  return texture
}
