import { useCallback, useState } from 'react'
import type { User } from 'firebase/auth'
import MapView from './MapView'

const photos = [
  ['https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85', 'Amalfi Coast, Italy', 'A slower kind of blue'],
  ['https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=85', 'Dolomites, Italy', 'Above the clouds'],
  ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=900&q=85', 'Kyoto, Japan', 'Quiet corners'],
  ['https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85', 'Lofoten, Norway', 'Northbound'],
  ['https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=85', 'Seychelles', 'Saltwater days'],
  ['https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85', 'Marrakech, Morocco', 'Rose-coloured evenings'],
  ['https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85', 'Lake Bled, Slovenia', 'A little lake day'],
  ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85', 'Patagonia, Chile', 'Edge of the map'],
]

type ProfilePageProps = { user: User; username: string; language: 'en' | 'ru'; onRequestAuth: () => void; selectedPhoto: number | null; onSelectPhoto: (index: number | null) => void }

export default function ProfilePage({ user, username, language, onRequestAuth, selectedPhoto, onSelectPhoto }: ProfilePageProps) {
  const [placeCount, setPlaceCount] = useState(0)
  const handlePlacesChange = useCallback((places: { id: string }[]) => setPlaceCount(places.length), [])
  const selected = selectedPhoto === null ? null : photos[selectedPhoto]
  return <section className="profile-page container"><div className="profile-header"><div className="profile-avatar">{(username || 'S').charAt(0).toUpperCase()}</div><div className="profile-heading"><p className="eyebrow"><span /> Travel diary</p><h1>@{username || 'traveller'}</h1><p>A collection of places, skies, and stories from the road.</p><div className="profile-stats"><span><strong>{photos.length}</strong> posts</span><span><strong>{placeCount}</strong> {language === 'ru' ? 'мест' : 'places'}</span><span><strong>2026</strong> journeying</span></div></div><div className="profile-route"><span className="plane-icon">✈</span><span>currently<br />somewhere new</span></div></div><div className="profile-divider"><span>THE ARCHIVE</span><span>{photos.length} memories</span></div><div className="profile-map-wrap"><p className="section-label">YOUR TRAVEL MAP</p><MapView mode="profile" user={user} language={language} onPlacesChange={handlePlacesChange} onRequestAuth={onRequestAuth} /></div><div className="photo-grid">{photos.map((photo, index) => <button className="photo-tile" key={photo[2]} onClick={() => onSelectPhoto(index)} type="button"><img src={photo[0]} alt={photo[2]} /><span className="photo-location">{photo[1]}</span></button>)}</div>{selected && <div className="photo-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onSelectPhoto(null)}><div className="photo-modal"><button className="photo-close nav-button" onClick={() => onSelectPhoto(null)} type="button" aria-label="Close">×</button><img src={selected[0]} alt={selected[2]} /><div className="photo-details"><p className="photo-location-detail">{selected[1]}</p><h2>{selected[2]}</h2><p>A quiet memory from a journey worth keeping.</p><div className="comments"><strong>Comments</strong><p>“The light here is unreal.”</p><p>“Adding this to my list.”</p></div></div></div></div>}</section>
}
