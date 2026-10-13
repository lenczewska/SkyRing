import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import type { User } from "firebase/auth";
import type { Post } from "./types";
import { getCommunityPosts } from "./lib/friendsService";
import UserAvatar from "./UserAvatar";
import HashtagText from "./HashtagText";
import PostDetailModal from "./PostDetailModal";

type HashtagPageProps = {
  user: User | null;
  username?: string;
  language?: "en" | "ru";
  onRequestAuth?: () => void;
};

const POPULAR_TAGS = [
  "italy",
  "roma",
  "paris",
  "japan",
  "mountains",
  "sea",
  "adventure",
  "food",
  "hiking",
  "nature",
  "iceland",
];

export default function HashtagPage({
  user,
  username = "",
  language = "ru",
  onRequestAuth,
}: HashtagPageProps) {
  const { tag: routeTag } = useParams<{ tag: string }>();
  const navigate = useNavigate();

  const currentTag = (routeTag || "").toLowerCase().replace(/^#/, "").trim();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "feed">("grid");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const copy =
    language === "ru"
      ? {
          title: `#${currentTag}`,
          subtitle: "Публикации путешественников со всего мира",
          postsCount: (cnt: number) =>
            `${cnt} ${cnt === 1 ? "публикация" : cnt < 5 ? "публикации" : "публикаций"}`,
          grid: "Сетка",
          feed: "Лента",
          backToFeed: "← Вся лента",
          emptyTitle: `Пока нет публикаций с хештегом #${currentTag}`,
          emptyDesc:
            "Будьте первым! Поделитесь впечатлением и добавьте этот хештег в свой пост.",
          createPost: "Создать пост",
          popularHeader: "Популярные хештеги:",
        }
      : {
          title: `#${currentTag}`,
          subtitle: "Travel stories from explorers around the world",
          postsCount: (cnt: number) =>
            `${cnt} ${cnt === 1 ? "post" : "posts"}`,
          grid: "Grid",
          feed: "Feed",
          backToFeed: "← All Feed",
          emptyTitle: `No posts with #${currentTag} yet`,
          emptyDesc:
            "Be the first explorer to share a story with this hashtag!",
          createPost: "Create Post",
          popularHeader: "Trending hashtags:",
        };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const allPosts = await getCommunityPosts(
          user ? { uid: user.uid, username } : null
        );
        if (isMounted) {
          setPosts(allPosts);
        }
      } catch (err) {
        console.warn("Could not load community posts:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user, username]);

  // Filter posts matching this hashtag
  const matchingPosts = useMemo(() => {
    if (!currentTag) return [];

    return posts.filter((p) => {
      const textToSearch = `${p.title} ${p.description} ${p.location}`.toLowerCase();
      // Match #tag or tag in location / title / description
      const hasHashtag = textToSearch.includes(`#${currentTag}`);
      const hasTagWord = new RegExp(`\\b${currentTag}\\b`, "i").test(textToSearch);
      return hasHashtag || hasTagWord;
    });
  }, [posts, currentTag]);

  // Handle Like
  const handleLike = (postId: string) => {
    if (!user) {
      onRequestAuth?.();
      return;
    }
    const currentUName = username || "me";
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likes = p.likes || [];
        const isLiked = likes.some(
          (u) => u.toLowerCase() === currentUName.toLowerCase()
        );
        const nextLikes = isLiked
          ? likes.filter((u) => u.toLowerCase() !== currentUName.toLowerCase())
          : [...likes, currentUName];
        const updated = { ...p, likes: nextLikes };
        if (selectedPost?.id === postId) setSelectedPost(updated);
        return updated;
      })
    );
  };

  // Handle Comment
  const handleComment = (postId: string, text: string) => {
    if (!user) {
      onRequestAuth?.();
      return;
    }
    const commentObj = {
      id: `${Date.now()}`,
      authorId: user.uid,
      authorUsername: username || "traveller",
      text,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextComments = [...(p.comments || []), commentObj];
        const updated = { ...p, comments: nextComments };
        if (selectedPost?.id === postId) setSelectedPost(updated);
        return updated;
      })
    );
  };

  return (
    <section className="hashtag-page container">
      {/* Top Navigation */}
      <div className="hashtag-top-nav">
        <Link to="/posts" className="hashtag-back-link">
          {copy.backToFeed}
        </Link>
      </div>

      {/* Hashtag Header Banner */}
      <header className="hashtag-header">
        <div className="hashtag-icon-circle">#</div>
        <div className="hashtag-header-info">
          <h1>#{currentTag}</h1>
          <p className="hashtag-meta-line">
            <span className="hashtag-post-count">
              {copy.postsCount(matchingPosts.length)}
            </span>
            <span className="hashtag-meta-divider">•</span>
            <span>{copy.subtitle}</span>
          </p>

          {/* Quick Trending Hashtags */}
          <div className="hashtag-trending-chips">
            <span className="trending-label">{copy.popularHeader}</span>
            {POPULAR_TAGS.filter((t) => t !== currentTag).map((tag) => (
              <button
                key={tag}
                type="button"
                className="trending-chip"
                onClick={() => navigate(`/tags/${tag}`)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="hashtag-view-toggle">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title={copy.grid}
          >
            ▦
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === "feed" ? "active" : ""}`}
            onClick={() => setViewMode("feed")}
            title={copy.feed}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="hashtag-loading">
          <p>{language === "ru" ? "Загрузка публикаций..." : "Loading posts..."}</p>
        </div>
      ) : matchingPosts.length > 0 ? (
        viewMode === "grid" ? (
          /* Instagram-Style Grid View */
          <div className="hashtag-posts-grid">
            {matchingPosts.map((post) => (
              <article
                key={post.id}
                className="hashtag-grid-item"
                onClick={() => setSelectedPost(post)}
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="grid-item-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid-item-placeholder">
                    <span>📷</span>
                  </div>
                )}

                {/* Hover overlay with likes, comments, and author */}
                <div className="grid-item-overlay">
                  <div className="grid-overlay-stats">
                    <span>❤️ {post.likes?.length || 0}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                  <div className="grid-overlay-author">
                    @{post.authorUsername || "traveller"}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Feed List View */
          <div className="hashtag-feed-list">
            {matchingPosts.map((post) => {
              const authorName = post.authorUsername || "traveller";
              return (
                <article key={post.id} className="hashtag-feed-card">
                  {post.image && (
                    <div
                      className="feed-card-media"
                      onClick={() => setSelectedPost(post)}
                    >
                      <img src={post.image} alt={post.title} />
                    </div>
                  )}
                  <div className="feed-card-body">
                    <div className="feed-card-author-row">
                      <Link
                        to={`/profile/${authorName}`}
                        className="feed-card-author-link"
                      >
                        <UserAvatar
                          avatar={post.authorAvatar}
                          username={authorName}
                          size={36}
                        />
                        <strong>@{authorName}</strong>
                      </Link>
                      <span className="feed-card-date">
                        {post.date || post.createdAt?.split("T")[0]}
                      </span>
                    </div>

                    <h3
                      className="feed-card-title"
                      onClick={() => setSelectedPost(post)}
                    >
                      <HashtagText text={post.title} />
                    </h3>

                    {post.description && (
                      <p className="feed-card-desc">
                        <HashtagText text={post.description} />
                      </p>
                    )}

                    <div className="feed-card-actions">
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={() => handleLike(post.id)}
                      >
                        ❤️ {post.likes?.length || 0}
                      </button>
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={() => setSelectedPost(post)}
                      >
                        💬 {post.comments?.length || 0}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="hashtag-empty-state">
          <div className="empty-hash-icon">#</div>
          <h3>{copy.emptyTitle}</h3>
          <p>{copy.emptyDesc}</p>
          <button
            type="button"
            className="button button-coral"
            onClick={() => navigate("/posts")}
          >
            {copy.createPost} ↗
          </button>
        </div>
      )}

      {/* Detailed Post Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          language={language}
          currentUsername={username}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          onComment={handleComment}
        />
      )}
    </section>
  );
}
