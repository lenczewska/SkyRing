import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

type PostsPageProps = {
  user: User | null;
  language: "en" | "ru";
  onRequestAuth?: () => void;
};
export type Post = {
  id: string;
  image?: string;
  title: string;
  description: string;
  location: string;
  date: string;
  comments: string[];
};

type Copy = {
  eyebrow: string;
  title: string;
  intro: string;
  add: string;
  image: string;
  description: string;
  location: string;
  date: string;
  comment: string;
  commentPlaceholder: string;
  publish: string;
  posts: string;
  empty: string;
  remove: string;
};

export default function PostsPage({
  user,
  language,
  onRequestAuth,
}: PostsPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState<Partial<Post>>({});
  const [newComment, setNewComment] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const copy: Copy =
    language === "ru"
      ? {
          eyebrow: "ПОСТЫ",
          title: "Истории, которые хочется сохранить.",
          intro: "Добавляйте фотографии, впечатления и детали каждой поездки.",
          add: "ДОБАВИТЬ ПОСТ",
          image: "Фотография",
          description: "Описание",
          location: "Местоположение",
          date: "Дата поездки",
          comment: "Комментарий",
          commentPlaceholder: "Добавьте комментарий",
          publish: "Опубликовать пост",
          posts: "ВАШИ ПОСТЫ",
          empty: "Пока нет постов.",
          remove: "Удалить",
        }
      : {
          eyebrow: "POSTS",
          title: "Stories worth keeping.",
          intro: "Add photos, impressions, and the details of every journey.",
          add: "ADD A POST",
          image: "Photo",
          description: "Description",
          location: "Location",
          date: "Trip date",
          comment: "Comment",
          commentPlaceholder: "Add a comment",
          publish: "Publish post",
          posts: "YOUR POSTS",
          empty: "No posts yet.",
          remove: "Remove",
        };

  useEffect(() => {
    if (!user) {
      setPosts([
        {
          id: "preview-amalfi",
          image:
            "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85",
          title:
            language === "ru" ? "Амальфитанское побережье" : "Amalfi Coast",
          description:
            language === "ru"
              ? "Так будут выглядеть ваши впечатления о поездке."
              : "This is where your impressions of a trip will live.",
          location: language === "ru" ? "Италия" : "Italy",
          date: "2026-05-12",
          comments: [],
        },
        {
          id: "preview-kyoto",
          image:
            "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=900&q=85",
          title: "Kyoto",
          description:
            language === "ru"
              ? "Фотографии, описания и воспоминания в одном месте."
              : "Photos, descriptions, and memories in one place.",
          location: language === "ru" ? "Япония" : "Japan",
          date: "2026-04-03",
          comments: [],
        },
        {
          id: "preview-bled",
          image:
            "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",
          title: "Lake Bled",
          description:
            language === "ru"
              ? "Именно так будут выглядеть ваши посты о путешествиях."
              : "This is how your travel posts will look.",
          location: language === "ru" ? "Словения" : "Slovenia",
          date: "2026-03-18",
          comments: [],
        },
      ]);
      return;
    }
    getDoc(doc(db, "users", user.uid))
      .then((snapshot) =>
        setPosts((snapshot.data()?.posts as Post[] | undefined) ?? []),
      )
      .catch(() => setPosts([]));
  }, [user, language]);

  const updateDraft = <K extends keyof Post>(key: K, value: Post[K]) =>
    setDraft({ ...draft, [key]: value });
  const publish = async () => {
    if (!user || !draft.title?.trim()) {
      setPublishError(
        language === "ru"
          ? "Добавьте название поста."
          : "Add a title for your post.",
      );
      return;
    }
    setPublishing(true);
    setPublishError("");
    const post: Post = {
      id: `${Date.now()}`,
      title: draft.title.trim(),
      image: draft.image,
      description: draft.description ?? "",
      location: draft.location ?? "",
      date: draft.date ?? "",
      comments: [],
    };
    const nextPosts = [post, ...posts];
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { posts: nextPosts },
        { merge: true },
      );
      setPosts(nextPosts);
      setDraft({});
    } catch {
      setPublishError(
        language === "ru"
          ? "Не удалось сохранить пост. Проверьте соединение и попробуйте ещё раз."
          : "The post could not be saved. Check your connection and try again.",
      );
    } finally {
      setPublishing(false);
    }
  };
  const addComment = async (post: Post) => {
    if (!newComment.trim()) return;
    const nextPosts = posts.map((item) =>
      item.id === post.id
        ? { ...item, comments: [...item.comments, newComment.trim()] }
        : item,
    );
    setPosts(nextPosts);
    setNewComment("");
    if (user)
      await setDoc(
        doc(db, "users", user.uid),
        { posts: nextPosts },
        { merge: true },
      );
  };
  return (
    <section className="subpage container posts-page">
      <p className="eyebrow">
        <span /> {copy.eyebrow}
      </p>
      <h1>{copy.title}</h1>
      <p className="subpage-intro">{copy.intro}</p>
      {!user && (
        <section className="guest-post-intro">
          <p className="guest-map-kicker">
            {language === "ru"
              ? "ВАШЕ БУДУЩЕЕ ПРОСТРАНСТВО"
              : "YOUR FUTURE SPACE"}
          </p>
          <h2>
            {language === "ru"
              ? "Здесь будут ваши посты о путешествиях."
              : "This is where your travel posts will live."}
          </h2>
          <p>
            {language === "ru"
              ? "Добавляйте фотографии, описания, места, даты и комментарии к своим историям."
              : "Add photos, descriptions, locations, dates, and comments to your stories."}
          </p>
          <button
            className="button button-coral"
            onClick={onRequestAuth}
            type="button"
          >
            {language === "ru"
              ? "Создать свой первый пост"
              : "Create your first post"}{" "}
            ↗
          </button>
        </section>
      )}
      {user && (
        <section className="post-composer">
          <p className="section-label">{copy.add}</p>
          <div className="post-form-grid">
            <label>
              {copy.image}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) updateDraft("image", URL.createObjectURL(file));
                }}
              />
            </label>
            {draft.image && (
              <img
                className="post-image-preview"
                src={draft.image}
                alt={copy.image}
              />
            )}
            <label>
              {copy.description}
              <textarea
                value={draft.description ?? ""}
                onChange={(event) =>
                  updateDraft("description", event.target.value)
                }
                placeholder={
                  language === "ru"
                    ? "Напишите ваше впечатление об этой поездке."
                    : "Write your impression of this trip."
                }
              />
            </label>
            <label>
              {copy.location}
              <input
                value={draft.location ?? ""}
                onChange={(event) =>
                  updateDraft("location", event.target.value)
                }
              />
            </label>
            <label>
              {copy.date}
              <input
                type="date"
                value={draft.date ?? ""}
                onChange={(event) => updateDraft("date", event.target.value)}
              />
            </label>
            <label>
              {language === "ru" ? "Название" : "Title"}
              <input
                value={draft.title ?? ""}
                onChange={(event) => updateDraft("title", event.target.value)}
              />
            </label>
          </div>
          <button
            className="button button-coral"
            onClick={() => void publish()}
            disabled={publishing}
            type="button"
          >
            {publishing
              ? language === "ru"
                ? "Сохраняем..."
                : "Saving..."
              : copy.publish}
          </button>
          {publishError && <p className="auth-error" role="alert">{publishError}</p>}
        </section>
      )}
      <section className="posts-feed">
        <p className="section-label">
          {user
            ? copy.posts
            : language === "ru"
              ? "ПРИМЕРЫ ПОСТОВ"
              : "POST EXAMPLES"}
        </p>
        {posts.map((post) => (
          <article className="post-card" key={post.id}>
            {post.image && (
              <img src={post.image} alt={post.location || post.title} />
            )}
            <div className="post-card-body">
              <div className="post-card-meta">
                <span>{post.location}</span>
                <span>{post.date}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
              {user && (
                <div className="post-comments">
                  <strong>{copy.comment}</strong>
                  {post.comments.map((comment, index) => (
                    <p key={`${post.id}-${index}`}>{comment}</p>
                  ))}
                  <div className="comment-row">
                    <input
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      placeholder={copy.commentPlaceholder}
                    />
                    <button
                      className="nav-button"
                      onClick={() => void addComment(post)}
                      type="button"
                    >
                      ↗
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
