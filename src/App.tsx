import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import { I18nProvider, useI18n } from "./i18n";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import type { AuthMode } from "./types";

function AppShell() {
  const { language, setLanguage, common, home } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [onboardingUser, setOnboardingUser] = useState<{
    uid: string;
    username: string;
  } | null>(null);
  const [profileMenu, setProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(
    () =>
      onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        setUsername("");
        if (nextUser) {
          try {
            const userSnap = await getDoc(doc(db, "users", nextUser.uid));
            const uData = userSnap.data();
            const uname = uData?.username ?? "";
            setUsername(uname);
            const hasLocal = window.localStorage.getItem(
              `skyring-onboarding-${nextUser.uid}`,
            );
            if (uData && uData.onboardingCompleted === false && !hasLocal) {
              setOnboardingUser({ uid: nextUser.uid, username: uname });
            }
          } catch {
            // ignore
          }
        }
      }),
    [],
  );

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
          <button
            className="nav-plus-btn"
            onClick={() => {
              if (!user) {
                setAuthMode("register");
              } else {
                navigate("/posts");
              }
            }}
            type="button"
            title={language === "ru" ? "Создать пост / Лента" : "Create post / Feed"}
            aria-label={language === "ru" ? "Создать пост / Лента" : "Create post / Feed"}
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
        </div>
        <div className="nav-actions">
          {/* Theme Switcher Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            type="button"
            aria-label={theme === "dark" ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
            title={theme === "dark" ? (language === "ru" ? "Светлая тема" : "Light mode") : (language === "ru" ? "Тёмная тема" : "Dark mode")}
          >
            <span className="theme-toggle-icon">
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              )}
            </span>
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
                @{username || "account"} <span aria-hidden="true">↗</span>
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
              className="button button-dark button-small nav-button"
              onClick={() => setAuthMode("login")}
              type="button"
            >
              {home.accountAction} <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </nav>
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

