import { useState } from 'react'
import { BookOpen, Compass, Globe2, Info, Menu, Orbit, SunMedium, X } from 'lucide-react'
import { ControlPanel } from './components/ControlPanel'
import { DaylightChart } from './components/DaylightChart'
import { DiscoveryDrawer } from './components/DiscoveryDrawer'
import { SimulationTicker } from './components/SimulationTicker'
import { SkyPathsLab } from './components/SkyPathsLab'
import { SundialLab } from './components/SundialLab'
import { EarthScene } from './scene/EarthScene'
import { useSimulation, type Lab } from './store/useSimulation'

const labs: { id: Lab; label: string; icon: typeof Orbit }[] = [
  { id: 'orbit', label: 'Orbit', icon: Orbit },
  { id: 'sky', label: 'Sky paths', icon: SunMedium },
  { id: 'sundial', label: 'Sundial', icon: Compass },
]

export default function App() {
  const [discoveriesOpen, setDiscoveriesOpen] = useState(false)
  const [mobileControls, setMobileControls] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const activeLab = useSimulation((state) => state.activeLab)
  const setActiveLab = useSimulation((state) => state.setActiveLab)

  const chooseLab = (lab: Lab) => {
    setActiveLab(lab)
    setMobileControls(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <SimulationTicker />
      <header className="topbar">
        <button className="brand" onClick={() => chooseLab('orbit')}><span className="brand-orbit"><i /></span><span><strong>ORBIT LAB</strong><small>FOLLOW THE LIGHT</small></span></button>
        <nav className="lab-nav" aria-label="Learning labs">{labs.map((lab) => { const Icon = lab.icon; return <button key={lab.id} className={activeLab === lab.id ? 'active' : ''} onClick={() => chooseLab(lab.id)}><Icon />{lab.label}</button> })}</nav>
        <nav className="utility-nav"><button onClick={() => setDiscoveriesOpen(true)}><BookOpen /> <span>Discoveries</span></button><button onClick={() => setAboutOpen(true)}><Info /> <span>How it works</span></button>{activeLab === 'orbit' && <button className="mobile-menu" onClick={() => setMobileControls(!mobileControls)} aria-label="Toggle controls">{mobileControls ? <X /> : <Menu />}</button>}</nav>
      </header>

      {activeLab === 'orbit' && <main id="main" className="workspace">
        <div className="visual-column">
          <section className="hero-copy"><span className="eyebrow">EARTH–SUN EXPLORER</span><h1>Why does daylight<br /><em>change?</em></h1><p>Hold the clock still to watch a year. Hold the date still to watch one day.</p></section>
          <EarthScene />
          <DaylightChart />
        </div>
        <div className={mobileControls ? 'controls-column mobile-open' : 'controls-column'}><ControlPanel onOpenDiscoveries={() => setDiscoveriesOpen(true)} onClose={() => setMobileControls(false)} /></div>
        {mobileControls && <button className="controls-scrim" aria-label="Close controls" onClick={() => setMobileControls(false)} />}
      </main>}
      {activeLab === 'sky' && <main id="main"><SkyPathsLab /></main>}
      {activeLab === 'sundial' && <main id="main"><SundialLab /></main>}

      <DiscoveryDrawer open={discoveriesOpen} onClose={() => setDiscoveriesOpen(false)} />
      {aboutOpen && <div className="drawer-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setAboutOpen(false) }}><section className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title"><button className="icon-button" onClick={() => setAboutOpen(false)}><X /></button><span className="eyebrow">BEHIND THE MODEL</span><h2 id="about-title">Three ways to follow the Sun</h2><p>Orbit Lab connects the same city, date, and local solar time across three views. Move from space, to your local sky, to a shadow on a dial without starting the investigation over.</p><div className="about-grid"><article><Globe2 /><strong>Orbit</strong><p>Earth’s 23.44° tilt changes the length and angle of sunlight through the year. Year and day playback are separated so both motions stay readable.</p></article><article><SunMedium /><strong>Sky paths</strong><p>Solar altitude and azimuth draw the Sun’s visible arc. Compare places on one date or seasons in one place.</p></article><article><Compass /><strong>Sundial</strong><p>The equation of time explains why an actual Sun and an average clock drift apart across the year.</p></article><article><Info /><strong>What is simplified?</strong><p>Sizes, distances, and orbit shape are compressed. Local terrain, weather, civil time zones, and daylight saving are not included.</p></article></div><button className="primary wide" onClick={() => setAboutOpen(false)}>Back to the lab</button></section></div>}
    </div>
  )
}
