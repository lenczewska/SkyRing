import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ChatConversation, ChatMessage } from "./types";
import UserAvatar from "./UserAvatar";
import {
  getOrCreateChatWithUser,
  getStoredConversations,
  getStoredMessages,
  markConversationAsRead,
  sendChatMessage,
} from "./lib/chatService";
import { CURATED_TRAVELERS } from "./lib/friendsService";
import { useModalScrollLock } from "./lib/useModalScrollLock";

type ChatPageProps = {
  user: User | null;
  username: string;
  userAvatar?: string;
  language: "en" | "ru";
  onRequestAuth?: () => void;
};

// Travel quick prompt chips
const QUICK_PROMPTS = [
  { ru: "Привет! ☕️ Рад знакомству!", en: "Hi! ☕️ Nice to connect!" },
  { ru: "Где находится это место? 🗺️", en: "Where is this place? 🗺️" },
  { ru: "Потрясающие кадры! 📸", en: "Stunning shots! 📸" },
  { ru: "Посоветуй маршрут! ✈️", en: "Any route recommendations? ✈️" },
];

function formatMessageTime(dateString: string) {
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatConvTime(dateString?: string, language: "en" | "ru" = "ru") {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return language === "ru" ? "сейчас" : "now";
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `${mins} ${language === "ru" ? "м" : "m"}`;
    }
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return `${hours} ${language === "ru" ? "ч" : "h"}`;
    }
    return d.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export default function ChatPage({
  user,
  username = "",
  userAvatar = "",
  language,
  onRequestAuth,
}: ChatPageProps) {
  const { targetUsername } = useParams<{ targetUsername?: string }>();
  const navigate = useNavigate();

  const currentProfile = {
    uid: user?.uid || "guest",
    username: username || "you",
    avatar: userAvatar,
  };

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTravelerModal, setShowTravelerModal] = useState(false);

  useModalScrollLock(showTravelerModal);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Prevent whole-page scroll while on the messenger view
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    } else {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "nearest",
      });
    }
  };

  // Refresh conversations list
  const refreshConversations = () => {
    const list = getStoredConversations(currentProfile);
    setConversations(list);
  };

  // Initial load
  useEffect(() => {
    refreshConversations();
  }, [user?.uid, username, userAvatar]);

  // Handle URL param targetUsername (e.g. /chat/sophie_nomad)
  useEffect(() => {
    if (targetUsername) {
      const cleanTarget = targetUsername.toLowerCase().replace(/^@/, "");
      // Check if target is a curated traveler or existing user
      const targetCurated = CURATED_TRAVELERS.find(
        (t) => t.username.toLowerCase() === cleanTarget,
      );
      const targetUser = {
        uid: targetCurated?.uid || `user-${cleanTarget}`,
        username: targetCurated?.username || cleanTarget,
        avatar: targetCurated?.avatar || cleanTarget.charAt(0).toUpperCase(),
        location: targetCurated?.location || "",
      };

      const { chatId } = getOrCreateChatWithUser({
        currentUser: currentProfile,
        targetUser,
      });

      setActiveChatId(chatId);
      refreshConversations();
    } else if (!activeChatId && conversations.length > 0) {
      // Auto-select first chat on desktop if none selected
      if (window.innerWidth > 768) {
        setActiveChatId(conversations[0].id);
      }
    }
  }, [targetUsername, conversations.length]);

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChatId) return;

    markConversationAsRead(activeChatId, currentProfile);
    const msgs = getStoredMessages(activeChatId, currentProfile);
    setMessages(msgs);
    refreshConversations();

    // Auto scroll down without jumping whole page
    setTimeout(() => {
      scrollToBottom(false);
    }, 60);
  }, [activeChatId]);

  // Scroll to bottom on messages update
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, isTyping]);

  const activeConversation = conversations.find((c) => c.id === activeChatId);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConversation || !activeChatId) return;

    setInputText("");

    const sent = await sendChatMessage({
      chatId: activeChatId,
      senderId: currentProfile.uid,
      senderUsername: currentProfile.username,
      senderAvatar: currentProfile.avatar,
      text,
      otherUser: activeConversation.otherUser,
      onReceivedReply: (replyMsg) => {
        setIsTyping(false);
        setMessages((prev) => [...prev, replyMsg]);
        refreshConversations();
      },
    });

    setMessages((prev) => [...prev, sent]);
    refreshConversations();

    // Show simulated typing indicator if talking to a curated traveler
    const otherName = activeConversation.otherUser.username.toLowerCase();
    if (
      otherName === "sophie_nomad" ||
      otherName === "marco_rossi" ||
      otherName === "elena_voyage" ||
      otherName === "alex_explorer"
    ) {
      setIsTyping(true);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(
    (c) =>
      c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Start new conversation from modal
  const handleStartChatWithTraveler = (traveler: (typeof CURATED_TRAVELERS)[0]) => {
    const { chatId } = getOrCreateChatWithUser({
      currentUser: currentProfile,
      targetUser: {
        uid: traveler.uid,
        username: traveler.username,
        avatar: traveler.avatar,
        location: traveler.location,
      },
    });
    setShowTravelerModal(false);
    setActiveChatId(chatId);
    refreshConversations();
    navigate(`/chat/${traveler.username}`);
  };

  const copy =
    language === "ru"
      ? {
          title: "Сообщения",
          searchPlaceholder: "Поиск диалогов...",
          noChats: "Диалогов пока нет",
          startNew: "+ Новый диалог",
          online: "В сети",
          offline: "Не в сети",
          typePlaceholder: "Напишите сообщение путешественнику...",
          send: "Отправить",
          emptyTitle: "Выберите диалог",
          emptySub:
            "Общайтесь с путешественниками со всего мира, делитесь маршрутами и секретными локациями.",
          startChatting: "Начать диалог",
          profile: "В профиль ↗",
          selectTraveler: "Выберите путешественника:",
          typing: "печатает...",
          guestNotice:
            "Вы вошли как гость. Ваши сообщения сохраняются в браузере. Войдите, чтобы сохранить диалоги в аккаунте.",
          loginBtn: "Войти в аккаунт",
        }
      : {
          title: "Messages",
          searchPlaceholder: "Search conversations...",
          noChats: "No conversations yet",
          startNew: "+ New message",
          online: "Online",
          offline: "Offline",
          typePlaceholder: "Write a message to traveler...",
          send: "Send",
          emptyTitle: "Select a conversation",
          emptySub:
            "Connect with travelers around the world, share trip plans and hidden gems.",
          startChatting: "Start chatting",
          profile: "View profile ↗",
          selectTraveler: "Choose a traveler:",
          typing: "is typing...",
          guestNotice:
            "You are browsing as guest. Log in to sync your messages permanently.",
          loginBtn: "Log in",
        };

  return (
    <section className="container chat-page-container">
      {/* Guest Notice Banner if not logged in */}
      {!user && (
        <div className="chat-guest-banner">
          <span>💬 {copy.guestNotice}</span>
          <button
            type="button"
            className="button button-small button-coral"
            onClick={onRequestAuth}
          >
            {copy.loginBtn} ↗
          </button>
        </div>
      )}

      <div className="chat-layout-card">
        {/* ================= LEFT SIDEBAR: CONVERSATIONS LIST ================= */}
        <aside
          className={`chat-sidebar ${activeChatId ? "chat-sidebar-hidden-mobile" : ""}`}
        >
          {/* Sidebar Header */}
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-title-row">
              <h2>{copy.title}</h2>
              <button
                type="button"
                className="chat-new-btn"
                onClick={() => setShowTravelerModal(true)}
                title={copy.startNew}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="chat-search-wrapper">
              <svg
                className="chat-search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="chat-search-input"
                placeholder={copy.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="chat-conv-list">
            {filteredConversations.length === 0 ? (
              <div className="chat-empty-sidebar">
                <p>{copy.noChats}</p>
                <button
                  type="button"
                  className="button button-small button-outline"
                  onClick={() => setShowTravelerModal(true)}
                >
                  {copy.startNew}
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeChatId;
                return (
                  <div
                    key={conv.id}
                    className={`chat-conv-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveChatId(conv.id);
                      navigate(`/chat/${conv.otherUser.username}`);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="chat-conv-avatar-wrap">
                      <UserAvatar
                        avatar={conv.otherUser.avatar}
                        username={conv.otherUser.username}
                        size={46}
                      />
                      {conv.otherUser.isOnline && (
                        <span className="chat-online-dot" />
                      )}
                    </div>

                    <div className="chat-conv-info">
                      <div className="chat-conv-top-line">
                        <span className="chat-conv-name">
                          @{conv.otherUser.username}
                        </span>
                        <span className="chat-conv-time">
                          {formatConvTime(conv.updatedAt, language)}
                        </span>
                      </div>
                      <div className="chat-conv-bottom-line">
                        <p className="chat-conv-snippet">
                          {conv.lastMessage?.text || "Диалог начат"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="chat-unread-badge">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ================= RIGHT AREA: ACTIVE CHAT ================= */}
        <main
          className={`chat-main-window ${!activeChatId ? "chat-main-hidden-mobile" : ""}`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-window-header">
                <div className="chat-header-user-info">
                  {/* Back button for mobile */}
                  <button
                    type="button"
                    className="chat-back-btn-mobile"
                    onClick={() => {
                      setActiveChatId(null);
                      navigate("/chat");
                    }}
                    title="Назад"
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
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <div className="chat-header-avatar-wrap">
                    <UserAvatar
                      avatar={activeConversation.otherUser.avatar}
                      username={activeConversation.otherUser.username}
                      size={42}
                    />
                    {activeConversation.otherUser.isOnline && (
                      <span className="chat-online-dot" />
                    )}
                  </div>

                  <div className="chat-header-names">
                    <span className="chat-header-title">
                      @{activeConversation.otherUser.username}
                    </span>
                    <div className="chat-header-subtitle">
                      {activeConversation.otherUser.isOnline ? (
                        <span className="chat-status-online">
                          ● {copy.online}
                        </span>
                      ) : (
                        <span className="chat-status-offline">
                          {copy.offline}
                        </span>
                      )}
                      {activeConversation.otherUser.location && (
                        <span className="chat-location-pill">
                          📍 {activeConversation.otherUser.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <Link
                    to={`/profile/${activeConversation.otherUser.username}`}
                    className="button button-small button-outline chat-profile-btn"
                  >
                    {copy.profile}
                  </Link>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={messagesContainerRef} className="chat-messages-area">
                {messages.map((msg) => {
                  const isMine =
                    msg.senderUsername === currentProfile.username ||
                    msg.senderId === currentProfile.uid;

                  return (
                    <div
                      key={msg.id}
                      className={`chat-bubble-row ${isMine ? "mine" : "theirs"}`}
                    >
                      {!isMine && (
                        <div className="chat-msg-avatar">
                          <UserAvatar
                            avatar={msg.senderAvatar}
                            username={msg.senderUsername}
                            size={30}
                          />
                        </div>
                      )}

                      <div className="chat-bubble-wrapper">
                        {/* If this was a story reply */}
                        {msg.replyToStory && (
                          <div className="chat-story-reply-card">
                            <img
                              src={msg.replyToStory.mediaUrl}
                              alt="Story snapshot"
                              className="chat-story-reply-thumb"
                            />
                            <div className="chat-story-reply-desc">
                              <span className="chat-story-reply-label">
                                {language === "ru"
                                  ? "Ответ на историю:"
                                  : "Replied to story:"}
                              </span>
                              {msg.replyToStory.caption && (
                                <p className="chat-story-reply-caption">
                                  {msg.replyToStory.caption}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="chat-bubble-content">
                          <p className="chat-bubble-text">{msg.text}</p>
                          <span className="chat-bubble-time">
                            {formatMessageTime(msg.createdAt)}
                            {isMine && <span className="chat-read-tick"> ✓✓</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="chat-bubble-row theirs">
                    <div className="chat-msg-avatar">
                      <UserAvatar
                        avatar={activeConversation.otherUser.avatar}
                        username={activeConversation.otherUser.username}
                        size={30}
                      />
                    </div>
                    <div className="chat-typing-bubble">
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                      <span className="chat-typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              <div className="chat-quick-prompts-bar">
                {QUICK_PROMPTS.map((prompt) => {
                  const text = language === "ru" ? prompt.ru : prompt.en;
                  return (
                    <button
                      key={text}
                      type="button"
                      className="chat-quick-prompt-chip"
                      onClick={() => handleSendMessage(text)}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>

              {/* Message Input Footer */}
              <form
                className="chat-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="chat-input-field"
                  placeholder={copy.typePlaceholder}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!inputText.trim()}
                  title={copy.send}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            /* Empty State */
            <div className="chat-empty-window">
              <div className="chat-empty-graphic">
                <span className="chat-empty-icon">✈️</span>
                <span className="chat-empty-ring" />
              </div>
              <h3>{copy.emptyTitle}</h3>
              <p>{copy.emptySub}</p>
              <button
                type="button"
                className="button button-coral chat-empty-start-btn"
                onClick={() => setShowTravelerModal(true)}
              >
                {copy.startChatting}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL: SELECT TRAVELER ================= */}
      {showTravelerModal && (
        <div
          className="chat-modal-overlay"
          onClick={() => setShowTravelerModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="chat-select-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-select-modal-header">
              <h3>{copy.selectTraveler}</h3>
              <button
                type="button"
                className="chat-select-close"
                onClick={() => setShowTravelerModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="chat-travelers-picker-list">
              {CURATED_TRAVELERS.map((traveler) => (
                <div
                  key={traveler.uid}
                  className="chat-picker-card"
                  onClick={() => handleStartChatWithTraveler(traveler)}
                  role="button"
                  tabIndex={0}
                >
                  <UserAvatar
                    avatar={traveler.avatar}
                    username={traveler.username}
                    size={48}
                  />
                  <div className="chat-picker-info">
                    <span className="chat-picker-name">
                      @{traveler.username}
                    </span>
                    <span className="chat-picker-bio">{traveler.bio}</span>
                    {traveler.location && (
                      <span className="chat-picker-loc">
                        📍 {traveler.location}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="button button-small button-outline chat-picker-action-btn"
                  >
                    💬 {language === "ru" ? "Написать" : "Message"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
