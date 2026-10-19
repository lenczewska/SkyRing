import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import MapView, { type VisitedPlace } from './MapView'
import { db } from './firebase'

type TravelMapPageProps = { user: User | null; language: 'en' | 'ru'; onRequestAuth: () => void }
type PlaceDetails = { story?: string; date?: string; transport?: string; airline?: string; photos?: string[] }

type Copy = { eyebrow: string; title: string; intro: string; list: string; empty: string; details: string; story: string; date: string; transport: string; transportPlaceholder: string; photos: string; save: string; saved: string; placeholder: string; choose: string; viewAll: string; showLess: string }

const INITIAL_VISIBLE_COUNT = 3

const TRANSPORT_OPTIONS_RU = [
  'Самолёт',
  'Поезд',
  'Автобус',
  'Автомобиль',
  'Корабль / Паром',
  'Мотоцикл',
  'Велосипед',
  'Пешком',
  'Другое',
]

const TRANSPORT_OPTIONS_EN = [
  'Plane',
  'Train',
  'Bus',
  'Car',
  'Ferry / Ship',
  'Motorcycle',
  'Bicycle',
  'On foot',
  'Other',
]

export default function TravelMapPage({ user, language, onRequestAuth }: TravelMapPageProps) {
  const [places, setPlaces] = useState<VisitedPlace[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, PlaceDetails>>({})
  const [draft, setDraft] = useState<PlaceDetails>({})
  const [saved, setSaved] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const panelRef = useRef<HTMLElement | null>(null)
  const placeListRef = useRef<HTMLDivElement | null>(null)

  const copy: Copy = language === 'ru' ? {
    eyebrow: 'КАРТА ПУТЕШЕСТВ',
    title: 'Места, которые остались с вами.',
    intro: 'Отмечайте города и страны, а затем добавляйте к каждому месту воспоминания.',
    list: 'ОТМЕЧЕННЫЕ МЕСТА',
    empty: 'Пока нет отмеченных городов.',
    details: 'Детали поездки',
    story: 'Ваше впечатление',
    date: 'Дата поездки',
    transport: 'Вид транспорта',
    transportPlaceholder: 'например: поезд, автобус, самолёт...',
    photos: 'Фотографии',
    save: 'Сохранить детали',
    saved: 'Сохранено',
    placeholder: 'Напишите ваше впечатление об этой поездке.',
    choose: 'Выберите город ниже, чтобы добавить детали.',
    viewAll: 'Смотреть все места',
    showLess: 'Свернуть',
  } : {
    eyebrow: 'TRAVEL MAP',
    title: 'Places that stayed with you.',
    intro: 'Mark cities and countries, then add memories to each place.',
    list: 'MARKED PLACES',
    empty: 'No cities marked yet.',
    details: 'Trip details',
    story: 'Your impression',
    date: 'Trip date',
    transport: 'Transport',
    transportPlaceholder: 'e.g. Train, bus, plane...',
    photos: 'Photos',
    save: 'Save details',
    saved: 'Saved',
    placeholder: 'Write your impression of this trip.',
    choose: 'Choose a city below to add details.',
    viewAll: 'View all places',
    showLess: 'Show less',
  }

  const currentTransport = draft.transport ?? draft.airline ?? ''
  const transportOptions = language === 'ru' ? TRANSPORT_OPTIONS_RU : TRANSPORT_OPTIONS_EN

  const handlePlacesChange = useCallback((nextPlaces: VisitedPlace[]) => {
    setPlaces(nextPlaces)
    if (selectedId && !nextPlaces.some((place) => place.id === selectedId)) setSelectedId(null)
  }, [selectedId])

  // Automatically expand if a place selected from map is beyond the initial preview
  useEffect(() => {
    if (selectedId && places.findIndex((p) => p.id === selectedId) >= INITIAL_VISIBLE_COUNT) {
      setIsExpanded(true)
    }
  }, [selectedId, places])

  // Click on empty space / outside to collapse questionnaire
  useEffect(() => {
    if (!selectedId) return

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null
      if (!target) return

      // Don't close if clicked inside the details panel
      if (panelRef.current?.contains(target)) return

      // Don't close if clicked inside the place list (let place list handlers toggle/select)
      if (placeListRef.current?.contains(target)) return

      // Clicked on empty space / outside -> collapse
      setSelectedId(null)
    }

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleOutsideClick)
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [selectedId])

  // Gently scroll panel into view when opened
  useEffect(() => {
    if (selectedId && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedId])

  const visiblePlaces = isExpanded || places.length <= INITIAL_VISIBLE_COUNT
    ? places
    : places.slice(0, INITIAL_VISIBLE_COUNT)

  useEffect(() => {
    if (!user) {
      try {
        const cached = window.localStorage.getItem('skyring-guest-place-details')
        if (cached) setDetails(JSON.parse(cached))
      } catch (e) {
        console.warn(e)
      }
      return
    }
    getDoc(doc(db, 'users', user.uid)).then((snapshot) => setDetails((snapshot.data()?.placeDetails as Record<string, PlaceDetails> | undefined) ?? {})).catch(() => setDetails({}))
  }, [user])

  const selectPlace = (place: VisitedPlace) => {
    if (selectedId === place.id) {
      // Toggle off if clicking the already selected place
      setSelectedId(null)
      return
    }
    setSelectedId(place.id)
    setDraft(details[place.id] ?? {})
    setSaved(false)
  }

  const saveDetails = async () => {
    if (!selectedId) return
    const nextDetails = { ...details, [selectedId]: draft }
    setDetails(nextDetails)
    setSaved(true)
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { placeDetails: nextDetails }, { merge: true })
      } catch (err) {
        console.warn('Could not sync place details:', err)
      }
    } else {
      window.localStorage.setItem('skyring-guest-place-details', JSON.stringify(nextDetails))
    }

    // Collapse questionnaire after saving
    setTimeout(() => {
      setSelectedId(null)
      setSaved(false)
    }, 450)
  }

  const removePlace = async (placeId: string) => {
    const nextPlaces = places.filter((place) => place.id !== placeId)
    setPlaces(nextPlaces)
    if (selectedId === placeId) setSelectedId(null)
    if (!user) {
      window.localStorage.setItem('skyring-guest-places', JSON.stringify(nextPlaces))
    }
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

      {!user ? (
        <div className="guest-map-wrapper">
          <section className="guest-map-intro">
            <p className="guest-map-kicker">
              {language === 'ru' ? 'ТВОЙ ПЕРСОНАЛЬНЫЙ 3D-ГЛОБУС' : 'YOUR PERSONAL 3D GLOBE'}
            </p>
            <h2>
              {language === 'ru'
                ? 'Поделись своими впечатлениями о путешествии со всем миром и найди друзей!'
                : 'Share your travel memories with the world and connect with friends!'}
            </h2>
            <p>
              {language === 'ru'
                ? 'Создай свой личный дневник приключений: отмечай города и страны, сохраняй воспоминания, подписывайся на других путешественников и вдохновляйся уникальными маршрутами со всей планеты.'
                : 'Create your personal adventure diary: mark visited places, save impressions, follow fellow travelers, and discover unforgettable journeys across the globe.'}
            </p>
            <div className="guest-map-cta-row">
              <button className="button button-coral" onClick={onRequestAuth} type="button">
                {language === 'ru' ? 'Создать аккаунт' : 'Create an account'} ↗
              </button>
              <button className="button button-outline" onClick={onRequestAuth} type="button">
                {language === 'ru' ? 'Войти' : 'Log in'}
              </button>
            </div>
          </section>

          <div className="guest-globe-showcase">
            <MapView
              mode="globe"
              readOnly={true}
              user={null}
              language={language}
              onRequestAuth={onRequestAuth}
            />
          </div>
        </div>
      ) : (
        <>
          <MapView
            mode="profile"
            readOnly={false}
            user={user}
            language={language}
            places={places}
            onPlacesChange={handlePlacesChange}
            onRequestAuth={onRequestAuth}
          />

          <section className="marked-places">
            <p className="section-label">{copy.list}</p>
            {places.length === 0 ? (
              <p className="empty-state">{copy.empty}</p>
            ) : (
              <>
                <div ref={placeListRef} className="place-list">
                  {visiblePlaces.map((place) => (
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

                {places.length > INITIAL_VISIBLE_COUNT && (
                  <button
                    type="button"
                    className="view-all-places-btn"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? copy.showLess : copy.viewAll}</span>
                    <span className="count-badge">{places.length}</span>
                    <span className="toggle-arrow" aria-hidden="true">
                      {isExpanded ? '↑' : '↓'}
                    </span>
                  </button>
                )}
              </>
            )}
          </section>

          {selectedPlace && (
            <section ref={panelRef} className="place-detail-panel">
              <div className="place-detail-header-row">
                <p className="section-label">{copy.details}</p>
                <button
                  type="button"
                  className="place-detail-close-btn"
                  onClick={() => setSelectedId(null)}
                  title={language === 'ru' ? 'Свернуть анкету' : 'Collapse form'}
                  aria-label={language === 'ru' ? 'Свернуть анкету' : 'Collapse form'}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
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
                  {copy.transport}
                  <select
                    value={currentTransport}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        transport: event.target.value,
                        airline: event.target.value,
                      })
                    }
                  >
                    <option value="">
                      {language === 'ru' ? 'Выберите вид транспорта...' : 'Choose transport...'}
                    </option>
                    {transportOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {!transportOptions.includes(currentTransport) && currentTransport && (
                      <option value={currentTransport}>{currentTransport}</option>
                    )}
                  </select>
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
            </section>
          )}
        </>
      )}
    </section>
  )
}
