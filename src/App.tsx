import { useEffect, useState, type FormEvent } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import './index.css'
import { auth } from './firebase'

const translations = {
  en: {
    navHow: 'How it works', navInspiration: 'Inspiration', login: 'Log in', create: 'Create your diary',
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
    navHow: 'Как это работает', navInspiration: 'Вдохновение', login: 'Войти', create: 'Создать дневник',
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

function App() {
  const [language, setLanguage] = useState<'en' | 'ru'>('en')
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const copy = translations[language]

  useEffect(() => onAuthStateChanged(auth, setUser), [])

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
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      setAuthMode(null)
      setPassword('')
    } catch (error) {
      const code = (error as { code?: string }).code
      setAuthError(code === 'auth/invalid-credential' ? 'Email or password is incorrect.' : code === 'auth/email-already-in-use' ? 'This email is already registered.' : code === 'auth/weak-password' ? 'Password must be at least 6 characters.' : 'Something went wrong. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <main className="site-shell">
      <nav className="nav container">
        <a className="brand" href="#top" aria-label="SkyRing home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>SkyRing</span></a>
        <div className="nav-links"><a href="#how-it-works">{copy.navHow}</a><a href="#inspiration">{copy.navInspiration}</a></div>
        <div className="nav-actions">
          <div className="language-switcher" aria-label="Choose language"><button className={language === 'en' ? 'language-active' : ''} onClick={() => setLanguage('en')} type="button">EN</button><span>/</span><button className={language === 'ru' ? 'language-active' : ''} onClick={() => setLanguage('ru')} type="button">RU</button></div>
          {user ? <><span className="user-email" title={user.email ?? ''}>{user.email}</span><button className="login-link nav-button" onClick={() => signOut(auth)} type="button">Log out</button></> : <button className="login-link nav-button" onClick={() => openAuth('login')} type="button">{copy.login}</button>}<button className="button button-dark button-small nav-button" onClick={() => openAuth('register')} type="button">{copy.create} <span aria-hidden="true">↗</span></button>
        </div>
      </nav>

      <section className="hero container" id="top">
        <div className="hero-copy"><p className="eyebrow"><span /> {copy.eyebrow}</p><h1>{copy.titleFirst}<br /><em>{copy.titleSecond}</em></h1><p className="hero-description">{copy.description}</p><div className="hero-actions"><a className="button button-coral" href="#create">{copy.start} <span aria-hidden="true">↗</span></a><a className="text-link" href="#how-it-works">{copy.discover} <span aria-hidden="true">↓</span></a></div></div>
        <div className="hero-art" aria-label="Aerial view of a blue coast" role="img"><div className="sun" /><div className="art-caption"><span>{copy.artFirst}</span><strong>{copy.artSecond}</strong></div><div className="location-pin pin-one">✦ <span>{locations[language][0]}</span></div><div className="location-pin pin-two">✦ <span>{locations[language][1]}</span></div><div className="art-stamp">SKY<br />RING</div></div>
      </section>

      <section className="intro-band" id="how-it-works"><div className="container intro-grid"><p className="section-label">{copy.idea}</p><div><h2>{copy.introFirst}<br /><em>{copy.introSecond}</em>{copy.introLast}</h2><p className="intro-text">{copy.introText}</p></div><div className="orbit-note"><span className="orbit-icon">◎</span><span>{copy.orbitFirst}<br />{copy.orbitSecond}</span></div></div></section>

      <section className="features-section container" id="inspiration"><div className="section-heading"><p className="section-label">{copy.journey}</p><h2>{copy.featureHeading}</h2></div><div className="feature-grid">{copy.features.map((feature, index) => <article className={`feature-card ${feature[2]}`} key={feature[0]}><div className="feature-top"><span className="feature-number">0{index + 1}</span><span className="feature-arrow" aria-hidden="true">↗</span></div><div><h3>{feature[0]}</h3><p>{feature[1]}</p></div></article>)}</div></section>

      <section className="closing container" id="create"><div className="closing-star" aria-hidden="true">✳</div><p className="eyebrow"><span /> {copy.closingEyebrow}</p><h2>{copy.closingFirst}<br /><em>{copy.closingSecond}</em></h2><button className="button button-dark nav-button" onClick={() => openAuth('register')} type="button">{copy.createSkyRing} <span aria-hidden="true">↗</span></button></section>
      <footer className="footer container"><a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>SkyRing</span></a><span>{copy.footer}</span><span>© 2026</span></footer>

      {authMode && <div className="auth-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAuthMode(null)}>
        <form className="auth-modal" onSubmit={handleAuth}>
          <button className="auth-close nav-button" onClick={() => setAuthMode(null)} type="button" aria-label="Close">×</button>
          <p className="eyebrow"><span /> SkyRing account</p>
          <h2>{authMode === 'login' ? 'Welcome back.' : 'Start your diary.'}</h2>
          <p className="auth-subtitle">{authMode === 'login' ? 'Log in to continue your journey.' : 'Create a personal space for every place you love.'}</p>
          <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label><input id="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          <button className="button button-coral auth-submit" disabled={authLoading} type="submit">{authLoading ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'} <span aria-hidden="true">↗</span></button>
          <button className="auth-switch nav-button" onClick={() => { setAuthError(''); setAuthMode(authMode === 'login' ? 'register' : 'login') }} type="button">{authMode === 'login' ? 'Need an account? Create one' : 'Already have an account? Log in'}</button>
        </form>
      </div>}
    </main>
  )
}

export default App
