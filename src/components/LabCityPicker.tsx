import { MapPin } from 'lucide-react'
import { cities } from '../data/cities'
import { useSimulation } from '../store/useSimulation'

export function LabCityPicker() {
  const focusedId = useSimulation((state) => state.focusedCityId)
  const focusCity = useSimulation((state) => state.focusCity)
  return (
    <div className="lab-city-picker">
      <label><MapPin size={18} /><span>Place</span><select value={focusedId} onChange={(event) => focusCity(event.target.value)}>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.country}</option>)}</select></label>
    </div>
  )
}
