import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Post, PostComment } from "./types";
import UserAvatar from "./UserAvatar";
import HashtagText, { extractHashtags } from "./HashtagText";
import { useModalScrollLock } from "./lib/useModalScrollLock";

type PostDetailModalProps = {
  post: Post;
  language?: "en" | "ru";
  currentUsername?: string;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, text: string) => void;
  onEditComment?: (postId: string, commentIndex: number, newText: string) => void;
  onDeleteComment?: (postId: string, commentIndex: number) => void;
};

/**
 * Format relative and full time for posts
 */
function formatPostTime(dateString?: string, language: "en" | "ru" = "ru") {
  if (!dateString) return { relative: "", full: "" };

  const postDate = new Date(dateString);
  if (isNaN(postDate.getTime())) {
    return { relative: dateString, full: dateString };
  }

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  let relative = "";
  if (diffSec < 60) {
    relative = language === "ru" ? "только что" : "just now";
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    relative = language === "ru" ? `${mins} мин. назад` : `${mins}m ago`;
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    relative = language === "ru" ? `${hours} ч. назад` : `${hours}h ago`;
  } else if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    relative = language === "ru" ? `${days} дн. назад` : `${days}d ago`;
  } else {
    relative = postDate.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
    });
  }

  const full = postDate.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return { relative, full };
}

export default function PostDetailModal({
  post,
  language = "ru",
  currentUsername = "",
  onClose,
  onLike,
  onComment,
  onEditComment,
  onDeleteComment,
}: PostDetailModalProps) {
  useModalScrollLock();

  const [newComment, setNewComment] = useState("");
  const [copied, setCopied] = useState(false);
  const [commentsList, setCommentsList] = useState<(string | PostComment)[]>(
    post.comments || []
  );
  const [editingCommentIdx, setEditingCommentIdx] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [activeMenuCommentIdx, setActiveMenuCommentIdx] = useState<number | null>(null);

  useEffect(() => {
    setCommentsList(post.comments || []);
  }, [post.comments]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuCommentIdx(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const authorName = post.authorUsername || "traveller";
  const { relative: relativeTime, full: fullTime } = formatPostTime(
    post.createdAt || post.date,
    language
  );

  const isLiked =
    currentUsername &&
    post.likes?.some((u) => u.toLowerCase() === currentUsername.toLowerCase());

  const extractedTags = extractHashtags(`${post.title} ${post.description}`);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !onComment) return;
    const commentText = newComment.trim();
    onComment(post.id, commentText);
    const tempObj: PostComment = {
      id: `${Date.now()}`,
      authorUsername: currentUsername || "traveller",
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    setCommentsList((prev) => [...prev, tempObj]);
    setNewComment("");
  };

  const handleStartEditComment = (idx: number, currentText: string) => {
    setEditingCommentIdx(idx);
    setEditingCommentText(currentText);
    setActiveMenuCommentIdx(null);
  };

  const handleSaveEditComment = (idx: number) => {
    const trimmed = editingCommentText.trim();
    if (!trimmed) return;
    const updated = commentsList.map((c, i) => {
      if (i !== idx) return c;
      if (typeof c === "object" && c !== null) {
        return {
          ...c,
          text: trimmed,
          isEdited: true,
        };
      }
      return {
        id: `${Date.now()}`,
        authorUsername: currentUsername || "traveller",
        text: trimmed,
        createdAt: new Date().toISOString(),
        isEdited: true,
      };
    });
    setCommentsList(updated);
    setEditingCommentIdx(null);
    onEditComment?.(post.id, idx, trimmed);
  };

  const handleDeleteComment = (idx: number) => {
    const updated = commentsList.filter((_, i) => i !== idx);
    setCommentsList(updated);
    setActiveMenuCommentIdx(null);
    onDeleteComment?.(post.id, idx);
  };

  const handleShare = () => {
    try {
      const shareUrl = `${window.location.origin}/posts#post-${post.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="post-detail-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="post-detail-modal" role="dialog" aria-modal="true">
        {/* Close Button */}
        <button
          className="post-detail-close-btn"
          onClick={onClose}
          type="button"
          aria-label={language === "ru" ? "Закрыть" : "Close"}
        >
          ✕
        </button>

        <div className="post-detail-grid">
          {/* Left Column: Image */}
          <div className="post-detail-media-container">
            {post.image ? (
              <img
                src={post.image}
                alt={post.title}
                className="post-detail-image"
              />
            ) : (
              <div className="post-detail-no-image">
                <span>📷</span>
              </div>
            )}
          </div>

          {/* Right Column: Information, Author, Comments */}
          <div className="post-detail-info-panel">
            {/* Header: Author & Time */}
            <div className="post-detail-author-header">
              <Link
                to={`/profile/${authorName}`}
                onClick={onClose}
                className="post-detail-author-link"
              >
                <UserAvatar
                  avatar={post.authorAvatar}
                  username={authorName}
                  size={46}
                  className="post-detail-avatar"
                />
                <div className="post-detail-author-meta">
                  <strong className="post-detail-author-name">
                    @{authorName}
                  </strong>
                  {post.location && (
                    <span className="post-detail-location">
                      📍 {post.location}
                    </span>
                  )}
                </div>
              </Link>

              {/* Publication Time badge */}
              <div
                className="post-detail-time-badge"
                title={`${language === "ru" ? "Опубликовано:" : "Published:"} ${fullTime}`}
              >
                <span className="time-icon">🕒</span>
                <span className="time-relative">{relativeTime}</span>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="post-detail-body-scroll">
              <div className="post-detail-title-block">
                <h2 className="post-detail-title">
                  <HashtagText text={post.title} />
                </h2>
                <div className="post-detail-full-date">{fullTime}</div>
              </div>

              {post.description && (
                <div className="post-detail-desc">
                  <p>
                    <HashtagText text={post.description} />
                  </p>
                </div>
              )}

              {/* Hashtag Pills */}
              {extractedTags.length > 0 && (
                <div className="post-detail-tags-row">
                  {extractedTags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/tags/${encodeURIComponent(tag)}`}
                      onClick={onClose}
                      className="hashtag-pill-item"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Comments Section */}
              <div className="post-detail-comments-section">
                <h4 className="post-detail-comments-title">
                  💬 {language === "ru" ? "Комментарии" : "Comments"} (
                  {commentsList.length})
                </h4>

                {commentsList.length > 0 ? (
                  <div className="post-detail-comments-list">
                    {commentsList.map((c, i) => {
                      const isObj = typeof c === "object" && c !== null;
                      const commentAuthor = isObj
                        ? (c as PostComment).authorUsername
                        : "traveller";
                      const commentText = isObj ? (c as PostComment).text : String(c);
                      const isEdited = isObj ? Boolean((c as PostComment).isEdited) : false;
                      const commentTime = isObj
                        ? formatPostTime((c as PostComment).createdAt, language)
                            .relative
                        : "";
                      const isEditing = editingCommentIdx === i;

                      const isCommentAuthor =
                        Boolean(currentUsername) &&
                        Boolean(commentAuthor) &&
                        commentAuthor.toLowerCase() === currentUsername.toLowerCase();
                      const isPostOwner =
                        Boolean(currentUsername) &&
                        Boolean(post.authorUsername) &&
                        post.authorUsername?.toLowerCase() === currentUsername.toLowerCase();

                      const canEdit = isCommentAuthor;
                      const canDelete = isCommentAuthor || isPostOwner;
                      const hasActions = canEdit || canDelete;

                      return (
                        <div className="post-detail-comment-item" key={i}>
                          <Link
                            to={`/profile/${commentAuthor}`}
                            onClick={onClose}
                            className="comment-author-avatar-link"
                          >
                            <UserAvatar
                              avatar={isObj ? (c as PostComment).authorAvatar : undefined}
                              username={commentAuthor}
                              size={28}
                              className="comment-avatar"
                            />
                          </Link>
                          <div className={`comment-bubble ${isEditing ? "is-editing" : ""}`}>
                            <div className="comment-bubble-header">
                              <div className="comment-header-left">
                                <Link
                                  to={`/profile/${commentAuthor}`}
                                  onClick={onClose}
                                  className="comment-author-name"
                                >
                                  @{commentAuthor}
                                </Link>
                                {commentTime && (
                                  <span className="comment-time">
                                    {commentTime}
                                  </span>
                                )}
                                {isEdited && (
                                  <span className="comment-edited-badge">
                                    {language === "ru" ? "ред." : "edited"}
                                  </span>
                                )}
                              </div>

                              {/* 3-dots action selector */}
                              {hasActions && !isEditing && (
                                <div className="comment-actions-wrap">
                                  <button
                                    type="button"
                                    className="comment-action-trigger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuCommentIdx(
                                        activeMenuCommentIdx === i ? null : i
                                      );
                                    }}
                                    title={language === "ru" ? "Действия" : "Actions"}
                                    aria-label="Comment options"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                      <circle cx="12" cy="5" r="2.2" />
                                      <circle cx="12" cy="12" r="2.2" />
                                      <circle cx="12" cy="19" r="2.2" />
                                    </svg>
                                  </button>

                                  {activeMenuCommentIdx === i && (
                                    <div
                                      className="comment-action-dropdown"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {canEdit && (
                                        <button
                                          type="button"
                                          className="comment-action-item"
                                          onClick={() => handleStartEditComment(i, commentText)}
                                        >
                                          <span className="action-icon">✏️</span>
                                          <span>{language === "ru" ? "Редактировать" : "Edit"}</span>
                                        </button>
                                      )}
                                      {canDelete && (
                                        <button
                                          type="button"
                                          className="comment-action-item delete"
                                          onClick={() => handleDeleteComment(i)}
                                        >
                                          <span className="action-icon">🗑️</span>
                                          <span>{language === "ru" ? "Удалить" : "Delete"}</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="comment-inline-edit-box">
                                <input
                                  type="text"
                                  className="comment-inline-edit-input"
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSaveEditComment(i);
                                    } else if (e.key === "Escape") {
                                      setEditingCommentIdx(null);
                                    }
                                  }}
                                  autoFocus
                                />
                                <div className="comment-inline-edit-actions">
                                  <button
                                    type="button"
                                    className="comment-edit-btn save"
                                    onClick={() => handleSaveEditComment(i)}
                                  >
                                    ✓ {language === "ru" ? "Сохранить" : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    className="comment-edit-btn cancel"
                                    onClick={() => setEditingCommentIdx(null)}
                                  >
                                    ✕ {language === "ru" ? "Отмена" : "Cancel"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="comment-text">
                                <HashtagText text={commentText} />
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-comments-msg">
                    {language === "ru"
                      ? "Пока нет комментариев. Напишите первым!"
                      : "No comments yet. Be the first to comment!"}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="post-detail-actions-footer">
              <div className="post-detail-interactive-bar">
                {onLike && (
                  <button
                    type="button"
                    className={`detail-like-btn ${isLiked ? "liked" : ""}`}
                    onClick={() => onLike(post.id)}
                  >
                    <span className="heart-icon">{isLiked ? "❤️" : "🤍"}</span>
                    <span>{post.likes?.length || 0}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="detail-share-btn"
                  onClick={handleShare}
                  title={language === "ru" ? "Скопировать ссылку" : "Copy link"}
                >
                  🔗 {copied ? (language === "ru" ? "Скопировано!" : "Copied!") : (language === "ru" ? "Поделиться" : "Share")}
                </button>
              </div>

              {/* Add Comment Input */}
              {onComment && post.allowComments !== false && (
                <form
                  onSubmit={handleSendComment}
                  className="post-detail-comment-form"
                >
                  <input
                    type="text"
                    placeholder={
                      language === "ru"
                        ? "Добавьте комментарий..."
                        : "Add a comment..."
                    }
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="detail-comment-input"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="button button-coral button-small detail-comment-submit"
                  >
                    {language === "ru" ? "Отправить" : "Post"} ↗
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
