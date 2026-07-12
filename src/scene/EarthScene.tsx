/* eslint-disable react-hooks/immutability -- Three.js textures and shader uniforms are mutable GPU resources. */
import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { cityById } from '../data/cities'
import { dayOfYear, daysInYear } from '../science/solar'
import { useSimulation } from '../store/useSimulation'

const ORBIT_RADIUS = 7.2
const EARTH_RADIUS = 1

function latLonVector(latitude: number, longitude: number, radius = 1): THREE.Vector3 {
  const lat = THREE.MathUtils.degToRad(latitude)
  const lon = THREE.MathUtils.degToRad(longitude)
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon),
  )
}

function orbitalPosition(date: Date): THREE.Vector3 {
  const angle = ((dayOfYear(date) - 80) / daysInYear(date.getUTCFullYear())) * Math.PI * 2
  return new THREE.Vector3(Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS)
}

function Stars() {
  const positions = useMemo(() => {
    const random = mulberry32(7331)
    const points = new Float32Array(1800 * 3)
    for (let index = 0; index < 1800; index += 1) {
      const radius = 35 + random() * 30
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      points[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
      points[index * 3 + 1] = radius * Math.cos(phi)
      points[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }
    return points
  }, [])
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#dcecff" size={0.055} sizeAttenuation transparent opacity={0.72} depthWrite={false} />
    </points>
  )
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function Sun() {
  const core = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (core.current) core.current.rotation.y = clock.elapsedTime * 0.035
  })
  return (
    <group>
      <pointLight color="#ffd18a" intensity={150} distance={45} decay={1.7} />
      <mesh ref={core}>
        <sphereGeometry args={[1.12, 64, 64]} />
        <meshBasicMaterial color="#ffbd56" />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[1.12, 48, 48]} />
        <meshBasicMaterial color="#ff8b38" transparent opacity={0.14} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <sprite scale={[5.4, 5.4, 1]}>
        <spriteMaterial map={useMemo(() => makeGlowTexture(), [])} color="#ff9d43" transparent opacity={0.46} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <Html center position={[0, -1.65, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
        <span className="scene-label scene-label--sun">THE SUN</span>
      </Html>
    </group>
  )
}

function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(255,255,235,1)')
  gradient.addColorStop(0.1, 'rgba(255,196,96,.9)')
  gradient.addColorStop(0.38, 'rgba(255,111,38,.3)')
  gradient.addColorStop(1, 'rgba(255,78,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(canvas)
}

const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  void main() {
    vUv = uv;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const earthFragmentShader = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 lightDirection;
  uniform float showTerminator;
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  void main() {
    vec3 normal = normalize(vNormalWorld);
    float sun = dot(normal, normalize(lightDirection));
    float blendWidth = mix(0.09, 0.018, showTerminator);
    float daylight = smoothstep(-blendWidth, blendWidth, sun);
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb * 1.18;
    day *= 0.72 + max(sun, 0.0) * 0.48;
    float rim = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 2.7);
    vec3 color = mix(night, day, daylight);
    color += vec3(0.02, 0.11, 0.22) * rim * daylight;
    gl_FragColor = vec4(color, 1.0);
  }
`

interface EarthProps { date: Date; position: THREE.Vector3 }

function Earth({ date, position }: EarthProps) {
  const earth = useRef<THREE.Mesh>(null)
  const tiltGroup = useRef<THREE.Group>(null)
  const [dayTexture, nightTexture] = useTexture(['/textures/earth-day.png', '/textures/earth-night.jpg'])
  const focusedCityId = useSimulation((state) => state.focusedCityId)
  const tilt = useSimulation((state) => state.tilt)
  const showAxis = useSimulation((state) => state.showAxis)
  const showEquator = useSimulation((state) => state.showEquator)
  const showTerminator = useSimulation((state) => state.showTerminator)
  const city = cityById(focusedCityId)
  dayTexture.colorSpace = THREE.SRGBColorSpace
  nightTexture.colorSpace = THREE.SRGBColorSpace
  dayTexture.anisotropy = 8
  nightTexture.anisotropy = 8

  const uniforms = useMemo(() => ({
    dayMap: { value: dayTexture },
    nightMap: { value: nightTexture },
    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
    showTerminator: { value: 1 },
  }), [dayTexture, nightTexture])

  const rotationAngle = useMemo(() => {
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
    return THREE.MathUtils.degToRad(180 - hours * 15)
  }, [date])

  useFrame(() => {
    if (!earth.current) return
    const light = position.clone().multiplyScalar(-1).normalize()
    uniforms.lightDirection.value.copy(light)
    uniforms.showTerminator.value = showTerminator ? 1 : 0
  })

  const marker = latLonVector(city.latitude, city.longitude, 1.025)
  return (
    <group position={position}>
      <group ref={tiltGroup} rotation={[0, 0, THREE.MathUtils.degToRad(tilt)]}>
        <group rotation={[0, rotationAngle, 0]}>
          <mesh ref={earth} castShadow receiveShadow>
            <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
            <shaderMaterial uniforms={uniforms} vertexShader={earthVertexShader} fragmentShader={earthFragmentShader} />
          </mesh>
          <mesh scale={1.035}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial color="#4ea9ff" transparent opacity={0.08} side={THREE.FrontSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh scale={1.085}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial color="#2b8cff" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          {showEquator && <Line points={circlePoints(1.018)} color="#79e7ff" lineWidth={1.1} transparent opacity={0.72} />}
          <group position={marker}>
            <mesh>
              <sphereGeometry args={[0.036, 20, 20]} />
              <meshBasicMaterial color={city.color} toneMapped={false} />
            </mesh>
            <mesh scale={2.8}>
              <ringGeometry args={[0.025, 0.045, 32]} />
              <meshBasicMaterial color={city.color} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <Html center distanceFactor={4.5} position={[0, 0.12, 0]} style={{ pointerEvents: 'none' }}>
              <div className="city-beacon" style={{ '--city-color': city.color } as React.CSSProperties}>
                <strong>{city.name}</strong><span>{Math.abs(city.latitude).toFixed(1)}°{city.latitude >= 0 ? 'N' : 'S'}</span>
              </div>
            </Html>
          </group>
        </group>
        {showAxis && (
          <group>
            <Line points={[[0, -1.6, 0], [0, 1.6, 0]]} color="#bce8ff" lineWidth={1.35} transparent opacity={0.82} />
            <mesh position={[0, 1.62, 0]}><coneGeometry args={[0.055, 0.18, 16]} /><meshBasicMaterial color="#bce8ff" /></mesh>
          </group>
        )}
      </group>
    </group>
  )
}

function circlePoints(radius: number, count = 96): [number, number, number][] {
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = (index / count) * Math.PI * 2
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
  })
}

function OrbitPath() {
  return (
    <group>
      <Line points={circlePoints(ORBIT_RADIUS, 180)} color="#5c7995" lineWidth={0.7} transparent opacity={0.38} />
      {[['MAR EQUINOX', 0], ['JUN SOLSTICE', Math.PI / 2], ['SEP EQUINOX', Math.PI], ['DEC SOLSTICE', Math.PI * 1.5]].map(([label, value]) => {
        const angle = value as number
        return (
          <group key={label as string} position={[Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.09, 0.14, 24]} /><meshBasicMaterial color="#8aa4bd" transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>
            <Html center position={[0, 0.28, 0]} distanceFactor={16} style={{ pointerEvents: 'none' }}><span className="scene-label">{label as string}</span></Html>
          </group>
        )
      })}
    </group>
  )
}

function CameraRig({ date }: { date: Date }) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const cameraMode = useSimulation((state) => state.cameraMode)
  const focusedCityId = useSimulation((state) => state.focusedCityId)
  const tilt = useSimulation((state) => state.tilt)
  const previousKey = useRef('')
  const settling = useRef(true)
  const previousEarthPosition = useRef(new THREE.Vector3())

  useFrame((_state, delta) => {
    if (!controls.current) return
    const earthPosition = orbitalPosition(date)
    const key = `${cameraMode}-${focusedCityId}`
    const changed = previousKey.current !== key
    if (changed) {
      previousKey.current = key
      settling.current = true
    }
    const target = cameraMode === 'orbit' ? new THREE.Vector3() : earthPosition
    const city = cityById(focusedCityId)
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
    const cityDirection = latLonVector(city.latitude, city.longitude)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(180 - hours * 15))
      .applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(tilt))
      .normalize()
    const desired = cameraMode === 'orbit'
      ? new THREE.Vector3(0, 18, 13)
      : earthPosition.clone().add(cityDirection.multiplyScalar(3.65)).add(new THREE.Vector3(0, 0.16, 0))
    const damping = 1 - Math.exp(-delta * (changed ? 8 : 3.2))
    if (settling.current) {
      controls.current.target.lerp(target, damping)
      camera.position.lerp(desired, damping)
      if (camera.position.distanceTo(desired) < 0.035 && controls.current.target.distanceTo(target) < 0.035) settling.current = false
    } else if (cameraMode === 'globe') {
      const earthDelta = earthPosition.clone().sub(previousEarthPosition.current)
      camera.position.add(earthDelta)
      controls.current.target.copy(earthPosition)
    }
    previousEarthPosition.current.copy(earthPosition)
    controls.current.update()
  })

  return <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={2.4} maxDistance={25} enableDamping dampingFactor={0.07} />
}

function SceneContent({ date }: { date: Date }) {
  const position = orbitalPosition(date)
  const cameraMode = useSimulation((state) => state.cameraMode)
  return (
    <>
      <color attach="background" args={['#03070d']} />
      <fog attach="fog" args={['#03070d', 24, 65]} />
      <ambientLight intensity={0.055} color="#789bd6" />
      <Stars />
      <Sun />
      {cameraMode === 'orbit' && <OrbitPath />}
      <Earth date={date} position={position} />
      <CameraRig date={date} />
    </>
  )
}

export function EarthScene() {
  const dateIso = useSimulation((state) => state.dateIso)
  const date = useMemo(() => new Date(dateIso), [dateIso])
  return (
    <div className="scene-wrap" aria-label="Interactive 3D model of Earth orbiting the Sun">
      <Canvas camera={{ position: [0, 4, 12], fov: 42, near: 0.05, far: 120 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}><SceneContent date={date} /></Suspense>
      </Canvas>
      <div className="scene-hint"><span /> Drag to orbit · scroll to zoom</div>
      <div className="scale-note">Concept view · sizes & distances not to scale</div>
    </div>
  )
}
