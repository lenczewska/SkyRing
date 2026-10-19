import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./index.css";
import { auth, db } from "./firebase";
import AuthModal from "./AuthModal";
import HomePage from "./HomePage";
import ProfilePage from "./ProfilePage";
import TravelMapPage from "./TravelMapPage";
import PostsPage from "./PostsPage";
import OnboardingModal from "./OnboardingModal";
import HashtagPage from "./HashtagPage";
import ChatPage from "./ChatPage";
import CreatePostModal from "./CreatePostModal";
import MobileSidebar from "./MobileSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { getTotalUnreadCount } from "./lib/chatService";
import { I18nProvider, useI18n } from "./i18n";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import type { AuthMode } from "./types";

function AppShell() {
  const { language, setLanguage, common, home } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState(() => {
    try {
      return window.localStorage.getItem("skyring-cached-username") || "";
    } catch {
      return "";
    }
  });
  const [userAvatar, setUserAvatar] = useState(() => {
    try {
      return window.localStorage.getItem("skyring-cached-avatar") || "";
    } catch {
      return "";
    }
  });
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [onboardingUser, setOnboardingUser] = useState<{
    uid: string;
    username: string;
  } | null>(null);
  const [profileMenu, setProfileMenu] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Keep track of unread messages count for navbar badge
  useEffect(() => {
    const updateUnread = () => {
      const count = getTotalUnreadCount({
        uid: user?.uid || "guest",
        username: username || "you",
      });
      setUnreadChatCount(count);
    };
    updateUnread();
    const interval = setInterval(updateUnread, 3000);
    return () => clearInterval(interval);
  }, [user?.uid, username]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 3500);

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      clearTimeout(safetyTimer);
      setUser(nextUser);
      setAuthLoading(false);
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (nextUser) {
        try {
          window.localStorage.setItem("skyring-auth-active", "1");
        } catch {}

        // Fast instant fallback from localStorage / displayName
        const localCached =
          window.localStorage.getItem(`skyring-uname-${nextUser.uid}`) ||
          window.localStorage.getItem("skyring-cached-username");
        const fallback =
          localCached ||
          nextUser.displayName ||
          nextUser.email?.split("@")[0] ||
          "";
        if (fallback) {
          setUsername(fallback);
          try {
            window.localStorage.setItem("skyring-cached-username", fallback);
          } catch {}
        }

        unsubscribeDoc = onSnapshot(
          doc(db, "users", nextUser.uid),
          (userSnap) => {
            if (userSnap.exists()) {
              const uData = userSnap.data();
              const uname =
                uData?.username ||
                nextUser.displayName ||
                nextUser.email?.split("@")[0] ||
                "";
              if (uname) {
                setUsername(uname);
                try {
                  window.localStorage.setItem(
                    `skyring-uname-${nextUser.uid}`,
                    uname,
                  );
                  window.localStorage.setItem(
                    "skyring-cached-username",
                    uname,
                  );
                } catch {
                  // ignore
                }
              }
              if (uData?.avatar !== undefined) {
                setUserAvatar(uData.avatar || "");
                try {
                  window.localStorage.setItem(
                    "skyring-cached-avatar",
                    uData.avatar || "",
                  );
                } catch {}
              }

              const hasLocal = window.localStorage.getItem(
                `skyring-onboarding-${nextUser.uid}`,
              );
              if (uData && uData.onboardingCompleted === false && !hasLocal) {
                setOnboardingUser({ uid: nextUser.uid, username: uname });
              }
            }
          },
          (err) => {
            console.warn("Could not listen to user doc in App:", err);
          },
        );
      } else {
        try {
          window.localStorage.removeItem("skyring-auth-active");
          window.localStorage.removeItem("skyring-cached-username");
          window.localStorage.removeItem("skyring-cached-avatar");
          window.localStorage.removeItem("skyring-guest-places");
          window.localStorage.removeItem("skyring-guest-place-details");
        } catch {}
        setUsername("");
        setUserAvatar("");
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  if (authLoading) {
    return (
      <main className="site-shell app-init-loader-screen">
        <div className="app-init-loader-center">
          <div className="brand-mark app-init-loader-logo" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span className="app-init-loader-text">SkyRing</span>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <nav className="nav container">
        <button
          className="brand nav-button"
          onClick={() => navigate("/")}
          aria-label="SkyRing home"
          type="button"
        >
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>SkyRing</span>
        </button>
        {user && (
          <div className="nav-links">
            <button
              className="nav-globe-btn"
              onClick={() => navigate("/map")}
              type="button"
              title={common.map}
              aria-label={common.map}
            >
              <svg
                className="nav-globe-svg"
                viewBox="0 0 36 36"
                width="32"
                height="32"
                aria-hidden="true"
              >
                <circle className="nav-globe-border-bg" cx="18" cy="18" r="15" />
                <circle className="nav-globe-border-fill" cx="18" cy="18" r="15" />
                <g className="nav-globe-icon">
                  <circle cx="18" cy="18" r="8" className="nav-globe-sphere" />
                  <line x1="10" y1="18" x2="26" y2="18" className="nav-globe-line" />
                  <line x1="18" y1="10" x2="18" y2="26" className="nav-globe-line" />
                  <ellipse cx="18" cy="18" rx="4.2" ry="8" className="nav-globe-line" />
                  <path d="M10.8 14.5 C13 16, 23 16, 25.2 14.5" className="nav-globe-line" />
                  <path d="M10.8 21.5 C13 20, 23 20, 25.2 21.5" className="nav-globe-line" />
                </g>
              </svg>
            </button>
            {/* Feed / Posts button */}
            <button
              className="nav-feed-btn"
              onClick={() => navigate("/posts")}
              type="button"
              title={language === "ru" ? "Лента путешествий" : "Travel Feed"}
              aria-label={language === "ru" ? "Лента путешествий" : "Travel Feed"}
            >
              <svg
                className="nav-feed-svg"
                viewBox="0 0 36 36"
                width="32"
                height="32"
                aria-hidden="true"
              >
                <circle className="nav-feed-border-bg" cx="18" cy="18" r="15" />
                <circle className="nav-feed-border-fill" cx="18" cy="18" r="15" />
                <g className="nav-feed-icon">
                  <rect
                    x="11.5"
                    y="11"
                    width="13"
                    height="14"
                    rx="2"
                    strokeWidth="1.6"
                    className="nav-feed-rect"
                  />
                  <line
                    x1="14.5"
                    y1="15"
                    x2="21.5"
                    y2="15"
                    strokeWidth="1.5"
                    className="nav-feed-line nav-feed-line-1"
                  />
                  <line
                    x1="14.5"
                    y1="18"
                    x2="21.5"
                    y2="18"
                    strokeWidth="1.5"
                    className="nav-feed-line nav-feed-line-2"
                  />
                  <line
                    x1="14.5"
                    y1="21"
                    x2="18.5"
                    y2="21"
                    strokeWidth="1.5"
                    className="nav-feed-line nav-feed-line-3"
                  />
                </g>
              </svg>
            </button>
            {/* Create Post button */}
            <button
              className="nav-plus-btn"
              onClick={() => setIsCreatePostOpen(true)}
              type="button"
              title={language === "ru" ? "Создать публикацию" : "Create post"}
              aria-label={language === "ru" ? "Создать публикацию" : "Create post"}
            >
              <svg
                className="nav-plus-svg"
                viewBox="0 0 36 36"
                width="32"
                height="32"
                aria-hidden="true"
              >
                <circle className="nav-plus-border-bg" cx="18" cy="18" r="15" />
                <circle className="nav-plus-border-fill" cx="18" cy="18" r="15" />
                <path className="nav-plus-cross" d="M18 11 V25 M11 18 H25" />
              </svg>
            </button>
            <button
              className={`nav-chat-btn ${unreadChatCount > 0 ? "has-unread" : ""}`}
              onClick={() => navigate("/chat")}
              type="button"
              title={language === "ru" ? "Сообщения / Чат" : "Messages / Chat"}
              aria-label={language === "ru" ? "Сообщения / Чат" : "Messages / Chat"}
            >
              <svg
                className="nav-chat-svg"
                viewBox="0 0 36 36"
                width="32"
                height="32"
                aria-hidden="true"
              >
                <circle className="nav-chat-border-bg" cx="18" cy="18" r="15" />
                <circle className="nav-chat-border-fill" cx="18" cy="18" r="15" />
                <g className="nav-chat-icon-group">
                  <path
                    d="M12 14c0-1.7 1.3-3 3-3h6c1.7 0 3 1.3 3 3v5c0 1.7-1.3 3-3 3h-2.5L15 24.5V22h-0c-1.7 0-3-1.3-3-3v-5z"
                    className="nav-chat-icon-path"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="15.5" cy="16.5" r="1.1" className="nav-chat-dot nav-chat-dot-1" />
                  <circle cx="18.5" cy="16.5" r="1.1" className="nav-chat-dot nav-chat-dot-2" />
                  <circle cx="21.5" cy="16.5" r="1.1" className="nav-chat-dot nav-chat-dot-3" />
                </g>
              </svg>
              {unreadChatCount > 0 && (
                <span className="nav-chat-badge">{unreadChatCount}</span>
              )}
            </button>
          </div>
        )}
        <div className="nav-actions">
          {/* Theme Switcher Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            type="button"
            aria-label={theme === "dark" ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
            title={theme === "dark" ? (language === "ru" ? "Светлая тема" : "Light mode") : (language === "ru" ? "Тёмная тема" : "Dark mode")}
          >
            <svg
              className="nav-theme-svg"
              viewBox="0 0 36 36"
              width="32"
              height="32"
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

          {/* Language Switcher */}
          <div className="language-switcher" aria-label={common.languageLabel}>
            <button
              className={language === "en" ? "language-active" : ""}
              onClick={() => setLanguage("en")}
              type="button"
            >
              EN
            </button>
            <span>/</span>
            <button
              className={language === "ru" ? "language-active" : ""}
              onClick={() => setLanguage("ru")}
              type="button"
            >
              RU
            </button>
          </div>

          {user ? (
            <div className="profile-nav">
              <button
                className="button button-dark button-small nav-button user-account-button"
                onClick={() => setProfileMenu(!profileMenu)}
                type="button"
              >
                @{username ||
                  user.displayName ||
                  user.email?.split("@")[0] ||
                  (language === "ru" ? "профиль" : "profile")}{" "}
                <span aria-hidden="true">↗</span>
              </button>
              {profileMenu && (
                <div className="profile-menu">
                  <button
                    className="nav-button"
                    onClick={() => {
                      navigate("/profile");
                      setProfileMenu(false);
                    }}
                    type="button"
                  >
                    {common.profile}
                  </button>
                  <button
                    className="nav-button menu-logout"
                    onClick={() => {
                      void signOut(auth);
                      navigate("/");
                      setProfileMenu(false);
                    }}
                    type="button"
                  >
                    {common.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="button button-dark button-small nav-button user-account-button"
              onClick={() => setAuthMode("login")}
              type="button"
            >
              {home.accountAction} <span aria-hidden="true">↗</span>
            </button>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            className={`nav-hamburger-btn ${isMobileMenuOpen ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={language === "ru" ? "Меню навигации" : "Navigation menu"}
            title={language === "ru" ? "Меню" : "Menu"}
          >
            <span className="nav-hamburger-line" />
            <span className="nav-hamburger-line" />
            <span className="nav-hamburger-line" />
            {unreadChatCount > 0 && <span className="nav-hamburger-badge-dot" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Sidebar Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        username={username}
        userAvatar={userAvatar}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        unreadChatCount={unreadChatCount}
        onRequestAuth={() => setAuthMode("login")}
        onCreatePost={() => setIsCreatePostOpen(true)}
        onLogout={() => {
          void signOut(auth);
          navigate("/");
        }}
      />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              copy={home}
              language={language}
              username={username}
              user={user}
              onRequestAuth={() => setAuthMode("login")}
              onRegister={() => setAuthMode("register")}
              onOpenMap={() => navigate("/map")}
            />
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <ProfilePage
                user={user}
                username={username}
                userAvatar={userAvatar}
                onAvatarChange={setUserAvatar}
                language={language}
                onUsernameChange={setUsername}
                onRequestAuth={() => setAuthMode("login")}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProfilePage
              user={user}
              username={username}
              userAvatar={userAvatar}
              onAvatarChange={setUserAvatar}
              language={language}
              onUsernameChange={setUsername}
              onRequestAuth={() => setAuthMode("login")}
            />
          }
        />
        <Route
          path="/map"
          element={
            <TravelMapPage
              user={user}
              language={language}
              onRequestAuth={() => setAuthMode("login")}
            />
          }
        />
        <Route
          path="/posts"
          element={
            <PostsPage
              user={user}
              username={username}
              userAvatar={userAvatar}
              language={language}
              onRequestAuth={() => setAuthMode("login")}
            />
          }
        />
        <Route
          path="/tags/:tag"
          element={
            <HashtagPage
              user={user}
              username={username}
              language={language}
              onRequestAuth={() => setAuthMode("login")}
            />
          }
        />
        <Route
          path="/chat"
          element={
            <ChatPage
              user={user}
              username={username}
              userAvatar={userAvatar}
              language={language}
              onRequestAuth={() => setAuthMode("login")}
            />
          }
        />
        <Route
          path="/chat/:targetUsername"
          element={
            <ChatPage
              user={user}
              username={username}
              userAvatar={userAvatar}
              language={language}
              onRequestAuth={() => setAuthMode("login")}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {authMode && (
        <AuthModal
          mode={authMode}
          language={language}
          onClose={() => setAuthMode(null)}
          onSwitch={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
          onRegisterSuccess={(registeredUid, registeredUsername) => {
            setAuthMode(null);
            setUsername(registeredUsername);
            try {
              window.localStorage.setItem(
                `skyring-uname-${registeredUid}`,
                registeredUsername,
              );
            } catch {
              // ignore
            }
            setOnboardingUser({
              uid: registeredUid,
              username: registeredUsername,
            });
          }}
        />
      )}
      {onboardingUser && (
        <OnboardingModal
          uid={onboardingUser.uid}
          username={onboardingUser.username}
          language={language}
          onComplete={() => {
            setOnboardingUser(null);
            navigate("/profile");
          }}
        />
      )}
      {/* Global Create Post Modal */}
      {isCreatePostOpen && user && (
        <CreatePostModal
          user={user}
          username={username}
          userAvatar={userAvatar}
          language={language}
          onClose={() => setIsCreatePostOpen(false)}
          onPostCreated={() => {
            navigate("/posts");
          }}
        />
      )}
      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        user={user}
        username={username}
        userAvatar={userAvatar}
        unreadChatCount={unreadChatCount}
        onRequestAuth={() => setAuthMode("login")}
        onCreatePost={() => {
          if (!user) {
            setAuthMode("register");
          } else {
            setIsCreatePostOpen(true);
          }
        }}
      />
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}

