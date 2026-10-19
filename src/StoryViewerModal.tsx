import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { StoryItem, UserStoryGroup } from "./types";
import UserAvatar from "./UserAvatar";
import { markStorySeen } from "./lib/storiesService";
import { getDirectChatId, sendChatMessage } from "./lib/chatService";

type StoryViewerModalProps = {
  groups: UserStoryGroup[];
  initialGroupIndex: number;
  initialStoryIndex?: number;
  currentUserId?: string | null;
  currentUsername?: string;
  currentUserAvatar?: string;
  language: "en" | "ru";
  onClose: () => void;
  onDeleteStory?: (storyId: string) => void;
  onStoryViewed?: (storyId: string) => void;
};

type FloatingEmoji = {
  id: number;
  emoji: string;
  leftPercent: number;
};

function formatStoryTime(dateString: string, language: "en" | "ru") {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return language === "ru" ? "только что" : "just now";
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return language === "ru" ? `${mins} мин назад` : `${mins}m ago`;
    }
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return language === "ru" ? `${hours} ч назад` : `${hours}h ago`;
    }
    const days = Math.floor(diffSec / 86400);
    return language === "ru" ? `${days} д назад` : `${days}d ago`;
  } catch {
    return "";
  }
}

export default function StoryViewerModal({
  groups,
  initialGroupIndex,
  initialStoryIndex = 0,
  currentUserId,
  currentUsername = "you",
  currentUserAvatar = "",
  language,
  onClose,
  onDeleteStory,
  onStoryViewed,
}: StoryViewerModalProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [replyText, setReplyText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeGroup = groups[groupIndex] || groups[0];
  const activeStory: StoryItem | undefined = activeGroup?.stories[storyIndex];
  const isOwnStory =
    Boolean(currentUserId && activeStory?.authorId === currentUserId) ||
    activeGroup?.userId === "me" ||
    activeGroup?.userId === currentUserId;

  const onStoryViewedRef = useRef(onStoryViewed);
  onStoryViewedRef.current = onStoryViewed;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleNextRef = useRef<() => void>(() => {});

  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);
  const seenReportedRef = useRef<Set<string>>(new Set());

  // Mark story as seen (fires once per story ID)
  useEffect(() => {
    if (activeStory && !seenReportedRef.current.has(activeStory.id)) {
      seenReportedRef.current.add(activeStory.id);
      markStorySeen(activeStory.id);
      onStoryViewedRef.current?.(activeStory.id);
    }
  }, [activeStory?.id]);

  // Navigate to next story or next user, or close if at the end
  const handleNext = useCallback(() => {
    elapsedBeforePauseRef.current = 0;
    setProgress(0);
    if (!activeGroup) return;
    if (storyIndex < activeGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onCloseRef.current();
    }
  }, [activeGroup, storyIndex, groupIndex, groups.length]);

  handleNextRef.current = handleNext;

  // Navigate to previous story or previous user
  const handlePrev = useCallback(() => {
    elapsedBeforePauseRef.current = 0;
    setProgress(0);
    if (!activeGroup) return;
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  }, [activeGroup, storyIndex, groupIndex, groups]);

  // Smooth progress bar runner with requestAnimationFrame
  useEffect(() => {
    if (!activeStory) return;

    if (isPaused) {
      return;
    }

    const duration = activeStory.duration || 5000;
    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    let animId: number;
    let isCancelled = false;

    const tick = () => {
      if (isCancelled) return;
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        elapsedBeforePauseRef.current = 0;
        handleNextRef.current();
      } else {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animId);
    };
  }, [groupIndex, storyIndex, isPaused, activeStory?.id]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Show temporary toast
  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Add floating reaction emoji
  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const leftPercent = 30 + Math.random() * 40; // centered area
    setFloatingEmojis((prev) => [...prev, { id, emoji, leftPercent }]);

    // Remove emoji after animation finishes (1.5s)
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1500);

    showToast(
      language === "ru"
        ? `Реакция ${emoji} отправлена!`
        : `Sent ${emoji} reaction!`,
    );
  };

  // Submit reply message
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;
    const sentText = replyText.trim();
    setReplyText("");

    // Send direct chat message with story snapshot attached
    void sendChatMessage({
      chatId: getDirectChatId(currentUsername || "you", activeGroup.username),
      senderId: currentUserId || "guest",
      senderUsername: currentUsername || "you",
      senderAvatar: currentUserAvatar,
      text: sentText,
      replyToStory: {
        storyId: activeStory.id,
        mediaUrl: activeStory.mediaUrl,
        caption: activeStory.caption,
      },
      otherUser: {
        uid: activeGroup.userId,
        username: activeGroup.username,
        avatar: activeGroup.userAvatar,
      },
    });

    showToast(
      language === "ru"
        ? `Ответ отправлен в чат @${activeGroup.username}`
        : `Reply sent in chat to @${activeGroup.username}`,
    );
  };

  // Delete own story
  const handleDeleteCurrent = () => {
    if (!activeStory) return;
    const confirmed = window.confirm(
      language === "ru"
        ? "Вы уверены, что хотите удалить эту историю?"
        : "Are you sure you want to delete this story?",
    );
    if (!confirmed) return;

    if (onDeleteStory) {
      onDeleteStory(activeStory.id);
    }
    // If there are other stories in group, stay, otherwise go next
    if (activeGroup.stories.length > 1) {
      if (storyIndex >= activeGroup.stories.length - 1) {
        setStoryIndex(Math.max(0, storyIndex - 1));
      }
    } else {
      onClose();
    }
  };

  if (!activeGroup || !activeStory) return null;

  return (
    <div
      className="story-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="story-toast-popup" role="status">
          {toastMessage}
        </div>
      )}

      {/* Desktop Prev Button */}
      {groupIndex > 0 || storyIndex > 0 ? (
        <button
          className="story-desktop-nav-btn story-nav-left"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous story"
          type="button"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      ) : null}

      {/* Story Player Container */}
      <div
        className="story-viewer-card"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => {
          elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
          setIsPaused(true);
        }}
        onMouseUp={() => {
          setIsPaused(false);
        }}
        onTouchStart={() => {
          elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
          setIsPaused(true);
        }}
        onTouchEnd={() => {
          setIsPaused(false);
        }}
      >
        {/* Progress Bars (Segments) */}
        <div className="story-progress-row">
          {activeGroup.stories.map((s, idx) => {
            let fillWidth = "0%";
            if (idx < storyIndex) {
              fillWidth = "100%";
            } else if (idx === storyIndex) {
              fillWidth = `${progress}%`;
            }
            return (
              <div key={s.id} className="story-progress-track">
                <div
                  className="story-progress-bar"
                  style={{ width: fillWidth }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className="story-viewer-header">
          <Link
            to={`/profile/${activeGroup.username}`}
            className="story-header-author"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="story-header-avatar">
              <UserAvatar
                avatar={activeGroup.userAvatar}
                username={activeGroup.username}
                size={38}
              />
            </div>
            <div className="story-header-meta">
              <div className="story-header-name-row">
                <span className="story-header-name">
                  @{activeGroup.username}
                </span>
                <span className="story-header-time">
                  {formatStoryTime(activeStory.createdAt, language)}
                </span>
              </div>
              {activeStory.location && (
                <div className="story-header-location">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{activeStory.location}</span>
                </div>
              )}
            </div>
          </Link>

          <div className="story-header-actions">
            {isPaused && (
              <span className="story-paused-pill">
                {language === "ru" ? "Пауза" : "Paused"}
              </span>
            )}

            {isOwnStory && (
              <button
                className="story-action-icon-btn story-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCurrent();
                }}
                title={language === "ru" ? "Удалить историю" : "Delete story"}
                type="button"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}

            <button
              className="story-action-icon-btn story-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title={language === "ru" ? "Закрыть" : "Close"}
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Story Media */}
        <div className="story-media-container">
          <img
            src={activeStory.mediaUrl}
            alt={activeStory.caption || `@${activeGroup.username}'s story`}
            className="story-media-image"
          />

          {/* Left / Right click zones for tap navigation */}
          <div
            className="story-touch-zone story-touch-left"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="story-touch-zone story-touch-right"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />

          {/* Floating Reaction Emojis Animation */}
          {floatingEmojis.map((item) => (
            <div
              key={item.id}
              className="story-floating-emoji"
              style={{ left: `${item.leftPercent}%` }}
            >
              {item.emoji}
            </div>
          ))}

          {/* Story Caption (Translucent pill / badge at bottom) */}
          {activeStory.caption && (
            <div className="story-caption-overlay">
              <p className="story-caption-text">{activeStory.caption}</p>
            </div>
          )}
        </div>

        {/* Footer Interaction Bar */}
        <div className="story-footer-bar">
          {/* Quick Reaction Emojis */}
          <div className="story-reactions-row">
            {["🔥", "❤️", "✈️", "😍", "👏", "😮"].map((emoji) => (
              <button
                key={emoji}
                className="story-reaction-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerReaction(emoji);
                }}
                type="button"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply input */}
          <form
            className="story-reply-form"
            onSubmit={handleSendReply}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              className="story-reply-input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                language === "ru"
                  ? `Ответить @${activeGroup.username}...`
                  : `Reply to @${activeGroup.username}...`
              }
            />
            {replyText.trim().length > 0 && (
              <button className="story-send-reply-btn" type="submit">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Desktop Next Button */}
      {groupIndex < groups.length - 1 ||
      storyIndex < activeGroup.stories.length - 1 ? (
        <button
          className="story-desktop-nav-btn story-nav-right"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next story"
          type="button"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
