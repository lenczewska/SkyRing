import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "firebase/auth";
import GlobeView from "./GlobeView";
import type { Post, UserSummary } from "./types";
import {
  getFollowingPosts,
  getLocalFollowing,
  searchTravelers,
  toggleFollow,
} from "./lib/friendsService";

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
  const navigate = useNavigate();
  const [friendsPosts, setFriendsPosts] = useState<Post[]>([]);
  const [suggestedTravelers, setSuggestedTravelers] = useState<UserSummary[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadData = async () => {
      const posts = await getFollowingPosts({
        uid: user.uid,
        username: username || "traveller",
      });
      if (!active) return;
      setFriendsPosts(posts);

      const travelers = await searchTravelers("", user.uid, username);
      if (!active) return;
      setSuggestedTravelers(travelers.slice(0, 3));

      const followingList = getLocalFollowing(user.uid);
      const fMap: Record<string, boolean> = {};
      followingList.forEach((id) => {
        fMap[id.toLowerCase()] = true;
      });
      setFollowingMap(fMap);
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [user, username]);

  const handleToggleFollow = async (t: UserSummary) => {
    if (!user) return;
    const isNow = !followingMap[t.username.toLowerCase()];
    setFollowingMap((prev) => ({
      ...prev,
      [t.username.toLowerCase()]: isNow,
      [t.uid.toLowerCase()]: isNow,
    }));

    await toggleFollow(
      { uid: user.uid, username: username || "traveller" },
      { uid: t.uid, username: t.username },
    );

    const posts = await getFollowingPosts({
      uid: user.uid,
      username: username || "traveller",
    });
    setFriendsPosts(posts);
  };

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
        <div className="profileView container">
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
              <button
                className="button button-outline nav-button"
                onClick={() => navigate("/profile")}
                type="button"
              >
                {language === "ru" ? "Найти друзей" : "Find friends"} ↗
              </button>
              <span>{note}</span>
            </div>
          </section>
          <section>
            <GlobeView
              language={language}
              user={user}
              onRequestAuth={onRequestAuth}
            />
          </section>
        </div>

        {/* Member Feed / Friends Updates */}
        <section className="member-feed container">
          <div className="member-feed-header">
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
            <Link to="/posts" className="button button-outline view-all-posts-btn">
              {language === "ru" ? "Вся лента постов" : "View all posts"} ↗
            </Link>
          </div>

          {friendsPosts.length > 0 ? (
            <div className="home-friends-grid">
              {friendsPosts.slice(0, 3).map((post) => (
                <article className="home-friend-card" key={post.id}>
                  {post.image && (
                    <div className="home-friend-img-wrap">
                      <img src={post.image} alt={post.title} />
                      <span className="home-friend-loc">📍 {post.location}</span>
                    </div>
                  )}
                  <div className="home-friend-content">
                    <div className="home-friend-author">
                      <Link
                        to={`/profile/${post.authorUsername}`}
                        className="author-avatar-sm"
                      >
                        {post.authorAvatar ||
                          (post.authorUsername || "T").charAt(0).toUpperCase()}
                      </Link>
                      <Link
                        to={`/profile/${post.authorUsername}`}
                        className="author-name-sm"
                      >
                        @{post.authorUsername}
                      </Link>
                      <span className="home-friend-date">{post.date}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.description}</p>
                    <Link
                      to="/posts"
                      className="read-more-link"
                    >
                      {language === "ru" ? "Читать историю" : "Read story"} ↗
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="home-friends-empty">
              <p>
                {language === "ru"
                  ? "Вы пока не подписаны на обновления других путешественников. Подпишитесь на активных исследователей ниже, чтобы видеть их новые маршруты!"
                  : "You are not following any travelers yet. Follow active explorers below to see their new adventures!"}
              </p>

              <div className="home-suggested-row">
                {suggestedTravelers.map((t) => {
                  const isFollowing =
                    followingMap[t.username.toLowerCase()] ?? t.isFollowing;
                  return (
                    <div className="home-suggested-card" key={t.uid}>
                      <Link
                        to={`/profile/${t.username}`}
                        className="suggested-avatar"
                      >
                        {t.avatar || t.username.charAt(0).toUpperCase()}
                      </Link>
                      <div className="suggested-info">
                        <Link
                          to={`/profile/${t.username}`}
                          className="suggested-username"
                        >
                          @{t.username}
                        </Link>
                        {t.location && (
                          <span className="suggested-loc">📍 {t.location}</span>
                        )}
                      </div>
                      <button
                        className={`follow-toggle-button ${isFollowing ? "following" : "follow"}`}
                        onClick={() => void handleToggleFollow(t)}
                        type="button"
                      >
                        {isFollowing
                          ? language === "ru"
                            ? "В подписках"
                            : "Following"
                          : language === "ru"
                            ? "+ Подписаться"
                            : "+ Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="home-find-more">
                <Link to="/profile" className="button button-coral button-small">
                  {language === "ru"
                    ? "Поиск всех путешественников в профиле"
                    : "Find all travelers in profile"}{" "}
                  ↗
                </Link>
              </div>
            </div>
          )}
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
