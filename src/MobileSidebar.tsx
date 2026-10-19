import { useEffect } from "react";
import type { User } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import UserAvatar from "./UserAvatar";

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  username: string;
  userAvatar?: string;
  language: "en" | "ru";
  onLanguageChange: (lang: "en" | "ru") => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  unreadChatCount: number;
  onRequestAuth: () => void;
  onCreatePost: () => void;
  onLogout: () => void;
};

export default function MobileSidebar({
  isOpen,
  onClose,
  user,
  username,
  userAvatar = "",
  language,
  onLanguageChange,
  theme,
  onToggleTheme,
  unreadChatCount,
  onRequestAuth,
  onCreatePost,
  onLogout,
}: MobileSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const copy =
    language === "ru"
      ? {
          menuTitle: "Меню",
          home: "Главная",
          homeDesc: "Обзор и популярное",
          map: "Карта путешествий",
          mapDesc: "Интерактивная карта и отметки",
          feed: "Лента публикаций",
          feedDesc: "Кадры и истории путешественников",
          chat: "Сообщения / Чат",
          chatDesc: "Диалоги с путешественниками",
          createPost: "Создать публикацию",
          createPostDesc: "Поделиться новым местом или фото",
          profile: "Мой профиль",
          profileDesc: "Маршруты, дневник и фото",
          guestTitle: "Гостевой режим",
          guestSub: "Войдите, чтобы делиться маршрутами и общаться",
          loginBtn: "Войти в аккаунт",
          logout: "Выйти из аккаунта",
          theme: "Тема оформления",
          themeDark: "Тёмная",
          themeLight: "Светлая",
          language: "Язык",
          online: "В сети",
          unread: "новых",
        }
      : {
          menuTitle: "Menu",
          home: "Home",
          homeDesc: "Explore & highlights",
          map: "Travel Map",
          mapDesc: "Interactive globe & pins",
          feed: "Travel Feed",
          feedDesc: "Explorer stories & shots",
          chat: "Messages & Chat",
          chatDesc: "Traveler direct chats",
          createPost: "Create Post",
          createPostDesc: "Share new place or photo",
          profile: "My Profile",
          profileDesc: "Pins, diary & travel shots",
          guestTitle: "Guest Mode",
          guestSub: "Log in to save routes and message travelers",
          loginBtn: "Log In",
          logout: "Sign Out",
          theme: "Appearance",
          themeDark: "Dark",
          themeLight: "Light",
          language: "Language",
          online: "Online",
          unread: "new",
        };

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleCreatePost = () => {
    onClose();
    if (!user) {
      onRequestAuth();
    } else {
      onCreatePost();
    }
  };

  const currentPath = location.pathname;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Drawer */}
      <aside
        className={`mobile-sidebar-drawer ${isOpen ? "open" : ""}`}
        aria-label={copy.menuTitle}
        aria-hidden={!isOpen}
      >
        {/* Drawer Header */}
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-brand" onClick={() => handleNav("/")}>
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="mobile-sidebar-title">SkyRing</span>
          </div>

          <button
            type="button"
            className="mobile-sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
            title="Закрыть меню"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="mobile-sidebar-user-card">
          {user ? (
            <div
              className="mobile-sidebar-user-info"
              onClick={() => handleNav("/profile")}
              role="button"
              tabIndex={0}
            >
              <div className="mobile-sidebar-avatar-wrap">
                <UserAvatar
                  avatar={userAvatar}
                  username={username || user.displayName || "you"}
                  size={46}
                />
                <span className="mobile-sidebar-online-dot" />
              </div>
              <div className="mobile-sidebar-user-text">
                <span className="mobile-sidebar-username">
                  @{username || user.displayName || user.email?.split("@")[0]}
                </span>
                <span className="mobile-sidebar-profile-link">
                  {copy.profile} ↗
                </span>
              </div>
            </div>
          ) : (
            <div className="mobile-sidebar-guest-card">
              <div className="mobile-sidebar-guest-info">
                <div className="mobile-sidebar-guest-avatar">👤</div>
                <div>
                  <h4 className="mobile-sidebar-guest-title">{copy.guestTitle}</h4>
                  <p className="mobile-sidebar-guest-sub">{copy.guestSub}</p>
                </div>
              </div>
              <button
                type="button"
                className="button button-coral button-small mobile-sidebar-login-btn"
                onClick={() => {
                  onClose();
                  onRequestAuth();
                }}
              >
                {copy.loginBtn} ↗
              </button>
            </div>
          )}
        </div>

        {/* Action Button: Create Post */}
        <div className="mobile-sidebar-action-wrap">
          <button
            type="button"
            className="mobile-sidebar-create-btn"
            onClick={handleCreatePost}
          >
            <span className="mobile-sidebar-create-icon">
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <div className="mobile-sidebar-create-text">
              <span className="mobile-sidebar-create-title">
                {copy.createPost}
              </span>
              <span className="mobile-sidebar-create-desc">
                {copy.createPostDesc}
              </span>
            </div>
          </button>
        </div>

        {/* Primary Navigation Links */}
        <nav className="mobile-sidebar-nav-list">
          {/* Home */}
          <button
            type="button"
            className={`mobile-sidebar-nav-item ${currentPath === "/" ? "active" : ""}`}
            onClick={() => handleNav("/")}
          >
            <span className="mobile-sidebar-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <div className="mobile-sidebar-item-text">
              <span className="mobile-sidebar-item-title">{copy.home}</span>
              <span className="mobile-sidebar-item-sub">{copy.homeDesc}</span>
            </div>
          </button>

          {/* Map */}
          <button
            type="button"
            className={`mobile-sidebar-nav-item ${currentPath === "/map" ? "active" : ""}`}
            onClick={() => handleNav("/map")}
          >
            <span className="mobile-sidebar-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <div className="mobile-sidebar-item-text">
              <span className="mobile-sidebar-item-title">{copy.map}</span>
              <span className="mobile-sidebar-item-sub">{copy.mapDesc}</span>
            </div>
          </button>

          {/* Feed / Posts */}
          <button
            type="button"
            className={`mobile-sidebar-nav-item ${currentPath === "/posts" ? "active" : ""}`}
            onClick={() => handleNav("/posts")}
          >
            <span className="mobile-sidebar-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="7" y1="8" x2="17" y2="8" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="7" y1="16" x2="13" y2="16" />
              </svg>
            </span>
            <div className="mobile-sidebar-item-text">
              <span className="mobile-sidebar-item-title">{copy.feed}</span>
              <span className="mobile-sidebar-item-sub">{copy.feedDesc}</span>
            </div>
          </button>

          {/* Chat / Messages */}
          <button
            type="button"
            className={`mobile-sidebar-nav-item ${currentPath.startsWith("/chat") ? "active" : ""}`}
            onClick={() => handleNav("/chat")}
          >
            <span className="mobile-sidebar-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <div className="mobile-sidebar-item-text">
              <div className="mobile-sidebar-item-title-row">
                <span className="mobile-sidebar-item-title">{copy.chat}</span>
                {unreadChatCount > 0 && (
                  <span className="mobile-sidebar-unread-pill">
                    {unreadChatCount} {copy.unread}
                  </span>
                )}
              </div>
              <span className="mobile-sidebar-item-sub">{copy.chatDesc}</span>
            </div>
          </button>

          {/* Profile (if logged in) */}
          {user && (
            <button
              type="button"
              className={`mobile-sidebar-nav-item ${currentPath === "/profile" ? "active" : ""}`}
              onClick={() => handleNav("/profile")}
            >
              <span className="mobile-sidebar-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <div className="mobile-sidebar-item-text">
                <span className="mobile-sidebar-item-title">{copy.profile}</span>
                <span className="mobile-sidebar-item-sub">{copy.profileDesc}</span>
              </div>
            </button>
          )}
        </nav>

        {/* Footer Settings: Theme & Language */}
        <div className="mobile-sidebar-footer">
          {/* Theme Selector */}
          <div className="mobile-sidebar-preference-row">
            <span className="mobile-sidebar-pref-label">{copy.theme}:</span>
            <div className="mobile-sidebar-theme-toggle">
              <button
                type="button"
                className={`mobile-theme-opt ${theme === "light" ? "active" : ""}`}
                onClick={() => {
                  if (theme !== "light") onToggleTheme();
                }}
              >
                ☀️ {copy.themeLight}
              </button>
              <button
                type="button"
                className={`mobile-theme-opt ${theme === "dark" ? "active" : ""}`}
                onClick={() => {
                  if (theme !== "dark") onToggleTheme();
                }}
              >
                🌙 {copy.themeDark}
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="mobile-sidebar-preference-row">
            <span className="mobile-sidebar-pref-label">{copy.language}:</span>
            <div className="mobile-sidebar-lang-toggle">
              <button
                type="button"
                className={`mobile-lang-opt ${language === "ru" ? "active" : ""}`}
                onClick={() => onLanguageChange("ru")}
              >
                Русский
              </button>
              <button
                type="button"
                className={`mobile-lang-opt ${language === "en" ? "active" : ""}`}
                onClick={() => onLanguageChange("en")}
              >
                English
              </button>
            </div>
          </div>

          {/* Log Out Button */}
          {user && (
            <button
              type="button"
              className="mobile-sidebar-logout-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{copy.logout}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
