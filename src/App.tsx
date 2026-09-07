import { useEffect, useState, type FormEvent } from 'react'
import { createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import './index.css'
import { auth, db } from './firebase'

const translations = {
  en: {
    navHow: 'How it works', navInspiration: 'Inspiration', login: 'Log in', accountAction: 'Log in / Sign up', create: 'Create your diary',
    eyebrow: 'Your travel diary, beautifully yours', titleFirst: 'Every journey', titleSecond: 'leaves a mark.',
    description: 'SkyRing is a personal space for the places you have been, the places you dream about, and the stories in between.',
    start: 'Start your diary', discover: 'Discover the idea', artFirst: 'YOUR WORLD,', artSecond: 'IN ONE PLACE', idea: 'THE IDEA',
    introFirst: 'Make a home for', introSecond: 'your way of seeing', introLast: ' the world.',
    introText: 'Not another checklist. A living portrait of your travels. Keep track of the moments that made a place yours, and let your personal map grow with every adventure.',
    orbitFirst: 'Made for curious', orbitSecond: 'people everywhere.', journey: 'YOUR JOURNEY, YOUR STORY', featureHeading: 'Start with a single place.',
    features: [
      ['Mark where you have been', 'Pin countries and cities, add dates, photos, and the small stories you want to keep.', 'feature-coral'],
      ['Plan what comes next', 'Keep a list of future trips so ideas never get lost and your next route is always close.', 'feature-sky'],
      ['Share what you love', 'Build your personal map of memories and show friends the places that stayed with you.', 'feature-gold'],
    ],
    closingEyebrow: 'The first page is yours', closingFirst: 'Where will your story', closingSecond: 'take you next?', createSkyRing: 'Create your SkyRing', footer: 'Keep the places that keep you.',
  },
  ru: {
    navHow: 'Как это работает', navInspiration: 'Вдохновение', login: 'Войти', accountAction: 'Войти / Регистрация', create: 'Создать дневник',
    eyebrow: 'Ваш личный дневник путешествий', titleFirst: 'Каждое путешествие', titleSecond: 'оставляет след.',
    description: 'SkyRing — личное пространство для мест, где вы побывали, куда мечтаете попасть, и историй между ними.',
    start: 'Начать дневник', discover: 'Узнать больше', artFirst: 'ВАШ МИР,', artSecond: 'В ОДНОМ МЕСТЕ', idea: 'ИДЕЯ',
    introFirst: 'Создайте место для', introSecond: 'своего взгляда', introLast: ' на мир.',
    introText: 'Не просто список стран. Живой портрет ваших путешествий. Сохраняйте моменты, которые сделали место особенным, и дополняйте свою карту с каждой поездкой.',
    orbitFirst: 'Для любопытных', orbitSecond: 'людей со всего мира.', journey: 'ВАШ ПУТЬ, ВАША ИСТОРИЯ', featureHeading: 'Начните с одного места.',
    features: [
      ['Отметьте, где вы были', 'Добавляйте страны и города, даты, фотографии и небольшие истории, которые хочется сохранить.', 'feature-coral'],
      ['Планируйте следующий шаг', 'Храните идеи будущих поездок, чтобы они не терялись, а новый маршрут всегда был под рукой.', 'feature-sky'],
      ['Покажите любимое', 'Создайте свою карту воспоминаний и расскажите друзьям о местах, которые остались в сердце.', 'feature-gold'],
    ],
    closingEyebrow: 'Первая страница за вами', closingFirst: 'Куда приведёт вас', closingSecond: 'следующая история?', createSkyRing: 'Создать SkyRing', footer: 'Сохраняйте места, которые остаются с вами.',
  },
} as const

const locations = { en: ['Lisbon', 'Kyoto'], ru: ['Лиссабон', 'Киото'] }

const profilePhotos = [
  { image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85', location: 'Amalfi Coast, Italy', title: 'A slower kind of blue', description: 'A quiet morning along the coast, before the first boats crossed the water.', comments: ['The light here is unreal.', 'Adding this to my list.'] },
  { image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=85', location: 'Dolomites, Italy', title: 'Above the clouds', description: 'Three hours uphill, one perfect view, and a very well-earned coffee.', comments: ['Worth every step.', 'This feels like a film still.'] },
  { image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=900&q=85', location: 'Kyoto, Japan', title: 'Quiet corners', description: 'A small street near Gion found by taking the long way home.', comments: ['The best discoveries are unplanned.'] },
  { image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85', location: 'Lofoten, Norway', title: 'Northbound', description: 'The road kept disappearing into the weather, so we kept driving.', comments: ['What a view.', 'Dream destination.'] },
  { image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=85', location: 'Seychelles', title: 'Saltwater days', description: 'No plans, warm sand, and a book that stayed open on the same page.', comments: ['This is the whole mood.'] },
  { image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85', location: 'Marrakech, Morocco', title: 'Rose-coloured evenings', description: 'The city softened at sunset and every rooftop turned copper.', comments: ['Beautifully captured.'] },
  { image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85', location: 'Lake Bled, Slovenia', title: 'A little lake day', description: 'A borrowed bicycle, a long lunch, and water like glass.', comments: ['Adding Slovenia to my plans.'] },
  { image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85', location: 'Patagonia, Chile', title: 'Edge of the map', description: 'The kind of landscape that makes you forget to check your phone.', comments: ['Incredible scale.'] },
]

function App() {
  const [language, setLanguage] = useState<'en' | 'ru'>('en')
  const [user, setUser] = useState<User | null>(null)
  const [currentUsername, setCurrentUsername] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [view, setView] = useState<'home' | 'profile'>('home')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)
  const copy = translations[language]

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser)
    setCurrentUsername('')

    if (nextUser) {
      const profileSnapshot = await getDoc(doc(db, 'users', nextUser.uid))
      setCurrentUsername(profileSnapshot.data()?.username ?? '')
    }
  }), [])

  const openAuth = (mode: 'login' | 'register') => {
    setAuthError('')
    setAuthMode(mode)
  }

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      if (authMode === 'register') {
        const normalizedUsername = username.trim().toLowerCase()
        if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
          throw new Error('username-format')
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password)
        const usernameRef = doc(db, 'usernames', normalizedUsername)

        try {
          await runTransaction(db, async (transaction) => {
            const usernameSnapshot = await transaction.get(usernameRef)
            if (usernameSnapshot.exists()) {
              throw new Error('username-taken')
            }

            transaction.set(usernameRef, { uid: credential.user.uid, email: credential.user.email, username: normalizedUsername, createdAt: serverTimestamp() })
            transaction.set(doc(db, 'users', credential.user.uid), { uid: credential.user.uid, email: credential.user.email, username: normalizedUsername, createdAt: serverTimestamp() })
          })
        } catch (error) {
          await deleteUser(credential.user)
          throw error
        }
      } else {
        let loginEmail = email.trim()
        if (!loginEmail.includes('@')) {
          const usernameSnapshot = await getDoc(doc(db, 'usernames', loginEmail.toLowerCase()))
          if (!usernameSnapshot.exists()) {
            throw new Error('username-not-found')
          }
          loginEmail = usernameSnapshot.data().email as string
        }
        await signInWithEmailAndPassword(auth, loginEmail, password)
      }
      setAuthMode(null)
      setPassword('')
    } catch (error) {
      const code = (error as { code?: string }).code
      const message = error instanceof Error ? error.message : ''
      setAuthError(message === 'username-format' ? 'Username: 3-20 characters, letters, numbers, and underscores only.' : message === 'username-taken' || message === 'username-not-found' ? 'This username is already taken or does not exist.' : code === 'auth/invalid-credential' ? 'Email/username or password is incorrect.' : code === 'auth/email-already-in-use' ? 'This email is already registered.' : code === 'auth/weak-password' ? 'Password must be at least 6 characters.' : code === 'permission-denied' ? 'Firestore access is denied. Publish firestore.rules in Firebase Console.' : code === 'failed-precondition' ? 'Firestore is not configured for this Firebase project yet.' : 'Something went wrong. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <main className="site-shell">
      <nav className="nav container">
        <button className="brand nav-button" onClick={() => setView('home')} aria-label="SkyRing home" type="button"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>SkyRing</span></button>
        <div className="nav-links"><button className="nav-button nav-link-button" onClick={() => setView('home')} type="button">{copy.navHow}</button><button className="nav-button nav-link-button" onClick={() => setView('home')} type="button">{copy.navInspiration}</button></div>
        <div className="nav-actions">
          <div className="language-switcher" aria-label="Choose language"><button className={language === 'en' ? 'language-active' : ''} onClick={() => setLanguage('en')} type="button">EN</button><span>/</span><button className={language === 'ru' ? 'language-active' : ''} onClick={() => setLanguage('ru')} type="button">RU</button></div>
          {user ? <div className="profile-nav"><button className="button button-dark button-small nav-button user-account-button" onClick={() => setProfileMenuOpen(!profileMenuOpen)} title="Open account menu" type="button">{currentUsername ? `@${currentUsername}` : 'Account'} <span aria-hidden="true">↗</span></button>{profileMenuOpen && <div className="profile-menu"><button className="nav-button" onClick={() => { setView('profile'); setProfileMenuOpen(false) }} type="button">My profile</button><button className="nav-button menu-logout" onClick={() => { signOut(auth); setProfileMenuOpen(false); setView('home') }} type="button">Log out</button></div>}</div> : <button className="button button-dark button-small nav-button" onClick={() => openAuth('login')} type="button">{copy.accountAction} <span aria-hidden="true">↗</span></button>}
        </div>
      </nav>

      {view === 'profile' && user ? <section className="profile-page container">
        <div className="profile-header"><div className="profile-avatar">{(currentUsername || 'S').charAt(0).toUpperCase()}</div><div className="profile-heading"><p className="eyebrow"><span /> Travel diary</p><h1>@{currentUsername || 'traveller'}</h1><p>A collection of places, skies, and stories from the road.</p><div className="profile-stats"><span><strong>{profilePhotos.length}</strong> posts</span><span><strong>12</strong> countries</span><span><strong>2026</strong> journeying</span></div></div><div className="profile-route"><span className="plane-icon">✈</span><span>currently<br />somewhere new</span></div></div>
        <div className="profile-divider"><span>THE ARCHIVE</span><span>{profilePhotos.length} memories</span></div>
        <div className="photo-grid">{profilePhotos.map((photo, index) => <button className="photo-tile" key={photo.title} onClick={() => setSelectedPhoto(index)} type="button"><img src={photo.image} alt={photo.title} /><span className="photo-location">{photo.location}</span></button>)}</div>
      </section> : <>
      <section className="hero container" id="top">
        <div className="hero-copy"><p className="eyebrow"><span /> {copy.eyebrow}</p><h1>{copy.titleFirst}<br /><em>{copy.titleSecond}</em></h1><p className="hero-description">{copy.description}</p><div className="hero-actions"><a className="button button-coral" href="#create">{copy.start} <span aria-hidden="true">↗</span></a><a className="text-link" href="#how-it-works">{copy.discover} <span aria-hidden="true">↓</span></a></div></div>
        <div className="hero-art" aria-label="Aerial view of a blue coast" role="img"><div className="sun" /><div className="art-caption"><span>{copy.artFirst}</span><strong>{copy.artSecond}</strong></div><div className="location-pin pin-one">✦ <span>{locations[language][0]}</span></div><div className="location-pin pin-two">✦ <span>{locations[language][1]}</span></div><div className="art-stamp">SKY<br />RING</div></div>
      </section>

      <section className="intro-band" id="how-it-works"><div className="container intro-grid"><p className="section-label">{copy.idea}</p><div><h2>{copy.introFirst}<br /><em>{copy.introSecond}</em>{copy.introLast}</h2><p className="intro-text">{copy.introText}</p></div><div className="orbit-note"><span className="orbit-icon">◎</span><span>{copy.orbitFirst}<br />{copy.orbitSecond}</span></div></div></section>

      <section className="features-section container" id="inspiration"><div className="section-heading"><p className="section-label">{copy.journey}</p><h2>{copy.featureHeading}</h2></div><div className="feature-grid">{copy.features.map((feature, index) => <article className={`feature-card ${feature[2]}`} key={feature[0]}><div className="feature-top"><span className="feature-number">0{index + 1}</span><span className="feature-arrow" aria-hidden="true">↗</span></div><div><h3>{feature[0]}</h3><p>{feature[1]}</p></div></article>)}</div></section>

      <section className="closing container" id="create"><div className="closing-star" aria-hidden="true">✳</div><p className="eyebrow"><span /> {copy.closingEyebrow}</p><h2>{copy.closingFirst}<br /><em>{copy.closingSecond}</em></h2><button className="button button-dark nav-button" onClick={() => openAuth('register')} type="button">{copy.createSkyRing} <span aria-hidden="true">↗</span></button></section>
      <footer className="footer container"><a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>SkyRing</span></a><span>{copy.footer}</span><span>© 2026</span></footer>
      </>}

      {authMode && <div className="auth-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAuthMode(null)}>
        <form className="auth-modal" onSubmit={handleAuth}>
          <button className="auth-close nav-button" onClick={() => setAuthMode(null)} type="button" aria-label="Close">×</button>
          <p className="eyebrow"><span /> SkyRing account</p>
          <h2>{authMode === 'login' ? 'Welcome back.' : 'Start your diary.'}</h2>
          <p className="auth-subtitle">{authMode === 'login' ? 'Log in to continue your journey.' : 'Create a personal space for every place you love.'}</p>
          {authMode === 'register' && <><label htmlFor="username">Username</label><input id="username" type="text" autoComplete="username" pattern="[A-Za-z0-9_]{3,20}" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="your_name" required /></>}
          <label htmlFor="email">{authMode === 'login' ? 'Email or username' : 'Email'}</label><input id="email" type={authMode === 'login' ? 'text' : 'email'} autoComplete={authMode === 'login' ? 'username' : 'email'} value={email} onChange={(event) => setEmail(event.target.value)}  required />
          <label htmlFor="password">Password</label><input id="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          <button className="button button-coral auth-submit" disabled={authLoading} type="submit">{authLoading ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'} <span aria-hidden="true">↗</span></button>
          <button className="auth-switch nav-button" onClick={() => { setAuthError(''); setAuthMode(authMode === 'login' ? 'register' : 'login') }} type="button">{authMode === 'login' ? 'Need an account? Create one' : 'Already have an account? Log in'}</button>
        </form>
      </div>}
      {selectedPhoto !== null && <div className="photo-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedPhoto(null)}><div className="photo-modal"><button className="photo-close nav-button" onClick={() => setSelectedPhoto(null)} type="button" aria-label="Close">×</button><img src={profilePhotos[selectedPhoto].image} alt={profilePhotos[selectedPhoto].title} /><div className="photo-details"><p className="photo-location-detail">{profilePhotos[selectedPhoto].location}</p><h2>{profilePhotos[selectedPhoto].title}</h2><p>{profilePhotos[selectedPhoto].description}</p><div className="comments"><strong>Comments</strong>{profilePhotos[selectedPhoto].comments.map((comment) => <p key={comment}>“{comment}”</p>)}</div></div></div></div>}
    </main>
  )
}

export default App
