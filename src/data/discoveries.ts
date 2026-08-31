import { EARTH_TILT_DEGREES } from '../science/solar'
import type { CameraMode, Lab, PlaybackMode } from '../store/useSimulation'
import type { SkyLayers, SkyView } from './skyTraces'

/**
 * One guided investigation. Every field beyond the copy exists because some learning
 * scenario in `docs/PRODUCT.md` is defined by it: scenario 11 is "play 30 days a second",
 * scenario 12 is "play one day slowly", 23 is the first-person viewpoint, 24 is the
 * sunrise band. A discovery that cannot express those cannot open them.
 */
export interface Discovery {
  id: string
  eyebrow: string
  title: string
  question: string
  insight: string
  /** Which lab makes the point. Without this a discovery lands wherever the learner already was. */
  lab: Lab
  cityIds: string[]
  month: number
  day: number
  tilt?: number
  solarHour?: number
  playbackMode?: PlaybackMode
  yearSpeed?: number
  daySpeed?: number
  /** Some scenarios only exist in motion. Reduced-motion preferences still win at the ticker. */
  autoplay?: boolean
  cameraMode?: CameraMode
  skyView?: SkyView
  skyLayers?: Partial<SkyLayers>
  /** Pinned sky traces, as free (city, date) pairs. Ids are generated when applied. */
  traces?: { cityId: string; month: number; day: number }[]
  /** Day of the year to calibrate the sundial on, as a 0..1 year fraction. */
  sundialCalibration?: number
  /** Turns a discovery into a real prediction: the answer stays hidden until the learner picks. */
  choices?: [string, string]
  answer?: 0 | 1
}

const YEAR = 2026
const utc = (month: number, day: number) => new Date(Date.UTC(YEAR, month, day, 12)).toISOString()
/** 0..1 through a 365-day year, matching how the sundial slider is scaled. */
const dayFraction = (dayOfYear: number) => dayOfYear / 364

export interface DiscoveryStatePatch {
  activeLab: Lab
  dateIso: string
  selectedCityIds: string[]
  focusedCityId: string
  tilt: number
  solarHour: number
  playing: boolean
  playbackMode: PlaybackMode
  yearSpeed: number
  daySpeed: number
  cameraMode: CameraMode
  skyView: SkyView
  skyLayers: SkyLayers
  skyTraces: { cityId: string; dateIso: string }[]
  sundialCalibration: number
}

const DEFAULTS = {
  tilt: EARTH_TILT_DEGREES,
  solarHour: 12,
  playbackMode: 'year' as PlaybackMode,
  yearSpeed: 30,
  daySpeed: 4,
  cameraMode: 'globe' as CameraMode,
  skyView: 'whole' as SkyView,
  skyLayers: { nightArc: true, hourTicks: true, yearFan: false, horizonBand: false } as SkyLayers,
  sundialCalibration: dayFraction(104),
}

/**
 * The complete state a discovery asks for, as data. Kept pure and separate from the drawer
 * so it can be tested without a DOM: this project's Vitest runs in the node environment and
 * has no React testing stack, and the launch cascade was previously untested entirely.
 */
export function discoveryState(discovery: Discovery): DiscoveryStatePatch {
  return {
    activeLab: discovery.lab,
    dateIso: utc(discovery.month, discovery.day),
    selectedCityIds: discovery.cityIds,
    focusedCityId: discovery.cityIds[0],
    tilt: discovery.tilt ?? DEFAULTS.tilt,
    solarHour: discovery.solarHour ?? DEFAULTS.solarHour,
    playing: discovery.autoplay ?? false,
    playbackMode: discovery.playbackMode ?? DEFAULTS.playbackMode,
    yearSpeed: discovery.yearSpeed ?? DEFAULTS.yearSpeed,
    daySpeed: discovery.daySpeed ?? DEFAULTS.daySpeed,
    cameraMode: discovery.cameraMode ?? DEFAULTS.cameraMode,
    skyView: discovery.skyView ?? DEFAULTS.skyView,
    skyLayers: { ...DEFAULTS.skyLayers, ...discovery.skyLayers },
    skyTraces: (discovery.traces ?? []).map((trace) => ({ cityId: trace.cityId, dateIso: utc(trace.month, trace.day) })),
    sundialCalibration: discovery.sundialCalibration ?? DEFAULTS.sundialCalibration,
  }
}

/**
 * One discovery per learning scenario in `docs/PRODUCT.md`. Numbering follows that document,
 * and the eyebrow number is derived from position rather than written into each record, so
 * inserting a scenario cannot leave the deck mislabelled.
 */
export const discoveries: Discovery[] = [
  // Version 1 — the Orbit lab and the annual daylight curve.
  { id: 'year', eyebrow: 'Start here', title: 'Your city, one year', question: 'When will London’s daylight curve climb fastest?', lab: 'orbit', cityIds: ['london'], month: 0, day: 1, insight: 'The curve climbs fastest near the March equinox, not at midsummer. Steepest change and longest day are not the same moment.' },
  { id: 'hemispheres', eyebrow: 'Mirror seasons', title: 'North meets south', question: 'Can London and Sydney both have their longest day together?', lab: 'orbit', cityIds: ['london', 'sydney'], month: 5, day: 21, insight: 'No. When the north tilts sunward, the south tilts away.', choices: ['Yes, on the same day', 'No, opposite halves of the year'], answer: 1 },
  { id: 'equinox', eyebrow: 'A global handshake', title: 'Meet at the equinox', question: 'Why do these very different places almost meet at 12 hours?', lab: 'orbit', cityIds: ['london', 'quito', 'tromso', 'capetown'], month: 2, day: 20, insight: 'Neither hemisphere leans toward the Sun, so day and night are nearly balanced worldwide. Only nearly: bending air and the Sun’s width add a few minutes everywhere.' },
  { id: 'midnight', eyebrow: 'Arctic magic', title: 'Chase the midnight Sun', question: 'Will Tromsø’s marker ever enter darkness today?', lab: 'orbit', cityIds: ['tromso'], month: 5, day: 21, insight: 'No — the tilted Arctic stays in sunlight through the whole rotation.', choices: ['Yes, briefly at midnight', 'No, it stays lit all day'], answer: 1 },
  { id: 'polar-night', eyebrow: 'Winter extreme', title: 'Find polar night', question: 'Does “no sunrise” always mean pitch black?', lab: 'orbit', cityIds: ['tromso'], month: 11, day: 21, insight: 'Not always. The Sun may stay below the horizon while twilight still colours the sky.' },
  { id: 'equator', eyebrow: 'Steady rhythm', title: 'The equator barely changes', question: 'Which line is flatter: Quito or London?', lab: 'orbit', cityIds: ['quito', 'london'], month: 8, day: 22, insight: 'Quito stays close to 12 hours because Earth’s tilt changes its sunlight angle far less.', choices: ['Quito', 'London'], answer: 0 },
  { id: 'latitude', eyebrow: 'Longitude test', title: 'Same latitude, same pattern', question: 'Do London and Calgary draw similar curves?', lab: 'orbit', cityIds: ['london', 'calgary'], month: 3, day: 15, insight: 'Yes. Latitude controls annual day length; longitude mainly shifts the clock.' },
  { id: 'zero-tilt', eyebrow: 'Thought experiment', title: 'Switch the tilt off', question: 'What happens to every seasonal curve at 0°?', lab: 'orbit', cityIds: ['london', 'tromso', 'sydney'], month: 5, day: 21, tilt: 0, cameraMode: 'orbit', insight: 'They flatten near 12 hours. Tilt — not Earth–Sun distance — drives these seasons.' },
  { id: 'big-tilt', eyebrow: 'Another Earth', title: 'Turn tilt up to 40°', question: 'Where does the curve change most?', lab: 'orbit', cityIds: ['quito', 'london', 'tromso'], month: 5, day: 21, tilt: 40, cameraMode: 'orbit', insight: 'High latitudes become much more extreme; the equator still changes little.' },
  { id: 'predict', eyebrow: 'Make a prediction', title: 'London or Sydney?', question: 'On 1 December, which city gets more daylight?', lab: 'orbit', cityIds: ['london', 'sydney'], month: 11, day: 1, insight: 'Sydney. In December the southern hemisphere leans toward the Sun.', choices: ['London', 'Sydney'], answer: 1 },

  // Version 2 — playback, and the Sky paths and Sundial labs.
  { id: 'calm-year', eyebrow: 'One smooth year', title: 'Watch one calm year', question: 'Press play. Does Earth flicker as the year runs by?', lab: 'orbit', cityIds: ['london'], month: 0, day: 1, playbackMode: 'year', yearSpeed: 30, autoplay: true, cameraMode: 'orbit', insight: 'No. Holding the clock at local noon means the year moves without spinning the globe hundreds of times, so the orbit stays readable and the daylight curve grows behind it.' },
  { id: 'one-sunrise', eyebrow: 'Cross the line', title: 'Cross one sunrise', question: 'The date is frozen at 21 June. What happens to London as the clock runs?', lab: 'orbit', cityIds: ['london'], month: 5, day: 21, solarHour: 2, playbackMode: 'day', daySpeed: 1, autoplay: true, insight: 'London crosses out of darkness into light, and the readout passes sunrise. Holding the date still is what makes one rotation watchable.' },
  { id: 'noon-shadows', eyebrow: 'Same clock, different Sun', title: 'Compare noon shadows', question: 'It is local noon in both cities. Is the Sun the same height?', lab: 'sky', cityIds: ['london', 'quito'], month: 5, day: 21, solarHour: 12, traces: [{ cityId: 'quito', month: 5, day: 21 }], insight: 'No. At the same local noon Quito’s Sun is far higher than London’s, so London’s shadows stay long even at midday.', choices: ['The same height', 'Different heights'], answer: 1 },
  { id: 'four-skies', eyebrow: 'Four places, one day', title: 'Four skies, one day', question: 'On one date, how differently can the Sun cross four skies?', lab: 'sky', cityIds: ['london', 'quito', 'tromso', 'capetown'], month: 5, day: 21, traces: [{ cityId: 'quito', month: 5, day: 21 }, { cityId: 'tromso', month: 5, day: 21 }, { cityId: 'capetown', month: 5, day: 21 }], insight: 'Each arc has its own height and length: Tromsø’s never sets, Quito’s passes near overhead, Cape Town’s is short and low. Same day, same Sun, four skies.' },
  { id: 'two-seasons', eyebrow: 'One place, two seasons', title: 'One sky, two seasons', question: 'How much of London’s sky does the Sun give up between June and December?', lab: 'sky', cityIds: ['london'], month: 5, day: 21, traces: [{ cityId: 'london', month: 11, day: 21 }], insight: 'The December arc is a short, low stub next to the long June sweep — same place, same horizon, barely the same Sun.' },
  { id: 'calibrate', eyebrow: 'A clock of sunlight', title: 'Calibrate a sundial', question: 'Set the dial right on 15 April. Does it stay right?', lab: 'sundial', cityIds: ['london'], month: 5, day: 21, sundialCalibration: dayFraction(104), insight: 'No. Calibration removes the error on one chosen day, not every day. Earth’s tilt and slightly oval orbit make real solar days uneven, so the dial drifts ahead and behind across the year.', choices: ['Yes, all year', 'No, it drifts'], answer: 1 },
  { id: 'dial-latitude', eyebrow: 'Where you stand', title: 'Latitude changes the dial', question: 'Same dial, same calibration. Do London, Quito and Sydney read alike?', lab: 'sundial', cityIds: ['london', 'quito', 'sydney'], month: 5, day: 21, sundialCalibration: dayFraction(104), insight: 'The hour lines fan out differently at every latitude, and south of the equator the shadow sweeps the other way. A dial has to be built for its own place.' },

  // Version 3 — the 3D sky dome.
  { id: 'north-east-summer', eyebrow: 'Summer sunrise', title: 'Summer starts in the north-east', question: 'On 21 June, does the Sun rise due east in London?', lab: 'sky', cityIds: ['london'], month: 5, day: 21, insight: 'No — it rises about 49° north of east, climbs to 62°, and sets in the north-west. In December it rises 128° south-east and never clears 16°.', choices: ['Due east', 'North of east'], answer: 1 },
  { id: 'due-east', eyebrow: 'The one shared day', title: 'Due east, everywhere', question: 'At the equinox, where does the Sun rise for everyone?', lab: 'sky', cityIds: ['quito'], month: 2, day: 20, traces: [{ cityId: 'tromso', month: 2, day: 20 }, { cityId: 'capetown', month: 2, day: 20 }], insight: 'Within about a degree of due east, at every latitude. The readout says almost exactly, because the apparent horizon and the calendar date both fall a little short of the exact equinox instant.' },
  { id: 'rise-not-cross', eyebrow: 'Two different facts', title: 'Rising north of east is not crossing', question: 'Quito’s Sun rises north of east on 21 June. Does it cross to the south?', lab: 'sky', cityIds: ['quito'], month: 5, day: 21, insight: 'No. It rises 67° ENE and stays on the north side all day. Which side it rises depends on the date; whether it crosses depends on your latitude.', choices: ['Yes, at midday', 'No, it stays north'], answer: 1 },
  { id: 'mirror-skies', eyebrow: 'Opposite lean', title: 'Mirror skies', question: 'On the same June date, how do London and Sydney’s arcs differ?', lab: 'sky', cityIds: ['london', 'sydney'], month: 5, day: 21, traces: [{ cityId: 'sydney', month: 5, day: 21 }], insight: 'London’s arc leans south and is long; Sydney’s leans north and is short. Two hemispheres, two mirrored skies, one day.' },
  { id: 'never-sets', eyebrow: 'A closed loop', title: 'A Sun that never sets', question: 'What shape does Tromsø’s Sun draw on 21 June?', lab: 'sky', cityIds: ['tromso'], month: 5, day: 21, traces: [{ cityId: 'tromso', month: 11, day: 21 }], insight: 'A closed loop that never touches the ground. On 21 December the same loop sits entirely beneath it, and the Sun does not rise at all.' },
  { id: 'stand-and-turn', eyebrow: 'Stand in the field', title: 'Stand in the field and turn round', question: 'From inside the dome, can you find where the Sun came up?', lab: 'sky', cityIds: ['london'], month: 5, day: 21, skyView: 'observer', insight: 'You are at eye height in the middle. Drag to turn your head and follow the arc back to the north-east, then tilt up to where the Sun passes at noon.' },
  { id: 'sunrise-wanders', eyebrow: 'A year of sunrises', title: 'How far the sunrise wanders', question: 'Does the Sun rise in the same place every morning?', lab: 'sky', cityIds: ['london'], month: 5, day: 21, skyLayers: { horizonBand: true }, traces: [{ cityId: 'tromso', month: 5, day: 21 }], insight: 'No. Across a year London’s sunrise slides along about 80° of horizon. Tromsø’s covers nearly the whole horizon — and vanishes entirely for part of the year.', choices: ['The same spot', 'It moves along the horizon'], answer: 1 },
]
