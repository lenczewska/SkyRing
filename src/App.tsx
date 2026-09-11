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
import { I18nProvider, useI18n } from "./i18n";
import type { AuthMode } from "./types";

function AppShell() {
  const { language, setLanguage, common, home } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [profileMenu, setProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(
    () =>
      onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        setUsername("");
        if (nextUser)
          setUsername(
            (await getDoc(doc(db, "users", nextUser.uid))).data()?.username ??
              "",
          );
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
            className="nav-button nav-link-button"
            onClick={() => navigate("/map")}
            type="button"
          >
            {common.map}
          </button>
          <button
            className="nav-button nav-link-button"
            onClick={() => navigate("/posts")}
            type="button"
          >
            {common.posts}
          </button>
        </div>
        <div className="nav-actions">
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
              />
            ) : (
              <Navigate to="/" replace />
            )
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
        />
      )}
    </main>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </I18nProvider>
  );
}
