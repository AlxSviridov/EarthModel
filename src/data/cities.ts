export interface City {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  color: string
  note: string
}

export const cities: City[] = [
  { id: 'london', name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, color: '#7dd3fc', note: 'A northern mid-latitude city with strongly changing seasons.' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, color: '#fb7185', note: 'Its seasons run opposite to London’s.' },
  { id: 'quito', name: 'Quito', country: 'Ecuador', latitude: -0.1807, longitude: -78.4678, color: '#facc15', note: 'Almost on the equator, with nearly 12 hours of daylight year-round.' },
  { id: 'tromso', name: 'Tromsø', country: 'Norway', latitude: 69.6492, longitude: 18.9553, color: '#c4b5fd', note: 'Inside the Arctic Circle: midnight Sun and polar night.' },
  { id: 'capetown', name: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, color: '#34d399', note: 'A southern city at almost the same latitude as Sydney.' },
  { id: 'calgary', name: 'Calgary', country: 'Canada', latitude: 51.0447, longitude: -114.0719, color: '#fb923c', note: 'Nearly London’s latitude but far west in longitude.' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, color: '#2dd4bf', note: 'Very close to the equator.' },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', latitude: 64.1466, longitude: -21.9426, color: '#93c5fd', note: 'Long summer days and very short winter days.' },
  { id: 'newyork', name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, color: '#f472b6', note: 'A familiar northern mid-latitude comparison.' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, color: '#a3e635', note: 'Similar latitude to the Mediterranean, at a different longitude.' },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', latitude: -1.2921, longitude: 36.8219, color: '#fde047', note: 'Just south of the equator.' },
  { id: 'ushuaia', name: 'Ushuaia', country: 'Argentina', latitude: -54.8019, longitude: -68.303, color: '#60a5fa', note: 'A high southern latitude with dramatic seasons.' },
]

export const cityById = (id: string) => cities.find((city) => city.id === id) ?? cities[0]

