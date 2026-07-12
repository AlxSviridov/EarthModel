import { useState } from 'react'
import { BookOpen, Info, Menu, X } from 'lucide-react'
import { ControlPanel } from './components/ControlPanel'
import { DaylightChart } from './components/DaylightChart'
import { DiscoveryDrawer } from './components/DiscoveryDrawer'
import { SimulationTicker } from './components/SimulationTicker'
import { EarthScene } from './scene/EarthScene'

export default function App() {
  const [discoveriesOpen, setDiscoveriesOpen] = useState(false)
  const [mobileControls, setMobileControls] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  return (
    <div className="app-shell">
      <SimulationTicker />
      <header className="topbar">
        <a href="#main" className="brand"><span className="brand-orbit"><i /></span><span><strong>ORBIT LAB</strong><small>FOLLOW THE LIGHT</small></span></a>
        <div className="topbar-center"><span className="live-dot" /> EARTH · 23.4° TILT <i /> EDUCATIONAL MODEL</div>
        <nav><button onClick={() => setDiscoveriesOpen(true)}><BookOpen size={15} /> Discoveries</button><button onClick={() => setAboutOpen(true)}><Info size={15} /> How it works</button><button className="mobile-menu" onClick={() => setMobileControls(!mobileControls)} aria-label="Toggle controls">{mobileControls ? <X /> : <Menu />}</button></nav>
      </header>
      <main id="main" className="workspace">
        <div className="visual-column">
          <section className="hero-copy"><span className="eyebrow">EARTH–SUN EXPLORER</span><h1>Why does daylight<br /><em>change?</em></h1><p>Pick a place. Move through the year. Watch Earth’s tilt shape every sunrise.</p></section>
          <EarthScene />
          <DaylightChart />
        </div>
        <div className={mobileControls ? 'controls-column mobile-open' : 'controls-column'}><ControlPanel onOpenDiscoveries={() => setDiscoveriesOpen(true)} /></div>
      </main>
      <DiscoveryDrawer open={discoveriesOpen} onClose={() => setDiscoveriesOpen(false)} />
      {aboutOpen && <div className="drawer-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setAboutOpen(false) }}><section className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title"><button className="icon-button" onClick={() => setAboutOpen(false)}><X /></button><span className="eyebrow">BEHIND THE MODEL</span><h2 id="about-title">Tilt changes the light</h2><p>Earth spins once each day while travelling around the Sun. Its axis leans by 23.44° and keeps pointing in nearly the same direction in space. That means each hemisphere spends part of the year leaning into more direct sunlight—and part leaning away.</p><div className="about-grid"><article><strong>Latitude</strong><p>Near the equator, each rotation is split almost evenly between light and dark. Near the poles, tilt can keep a place entirely in light or darkness.</p></article><article><strong>Equinoxes</strong><p>In March and September neither hemisphere leans toward the Sun, so day and night are nearly balanced worldwide.</p></article><article><strong>What is simplified?</strong><p>Sizes, distances, and orbit shape are compressed for teaching. Daylight uses a standard apparent-sunrise equation, not local mountains or weather.</p></article><article><strong>Images</strong><p>Earth textures use NASA Blue Marble and Black Marble imagery. This project is not endorsed by NASA.</p></article></div><button className="primary wide" onClick={() => setAboutOpen(false)}>Back to the lab</button></section></div>}
    </div>
  )
}

