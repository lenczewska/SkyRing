import { useEffect, useMemo, useState, type PointerEvent } from 'react'
import { geoCentroid, geoNaturalEarth1, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'
import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export type VisitedPlace = {
  id: string
  latitude: number
  longitude: number
  label: string
}

type MapViewProps = {
  user: User | null
  onRequestAuth: () => void
  language?: 'en' | 'ru'
  onPlacesChange?: (places: VisitedPlace[]) => void
  mode?: 'globe' | 'profile'
}

type GeocodeResult = {
  place_id: number
  lat: string
  lon: string
  display_name: string
  type?: string
}

const world = feature(worldData as never, worldData.objects.countries as never) as never

function countryKey(country: any) {
  return String(country.id ?? country.properties?.name ?? '')
}

export default function MapView({ user, onRequestAuth, language = 'en', onPlacesChange, mode = 'globe' }: MapViewProps) {
  const [places, setPlaces] = useState<VisitedPlace[]>([])
  const [loading, setLoading] = useState(Boolean(user))
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const projection = useMemo(() => {
    if (mode === 'profile') return geoNaturalEarth1().fitSize([960, 500], world as any)
    return geoOrthographic().rotate([rotation, 0, 0]).clipAngle(90).fitExtent([[48, 38], [572, 462]], { type: 'Sphere' })
  }, [mode, rotation])
  const pathGenerator = useMemo(() => geoPath(projection), [projection])
  const countries = (world as any).features as any[]

  useEffect(() => {
    let active = true

    if (!user) {
      setPlaces([])
      setLoading(false)
      return () => { active = false }
    }

    setLoading(true)
    getDoc(doc(db, 'users', user.uid)).then((snapshot) => {
      if (!active) return
      const resetKey = `skyring-map-reset-${user.uid}-v1`
      if (!window.localStorage.getItem(resetKey)) {
        setPlaces([])
        onPlacesChange?.([])
        window.localStorage.setItem(resetKey, 'done')
        void setDoc(doc(db, 'users', user.uid), { visitedCountries: [] }, { merge: true })
      } else {
        const savedPlaces = (snapshot.data()?.visitedCountries as VisitedPlace[] | undefined) ?? []
        setPlaces(savedPlaces)
        onPlacesChange?.(savedPlaces)
      }
      setLoading(false)
    }).catch(() => {
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [user, onPlacesChange])

  const addCountry = async (country: any) => {
    if (!user) {
      onRequestAuth()
      return
    }

    const label = country.properties?.name ?? `Country ${countryKey(country)}`
    const existingPlace = places.find((place) => place.label === label)
    const nextPlaces = existingPlace ? places.filter((place) => place.id !== existingPlace.id) : (() => {
      const [longitude, latitude] = geoCentroid(country)
      const place: VisitedPlace = { id: `${countryKey(country)}-${latitude.toFixed(3)}-${longitude.toFixed(3)}`, latitude, longitude, label }
      return [...places, place]
    })()
    setPlaces(nextPlaces)
    onPlacesChange?.(nextPlaces)

    try {
      await setDoc(doc(db, 'users', user.uid), { visitedCountries: nextPlaces }, { merge: true })
    } catch {
      setPlaces(places)
      onPlacesChange?.(places)
    }
  }

  const addPlace = async (result: GeocodeResult) => {
    if (!user) {
      onRequestAuth()
      return
    }

    const label = result.display_name.split(',')[0].trim()
    const place: VisitedPlace = {
      id: `${result.place_id}`,
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      label,
    }
    const nextPlaces = [...places.filter((existingPlace) => existingPlace.id !== place.id), place]
    setPlaces(nextPlaces)
    onPlacesChange?.(nextPlaces)
    setSearchResults([])
    setSearch('')

    try {
      await setDoc(doc(db, 'users', user.uid), { visitedCountries: nextPlaces }, { merge: true })
    } catch {
      setPlaces(places)
      onPlacesChange?.(places)
    }
  }

  const clearPlaces = async () => {
    if (!user) return
    setPlaces([])
    onPlacesChange?.([])
    try {
      await setDoc(doc(db, 'users', user.uid), { visitedCountries: [] }, { merge: true })
    } catch {
      setPlaces(places)
      onPlacesChange?.(places)
    }
  }

  const searchPlaces = async () => {
    const query = search.trim()
    if (!query) return

    setSearching(true)
    setSearchError('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Search failed')
      const results = await response.json() as GeocodeResult[]
      setSearchResults(results)
      if (results.length === 0) setSearchError(language === 'ru' ? 'Ничего не найдено. Попробуйте другой запрос.' : 'Nothing found. Try another spelling.')
    } catch {
      setSearchError(language === 'ru' ? 'Поиск временно недоступен. Попробуйте ещё раз.' : 'Search is unavailable right now. Try again.')
    } finally {
      setSearching(false)
    }
  }

  const visitedNames = new Set(places.map((place) => place.label))
  const mapWidth = mode === 'profile' ? 960 : 620
  const mapHeight = 500

  useEffect(() => {
    if (mode === 'profile' || dragging || hovering) return undefined
    let frame = 0
    let lastFrame = performance.now()
    const animate = (time: number) => {
      if (time - lastFrame >= 33) {
        setRotation((value) => value + 0.38)
        lastFrame = time
      }
      frame = window.requestAnimationFrame(animate)
    }
    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [mode, dragging, hovering])

  const handlePointerDown = () => setDragging(true)
  const handlePointerUp = () => setDragging(false)
  const handlePointerEnter = () => setHovering(true)
  const handlePointerLeave = () => {
    setHovering(false)
    setDragging(false)
  }
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (dragging) setRotation((value) => value + event.movementX * 0.25)
  }

  const map = <div className={`map-panel ${mode === 'globe' ? 'globe-panel' : 'profile-map-panel'}`}>
      <svg className={mode === 'globe' ? 'globe-map' : 'world-map'} viewBox={`0 0 ${mapWidth} ${mapHeight}`} role="img" aria-label={mode === 'globe' ? 'Rotating interactive globe' : 'Interactive world map'} onPointerDown={mode === 'globe' ? handlePointerDown : undefined} onPointerUp={mode === 'globe' ? handlePointerUp : undefined} onPointerMove={mode === 'globe' ? handlePointerMove : undefined}>
        {mode === 'globe' && <defs><clipPath id="globe-clip"><circle cx="310" cy="270" r="270" /></clipPath></defs>}
        <g onPointerEnter={mode === 'globe' ? handlePointerEnter : undefined} onPointerLeave={mode === 'globe' ? handlePointerLeave : undefined}>
          {mode === 'globe' && <circle className="globe-ocean" cx="310" cy="250" r="220" />}
          <g className="country-shapes" clipPath={mode === 'globe' ? 'url(#globe-clip)' : undefined}>
            {countries.map((country) => <path className={visitedNames.has(country.properties?.name) ? 'country visited' : 'country'} d={pathGenerator(country) ?? undefined} key={countryKey(country)} onClick={mode === 'profile' ? () => addCountry(country) : undefined} onKeyDown={mode === 'profile' ? (event) => { if (event.key === 'Enter') addCountry(country) } : undefined} role={mode === 'profile' ? 'button' : undefined} tabIndex={mode === 'profile' ? 0 : undefined}><title>{country.properties?.name ?? 'Country'}{mode === 'profile' ? user ? ' - click to mark visited' : ' - log in to mark visited' : ''}</title></path>)}
          </g>
        </g>
        {mode === 'profile' && <g>{places.map((place) => { const point = projection([place.longitude, place.latitude]); return point ? <g className="map-place" key={place.id} transform={`translate(${point[0]}, ${point[1]})`}><path d="M0 0C-1.2-2.7-7-6.3-7-11A7 7 0 1 1 7-11C7-6.3 1.2-2.7 0 0Z" /><circle className="map-place-core" cy="-11" r="2.6" /><title>{place.label}</title></g> : null })}</g>}
      </svg>
      {mode === 'profile' && <div className="map-overlay-label"><span className="plane-icon">✈</span><span>{user ? 'Click a country to mark it as visited.' : 'Log in to start marking your journey.'}</span></div>}
      {loading && <span className="map-loading">Loading your map...</span>}
    </div>

  if (mode === 'globe') return map

  const copy = language === 'ru' ? { label: 'ДОБАВИТЬ МЕСТО', heading: 'Новая отметка.', description: 'Найдите город или страну и точно добавьте их на карту.', field: 'Город или страна', placeholder: 'Например, Лиссабон или Япония', add: 'Добавить', searching: 'Поиск...', empty: 'Ничего не найдено. Попробуйте другой запрос.', unavailable: 'Поиск временно недоступен. Попробуйте ещё раз.', clear: 'Удалить все отметки', clearLabel: 'Удалить все отметки с карты?' } : { label: 'ADD A PLACE', heading: 'Find your next mark.', description: 'Search for a city or country and place it precisely on your map.', field: 'City or country', placeholder: 'Try Lisbon or Japan', add: 'Add', searching: 'Searching...', empty: 'Nothing found. Try another spelling.', unavailable: 'Search is unavailable right now. Try again.', clear: 'Clear all marks', clearLabel: 'Remove all marks from the map?' }
  return <div className="profile-map-layout"><div className="profile-map-column">{map}</div><aside className="place-search-panel"><p className="section-label">{copy.label}</p><h2>{copy.heading}</h2><p className="place-search-copy">{copy.description}</p><form className="place-search-form" onSubmit={(event) => { event.preventDefault(); void searchPlaces() }}><label htmlFor="place-search">{copy.field}</label><div className="place-search-row"><input id="place-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.placeholder} /><button className="button button-coral button-small" type="submit" disabled={searching}>{searching ? copy.searching : copy.add}</button></div></form>{searchError && <p className="place-search-error">{searchError}</p>}{searchResults.length > 0 && <div className="place-search-results" aria-label={copy.field}>{searchResults.map((result) => <button className="place-search-result" key={result.place_id} onClick={() => void addPlace(result)} type="button"><strong>{result.display_name.split(',')[0]}</strong><span>{result.display_name}</span></button>)}</div>}<button className="clear-places-button" onClick={() => { if (window.confirm(copy.clearLabel)) void clearPlaces() }} type="button">{copy.clear}</button></aside></div>
}
