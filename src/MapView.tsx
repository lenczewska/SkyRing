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
  mode?: 'globe' | 'profile'
}

const world = feature(worldData as never, worldData.objects.countries as never) as never

function countryKey(country: any) {
  return String(country.id ?? country.properties?.name ?? '')
}

export default function MapView({ user, onRequestAuth, mode = 'globe' }: MapViewProps) {
  const [places, setPlaces] = useState<VisitedPlace[]>([])
  const [loading, setLoading] = useState(Boolean(user))
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState(false)
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
        window.localStorage.setItem(resetKey, 'done')
        void setDoc(doc(db, 'users', user.uid), { visitedCountries: [] }, { merge: true })
      } else {
        setPlaces((snapshot.data()?.visitedCountries as VisitedPlace[] | undefined) ?? [])
      }
      setLoading(false)
    }).catch(() => {
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [user])

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

    try {
      await setDoc(doc(db, 'users', user.uid), { visitedCountries: nextPlaces }, { merge: true })
    } catch {
      setPlaces(places)
    }
  }

  const visitedNames = new Set(places.map((place) => place.label))
  const mapWidth = mode === 'profile' ? 960 : 620
  const mapHeight = 500

  useEffect(() => {
    if (mode === 'profile' || dragging) return undefined
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
  }, [mode, dragging])

  const handlePointerDown = () => setDragging(true)
  const handlePointerUp = () => setDragging(false)
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (dragging) setRotation((value) => value + event.movementX * 0.25)
  }

  return (
    <div className={`map-panel ${mode === 'globe' ? 'globe-panel' : 'profile-map-panel'}`}>
      <svg className={mode === 'globe' ? 'globe-map' : 'world-map'} viewBox={`0 0 ${mapWidth} ${mapHeight}`} role="img" aria-label={mode === 'globe' ? 'Rotating interactive globe' : 'Interactive world map'} onPointerDown={mode === 'globe' ? handlePointerDown : undefined} onPointerUp={mode === 'globe' ? handlePointerUp : undefined} onPointerLeave={mode === 'globe' ? handlePointerUp : undefined} onPointerMove={mode === 'globe' ? handlePointerMove : undefined}>
        {mode === 'globe' && <><defs><clipPath id="globe-clip"><circle cx="310" cy="250" r="220" /></clipPath></defs><circle className="globe-ocean" cx="310" cy="250" r="220" /></>}
        <g className="country-shapes" clipPath={mode === 'globe' ? 'url(#globe-clip)' : undefined}>
          {countries.map((country) => <path className={visitedNames.has(country.properties?.name) ? 'country visited' : 'country'} d={pathGenerator(country) ?? undefined} key={countryKey(country)} onClick={mode === 'profile' ? () => addCountry(country) : undefined} onKeyDown={mode === 'profile' ? (event) => { if (event.key === 'Enter') addCountry(country) } : undefined} role={mode === 'profile' ? 'button' : undefined} tabIndex={mode === 'profile' ? 0 : undefined}><title>{country.properties?.name ?? 'Country'}{mode === 'profile' ? user ? ' - click to mark visited' : ' - log in to mark visited' : ''}</title></path>)}
        </g>
        {mode === 'profile' && <g>{places.map((place) => { const point = projection([place.longitude, place.latitude]); return point ? <g className="map-place" key={place.id} transform={`translate(${point[0]}, ${point[1]})`}><circle r="7" /><circle className="map-place-core" r="2.5" /><title>{place.label}</title></g> : null })}</g>}
      </svg>
      {mode === 'profile' && <div className="map-overlay-label"><span className="plane-icon">✈</span><span>{user ? 'Click a country to mark it as visited.' : 'Log in to start marking your journey.'}</span></div>}
      {loading && <span className="map-loading">Loading your map...</span>}
    </div>
  )
}
