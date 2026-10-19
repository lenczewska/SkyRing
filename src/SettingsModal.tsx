import { useState, useMemo, type FormEvent } from "react";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  type User,
} from "firebase/auth";
import {
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { UserProfile } from "./types";
import LocationSelect from "./LocationSelect";
import { getSortedCountries, getCitiesForCountry } from "./lib/worldLocations";
import UserAvatar from "./UserAvatar";
import AvatarModal from "./AvatarModal";
import { useModalScrollLock } from "./lib/useModalScrollLock";

type SettingsModalProps = {
  user: User;
  profileData: UserProfile | null;
  language: "en" | "ru";
  onClose: () => void;
  onProfileUpdate: (updated: Partial<UserProfile>) => void;
  onAccountDeleted: () => void;
};

export default function SettingsModal({
  user,
  profileData,
  language = "ru",
  onClose,
  onProfileUpdate,
  onAccountDeleted,
}: SettingsModalProps) {
  useModalScrollLock();

  const currentUsername = profileData?.username || "";
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");

  // Avatar state
  const [avatar, setAvatar] = useState(profileData?.avatar || "");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState("");

  // Toggles
  const [allowComments, setAllowComments] = useState<boolean>(
    profileData?.allowComments ?? true
  );
  const [privateMap, setPrivateMap] = useState<boolean>(
    profileData?.privateMap ?? false
  );
  const [showAgeAndLocation, setShowAgeAndLocation] = useState<boolean>(
    profileData?.showAgeAndLocation ?? true
  );
  const [emailNotifications, setEmailNotifications] = useState<boolean>(
    profileData?.emailNotifications ?? true
  );
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");

  const [country, setCountry] = useState(profileData?.country || "");
  const [city, setCity] = useState(profileData?.city || "");
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState("");

  const countryOptions = useMemo(() => {
    return getSortedCountries(language).map((c) => ({
      value: language === "ru" ? c.ru : c.en,
      label: language === "ru" ? c.ru : c.en,
      icon: c.flag,
      sublabel: language === "ru" ? c.en : c.ru,
    }));
  }, [language]);

  const cityOptions = useMemo(() => {
    return getCitiesForCountry(country, language).map((cityName) => ({
      value: cityName,
      label: cityName,
      icon: "🏙️",
    }));
  }, [country, language]);

  // Delete Account States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const copy =
    language === "ru"
      ? {
          title: "Настройки профиля",
          close: "Закрыть",
          generalTab: "Основное",
          usernameLabel: "Имя пользователя (никнейм)",
          usernameHint: "3–20 символов: маленькие латинские буквы, цифры и _",
          changeUsernameBtn: "Сохранить никнейм",
          usernameSaving: "Проверка и сохранение...",
          usernameTaken: "Этот никнейм уже занят другим путешественником.",
          usernameInvalid: "Никнейм должен содержать от 3 до 20 латинских букв, цифр или _.",
          usernameSuccess: "Никнейм успешно обновлён!",
          avatarSection: "Фото профиля",
          avatarDesc: "Персонализируйте профиль, чтобы друзья и путешественники узнавали вас.",
          changeAvatarBtn: "Сменить фото",
          addAvatarBtn: "Загрузить фото",
          removeAvatarBtn: "Удалить фото",
          avatarRemovedMsg: "Фото профиля удалено.",
          locationSection: "Локация (страна и город)",
          countryLabel: "Страна",
          cityLabel: "Город",
          countryPlaceholder: "Выберите страну или начните вводить...",
          cityPlaceholder: "Выберите город или начните вводить...",
          saveLocationBtn: "Сохранить локацию",
          locationSuccess: "Локация успешно обновлена!",
          privacySection: "Приватность и взаимодействие",
          allowCommentsTitle: "Разрешить комментарии к постам",
          allowCommentsDesc:
            "Другие пользователи могут комментировать ваши истории и фотоотчёты.",
          privateMapTitle: "Скрывать карту от гостей",
          privateMapDesc:
            "Только зарегистрированные пользователи и подписчики увидят ваши отметки.",
          showAgeLocationTitle: "Показывать возраст и город в профиле",
          showAgeLocationDesc:
            "Отображать плашки с вашей локацией и возрастом на странице профиля.",
          notificationsTitle: "Уведомления о новых подписках",
          notificationsDesc:
            "Получать уведомления, когда на вас подписываются новые путешественники.",
          saveSettingsBtn: "Сохранить настройки",
          settingsSaved: "Настройки успешно сохранены!",
          dangerZone: "Опасная зона",
          deleteAccountTitle: "Удаление аккаунта",
          deleteAccountDesc:
            "Это действие необратимо. Ваш профиль, никнейм, посты и сохранённые отметки на карте будут безвозвратно удалены.",
          deleteAccountBtn: "Удалить аккаунт",
          confirmDeleteTitle: "Вы уверены? Это действие необратимо!",
          confirmDeleteDesc:
            "Все ваши публикации, подписчики, метки на карте и данные профиля будут полностью стёрты из базы данных. Восстановить доступ будет невозможно.",
          confirmPasswordPrompt: "Для подтверждения введите ваш пароль:",
          confirmDeleteAction: "Да, удалить аккаунт навсегда",
          cancelBtn: "Отмена",
          deleteInProgress: "Удаление аккаунта...",
          deleteError: "Не удалось удалить аккаунт. Проверьте пароль или попробуйте снова.",
        }
      : {
          title: "Profile Settings",
          close: "Close",
          generalTab: "General",
          usernameLabel: "Username",
          usernameHint: "3-20 characters: lowercase letters, numbers, and _",
          changeUsernameBtn: "Save Username",
          usernameSaving: "Checking & saving...",
          usernameTaken: "This username is already taken by another traveler.",
          usernameInvalid: "Username must be 3-20 letters, numbers, or underscores.",
          usernameSuccess: "Username updated successfully!",
          avatarSection: "Profile Photo",
          avatarDesc: "Personalize your profile so fellow travelers recognize you.",
          changeAvatarBtn: "Change photo",
          addAvatarBtn: "Upload photo",
          removeAvatarBtn: "Remove photo",
          avatarRemovedMsg: "Profile photo removed.",
          locationSection: "Location (Country & City)",
          countryLabel: "Country",
          cityLabel: "City",
          countryPlaceholder: "Select country or start typing...",
          cityPlaceholder: "Select city or start typing...",
          saveLocationBtn: "Save Location",
          locationSuccess: "Location updated successfully!",
          privacySection: "Privacy & Interaction",
          allowCommentsTitle: "Allow comments on posts",
          allowCommentsDesc:
            "Other travelers can leave comments on your travel stories.",
          privateMapTitle: "Hide travel map from guests",
          privateMapDesc:
            "Only registered users and followers can view your visited places.",
          showAgeLocationTitle: "Show age & location on profile",
          showAgeLocationDesc:
            "Display location and age badges on your public profile header.",
          notificationsTitle: "Follower notifications",
          notificationsDesc:
            "Get notified when fellow travelers follow your profile.",
          saveSettingsBtn: "Save Settings",
          settingsSaved: "Settings saved successfully!",
          dangerZone: "Danger Zone",
          deleteAccountTitle: "Delete Account",
          deleteAccountDesc:
            "This action cannot be undone. Your profile, username, posts, and map marks will be permanently removed.",
          deleteAccountBtn: "Delete Account",
          confirmDeleteTitle: "Are you sure? This action is irreversible!",
          confirmDeleteDesc:
            "All your travel stories, followers, marked places, and profile data will be permanently wiped from the database.",
          confirmPasswordPrompt: "Enter your password to confirm deletion:",
          confirmDeleteAction: "Yes, delete account permanently",
          cancelBtn: "Cancel",
          deleteInProgress: "Deleting account...",
          deleteError: "Could not delete account. Check password or try again.",
        };

  // 1. Change Username Handler
  const handleSaveUsername = async (e: FormEvent) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");

    const normalized = newUsername.trim().toLowerCase();
    if (normalized === currentUsername.toLowerCase()) {
      setUsernameSuccess(copy.usernameSuccess);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setUsernameError(copy.usernameInvalid);
      return;
    }

    setUsernameSaving(true);
    try {
      await runTransaction(db, async (transaction) => {
        const newUsernameRef = doc(db, "usernames", normalized);
        const newSnap = await transaction.get(newUsernameRef);
        if (newSnap.exists()) {
          throw new Error("username-taken");
        }

        // Reserve new username
        transaction.set(newUsernameRef, {
          uid: user.uid,
          email: user.email || "",
          username: normalized,
          createdAt: serverTimestamp(),
        });

        // Release old username doc if it belonged to this user
        if (currentUsername) {
          const oldUsernameRef = doc(db, "usernames", currentUsername.toLowerCase());
          transaction.delete(oldUsernameRef);
        }

        // Update user document
        const userRef = doc(db, "users", user.uid);
        transaction.set(
          userRef,
          {
            username: normalized,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      onProfileUpdate({ username: normalized });
      setUsernameSuccess(copy.usernameSuccess);
    } catch (err: any) {
      if (err?.message === "username-taken") {
        setUsernameError(copy.usernameTaken);
      } else {
        console.warn("Could not change username:", err);
        setUsernameError(copy.usernameTaken);
      }
    } finally {
      setUsernameSaving(false);
    }
  };

  // 1b. Save Country & City Location Handler
  const handleSaveLocation = async () => {
    setLocationSaving(true);
    setLocationSuccess("");
    const locString =
      city && country ? `${city}, ${country}` : city || country || "";
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          country: country.trim(),
          city: city.trim(),
          location: locString.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      onProfileUpdate({
        country: country.trim(),
        city: city.trim(),
        location: locString.trim(),
      });
      setLocationSuccess(copy.locationSuccess);
      setTimeout(() => setLocationSuccess(""), 3500);
    } catch (e) {
      console.warn("Could not save location:", e);
    } finally {
      setLocationSaving(false);
    }
  };

  // 2. Save Privacy & Interaction Settings
  const handleSaveToggles = async () => {
    setSettingsSaving(true);
    setSettingsSuccess("");

    const updates: Partial<UserProfile> = {
      allowComments,
      privateMap,
      showAgeAndLocation,
      emailNotifications,
    };

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      onProfileUpdate(updates);
      setSettingsSuccess(copy.settingsSaved);
      setTimeout(() => setSettingsSuccess(""), 3500);
    } catch (err) {
      console.warn("Could not save settings:", err);
    } finally {
      setSettingsSaving(false);
    }
  };

  // 3. Delete Account Handler
  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleteLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user");

      // If user signed in with email/password and provided password, re-authenticate first
      if (deletePassword && currentUser.email) {
        try {
          const credential = EmailAuthProvider.credential(
            currentUser.email,
            deletePassword
          );
          await reauthenticateWithCredential(currentUser, credential);
        } catch (reauthErr) {
          console.warn("Re-authentication failed:", reauthErr);
          setDeleteError(
            language === "ru" ? "Неверный пароль." : "Incorrect password."
          );
          setDeleteLoading(false);
          return;
        }
      }

      // 1. Delete user from usernames collection
      if (currentUsername) {
        try {
          await deleteDoc(doc(db, "usernames", currentUsername.toLowerCase()));
        } catch (e) {
          console.warn("Could not delete username doc:", e);
        }
      }

      // 2. Delete user doc from users collection
      try {
        await deleteDoc(doc(db, "users", currentUser.uid));
      } catch (e) {
        console.warn("Could not delete user doc:", e);
      }

      // 3. Clean up localStorage
      try {
        window.localStorage.removeItem(`skyring-onboarding-${currentUser.uid}`);
        window.localStorage.removeItem(`skyring-following-${currentUser.uid}`);
        window.localStorage.removeItem(`skyring-guest-places`);
      } catch {
        // ignore
      }

      // 4. Delete user in Firebase Authentication
      await deleteUser(currentUser);
      await signOut(auth);

      onAccountDeleted();
    } catch (err: any) {
      console.warn("Error deleting account:", err);
      if (err?.code === "auth/requires-recent-login") {
        setDeleteError(
          language === "ru"
            ? "Требуется повторный вход. Пожалуйста, введите ваш пароль выше для подтверждения."
            : "Requires recent login. Please enter your password above to confirm."
        );
      } else {
        setDeleteError(copy.deleteError);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div
      className="settings-modal-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="settings-modal" role="dialog" aria-modal="true">
        <div className="settings-modal-header">
          <div className="settings-header-info">
            <h2>⚙️ {copy.title}</h2>
            <span className="settings-user-tag">@{currentUsername}</span>
          </div>
          <button
            className="settings-close-btn"
            onClick={onClose}
            type="button"
            aria-label={copy.close}
          >
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Section 0: Profile Photo */}
          <section className="settings-card">
            <h3 className="settings-card-title">📷 {copy.avatarSection}</h3>
            <p className="settings-card-subtitle">{copy.avatarDesc}</p>
            <div className="settings-avatar-row">
              <UserAvatar
                avatar={avatar}
                username={currentUsername}
                size={76}
                className="settings-avatar-preview"
              />
              <div className="settings-avatar-actions">
                <button
                  type="button"
                  className="button button-coral button-small settings-action-btn"
                  onClick={() => setShowAvatarPicker(true)}
                >
                  📷 {avatar ? copy.changeAvatarBtn : copy.addAvatarBtn}
                </button>
                {avatar && (
                  <button
                    type="button"
                    className="button button-outline button-small settings-action-btn"
                    onClick={async () => {
                      setAvatar("");
                      try {
                        await updateDoc(doc(db, "users", user.uid), {
                          avatar: "",
                        });
                        onProfileUpdate({ avatar: "" });
                        setAvatarSuccess(copy.avatarRemovedMsg);
                        setTimeout(() => setAvatarSuccess(""), 3000);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    🗑️ {copy.removeAvatarBtn}
                  </button>
                )}
              </div>
            </div>
            {avatarSuccess && (
              <p className="settings-msg success">{avatarSuccess}</p>
            )}
          </section>

          {/* Section 1: Change Username */}
          <section className="settings-card">
            <h3 className="settings-card-title">👤 {copy.generalTab}</h3>
            <form onSubmit={handleSaveUsername} className="settings-username-form">
              <label htmlFor="settings-username-input">
                <span>{copy.usernameLabel}</span>
                <div className="settings-input-affix">
                  <span className="affix-at">@</span>
                  <input
                    id="settings-username-input"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                    pattern="[A-Za-z0-9_]{3,20}"
                    required
                  />
                </div>
                <small className="settings-hint">{copy.usernameHint}</small>
              </label>

              {usernameError && (
                <p className="settings-msg error">{usernameError}</p>
              )}
              {usernameSuccess && (
                <p className="settings-msg success">{usernameSuccess}</p>
              )}

              <button
                type="submit"
                disabled={usernameSaving || newUsername === currentUsername}
                className="button button-coral button-small settings-action-btn"
              >
                {usernameSaving ? copy.usernameSaving : copy.changeUsernameBtn} ↗
              </button>
            </form>
          </section>

          {/* Section 1b: Location (Country & City) */}
          <section className="settings-card">
            <h3 className="settings-card-title">📍 {copy.locationSection}</h3>
            <div className="settings-location-grid">
              <LocationSelect
                label={copy.countryLabel}
                value={country}
                onChange={(val) => {
                  setCountry(val);
                  setCity("");
                }}
                options={countryOptions}
                placeholder={copy.countryPlaceholder}
                allowCustom={true}
                emptyMessage={
                  language === "ru" ? "Страна не найдена" : "No country found"
                }
              />

              <LocationSelect
                label={copy.cityLabel}
                value={city}
                onChange={(val) => setCity(val)}
                options={cityOptions}
                placeholder={copy.cityPlaceholder}
                allowCustom={true}
                disabled={!country.trim()}
                hint={
                  !country.trim()
                    ? language === "ru"
                      ? "Сначала выберите страну"
                      : "Choose country first"
                    : undefined
                }
                emptyMessage={
                  language === "ru"
                    ? "Город не найден (можно ввести свой)"
                    : "No city found (you can type yours)"
                }
              />
            </div>

            {locationSuccess && (
              <p className="settings-msg success">{locationSuccess}</p>
            )}

            <button
              type="button"
              onClick={handleSaveLocation}
              disabled={locationSaving}
              className="button button-coral button-small settings-action-btn"
            >
              {locationSaving ? "..." : copy.saveLocationBtn} ✓
            </button>
          </section>

          {/* Section 2: Privacy & Interaction Toggles */}
          <section className="settings-card">
            <h3 className="settings-card-title">🔒 {copy.privacySection}</h3>
            <div className="settings-toggles-list">
              {/* Allow Comments */}
              <label className="settings-toggle-item">
                <div className="toggle-text">
                  <strong>💬 {copy.allowCommentsTitle}</strong>
                  <p>{copy.allowCommentsDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="settings-checkbox-switch"
                />
              </label>

              {/* Private Map */}
              <label className="settings-toggle-item">
                <div className="toggle-text">
                  <strong>🗺️ {copy.privateMapTitle}</strong>
                  <p>{copy.privateMapDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privateMap}
                  onChange={(e) => setPrivateMap(e.target.checked)}
                  className="settings-checkbox-switch"
                />
              </label>

              {/* Show Age & Location */}
              <label className="settings-toggle-item">
                <div className="toggle-text">
                  <strong>📍 {copy.showAgeLocationTitle}</strong>
                  <p>{copy.showAgeLocationDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={showAgeAndLocation}
                  onChange={(e) => setShowAgeAndLocation(e.target.checked)}
                  className="settings-checkbox-switch"
                />
              </label>

              {/* Email Notifications */}
              <label className="settings-toggle-item">
                <div className="toggle-text">
                  <strong>🔔 {copy.notificationsTitle}</strong>
                  <p>{copy.notificationsDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="settings-checkbox-switch"
                />
              </label>
            </div>

            {settingsSuccess && (
              <p className="settings-msg success">{settingsSuccess}</p>
            )}

            <button
              type="button"
              onClick={handleSaveToggles}
              disabled={settingsSaving}
              className="button button-dark button-small settings-action-btn"
            >
              {settingsSaving ? "..." : copy.saveSettingsBtn} ✓
            </button>
          </section>

          {/* Section 3: Danger Zone */}
          <section className="settings-card danger-zone">
            <div className="danger-header">
              <h3 className="danger-title">⚠️ {copy.dangerZone}</h3>
              <p className="danger-desc">{copy.deleteAccountDesc}</p>
            </div>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="button button-danger settings-delete-btn"
              >
                🗑️ {copy.deleteAccountBtn}
              </button>
            ) : (
              <div className="delete-confirm-box">
                <div className="delete-confirm-header">
                  <h4>🚨 {copy.confirmDeleteTitle}</h4>
                  <p>{copy.confirmDeleteDesc}</p>
                </div>

                <div className="delete-password-row">
                  <label>
                    <span>{copy.confirmPasswordPrompt}</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </label>
                </div>

                {deleteError && (
                  <p className="settings-msg error">{deleteError}</p>
                )}

                <div className="delete-actions-row">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="button button-danger-confirm"
                  >
                    {deleteLoading ? copy.deleteInProgress : copy.confirmDeleteAction} ✕
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError("");
                    }}
                    className="button button-outline button-small"
                  >
                    {copy.cancelBtn}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {showAvatarPicker && (
        <AvatarModal
          uid={user.uid}
          username={currentUsername}
          currentAvatar={avatar}
          language={language}
          onClose={() => setShowAvatarPicker(false)}
          onSave={(newAvatar) => {
            setAvatar(newAvatar);
            onProfileUpdate({ avatar: newAvatar });
          }}
        />
      )}
    </div>
  );
}
