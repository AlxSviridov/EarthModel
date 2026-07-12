import { MapPin, X } from 'lucide-react'
import { cities, cityById } from '../data/cities'
import { useSimulation } from '../store/useSimulation'

export function LabCityPicker({ multi = false }: { multi?: boolean }) {
  const selectedIds = useSimulation((state) => state.selectedCityIds)
  const focusedId = useSimulation((state) => state.focusedCityId)
  const { addCity, focusCity, removeCity } = useSimulation()
  return (
    <div className="lab-city-picker">
      <label><MapPin size={18} /><span>Place</span><select value={focusedId} onChange={(event) => { if (multi) addCity(event.target.value); focusCity(event.target.value) }}>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.country}</option>)}</select></label>
      {multi && <div className="lab-city-chips">{selectedIds.map((id) => { const city = cityById(id); return <button key={id} className={id === focusedId ? 'active' : ''} onClick={() => focusCity(id)} style={{ '--city-color': city.color } as React.CSSProperties}><i />{city.name}{selectedIds.length > 1 && <span role="button" tabIndex={0} aria-label={`Remove ${city.name}`} onClick={(event) => { event.stopPropagation(); removeCity(id) }}><X size={14} /></span>}</button> })}<span>Up to four places</span></div>}
    </div>
  )
}
