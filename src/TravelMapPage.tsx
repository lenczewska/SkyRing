import { useCallback, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import MapView, { type VisitedPlace } from './MapView'
import { db } from './firebase'

type TravelMapPageProps = { user: User | null; language: 'en' | 'ru'; onRequestAuth: () => void }
type PlaceDetails = { story?: string; date?: string; airline?: string; photos?: string[] }

type Copy = { eyebrow: string; title: string; intro: string; list: string; empty: string; details: string; story: string; date: string; airline: string; photos: string; save: string; saved: string; placeholder: string; choose: string }

export default function TravelMapPage({ user, language, onRequestAuth }: TravelMapPageProps) {
  const [places, setPlaces] = useState<VisitedPlace[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, PlaceDetails>>({})
  const [draft, setDraft] = useState<PlaceDetails>({})
  const [saved, setSaved] = useState(false)
  const copy: Copy = language === 'ru' ? { eyebrow: 'КАРТА ПУТЕШЕСТВ', title: 'Места, которые остались с вами.', intro: 'Отмечайте города и страны, а затем добавляйте к каждому месту воспоминания.', list: 'ОТМЕЧЕННЫЕ МЕСТА', empty: 'Пока нет отмеченных городов.', details: 'Детали поездки', story: 'Ваше впечатление', date: 'Дата поездки', airline: 'Авиакомпания', photos: 'Фотографии', save: 'Сохранить детали', saved: 'Сохранено', placeholder: 'Напишите ваше впечатление об этой поездке.', choose: 'Выберите город ниже, чтобы добавить детали.' } : { eyebrow: 'TRAVEL MAP', title: 'Places that stayed with you.', intro: 'Mark cities and countries, then add memories to each place.', list: 'MARKED PLACES', empty: 'No cities marked yet.', details: 'Trip details', story: 'Your impression', date: 'Trip date', airline: 'Airline', photos: 'Photos', save: 'Save details', saved: 'Saved', placeholder: 'Write your impression of this trip.', choose: 'Choose a city below to add details.' }

  const handlePlacesChange = useCallback((nextPlaces: VisitedPlace[]) => {
    setPlaces(nextPlaces)
    if (selectedId && !nextPlaces.some((place) => place.id === selectedId)) setSelectedId(null)
  }, [selectedId])

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snapshot) => setDetails((snapshot.data()?.placeDetails as Record<string, PlaceDetails> | undefined) ?? {})).catch(() => setDetails({}))
  }, [user])

  const selectPlace = (place: VisitedPlace) => {
    setSelectedId(place.id)
    setDraft(details[place.id] ?? {})
    setSaved(false)
  }

  const saveDetails = async () => {
    if (!selectedId) return
    const nextDetails = { ...details, [selectedId]: draft }
    setDetails(nextDetails)
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), { placeDetails: nextDetails }, { merge: true })
    setSaved(true)
  }

  const removePlace = async (placeId: string) => {
    const nextPlaces = places.filter((place) => place.id !== placeId)
    setPlaces(nextPlaces)
    if (selectedId === placeId) setSelectedId(null)
    window.localStorage.setItem('skyring-guest-places', JSON.stringify(nextPlaces))
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { visitedCountries: nextPlaces }, { merge: true })
      } catch (err) {
        console.warn('Could not sync removal to firestore:', err)
      }
    }
  }

  const selectedPlace = places.find((place) => place.id === selectedId)

  return (
    <section className="subpage container travel-map-page">
      <p className="eyebrow"><span /> {copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="subpage-intro">{copy.intro}</p>

      {!user && (
        <section className="guest-map-intro">
          <p className="guest-map-kicker">
            {language === 'ru' ? 'ВАША БУДУЩАЯ ИСТОРИЯ' : 'YOUR FUTURE STORY'}
          </p>
          <h2>
            {language === 'ru'
              ? 'Здесь будут отмечены ваши истории путешествий.'
              : 'This is where your travel stories will live.'}
          </h2>
          <p>
            {language === 'ru'
              ? 'Отмечайте города, где вы были, пишите воспоминания и делитесь впечатлениями о каждой поездке и стране.'
              : 'Mark the cities you have visited, write memories, and keep your impressions of every trip and country.'}
          </p>
          <button className="button button-coral" onClick={onRequestAuth} type="button">
            {language === 'ru' ? 'Начать свою историю' : 'Start your story'} ↗
          </button>
        </section>
      )}

      <MapView
        mode="profile"
        readOnly={false}
        user={user}
        language={language}
        places={places}
        onPlacesChange={handlePlacesChange}
        onRequestAuth={onRequestAuth}
      />

      {user && (
        <>
          <section className="marked-places">
            <p className="section-label">{copy.list}</p>
            {places.length === 0 ? (
              <p className="empty-state">{copy.empty}</p>
            ) : (
              <div className="place-list">
                {places.map((place) => (
                  <div
                    className={`place-list-item ${selectedId === place.id ? 'place-list-item-active' : ''}`}
                    key={place.id}
                    onClick={() => selectPlace(place)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectPlace(place)
                      }
                    }}
                  >
                    <span className="place-list-dot" />
                    <span className="place-list-info">
                      <strong>{place.label}</strong>
                      <small>{place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}</small>
                    </span>
                    <div className="place-card-actions">
                      <button
                        className="place-card-delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          void removePlace(place.id)
                        }}
                        type="button"
                        title={language === 'ru' ? 'Удалить место' : 'Remove place'}
                        aria-label={language === 'ru' ? 'Удалить место' : 'Remove place'}
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 10 10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
                        </svg>
                      </button>
                      <span className="place-list-arrow" aria-hidden="true">↗</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="place-detail-panel">
            {selectedPlace ? (
              <>
                <p className="section-label">{copy.details}</p>
                <h2>{selectedPlace.label}</h2>
                <label>
                  {copy.story}
                  <textarea
                    value={draft.story ?? ''}
                    onChange={(event) => setDraft({ ...draft, story: event.target.value })}
                    placeholder={copy.placeholder}
                  />
                </label>
                <div className="detail-grid">
                  <label>
                    {copy.date}
                    <input
                      type="date"
                      value={draft.date ?? ''}
                      onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                    />
                  </label>
                  <label>
                    {copy.airline}
                    <input
                      value={draft.airline ?? ''}
                      onChange={(event) => setDraft({ ...draft, airline: event.target.value })}
                      placeholder="e.g. AZAL"
                    />
                  </label>
                </div>
                <label>
                  {copy.photos}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        photos: Array.from(event.target.files ?? []).map((file) => URL.createObjectURL(file)),
                      })
                    }
                  />
                </label>
                {draft.photos && (
                  <div className="detail-photo-preview">
                    {draft.photos.map((photo) => (
                      <img src={photo} alt={selectedPlace.label} key={photo} />
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="button button-coral" onClick={() => void saveDetails()} type="button">
                    {saved ? copy.saved : copy.save}
                  </button>
                  <button
                    className="button button-outline"
                    onClick={() => void removePlace(selectedPlace.id)}
                    type="button"
                    style={{ borderColor: '#e76f51', color: '#e76f51' }}
                  >
                    {language === 'ru' ? 'Удалить место' : 'Remove place'}
                  </button>
                </div>
              </>
            ) : (
              <p className="empty-state">{copy.choose}</p>
            )}
          </section>
        </>
      )}
    </section>
  )
}
