import type { User } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";
import UserAvatar from "./UserAvatar";

type MobileBottomNavProps = {
  user: User | null;
  username: string;
  userAvatar?: string;
  unreadChatCount?: number;
  onRequestAuth: () => void;
  onCreatePost: () => void;
};

export default function MobileBottomNav({
  user,
  username,
  userAvatar = "",
  unreadChatCount: _unreadChatCount = 0,
  onRequestAuth,
  onCreatePost,
}: MobileBottomNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isHome = currentPath === "/";
  const isMap = currentPath === "/map";
  const isFeed = currentPath === "/posts";
  const isProfile = currentPath === "/profile" || currentPath.startsWith("/profile/@");

  return (
    <nav className="mobile-bottom-nav" aria-label="Мобильная навигация">
      <div className="mobile-bottom-nav-inner">
        {/* 1. Home */}
        <Link
          to="/"
          className={`mobile-nav-tab ${isHome ? "active" : ""}`}
          aria-label="Главная"
        >
          <span className="mobile-nav-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="mobile-nav-label">Главная</span>
        </Link>

        {/* 2. Map */}
        <Link
          to="/map"
          className={`mobile-nav-tab ${isMap ? "active" : ""}`}
          aria-label="Карта"
        >
          <span className="mobile-nav-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <span className="mobile-nav-label">Карта</span>
        </Link>

        {/* 3. Center Create Action Button */}
        <button
          type="button"
          className="mobile-nav-create-btn"
          onClick={onCreatePost}
          aria-label="Создать публикацию"
          title="Создать публикацию"
        >
          <span className="mobile-nav-create-inner">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </button>

        {/* 4. Feed */}
        <Link
          to="/posts"
          className={`mobile-nav-tab ${isFeed ? "active" : ""}`}
          aria-label="Лента"
        >
          <span className="mobile-nav-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="7" y1="16" x2="13" y2="16" />
            </svg>
          </span>
          <span className="mobile-nav-label">Лента</span>
        </Link>

        {/* 5. Profile or Login */}
        {user ? (
          <Link
            to="/profile"
            className={`mobile-nav-tab ${isProfile ? "active" : ""}`}
            aria-label="Профиль"
          >
            <span className="mobile-nav-avatar-icon">
              <UserAvatar
                avatar={userAvatar}
                username={username || user.displayName || "you"}
                size={24}
              />
            </span>
            <span className="mobile-nav-label">Профиль</span>
          </Link>
        ) : (
          <button
            type="button"
            className="mobile-nav-tab"
            onClick={onRequestAuth}
            aria-label="Войти"
          >
            <span className="mobile-nav-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="mobile-nav-label">Войти</span>
          </button>
        )}
      </div>
    </nav>
  );
}
