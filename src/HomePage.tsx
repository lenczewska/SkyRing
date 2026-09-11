import type { User } from "firebase/auth";
import GlobeView from "./GlobeView";

type Copy = {
  eyebrow: string;
  titleFirst: string;
  titleSecond: string;
  description: string;
  start: string;
  discover: string;
  idea: string;
  introFirst: string;
  introSecond: string;
  introLast: string;
  introText: string;
  orbitFirst: string;
  orbitSecond: string;
  journey: string;
  featureHeading: string;
  features: readonly (readonly [string, string, string])[];
  closingEyebrow: string;
  closingFirst: string;
  closingSecond: string;
  createSkyRing: string;
};

type HomePageProps = {
  copy: Copy;
  language: "en" | "ru";
  user: User | null;
  username?: string;
  onRequestAuth: () => void;
  onRegister: () => void;
  onOpenMap?: () => void;
};

export default function HomePage({
  copy,
  language,
  user,
  username = "",
  onRequestAuth,
  onRegister,
  onOpenMap,
}: HomePageProps) {
  if (user) {
    const greeting =
      language === "ru"
        ? `Привет, ${username || "путешественник"}.`
        : `Hello, ${username || "traveller"}.`;
    const title =
      language === "ru"
        ? "Твой дневник путешествий начинается здесь."
        : "Your travel diary starts here.";
    const description =
      language === "ru"
        ? "Отмечай места, сохраняй впечатления и возвращайся к историям, которые хочется прожить снова."
        : "Mark places, save impressions, and return to the stories you want to live again.";
    const note =
      language === "ru"
        ? "Следующий пункт назначения уже ждёт."
        : "Your next destination is waiting.";
    return (
      <>
        <section className="member-welcome container">
          <p className="eyebrow">
            <span /> {language === "ru" ? "СНОВА В ПУТИ" : "BACK ON THE ROAD"}
          </p>
          <h2 className="text-[60px]">
            {greeting}
            <br />
            <em>{title}</em>
          </h2>
          <p className="hero-description">{description}</p>
          <div className="member-welcome-actions">
            <button
              className="button button-coral nav-button"
              onClick={onOpenMap ?? onRegister}
              type="button"
            >
              {language === "ru"
                ? "Добавить первое место"
                : "Add your first place"}{" "}
              ↗
            </button>
            <span>{note}</span>
          </div>
        </section>
        <section className="member-feed container">
          <div>
            <p className="section-label">
              {language === "ru" ? "ОБНОВЛЕНИЯ ДРУЗЕЙ" : "FRIENDS UPDATES"}
            </p>
            <h2>
              {language === "ru"
                ? "Истории людей, которые тоже в пути."
                : "Stories from people who are on the road too."}
            </h2>
          </div>
          <p>
            {language === "ru"
              ? "Добавляй друзей по имени пользователя, чтобы видеть их новые места и впечатления здесь."
              : "Add friends by username to see their new places and impressions here."}
          </p>
        </section>
      </>
    );
  }
  return (
    <>
      <section className="hero container" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> {copy.eyebrow}
          </p>
          <h1>
            {copy.titleFirst}
            <br />
            <em>{copy.titleSecond}</em>
          </h1>
          <p className="hero-description">{copy.description}</p>
          <div className="hero-actions">
            <button
              className="button button-coral nav-button"
              onClick={onRegister}
              type="button"
            >
              {copy.start} <span aria-hidden="true">↗</span>
            </button>
            <a className="text-link" href="#how-it-works">
              {copy.discover} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <GlobeView
          language={language}
          user={user}
          onRequestAuth={onRequestAuth}
        />
      </section>
      <section className="intro-band" id="how-it-works">
        <div className="container intro-grid">
          <p className="section-label">{copy.idea}</p>
          <div>
            <h2>
              {copy.introFirst}
              <br />
              <em>{copy.introSecond}</em>
              {copy.introLast}
            </h2>
            <p className="intro-text">{copy.introText}</p>
          </div>
          <div className="orbit-note">
            <span className="orbit-icon">◎</span>
            <span>
              {copy.orbitFirst}
              <br />
              {copy.orbitSecond}
            </span>
          </div>
        </div>
      </section>
      <section className="features-section container" id="inspiration">
        <div className="section-heading">
          <p className="section-label">{copy.journey}</p>
          <h2>{copy.featureHeading}</h2>
        </div>
        <div className="feature-grid">
          {copy.features.map((feature, index) => (
            <article className={`feature-card ${feature[2]}`} key={feature[0]}>
              <div className="feature-top">
                <span className="feature-number">0{index + 1}</span>
                <span className="feature-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div>
                <h3>{feature[0]}</h3>
                <p>{feature[1]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="closing container" id="create">
        <div className="closing-star" aria-hidden="true">
          ✳
        </div>
        <p className="eyebrow">
          <span /> {copy.closingEyebrow}
        </p>
        <h2>
          {copy.closingFirst}
          <br />
          <em>{copy.closingSecond}</em>
        </h2>
        <button
          className="button button-dark nav-button"
          onClick={onRegister}
          type="button"
        >
          {copy.createSkyRing} <span aria-hidden="true">↗</span>
        </button>
      </section>
    </>
  );
}
