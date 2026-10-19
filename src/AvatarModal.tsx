import { useState, useRef, type ChangeEvent } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import UserAvatar from "./UserAvatar";
import { useModalScrollLock } from "./lib/useModalScrollLock";

type AvatarModalProps = {
  uid: string;
  username: string;
  currentAvatar?: string;
  language?: "en" | "ru";
  onClose: () => void;
  onSave: (newAvatar: string) => void;
};

const TRAVEL_EMOJIS = [
  "✈️", "🏔️", "🏕️", "🧭", "🎒", "🏄", "📸", "🗺️",
  "🌴", "🚗", "🚂", "🚲", "🌅", "🏖️", "⛵", "🎿",
  "🦁", "🐬", "🦊", "🦅", "⛺", "🗽", "🗼", "🌍"
];

// Curated travel avatars from Unsplash for quick choice
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
];

export default function AvatarModal({
  uid,
  username,
  currentAvatar = "",
  language = "ru",
  onClose,
  onSave,
}: AvatarModalProps) {
  useModalScrollLock();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);
  const [urlInput, setUrlInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "presets">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copy =
    language === "ru"
      ? {
          title: "Фото профиля",
          subtitle: "Загрузите снимок, выберите тревел-иконку или укажите ссылку",
          previewLabel: "Предпросмотр",
          tabUpload: "Загрузить фото",
          tabUrl: "Указать ссылку",
          tabPresets: "Тревел-иконки",
          chooseFileBtn: "📁 Выбрать фото с устройства",
          fileHint: "Поддерживаются PNG, JPG, WebP. Автоматическое масштабирование.",
          urlPlaceholder: "https://example.com/avatar.jpg",
          applyUrlBtn: "Применить ссылку",
          removeAvatarBtn: "Удалить фото (вернуть букву)",
          cancel: "Отмена",
          save: "Сохранить фото",
          saving: "Сохранение...",
          success: "Фото профиля успешно обновлено!",
          errorRead: "Не удалось прочитать изображение. Попробуйте другой файл.",
          errorSave: "Ошибка при сохранении фото. Попробуйте еще раз.",
        }
      : {
          title: "Profile Photo",
          subtitle: "Upload a picture, pick a travel icon, or enter an image URL",
          previewLabel: "Preview",
          tabUpload: "Upload photo",
          tabUrl: "Image URL",
          tabPresets: "Travel icons",
          chooseFileBtn: "📁 Choose photo from device",
          fileHint: "Supports PNG, JPG, WebP. Automatically resized and optimized.",
          urlPlaceholder: "https://example.com/avatar.jpg",
          applyUrlBtn: "Apply URL",
          removeAvatarBtn: "Remove photo (revert to letter)",
          cancel: "Cancel",
          save: "Save photo",
          saving: "Saving...",
          success: "Profile photo updated successfully!",
          errorRead: "Could not read image file. Please try another.",
          errorSave: "Could not save photo. Please try again.",
        };

  // Helper to compress/crop image to square Data URL (max 400x400)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        language === "ru"
          ? "Пожалуйста, выберите файл изображения"
          : "Please choose an image file"
      );
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          // Square center crop calculation
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          const canvas = document.createElement("canvas");
          const targetSize = Math.min(minDim, maxDim);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("No canvas context");

          // High quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize
          );

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setSelectedAvatar(compressedDataUrl);
        } catch {
          setError(copy.errorRead);
        }
      };
      img.onerror = () => {
        setError(copy.errorRead);
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setError(copy.errorRead);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setSelectedAvatar(trimmed);
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar("");
    setUrlInput("");
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      if (uid) {
        await updateDoc(doc(db, "users", uid), {
          avatar: selectedAvatar,
        });
      }
      onSave(selectedAvatar);
      onClose();
    } catch (err) {
      console.warn("Could not save avatar:", err);
      // Fallback local update even if Firestore fails
      onSave(selectedAvatar);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="avatar-modal-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="avatar-modal" role="dialog" aria-modal="true">
        <div className="avatar-modal-header">
          <div>
            <h2>📷 {copy.title}</h2>
            <p className="avatar-modal-subtitle">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            className="avatar-modal-close"
            onClick={onClose}
            aria-label={copy.cancel}
          >
            ✕
          </button>
        </div>

        {/* Live Preview */}
        <div className="avatar-preview-section">
          <div className="avatar-preview-wrapper">
            <UserAvatar
              avatar={selectedAvatar}
              username={username}
              size={120}
              className="avatar-large-preview"
            />
          </div>
          <div className="avatar-preview-info">
            <strong>@{username}</strong>
            <span className="avatar-preview-hint">
              {selectedAvatar
                ? selectedAvatar.startsWith("data:")
                  ? language === "ru"
                    ? "Загружено с устройства"
                    : "Uploaded from device"
                  : selectedAvatar.startsWith("http")
                  ? language === "ru"
                    ? "Изображение по ссылке"
                    : "Image URL"
                  : language === "ru"
                  ? "Символ / эмодзи"
                  : "Emoji / Icon"
                : language === "ru"
                ? "Стандартная буква"
                : "Default initial"}
            </span>
            {selectedAvatar && (
              <button
                type="button"
                className="button-text avatar-remove-link"
                onClick={handleRemoveAvatar}
              >
                🗑️ {copy.removeAvatarBtn}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="avatar-tabs">
          <button
            type="button"
            className={`avatar-tab ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            📁 {copy.tabUpload}
          </button>
          <button
            type="button"
            className={`avatar-tab ${activeTab === "presets" ? "active" : ""}`}
            onClick={() => setActiveTab("presets")}
          >
            ✈️ {copy.tabPresets}
          </button>
          <button
            type="button"
            className={`avatar-tab ${activeTab === "url" ? "active" : ""}`}
            onClick={() => setActiveTab("url")}
          >
            🔗 {copy.tabUrl}
          </button>
        </div>

        {/* Tab Content */}
        <div className="avatar-tab-content">
          {activeTab === "upload" && (
            <div className="avatar-upload-panel">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="button button-coral avatar-file-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {copy.chooseFileBtn}
              </button>
              <p className="avatar-file-hint">{copy.fileHint}</p>
            </div>
          )}

          {activeTab === "presets" && (
            <div className="avatar-presets-panel">
              <p className="avatar-presets-label">
                {language === "ru"
                  ? "Тревел-фотографии:"
                  : "Travel photos:"}
              </p>
              <div className="avatar-preset-photos-grid">
                {PRESET_AVATARS.map((photoUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`avatar-preset-photo-btn ${selectedAvatar === photoUrl ? "selected" : ""}`}
                    onClick={() => setSelectedAvatar(photoUrl)}
                  >
                    <img src={photoUrl} alt="Preset avatar" />
                  </button>
                ))}
              </div>

              <p className="avatar-presets-label" style={{ marginTop: "12px" }}>
                {language === "ru"
                  ? "Иконки и эмодзи:"
                  : "Icons & emojis:"}
              </p>
              <div className="avatar-emoji-grid">
                {TRAVEL_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`avatar-emoji-btn ${selectedAvatar === emoji ? "selected" : ""}`}
                    onClick={() => setSelectedAvatar(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "url" && (
            <div className="avatar-url-panel">
              <div className="avatar-url-input-row">
                <input
                  type="url"
                  placeholder={copy.urlPlaceholder}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="avatar-url-input"
                />
                <button
                  type="button"
                  className="button button-outline"
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim()}
                >
                  {copy.applyUrlBtn}
                </button>
              </div>
              <small className="avatar-file-hint">
                {language === "ru"
                  ? "Вставьте прямую ссылку на картинку (JPG, PNG, WebP)"
                  : "Paste a direct link to an image (JPG, PNG, WebP)"}
              </small>
            </div>
          )}
        </div>

        {error && <p className="avatar-error-msg">{error}</p>}

        {/* Footer Actions */}
        <div className="avatar-modal-footer">
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
            disabled={loading}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="button button-coral"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? copy.saving : copy.save} ✓
          </button>
        </div>
      </div>
    </div>
  );
}
