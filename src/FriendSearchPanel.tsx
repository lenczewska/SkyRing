import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { UserSummary } from "./types";
import {
  getLocalFollowing,
  searchTravelers,
  toggleFollow,
} from "./lib/friendsService";

type FriendSearchPanelProps = {
  currentUser: { uid: string; username: string } | null;
  language: "en" | "ru";
  onFollowChange?: () => void;
};

export default function FriendSearchPanel({
  currentUser,
  language,
  onFollowChange,
}: FriendSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [travelers, setTravelers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);

    const timer = setTimeout(() => {
      searchTravelers(query, currentUser?.uid, currentUser?.username).then(
        (results) => {
          if (!active) return;
          setTravelers(results);

          const currentFollowing = getLocalFollowing(currentUser?.uid);
          const fMap: Record<string, boolean> = {};
          currentFollowing.forEach((id) => {
            fMap[id.toLowerCase()] = true;
          });
          setFollowingMap(fMap);

          setLoading(false);
        },
      );
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, currentUser]);

  const handleToggle = async (t: UserSummary) => {
    const isNow = !followingMap[t.username.toLowerCase()];
    setFollowingMap((prev) => ({
      ...prev,
      [t.username.toLowerCase()]: isNow,
      [t.uid.toLowerCase()]: isNow,
    }));

    await toggleFollow(currentUser, {
      uid: t.uid,
      username: t.username,
    });

    onFollowChange?.();
  };

  return (
    <section className="friend-search-section">
      <div className="friend-search-header">
        <div>
          <p className="section-label">
            {language === "ru"
              ? "НАЙТИ ДРУЗЕЙ И ПУТЕШЕСТВЕННИКОВ"
              : "FIND FRIENDS & TRAVELERS"}
          </p>
          <h2>
            {language === "ru"
              ? "Добавляйте людей в подписки и следите за их поездками."
              : "Follow fellow travelers and discover their journeys."}
          </h2>
        </div>
        <Link to="/posts" className="button button-outline friend-feed-btn">
          {language === "ru" ? "Лента подписок" : "Following Feed"} ↗
        </Link>
      </div>

      <div className="friend-search-input-wrap">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            language === "ru"
              ? "Введите логин или город (например: sophie_nomad, marco, alex)..."
              : "Search by username or place (e.g. sophie_nomad, marco, alex)..."
          }
          className="friend-search-input"
        />
        {query && (
          <button
            className="clear-search-btn"
            onClick={() => setQuery("")}
            type="button"
            aria-label={language === "ru" ? "Очистить" : "Clear"}
          >
            ×
          </button>
        )}
      </div>

      <div className="friend-search-subheading">
        <span>
          {query
            ? language === "ru"
              ? `Результаты поиска (${travelers.length})`
              : `Search results (${travelers.length})`
            : language === "ru"
              ? "Рекомендованные путешественники"
              : "Suggested travelers to follow"}
        </span>
      </div>

      {loading ? (
        <div className="friend-search-loading">
          {language === "ru" ? "Ищем путешественников..." : "Finding travelers..."}
        </div>
      ) : travelers.length === 0 ? (
        <p className="empty-state">
          {language === "ru"
            ? "По вашему запросу никого не найдено."
            : "No travelers found matching your search."}
        </p>
      ) : (
        <div className="friend-card-grid">
          {travelers.map((t) => {
            const isFollowing =
              followingMap[t.username.toLowerCase()] ?? t.isFollowing;

            return (
              <div className="friend-card" key={t.uid}>
                <div className="friend-card-head">
                  <Link
                    to={`/profile/${t.username}`}
                    className="friend-card-avatar-link"
                  >
                    <div className="friend-avatar">
                      {t.avatar || t.username.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div className="friend-card-meta">
                    <div className="friend-name-row">
                      <Link
                        to={`/profile/${t.username}`}
                        className="friend-username-link"
                      >
                        <strong>@{t.username}</strong>
                      </Link>
                      {t.isMutual && (
                        <span className="mutual-badge">
                          {language === "ru" ? "Взаимно" : "Mutual"}
                        </span>
                      )}
                    </div>
                    {t.location && (
                      <span className="friend-location">📍 {t.location}</span>
                    )}
                  </div>
                </div>

                {t.bio && <p className="friend-bio">{t.bio}</p>}

                <div className="friend-stats-row">
                  <span>
                    <strong>{t.placesCount}</strong>{" "}
                    {language === "ru" ? "мест" : "places"}
                  </span>
                  <span>
                    <strong>{t.postsCount}</strong>{" "}
                    {language === "ru" ? "постов" : "posts"}
                  </span>
                  <span>
                    <strong>{t.followersCount}</strong>{" "}
                    {language === "ru" ? "подписчиков" : "followers"}
                  </span>
                </div>

                <div className="friend-card-footer">
                  <Link
                    to={`/profile/${t.username}`}
                    className="button button-outline friend-view-btn"
                  >
                    {language === "ru" ? "Дневник" : "Diary"} ↗
                  </Link>
                  <button
                    className={`follow-toggle-button ${isFollowing ? "following" : "follow"}`}
                    onClick={() => void handleToggle(t)}
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
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
