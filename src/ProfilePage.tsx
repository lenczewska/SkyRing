import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import MapView from "./MapView";
import type { Post } from "./PostsPage";
import { db } from "./firebase";

type ProfilePageProps = {
  user: User;
  username: string;
  language: "en" | "ru";
  onNavigate: (page: "map" | "posts") => void;
};

export default function ProfilePage({
  user,
  username,
  language,
  onNavigate,
}: ProfilePageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const copy =
    language === "ru"
      ? {
          diary: "Дневник путешествий",
          description:
            "Личное пространство для мест, воспоминаний и историй с дороги.",
          places: "мест",
          journeying: "путешествий в 2026",
          note: "Здесь можно только посмотреть карту и публикации пользователя.",
          map: "Карта путешествий",
          posts: "Посты",
          shared: "ПОСТЫ ПОЛЬЗОВАТЕЛЯ",
          empty: "Пока нет опубликованных постов.",
          comments: "Комментариев",
          journeys: "путешествий в",
        }
      : {
          diary: "Travel diary",
          description:
            "A personal space for places, memories, and stories from the road.",
          places: "places",
          journeying: "journeying in 2026",
          note: "This page is view-only. Edit the map or posts in their dedicated sections.",
          map: "Travel map",
          posts: "Posts",
          shared: "USER POSTS",
          empty: "No published posts yet.",
          comments: "Comments",
          journeys: "journeys in",
        };

  useEffect(() => {
    getDoc(doc(db, "users", user.uid))
      .then((snapshot) =>
        setPosts((snapshot.data()?.posts as Post[] | undefined) ?? []),
      )
      .catch(() => setPosts([]));
  }, [user.uid]);

  return (
    <section className="profile-page container">
      <div className="profile-header">
        <div className="profile-avatar">
          {(username || "S").charAt(0).toUpperCase()}
        </div>
        <div className="profile-heading">
          <p className="eyebrow">
            <span /> {copy.diary}
          </p>
          <h1>@{username || "traveller"}</h1>
          <p>{copy.description}</p>
          <div className="profile-stats">
            <span>
              <strong>{posts.length}</strong> {copy.posts.toLowerCase()}
            </span>
            <span>
              <strong>
                {posts.filter((post) => post.date.startsWith("2026")).length}
              </strong>{" "}
              {copy.journeys} 2026
            </span>
          </div>
        </div>
      </div>
      <div className="profile-divider">
        <span>{language === "ru" ? "МОЙ ДНЕВНИК" : "MY DIARY"}</span>
        <span>{copy.note}</span>
      </div>
      <div className="profile-readonly-map">
        <MapView
          mode="profile"
          readOnly
          user={user}
          language={language}
          onRequestAuth={() => undefined}
        />
      </div>
      <section className="profile-shared-posts">
        <p className="section-label">{copy.shared}</p>
        {posts.length === 0 ? (
          <p className="empty-state">{copy.empty}</p>
        ) : (
          <div className="profile-post-grid">
            {posts.map((post) => (
              <article className="profile-post-card" key={post.id}>
                {post.image && (
                  <img src={post.image} alt={post.location || post.title} />
                )}
                <div>
                  <div className="post-card-meta">
                    <span>{post.location}</span>
                    <span>{post.date}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.description}</p>
                  <small>
                    {post.comments.length} {copy.comments.toLowerCase()}
                  </small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="profile-quick-links">
        <button onClick={() => onNavigate("map")} type="button">
          {copy.map} <span>↗</span>
        </button>
        <button onClick={() => onNavigate("posts")} type="button">
          {copy.posts} <span>↗</span>
        </button>
      </div>
    </section>
  );
}
