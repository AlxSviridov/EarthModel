/* eslint-disable react-hooks/immutability -- Three.js textures and shader uniforms are mutable GPU resources. */
import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { cityById, type City } from '../data/cities'
import { dayOfYear, daysInYear } from '../science/solar'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useSimulation } from '../store/useSimulation'
import { useOptionalTexture } from './useOptionalTexture'

const ORBIT_RADIUS = 7.2
const EARTH_RADIUS = 1
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const Z_AXIS = new THREE.Vector3(0, 0, 1)
const SEASON_PHASE = -Math.PI / 2

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
  const angle = ((dayOfYear(date) - 80) / daysInYear(date.getUTCFullYear())) * Math.PI * 2 + SEASON_PHASE
  return new THREE.Vector3(Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS)
}

/** Spin that puts the focused longitude under the Sun at 12:00 local solar time. */
function earthSpinAngle(position: THREE.Vector3, tiltDegrees: number, longitudeDegrees: number, solarHour: number): number {
  const sunInTiltFrame = position.clone().multiplyScalar(-1).normalize().applyAxisAngle(Z_AXIS, -THREE.MathUtils.degToRad(tiltDegrees))
  const subsolarMeridian = Math.atan2(-sunInTiltFrame.z, sunInTiltFrame.x)
  const longitude = THREE.MathUtils.degToRad(longitudeDegrees)
  const hourAngle = THREE.MathUtils.degToRad((solarHour - 12) * 15)
  return subsolarMeridian - longitude - hourAngle
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

const sunVertexShader = `
  varying vec3 vPosition;
  varying vec3 vViewNormal;
  void main() {
    vPosition = position;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const sunFragmentShader = `
  uniform float time;
  varying vec3 vPosition;
  varying vec3 vViewNormal;
  float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p) { float value=0.0; float amp=.55; for(int i=0;i<5;i++){value+=amp*noise(p);p=p*2.03+1.7;amp*=.5;} return value; }
  void main() {
    vec3 p = normalize(vPosition);
    float flow = fbm(p * 5.2 + vec3(time*.035, -time*.018, time*.012));
    float cells = fbm(p * 23.0 - vec3(time*.02, 0.0, time*.015));
    float flare = pow(max(0.0, noise(p*3.0 + time*.025)-.62), 3.0) * 9.0;
    float limb = pow(max(vViewNormal.z, 0.0), .34);
    vec3 deep = vec3(.78,.055,.008);
    vec3 orange = vec3(1.0,.26,.025);
    vec3 gold = vec3(1.0,.72,.19);
    vec3 color = mix(deep, orange, smoothstep(.2,.72,flow));
    color = mix(color, gold, smoothstep(.48,.92,cells + flare));
    color *= .58 + .58*limb;
    gl_FragColor = vec4(color, 1.0);
  }
`

function Sun() {
  const core = useRef<THREE.Mesh>(null)
  const material = useRef<THREE.ShaderMaterial>(null)
  useFrame(({ clock }) => {
    if (core.current) core.current.rotation.y = clock.elapsedTime * 0.035
    if (material.current) material.current.uniforms.time.value = clock.elapsedTime
  })
  return (
    <group>
      <pointLight color="#ffd18a" intensity={150} distance={45} decay={1.7} />
      <mesh ref={core}>
        <sphereGeometry args={[1.12, 96, 96]} />
        <shaderMaterial ref={material} vertexShader={sunVertexShader} fragmentShader={sunFragmentShader} uniforms={{ time: { value: 0 } }} />
      </mesh>
      <mesh scale={1.10}>
        <sphereGeometry args={[1.12, 48, 48]} />
        <meshBasicMaterial color="#ff6b24" transparent opacity={0.22} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={1.22}>
        <sphereGeometry args={[1.12, 48, 48]} />
        <meshBasicMaterial color="#ff9a3d" transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <sprite scale={[5.4, 5.4, 1]}>
        <spriteMaterial map={useMemo(() => makeGlowTexture(), [])} color="#ff9d43" transparent opacity={0.46} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <Html center position={[0, -1.65, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
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

interface CityPinProps { city: City; position: THREE.Vector3 }

/**
 * A map pin, not a billboard.
 *
 * The anchor is 3D and scales with the globe, because it marks a real place on a real
 * sphere — that is geography. The label is screen-space chrome and deliberately carries no
 * `distanceFactor`: drei scales such labels by `distanceFactor / (2*tan(fov/2)*distance)`,
 * a pure 1/distance law, which made the name swing over 16x across the camera's 2.4-40
 * range. It was roughly 32 px close up and under 3 px at the full-orbit preset, so it was
 * both overbearing and, at the far end, below the 11 px floor the product contract sets.
 *
 * Visibility is a dot product between the city's world normal and the direction to the
 * camera, not a raycast. The anchor sits only 0.025 above the surface and drei's raycast
 * occlusion compares distances with no epsilon, so it flickers at the limb; and
 * `occlude="blending"` rewrites the canvas z-index, which would undo the deliberate
 * low-z layering an earlier QA pass established. Opacity fades rather than snapping,
 * because a learning scenario asks the reader to follow the marker through a whole
 * rotation.
 */
function CityPin({ city, position }: CityPinProps) {
  const group = useRef<THREE.Group>(null)
  const label = useRef<HTMLDivElement>(null)
  const facing = useRef(1)
  const wasLit = useRef<boolean | null>(null)
  const worldPosition = useMemo(() => new THREE.Vector3(), [])
  const toCamera = useMemo(() => new THREE.Vector3(), [])
  const toSun = useMemo(() => new THREE.Vector3(), [])
  const normal = useMemo(() => new THREE.Vector3(), [])
  const reducedMotion = usePrefersReducedMotion()
  const ringQuaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(Z_AXIS, position.clone().normalize()),
    [position],
  )

  useFrame((state, delta) => {
    if (!group.current || !label.current) return
    group.current.getWorldPosition(worldPosition)
    // The pin sits just above the surface, so its position from Earth's centre is its normal.
    group.current.parent?.getWorldPosition(normal)
    normal.subVectors(worldPosition, normal).normalize()
    toCamera.subVectors(state.camera.position, worldPosition).normalize()

    // Fade out through the last 20 degrees before the limb rather than popping at it.
    const target = THREE.MathUtils.smoothstep(normal.dot(toCamera), -0.05, 0.28)
    facing.current = reducedMotion ? target : THREE.MathUtils.damp(facing.current, target, 9, delta)
    label.current.style.opacity = facing.current.toFixed(3)
    label.current.style.visibility = facing.current < 0.02 ? 'hidden' : 'visible'

    // Day/night state, from the same geometry the Earth shader uses: the Sun sits at the
    // world origin, so the direction to it is simply -worldPosition. Taking it from the
    // scene rather than from the UTC helper in solar.ts guarantees the dot agrees with the
    // terminator the learner can see, instead of drifting against it.
    toSun.copy(worldPosition).multiplyScalar(-1).normalize()
    const lit = normal.dot(toSun) >= SUNRISE_COSINE
    if (lit !== wasLit.current) {
      wasLit.current = lit
      label.current.dataset.lit = lit ? 'day' : 'night'
    }
  })

  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[0.022, 20, 20]} />
        <meshBasicMaterial color={city.color} toneMapped={false} />
      </mesh>
      {/* Lies flat on the surface: the ring's own +Z is turned to face along the normal,
          which the previous flat XY ring never did. */}
      <mesh quaternion={ringQuaternion}>
        <ringGeometry args={[0.05, 0.062, 48]} />
        <meshBasicMaterial color={city.color} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html center position={[0, 0, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="city-pin" ref={label} data-lit="day" style={{ '--city-color': city.color } as React.CSSProperties}>
          <div className="city-pin-chip">
            <i className="city-pin-state" />
            <strong>{city.name}</strong>
            <span>{Math.abs(city.latitude).toFixed(1)}°{city.latitude >= 0 ? 'N' : 'S'}</span>
          </div>
          <i className="city-pin-leader" />
        </div>
      </Html>
    </group>
  )
}

/** Tuned once, against the 5-degree RMS slope the relief map is built to. Deliberately not
 *  a control: every other overlay toggle maps to a taught concept, and "bump strength"
 *  maps to none — its only honest setting is the one that looks least dramatic. */
const RELIEF_STRENGTH = 0.85

/** sin(-0.833°) — the apparent-sunrise altitude the whole project uses, as a cosine test. */
const SUNRISE_COSINE = -0.01454

const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vTangentWorld;
  varying vec3 vViewWorld;
  varying float vPoleFade;
  void main() {
    vUv = uv;

    // The tangent frame is built in OBJECT space, where the sphere's pole really is +Y and
    // cross(+Y, N) is exactly the direction of increasing U. In world space the mesh is
    // inside the axial-tilt group, so world +Y is up to 40 degrees off the pole and the
    // frame would twist — lighting every ridge from the wrong angle, and changing as the
    // learner drags the tilt slider.
    vec3 objectNormal = normalize(normal);
    vec3 objectTangent = cross(vec3(0.0, 1.0, 0.0), objectNormal);
    vPoleFade = length(objectTangent);
    objectTangent = vPoleFade > 1e-4 ? objectTangent / vPoleFade : vec3(0.0, 0.0, 1.0);

    mat3 toWorld = mat3(modelMatrix);
    vNormalWorld = normalize(toWorld * objectNormal);
    vTangentWorld = normalize(toWorld * objectTangent);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vViewWorld = cameraPosition - worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const earthFragmentShader = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D reliefMap;
  uniform vec3 lightDirection;
  uniform float showTerminator;
  uniform float reliefStrength;
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vTangentWorld;
  varying vec3 vViewWorld;
  varying float vPoleFade;
  void main() {
    vec3 normal = normalize(vNormalWorld);
    vec3 sunDirection = normalize(lightDirection);

    // The day/night blend runs on the GEOMETRIC normal and must keep doing so. With the
    // sharp terminator on, the blend band is about 2 degrees of arc; a 5-degree slope in
    // the relief map would displace its midpoint by more than twice that, shattering the
    // terminator into night-lights punched through the Andes and islands of daylight
    // floating in the dark side. That line teaches something, so it stays geometric.
    float sun = dot(normal, sunDirection);
    float blendWidth = mix(0.09, 0.018, showTerminator);
    float daylight = smoothstep(-blendWidth, blendWidth, sun);

    // The perturbed normal earns exactly one job: shading detail on the lit side.
    float sunShaded = sun;
    if (reliefStrength > 0.0) {
      vec3 tangent = normalize(vTangentWorld - normal * dot(normal, vTangentWorld));
      vec3 bitangent = cross(normal, tangent);
      vec3 relief = texture2D(reliefMap, vUv).xyz * 2.0 - 1.0;
      float amount = reliefStrength * smoothstep(0.02, 0.14, vPoleFade);
      vec3 shadedNormal = normalize(
        tangent * (relief.x * amount) +
        bitangent * (relief.y * amount) +
        normal * max(relief.z, 0.05)
      );
      sunShaded = dot(shadedNormal, sunDirection);
    }

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb * 1.18;

    // Relief enters as a bounded difference on top of the unchanged base shading, weighted
    // toward grazing light. That is why real mountains only show up near dawn and dusk, and
    // it keeps the overall brightness of the globe exactly as it was.
    float graze = 1.0 - smoothstep(0.0, 0.40, sun);
    float reliefTerm = (max(sunShaded, 0.0) - max(sun, 0.0)) * (0.42 + 0.58 * graze);
    day *= clamp(0.72 + max(sun, 0.0) * 0.48 + reliefTerm * 0.9, 0.30, 1.35);

    vec3 viewDirection = normalize(vViewWorld);
    float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.7);
    vec3 color = mix(night, day, daylight);
    color += vec3(0.02, 0.11, 0.22) * rim * daylight;
    gl_FragColor = vec4(color, 1.0);
  }
`

interface EarthProps { position: THREE.Vector3 }

function Earth({ position }: EarthProps) {
  const earth = useRef<THREE.Mesh>(null)
  const tiltGroup = useRef<THREE.Group>(null)
  const [dayTexture, nightTexture] = useTexture(['/textures/earth-day.png', '/textures/earth-night.jpg'])
  const reliefTexture = useOptionalTexture('/textures/earth-relief-normal.png')
  const focusedCityId = useSimulation((state) => state.focusedCityId)
  const solarHour = useSimulation((state) => state.solarHour)
  const tilt = useSimulation((state) => state.tilt)
  const showAxis = useSimulation((state) => state.showAxis)
  const showEquator = useSimulation((state) => state.showEquator)
  const showTerminator = useSimulation((state) => state.showTerminator)
  const city = cityById(focusedCityId)
  dayTexture.colorSpace = THREE.SRGBColorSpace
  nightTexture.colorSpace = THREE.SRGBColorSpace
  dayTexture.anisotropy = 8
  nightTexture.anisotropy = 8

  // The relief map arrives asynchronously and is declared but never added to the memo deps:
  // rebuilding the uniforms object mid-flight would hand the material a new identity and
  // drop a frame of lighting. The sampler is always declared, so the shader compiles once
  // whether or not the texture ever lands.
  const uniforms = useMemo(() => ({
    dayMap: { value: dayTexture },
    nightMap: { value: nightTexture },
    reliefMap: { value: null as THREE.Texture | null },
    lightDirection: { value: new THREE.Vector3(1, 0, 0) },
    showTerminator: { value: 1 },
    reliefStrength: { value: 0 },
  }), [dayTexture, nightTexture])

  const rotationAngle = earthSpinAngle(position, tilt, city.longitude, solarHour)

  useFrame(() => {
    if (!earth.current) return
    const light = position.clone().multiplyScalar(-1).normalize()
    uniforms.lightDirection.value.copy(light)
    uniforms.showTerminator.value = showTerminator ? 1 : 0
    uniforms.reliefMap.value = reliefTexture
    uniforms.reliefStrength.value = reliefTexture ? RELIEF_STRENGTH : 0
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
          <CityPin city={city} position={marker} />
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

function OrbitPath({ date }: { date: Date }) {
  const progressAngle = (((dayOfYear(date) - 80) / daysInYear(date.getUTCFullYear())) * Math.PI * 2 + Math.PI * 2) % (Math.PI * 2)
  const traveled = Array.from({ length: 121 }, (_, index) => {
    const angle = SEASON_PHASE + progressAngle * (index / 120)
    return [Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS] as [number, number, number]
  })
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ORBIT_RADIUS - 0.17, ORBIT_RADIUS + 0.17, 192]} />
        <meshBasicMaterial color="#5fbce8" transparent opacity={0.045} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={circlePoints(ORBIT_RADIUS, 220)} color="#82c9ea" lineWidth={4} transparent opacity={0.10} />
      <Line points={circlePoints(ORBIT_RADIUS, 220)} color="#9bdcff" lineWidth={1.55} transparent opacity={0.68} />
      {traveled.length > 1 && <Line points={traveled} color="#ffd078" lineWidth={2.5} transparent opacity={0.92} />}
      {Array.from({ length: 12 }, (_, index) => {
        const angle = SEASON_PHASE + (index / 12) * Math.PI * 2
        return <mesh key={index} position={[Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS]}><sphereGeometry args={[index % 3 === 0 ? .075 : .04, 12, 12]} /><meshBasicMaterial color={index % 3 === 0 ? '#d4f1ff' : '#638ba5'} /></mesh>
      })}
      {[['MAR EQUINOX', SEASON_PHASE], ['JUN SOLSTICE', 0], ['SEP EQUINOX', Math.PI / 2], ['DEC SOLSTICE', Math.PI]].map(([label, value]) => {
        const angle = value as number
        return (
          <group key={label as string} position={[Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.09, 0.14, 24]} /><meshBasicMaterial color="#8aa4bd" transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>
            <Html center position={[0, 0.28, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}><span className="scene-label">{label as string}</span></Html>
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
  const solarHour = useSimulation((state) => state.solarHour)
  const trackCity = useSimulation((state) => state.trackCity)
  const setTrackCity = useSimulation((state) => state.setTrackCity)
  const cameraResetNonce = useSimulation((state) => state.cameraResetNonce)
  const previousKey = useRef('')
  const settling = useRef(true)
  const previousEarthPosition = useRef(new THREE.Vector3())

  useFrame((_state, delta) => {
    if (!controls.current) return
    const earthPosition = orbitalPosition(date)
    const key = `${cameraMode}-${focusedCityId}-${trackCity}-${cameraResetNonce}`
    const changed = previousKey.current !== key
    if (changed) {
      previousKey.current = key
      settling.current = true
    }
    const target = cameraMode === 'orbit' ? new THREE.Vector3() : earthPosition
    const city = cityById(focusedCityId)
    const spin = earthSpinAngle(earthPosition, tilt, city.longitude, solarHour)
    const cityDirection = latLonVector(city.latitude, city.longitude)
      .applyAxisAngle(Y_AXIS, spin)
      .applyAxisAngle(Z_AXIS, THREE.MathUtils.degToRad(tilt))
      .normalize()
    const desired = cameraMode === 'orbit'
      ? new THREE.Vector3(0, 23, 16.5)
      : earthPosition.clone().add(cityDirection.multiplyScalar(3.65)).add(new THREE.Vector3(0, 0.16, 0))
    const damping = 1 - Math.exp(-delta * (changed ? 8 : 3.2))
    if (settling.current) {
      controls.current.target.lerp(target, damping)
      camera.position.lerp(desired, damping)
      if (camera.position.distanceTo(desired) < 0.035 && controls.current.target.distanceTo(target) < 0.035) settling.current = false
    } else if (cameraMode === 'globe' && trackCity) {
      const trackedPosition = earthPosition.clone().add(cityDirection.multiplyScalar(3.65)).add(new THREE.Vector3(0, 0.16, 0))
      controls.current.target.copy(earthPosition)
      camera.position.lerp(trackedPosition, 1 - Math.exp(-delta * 8))
    } else if (cameraMode === 'globe') {
      const earthDelta = earthPosition.clone().sub(previousEarthPosition.current)
      camera.position.add(earthDelta)
      controls.current.target.copy(earthPosition)
    }
    previousEarthPosition.current.copy(earthPosition)
    controls.current.update()
  })

  return <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={2.4} maxDistance={40} enableDamping dampingFactor={0.07} onStart={() => { settling.current = false; setTrackCity(false) }} />
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
      {cameraMode === 'orbit' && <OrbitPath date={date} />}
      <Earth position={position} />
      <CameraRig date={date} />
    </>
  )
}

export function EarthScene() {
  const dateIso = useSimulation((state) => state.dateIso)
  const focusedCityId = useSimulation((state) => state.focusedCityId)
  const cameraMode = useSimulation((state) => state.cameraMode)
  const trackCity = useSimulation((state) => state.trackCity)
  const recallCamera = useSimulation((state) => state.recallCamera)
  const setProgress = useSimulation((state) => state.setProgress)
  const date = useMemo(() => new Date(dateIso), [dateIso])
  const city = cityById(focusedCityId)
  const seasonEvents = [
    { label: 'Mar equinox', short: 'MAR', progress: 79 / daysInYear(date.getUTCFullYear()) },
    { label: 'Jun solstice', short: 'JUN', progress: 171 / daysInYear(date.getUTCFullYear()) },
    { label: 'Sep equinox', short: 'SEP', progress: 265 / daysInYear(date.getUTCFullYear()) },
    { label: 'Dec solstice', short: 'DEC', progress: 355 / daysInYear(date.getUTCFullYear()) },
  ]
  return (
    <div className="scene-wrap" aria-label="Interactive 3D model of Earth orbiting the Sun">
      <div className="scene-view-switch" aria-label="Scene view">
        <button className={cameraMode === 'globe' ? 'active' : ''} onClick={() => recallCamera('globe')}>City close-up</button>
        <button className={cameraMode === 'orbit' ? 'active' : ''} onClick={() => recallCamera('orbit')}>Full orbit</button>
      </div>
      <div className="season-dock" aria-label="Jump to a season">
        {seasonEvents.map((event) => <button key={event.label} onClick={() => { setProgress(event.progress); recallCamera('orbit') }}><strong>{event.short}</strong><span>{event.label}</span></button>)}
      </div>
      <Canvas camera={{ position: [0, 4, 12], fov: 42, near: 0.05, far: 120 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}><SceneContent date={date} /></Suspense>
      </Canvas>
      <div className="scene-hint"><span /> {trackCity ? `${city.name} stays centred · drag to release` : 'Drag to orbit · scroll to zoom'}</div>
      {cameraMode === 'orbit' && <div className="orbit-key">Gold arc = year travelled · bright points = equinoxes & solstices</div>}
      <div className="scale-note">Concept view · sizes, distances &amp; surface relief not to scale</div>
    </div>
  )
}
