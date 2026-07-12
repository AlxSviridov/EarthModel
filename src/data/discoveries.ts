export interface Discovery {
  id: string
  eyebrow: string
  title: string
  question: string
  cityIds: string[]
  month: number
  day: number
  tilt?: number
  insight: string
}

export const discoveries: Discovery[] = [
  { id: 'year', eyebrow: '01 · Start here', title: 'Your city, one year', question: 'When will London’s daylight curve climb fastest?', cityIds: ['london'], month: 0, day: 1, insight: 'The curve climbs fastest near the March equinox, not at midsummer.' },
  { id: 'hemispheres', eyebrow: '02 · Mirror seasons', title: 'North meets south', question: 'Can London and Sydney both have their longest day together?', cityIds: ['london', 'sydney'], month: 5, day: 21, insight: 'No. When the north tilts sunward, the south tilts away.' },
  { id: 'equinox', eyebrow: '03 · A global handshake', title: 'Meet at the equinox', question: 'Why do these very different places almost meet at 12 hours?', cityIds: ['london', 'quito', 'tromso', 'capetown'], month: 2, day: 20, insight: 'Neither hemisphere leans toward the Sun, so day and night are nearly balanced worldwide.' },
  { id: 'midnight', eyebrow: '04 · Arctic magic', title: 'Chase the midnight Sun', question: 'Will Tromsø’s marker ever enter darkness today?', cityIds: ['tromso'], month: 5, day: 21, insight: 'No—the tilted Arctic stays in sunlight through the whole rotation.' },
  { id: 'polar-night', eyebrow: '05 · Winter extreme', title: 'Find polar night', question: 'Does “no sunrise” always mean pitch black?', cityIds: ['tromso'], month: 11, day: 21, insight: 'Not always. The Sun may stay below the horizon while twilight still colours the sky.' },
  { id: 'equator', eyebrow: '06 · Steady rhythm', title: 'The equator barely changes', question: 'Which line is flatter: Quito or London?', cityIds: ['quito', 'london'], month: 8, day: 22, insight: 'Quito stays close to 12 hours because Earth’s tilt changes its sunlight angle far less.' },
  { id: 'latitude', eyebrow: '07 · Longitude test', title: 'Same latitude, same pattern', question: 'Do London and Calgary draw similar curves?', cityIds: ['london', 'calgary'], month: 3, day: 15, insight: 'Yes. Latitude controls annual day length; longitude mainly shifts the clock.' },
  { id: 'zero-tilt', eyebrow: '08 · Thought experiment', title: 'Switch the tilt off', question: 'What happens to every seasonal curve at 0°?', cityIds: ['london', 'tromso', 'sydney'], month: 5, day: 21, tilt: 0, insight: 'They flatten near 12 hours. Tilt—not Earth–Sun distance—drives these seasons.' },
  { id: 'big-tilt', eyebrow: '09 · Another Earth', title: 'Turn tilt up to 40°', question: 'Where does the curve change most?', cityIds: ['quito', 'london', 'tromso'], month: 5, day: 21, tilt: 40, insight: 'High latitudes become much more extreme; the equator still changes little.' },
  { id: 'predict', eyebrow: '10 · Make a prediction', title: 'London or Sydney?', question: 'On 1 December, which city gets more daylight?', cityIds: ['london', 'sydney'], month: 11, day: 1, insight: 'Sydney. In December, the southern hemisphere leans toward the Sun.' },
]

