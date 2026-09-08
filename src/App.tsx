import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import './index.css'
import { auth, db } from './firebase'
import AuthModal from './AuthModal'
import HomePage from './HomePage'
import ProfilePage from './ProfilePage'
import TravelMapPage from './TravelMapPage'
import PostsPage from './PostsPage'
import type { AuthMode, Page } from './types'

const translations = {
  en: { navHow: 'How it works', navInspiration: 'Inspiration', accountAction: 'Log in / Sign up', eyebrow: 'Your travel diary, beautifully yours', titleFirst: 'Every journey', titleSecond: 'leaves a mark.', description: 'SkyRing is a personal space for the places you have been, the places you dream about, and the stories in between.', start: 'Start your diary', discover: 'Discover the idea', idea: 'THE IDEA', introFirst: 'Make a home for', introSecond: 'your way of seeing', introLast: ' the world.', introText: 'Not another checklist. A living portrait of your travels. Keep track of the moments that made a place yours, and let your personal map grow with every adventure.', orbitFirst: 'Made for curious', orbitSecond: 'people everywhere.', journey: 'YOUR JOURNEY, YOUR STORY', featureHeading: 'Start with a single place.', features: [['Mark where you have been', 'Pin countries and cities, add dates, photos, and the small stories you want to keep.', 'feature-coral'], ['Plan what comes next', 'Keep a list of future trips so ideas never get lost and your next route is always close.', 'feature-sky'], ['Share what you love', 'Build your personal map of memories and show friends the places that stayed with you.', 'feature-gold']], closingEyebrow: 'The first page is yours', closingFirst: 'Where will your story', closingSecond: 'take you next?', createSkyRing: 'Create your SkyRing', footer: 'Keep the places that keep you.' },
  ru: { navHow: 'Как это работает', navInspiration: 'Вдохновение', accountAction: 'Войти / Регистрация', eyebrow: 'Ваш личный дневник путешествий', titleFirst: 'Каждое путешествие', titleSecond: 'оставляет след.', description: 'SkyRing — личное пространство для мест, где вы побывали, куда мечтаете попасть, и историй между ними.', start: 'Начать дневник', discover: 'Узнать больше', idea: 'ИДЕЯ', introFirst: 'Создайте место для', introSecond: 'своего взгляда', introLast: ' на мир.', introText: 'Не просто список стран. Живой портрет ваших путешествий. Сохраняйте моменты, которые сделали место особенным, и дополняйте свою карту с каждой поездкой.', orbitFirst: 'Для любопытных', orbitSecond: 'людей со всего мира.', journey: 'ВАШ ПУТЬ, ВАША ИСТОРИЯ', featureHeading: 'Начните с одного места.', features: [['Отметьте, где вы были', 'Добавляйте страны и города, даты, фотографии и небольшие истории, которые хочется сохранить.', 'feature-coral'], ['Планируйте следующий шаг', 'Храните идеи будущих поездок, чтобы они не терялись, а новый маршрут всегда был под рукой.', 'feature-sky'], ['Покажите любимое', 'Создайте свою карту воспоминаний и расскажите друзьям о местах, которые остались в сердце.', 'feature-gold']], closingEyebrow: 'Первая страница за вами', closingFirst: 'Куда приведёт вас', closingSecond: 'следующая история?', createSkyRing: 'Создать SkyRing', footer: 'Сохраняйте места, которые остаются с вами.' },
} as const

function App() {
  const [language, setLanguage] = useState<'en' | 'ru'>(() => window.localStorage.getItem('skyring-language') === 'ru' ? 'ru' : 'en')
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [page, setPage] = useState<Page>('home')
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [profileMenu, setProfileMenu] = useState(false)
  const copy = translations[language]

  const changeLanguage = (nextLanguage: 'en' | 'ru') => {
    setLanguage(nextLanguage)
    window.localStorage.setItem('skyring-language', nextLanguage)
  }

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser)
    setUsername('')
    if (nextUser) setUsername((await getDoc(doc(db, 'users', nextUser.uid))).data()?.username ?? '')
  }), [])

  const openAuth = (mode: AuthMode) => setAuthMode(mode)

  const navigationCopy = language === 'ru' ? { profile: 'Мой профиль', map: 'Карта путешествий', posts: 'Посты', logout: 'Выйти' } : { profile: 'My profile', map: 'Travel map', posts: 'Posts', logout: 'Log out' }
  return <main className="site-shell"><nav className="nav container"><button className="brand nav-button" onClick={() => setPage('home')} aria-label="SkyRing home" type="button"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>SkyRing</span></button><div className="nav-links"><button className="nav-button nav-link-button" onClick={() => setPage('map')} type="button">{navigationCopy.map}</button><button className="nav-button nav-link-button" onClick={() => setPage('posts')} type="button">{navigationCopy.posts}</button></div><div className="nav-actions"><div className="language-switcher" aria-label={language === 'ru' ? 'Выбор языка' : 'Choose language'}><button className={language === 'en' ? 'language-active' : ''} onClick={() => changeLanguage('en')} type="button">EN</button><span>/</span><button className={language === 'ru' ? 'language-active' : ''} onClick={() => changeLanguage('ru')} type="button">RU</button></div>{user ? <div className="profile-nav"><button className="button button-dark button-small nav-button user-account-button" onClick={() => setProfileMenu(!profileMenu)} type="button">@{username || 'account'} <span aria-hidden="true">↗</span></button>{profileMenu && <div className="profile-menu"><button className="nav-button" onClick={() => { setPage('profile'); setProfileMenu(false) }} type="button">{navigationCopy.profile}</button><button className="nav-button menu-logout" onClick={() => { signOut(auth); setPage('home'); setProfileMenu(false) }} type="button">{navigationCopy.logout}</button></div>}</div> : <button className="button button-dark button-small nav-button" onClick={() => openAuth('login')} type="button">{copy.accountAction} <span aria-hidden="true">↗</span></button>}</div></nav>{page === 'home' ? <HomePage copy={copy} language={language} user={user} onRequestAuth={() => openAuth('login')} onRegister={() => openAuth('register')} /> : page === 'profile' && user ? <ProfilePage user={user} username={username} language={language} onNavigate={setPage} /> : page === 'map' && user ? <TravelMapPage user={user} language={language} onRequestAuth={() => openAuth('login')} /> : page === 'posts' && user ? <PostsPage user={user} language={language} /> : null}{authMode && <AuthModal mode={authMode} language={language} onClose={() => setAuthMode(null)} onSwitch={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} />}</main>
}

export default App
