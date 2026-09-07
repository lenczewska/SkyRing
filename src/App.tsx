import { useState } from 'react'
import './index.css'

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
  const copy = translations[language]

  return (
    <main className="site-shell">
      <nav className="nav container">
        <a className="brand" href="#top" aria-label="SkyRing home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>SkyRing</span></a>
        <div className="nav-links"><a href="#how-it-works">{copy.navHow}</a><a href="#inspiration">{copy.navInspiration}</a></div>
        <div className="nav-actions">
          <div className="language-switcher" aria-label="Choose language"><button className={language === 'en' ? 'language-active' : ''} onClick={() => setLanguage('en')} type="button">EN</button><span>/</span><button className={language === 'ru' ? 'language-active' : ''} onClick={() => setLanguage('ru')} type="button">RU</button></div>
          <a className="login-link" href="#login">{copy.login}</a><a className="button button-dark button-small" href="#create">{copy.create} <span aria-hidden="true">↗</span></a>
        </div>
      </nav>

      <section className="hero container" id="top">
        <div className="hero-copy"><p className="eyebrow"><span /> {copy.eyebrow}</p><h1>{copy.titleFirst}<br /><em>{copy.titleSecond}</em></h1><p className="hero-description">{copy.description}</p><div className="hero-actions"><a className="button button-coral" href="#create">{copy.start} <span aria-hidden="true">↗</span></a><a className="text-link" href="#how-it-works">{copy.discover} <span aria-hidden="true">↓</span></a></div></div>
        <div className="hero-art" aria-label="Aerial view of a blue coast" role="img"><div className="sun" /><div className="art-caption"><span>{copy.artFirst}</span><strong>{copy.artSecond}</strong></div><div className="location-pin pin-one">✦ <span>{locations[language][0]}</span></div><div className="location-pin pin-two">✦ <span>{locations[language][1]}</span></div><div className="art-stamp">SKY<br />RING</div></div>
      </section>

      <section className="intro-band" id="how-it-works"><div className="container intro-grid"><p className="section-label">{copy.idea}</p><div><h2>{copy.introFirst}<br /><em>{copy.introSecond}</em>{copy.introLast}</h2><p className="intro-text">{copy.introText}</p></div><div className="orbit-note"><span className="orbit-icon">◎</span><span>{copy.orbitFirst}<br />{copy.orbitSecond}</span></div></div></section>

      <section className="features-section container" id="inspiration"><div className="section-heading"><p className="section-label">{copy.journey}</p><h2>{copy.featureHeading}</h2></div><div className="feature-grid">{copy.features.map((feature, index) => <article className={`feature-card ${feature[2]}`} key={feature[0]}><div className="feature-top"><span className="feature-number">0{index + 1}</span><span className="feature-arrow" aria-hidden="true">↗</span></div><div><h3>{feature[0]}</h3><p>{feature[1]}</p></div></article>)}</div></section>

      <section className="closing container" id="create"><div className="closing-star" aria-hidden="true">✳</div><p className="eyebrow"><span /> {copy.closingEyebrow}</p><h2>{copy.closingFirst}<br /><em>{copy.closingSecond}</em></h2><a className="button button-dark" href="#login">{copy.createSkyRing} <span aria-hidden="true">↗</span></a></section>
      <footer className="footer container"><a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>SkyRing</span></a><span>{copy.footer}</span><span>© 2026</span></footer>
    </main>
  )
}

export default App
