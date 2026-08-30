/* eslint-disable react-hooks/immutability -- the Three.js camera and its projection are mutable GPU-side state. */
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { annualSunriseAzimuthRange, skyVector, solarPosition, sunTrack } from '../science/solar'
import type { SkyLayers, SkyView, ResolvedTrace } from '../data/skyTraces'
import { useSimulation } from '../store/useSimulation'

const DOME_RADIUS = 6
const COMPASS = [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]] as const
const HOUR_LABELS = [6, 9, 12, 15, 18]

/** Dome point for a sky direction. The frame is +X east, +Y up, -Z north. */
function skyPoint(altitudeDegrees: number, azimuthDegrees: number, radius = DOME_RADIUS): THREE.Vector3 {
  const direction = skyVector(altitudeDegrees, azimuthDegrees)
  return new THREE.Vector3(direction.east * radius, direction.up * radius, -direction.north * radius)
}

function ringPoints(altitudeDegrees: number, radius = DOME_RADIUS, segments = 180): THREE.Vector3[] {
  return Array.from({ length: segments + 1 }, (_, index) => skyPoint(altitudeDegrees, (index / segments) * 360, radius))
}

/** Half of a vertical great circle, swept from one horizon point over the zenith to the opposite one. */
function verticalCirclePoints(azimuthDegrees: number, segments = 120): THREE.Vector3[] {
  const start = skyVector(0, azimuthDegrees)
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index / segments) * Math.PI
    return new THREE.Vector3(start.east * Math.cos(angle), Math.sin(angle), -start.north * Math.cos(angle)).multiplyScalar(DOME_RADIUS)
  })
}

const skyVertexShader = `
varying vec3 vPosition;
void main() {
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const BACKDROP_RADIUS = DOME_RADIUS * 3.6

/** Height is normalised by the backdrop's own radius, so the warm band stays a thin sunset glow. */
const skyFragmentShader = `
varying vec3 vPosition;
void main() {
  float height = clamp(vPosition.y / ${BACKDROP_RADIUS.toFixed(1)}, -1.0, 1.0);
  vec3 deep = vec3(0.035, 0.145, 0.255);
  vec3 mid = vec3(0.133, 0.341, 0.478);
  vec3 warm = vec3(0.941, 0.647, 0.357);
  vec3 underground = vec3(0.012, 0.031, 0.055);
  vec3 color = mix(mid, deep, smoothstep(0.0, 0.55, height));
  color = mix(color, warm, smoothstep(0.05, 0.0, height) * 0.22);
  color = mix(color, underground, smoothstep(0.0, -0.06, height));
  gl_FragColor = vec4(color, 1.0);
}
`

function SkyBackdrop() {
  return (
    <mesh>
      <sphereGeometry args={[BACKDROP_RADIUS, 48, 32]} />
      <shaderMaterial vertexShader={skyVertexShader} fragmentShader={skyFragmentShader} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function Ground({ band }: { band: { minAzimuth: number | null; maxAzimuth: number | null } }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
        <circleGeometry args={[DOME_RADIUS, 96]} />
        <meshBasicMaterial color="#050f18" transparent opacity={0.82} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {band.minAzimuth !== null && band.maxAzimuth !== null && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
            <ringGeometry args={[DOME_RADIUS * 0.88, DOME_RADIUS * 0.995, 64, 1, THREE.MathUtils.degToRad(90 - band.maxAzimuth), THREE.MathUtils.degToRad(band.maxAzimuth - band.minAzimuth)]} />
            <meshBasicMaterial color="#ffc96d" transparent opacity={0.17} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
            <ringGeometry args={[DOME_RADIUS * 0.88, DOME_RADIUS * 0.995, 64, 1, THREE.MathUtils.degToRad(90 + band.minAzimuth), THREE.MathUtils.degToRad(band.maxAzimuth - band.minAzimuth)]} />
            <meshBasicMaterial color="#ffc96d" transparent opacity={0.17} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      <Line points={ringPoints(0)} color="#bcd9ea" lineWidth={2} transparent opacity={0.75} />
      {Array.from({ length: 36 }, (_, index) => {
        const azimuth = index * 10
        const major = azimuth % 45 === 0
        return <Line key={azimuth} points={[skyPoint(0, azimuth, DOME_RADIUS * (major ? 0.945 : 0.972)), skyPoint(0, azimuth)]} color="#8fb3c8" lineWidth={major ? 1.6 : 1} transparent opacity={major ? 0.7 : 0.38} />
      })}
      <Line points={[skyPoint(0, 0), skyPoint(0, 180)]} color="#8fb3c8" lineWidth={1.4} transparent opacity={0.4} dashed dashSize={0.22} gapSize={0.16} />
      <Line points={[skyPoint(0, 90), skyPoint(0, 270)]} color="#ffc96d" lineWidth={2.6} transparent opacity={0.85} />
      {COMPASS.map(([label, azimuth]) => (
        <Html key={label} center position={skyPoint(0, azimuth, DOME_RADIUS * 1.09).setY(0.18)} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <span className={azimuth === 90 || azimuth === 270 ? 'scene-label scene-label--sun' : 'scene-label'}>{label}</span>
        </Html>
      ))}
    </group>
  )
}

function SkyGrid() {
  return (
    <group>
      {[30, 60].map((altitude) => (
        <group key={altitude}>
          <Line points={ringPoints(altitude)} color="#7ea5bd" lineWidth={1} transparent opacity={0.24} dashed dashSize={0.2} gapSize={0.2} />
          <Html center position={skyPoint(altitude, 45)} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}><span className="scene-label">{altitude}°</span></Html>
        </group>
      ))}
      <Line points={verticalCirclePoints(0)} color="#8fb3c8" lineWidth={1} transparent opacity={0.26} dashed dashSize={0.2} gapSize={0.2} />
      <Line points={verticalCirclePoints(90)} color="#ffc96d" lineWidth={1.8} transparent opacity={0.45} />
      <Html center position={[0, DOME_RADIUS * 1.13, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}><span className="scene-label">STRAIGHT UP</span></Html>
    </group>
  )
}

function TraceArc({ trace, dimmed, showNight, showHours }: { trace: ResolvedTrace; dimmed: boolean; showNight: boolean; showHours: boolean }) {
  const track = useMemo(() => sunTrack(trace.city.latitude, trace.date, 5, trace.tilt), [trace.city.latitude, trace.date, trace.tilt])
  const segments = useMemo(() => {
    const above: THREE.Vector3[][] = []
    const below: THREE.Vector3[][] = []
    let current: THREE.Vector3[] | null = null
    let currentAbove: boolean | null = null
    for (const sample of track) {
      const point = skyPoint(sample.altitudeDegrees, sample.azimuthDegrees)
      if (currentAbove !== sample.aboveHorizon) {
        if (current && current.length > 1) (currentAbove ? above : below).push(current)
        current = current && current.length ? [current[current.length - 1]] : []
        currentAbove = sample.aboveHorizon
      }
      current!.push(point)
    }
    if (current && current.length > 1) (currentAbove ? above : below).push(current)
    return { above, below }
  }, [track])
  const hourMarks = useMemo(() => track.filter((sample) => Number.isInteger(sample.hour) && sample.hour < 24), [track])

  return (
    <group>
      {showNight && segments.below.map((points, index) => (
        <Line key={`night-${index}`} points={points} color={trace.color} lineWidth={1.4} transparent opacity={dimmed ? 0.1 : 0.28} dashed dashSize={0.16} gapSize={0.18} />
      ))}
      {segments.above.map((points, index) => (
        <Line key={`day-${index}`} points={points} color={trace.color} lineWidth={dimmed ? 2 : 3.4} transparent opacity={dimmed ? 0.34 : 0.95} />
      ))}
      {showHours && hourMarks.map((sample) => (
        <mesh key={sample.hour} position={skyPoint(sample.altitudeDegrees, sample.azimuthDegrees)}>
          <sphereGeometry args={[sample.aboveHorizon ? 0.055 : 0.032, 10, 10]} />
          <meshBasicMaterial color={trace.color} transparent opacity={sample.aboveHorizon ? 0.9 : 0.3} />
        </mesh>
      ))}
      {showHours && HOUR_LABELS.map((hour) => {
        const sample = hourMarks.find((mark) => mark.hour === hour)
        if (!sample || !sample.aboveHorizon) return null
        return (
          <Html key={`label-${hour}`} center position={skyPoint(sample.altitudeDegrees, sample.azimuthDegrees, DOME_RADIUS * 1.04)} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <span className="scene-label">{String(hour).padStart(2, '0')}:00</span>
          </Html>
        )
      })}
    </group>
  )
}

function SunMarker({ trace }: { trace: ResolvedTrace }) {
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!group.current) return
    const { solarHour } = useSimulation.getState()
    const position = solarPosition(trace.city.latitude, trace.date, solarHour, trace.tilt)
    group.current.position.copy(skyPoint(position.altitudeDegrees, position.azimuthDegrees))
    group.current.scale.setScalar(position.aboveHorizon ? 1 : 0.55)
  })
  return (
    <group ref={group}>
      <mesh><sphereGeometry args={[0.17, 18, 18]} /><meshBasicMaterial color={trace.color} /></mesh>
      <mesh scale={2.1}><sphereGeometry args={[0.17, 18, 18]} /><meshBasicMaterial color={trace.color} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      <mesh scale={3.6}><sphereGeometry args={[0.17, 18, 18]} /><meshBasicMaterial color={trace.color} transparent opacity={0.09} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    </group>
  )
}

function YearFan({ trace }: { trace: ResolvedTrace }) {
  const arcs = useMemo(() => {
    const year = trace.date.getUTCFullYear()
    return Array.from({ length: 12 }, (_, month) => {
      const track = sunTrack(trace.city.latitude, new Date(Date.UTC(year, month, 1, 12)), 20, trace.tilt).filter((sample) => sample.aboveHorizon)
      return track.map((sample) => skyPoint(sample.altitudeDegrees, sample.azimuthDegrees))
    }).filter((points) => points.length > 1)
  }, [trace.city.latitude, trace.date, trace.tilt])
  return <group>{arcs.map((points, index) => <Line key={index} points={points} color="#9fc4da" lineWidth={1} transparent opacity={0.17} />)}</group>
}

const EYE_HEIGHT = DOME_RADIUS * 0.11

/**
 * Standing inside, the camera sits near the middle at eye height and looks along a ray aimed at the
 * equator-facing sky. The pitch follows the day's noon altitude, so a low winter arc and a near
 * overhead tropical one both land in frame.
 */
function observerPose(facing: number, noonAltitude: number): { camera: THREE.Vector3; target: THREE.Vector3 } {
  const azimuth = facing < 0 ? 180 : 0
  const pitch = Math.min(34, Math.max(10, noonAltitude * 0.45))
  const camera = new THREE.Vector3(0, EYE_HEIGHT, 0)
  const aim = skyPoint(pitch, azimuth, 1)
  return { camera, target: camera.clone().add(aim.multiplyScalar(DOME_RADIUS * 0.6)) }
}

function CameraRig({ view, viewNonce, facing, noonAltitude, reducedMotion }: { view: SkyView; viewNonce: number; facing: number; noonAltitude: number; reducedMotion: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const previousKey = useRef('')
  const settling = useRef(true)

  useFrame((_state, delta) => {
    if (!controls.current) return
    const pitchKey = Math.round(noonAltitude / 5)
    const key = `${view}-${viewNonce}-${facing}-${pitchKey}`
    const changed = previousKey.current !== key
    if (changed) {
      previousKey.current = key
      settling.current = true
    }
    if (!settling.current) {
      controls.current.update()
      return
    }
    const observer = observerPose(facing, noonAltitude)
    const desired = view === 'birdseye'
      ? new THREE.Vector3(0, DOME_RADIUS * 2.35, 0.02)
      : view === 'whole'
        ? new THREE.Vector3(DOME_RADIUS * 1.35, DOME_RADIUS * 1.45, facing * DOME_RADIUS * 1.95)
        : observer.camera
    const target = view === 'observer' ? observer.target : new THREE.Vector3(0, DOME_RADIUS * 0.14, 0)
    const damping = reducedMotion ? 1 : 1 - Math.exp(-delta * (changed ? 8 : 3.2))
    // Standing inside needs a wider lens: a summer arc spans more altitude than a normal field of view.
    const desiredFov = view === 'observer' ? 75 : 55
    const perspective = camera as THREE.PerspectiveCamera
    if (Math.abs(perspective.fov - desiredFov) > 0.05) {
      perspective.fov += (desiredFov - perspective.fov) * damping
      perspective.updateProjectionMatrix()
    }
    camera.position.lerp(desired, damping)
    controls.current.target.lerp(target, damping)
    if (camera.position.distanceTo(desired) < 0.035 && controls.current.target.distanceTo(target) < 0.035) settling.current = false
    controls.current.update()
  })

  return <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={DOME_RADIUS * 0.22} maxDistance={DOME_RADIUS * 3.2} maxPolarAngle={Math.PI * 0.62} enableDamping dampingFactor={0.07} onStart={() => { settling.current = false }} />
}

function DomeContent({ traces, highlightId, layers, view, viewNonce, reducedMotion }: SkyDomeSceneProps) {
  const live = traces[0]
  const noonAltitude = useMemo(() => (live ? solarPosition(live.city.latitude, live.date, 12, live.tilt).altitudeDegrees : 40), [live])
  const band = useMemo(
    () => (layers.horizonBand && live ? annualSunriseAzimuthRange(live.city.latitude, live.date.getUTCFullYear(), live.tilt) : { minAzimuth: null, maxAzimuth: null, daysWithoutSunrise: 0 }),
    [layers.horizonBand, live],
  )
  return (
    <>
      <SkyBackdrop />
      <Ground band={band} />
      <SkyGrid />
      {layers.yearFan && live && <YearFan trace={live} />}
      {traces.map((trace) => (
        <TraceArc
          key={trace.id}
          trace={trace}
          dimmed={highlightId !== null && highlightId !== trace.id}
          showNight={layers.nightArc}
          showHours={layers.hourTicks && (highlightId === trace.id || (highlightId === null && trace.live))}
        />
      ))}
      {traces.map((trace) => <SunMarker key={trace.id} trace={trace} />)}
      <CameraRig view={view} viewNonce={viewNonce} facing={live && live.city.latitude < 0 ? 1 : -1} noonAltitude={noonAltitude} reducedMotion={reducedMotion} />
    </>
  )
}

export interface SkyDomeSceneProps {
  traces: ResolvedTrace[]
  highlightId: string | null
  layers: SkyLayers
  view: SkyView
  viewNonce: number
  reducedMotion: boolean
}

/** Arrow keys orbit and +/- zoom, so the dome is usable without a pointer. */
function KeyboardControls() {
  const { camera, controls } = useThree()
  const held = useRef(new Set<string>())

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(event.key)) return
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
      event.preventDefault()
      held.current.add(event.key)
    }
    const up = (event: KeyboardEvent) => held.current.delete(event.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useFrame((_state, delta) => {
    const orbit = controls as OrbitControlsImpl | null
    if (!orbit || held.current.size === 0) return
    const keys = held.current
    const target = orbit.target
    const offset = camera.position.clone().sub(target)
    const spherical = new THREE.Spherical().setFromVector3(offset)
    if (keys.has('ArrowLeft')) spherical.theta += delta * 1.1
    if (keys.has('ArrowRight')) spherical.theta -= delta * 1.1
    if (keys.has('ArrowUp')) spherical.phi = Math.max(0.05, spherical.phi - delta * 0.8)
    if (keys.has('ArrowDown')) spherical.phi = Math.min(Math.PI * 0.62, spherical.phi + delta * 0.8)
    if (keys.has('+') || keys.has('=')) spherical.radius = Math.max(DOME_RADIUS * 0.22, spherical.radius - delta * DOME_RADIUS)
    if (keys.has('-') || keys.has('_')) spherical.radius = Math.min(DOME_RADIUS * 3.2, spherical.radius + delta * DOME_RADIUS)
    camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical))
    orbit.update()
  })

  return null
}

export function SkyDomeScene(props: SkyDomeSceneProps) {
  return (
    <Canvas camera={{ position: [0, DOME_RADIUS * 0.16, DOME_RADIUS * 0.3], fov: 60, near: 0.05, far: DOME_RADIUS * 8 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Suspense fallback={null}><DomeContent {...props} /><KeyboardControls /></Suspense>
    </Canvas>
  )
}
