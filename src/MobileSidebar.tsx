import { useEffect } from "react";
import type { User } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import { useModalScrollLock } from "./lib/useModalScrollLock";

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
  onCreatePost?: () => void;
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
  onLogout,
}: MobileSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useModalScrollLock(isOpen);

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
          search: "Поиск и исследование",
          searchDesc: "Места, страны и путешественники",
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
          search: "Search & Explore",
          searchDesc: "Places, countries & travelers",
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
            aria-label={language === "ru" ? "Закрыть меню" : "Close menu"}
            title={language === "ru" ? "Закрыть меню" : "Close menu"}
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

          {/* Search & Explore */}
          <button
            type="button"
            className={`mobile-sidebar-nav-item ${currentPath === "/search" ? "active" : ""}`}
            onClick={() => handleNav("/search")}
          >
            <span className="mobile-sidebar-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <div className="mobile-sidebar-item-text">
              <span className="mobile-sidebar-item-title">{copy.search}</span>
              <span className="mobile-sidebar-item-sub">{copy.searchDesc}</span>
            </div>
          </button>

          {user && (
            <>
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

              {/* Profile */}
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
            </>
          )}
        </nav>

        {/* Footer Settings: Language, Theme & Account */}
        <div className="mobile-sidebar-footer">
          <div className="mobile-sidebar-controls-row">
            {/* Language Switcher (EN / RU like desktop header) */}
            <div className="language-switcher mobile-sidebar-lang" aria-label="Language">
              <button
                className={language === "en" ? "language-active" : ""}
                onClick={() => onLanguageChange("en")}
                type="button"
              >
                EN
              </button>
              <span>/</span>
              <button
                className={language === "ru" ? "language-active" : ""}
                onClick={() => onLanguageChange("ru")}
                type="button"
              >
                RU
              </button>
            </div>

            {/* Theme Toggle Button (Moon / Sun) */}
            <button
              className="theme-toggle-btn mobile-sidebar-theme-btn"
              onClick={onToggleTheme}
              type="button"
              aria-label={
                theme === "dark"
                  ? language === "ru"
                    ? "Светлая тема"
                    : "Light mode"
                  : language === "ru"
                    ? "Тёмная тема"
                    : "Dark mode"
              }
              title={
                theme === "dark"
                  ? language === "ru"
                    ? "Светлая тема"
                    : "Light mode"
                  : language === "ru"
                    ? "Тёмная тема"
                    : "Dark mode"
              }
            >
              <svg
                className="nav-theme-svg"
                viewBox="0 0 36 36"
                width="34"
                height="34"
                aria-hidden="true"
              >
                <circle className="nav-theme-border-bg" cx="18" cy="18" r="15" />
                <circle className="nav-theme-border-fill" cx="18" cy="18" r="15" />
                <g className="nav-theme-icon">
                  {theme === "dark" ? (
                    <path
                      transform="translate(18, 18) scale(0.7778) translate(-13, -12)"
                      d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
                    />
                  ) : (
                    <g transform="translate(18, 18) scale(0.7) translate(-12, -12)">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </g>
                  )}
                </g>
              </svg>
            </button>
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
