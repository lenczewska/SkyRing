import { useState, useRef } from "react";
import type { User } from "firebase/auth";
import { STORY_TRAVEL_PRESETS } from "./lib/storiesService";
import UserAvatar from "./UserAvatar";

type CreateStoryModalProps = {
  user: User | null;
  username: string;
  userAvatar?: string;
  language: "en" | "ru";
  onClose: () => void;
  onStoryCreated: (data: {
    mediaUrl: string;
    caption?: string;
    location?: string;
  }) => Promise<void>;
};

export default function CreateStoryModal({
  username,
  userAvatar = "",
  language,
  onClose,
  onStoryCreated,
}: CreateStoryModalProps) {
  const [selectedImage, setSelectedImage] = useState<string>(
    STORY_TRAVEL_PRESETS[0].url,
  );
  const [caption, setCaption] = useState<string>(
    STORY_TRAVEL_PRESETS[0].caption,
  );
  const [location, setLocation] = useState<string>(
    STORY_TRAVEL_PRESETS[0].location,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress and handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(
        language === "ru"
          ? "Пожалуйста, выберите файл изображения."
          : "Please select an image file.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize canvas to max 1280x1280 to maintain high visual quality without excessive byte size
        const canvas = document.createElement("canvas");
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setSelectedImage(compressed);
        } else {
          setSelectedImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: (typeof STORY_TRAVEL_PRESETS)[0]) => {
    setSelectedImage(preset.url);
    if (!caption) setCaption(preset.caption);
    if (!location) setLocation(preset.location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    setIsSubmitting(true);
    try {
      await onStoryCreated({
        mediaUrl: selectedImage,
        caption: caption.trim(),
        location: location.trim(),
      });
      onClose();
    } catch (err) {
      console.error("Failed to publish story:", err);
      alert(
        language === "ru"
          ? "Не удалось опубликовать историю. Попробуйте еще раз."
          : "Failed to publish story. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="story-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="create-story-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="create-story-header">
          <div className="create-story-header-title">
            <span className="create-story-icon">✨</span>
            <h3>
              {language === "ru" ? "Создать новую историю" : "Create new story"}
            </h3>
          </div>
          <button
            className="create-story-close-btn"
            onClick={onClose}
            title={language === "ru" ? "Закрыть" : "Close"}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="create-story-body">
          {/* Live Preview Card */}
          <div className="create-story-preview-col">
            <span className="create-story-preview-label">
              {language === "ru" ? "Предпросмотр сторис" : "Story Preview"}
            </span>
            <div className="create-story-phone-preview">
              <div className="preview-progress-bar">
                <div className="preview-progress-segment active" />
              </div>
              <div className="preview-story-header">
                <UserAvatar
                  avatar={userAvatar}
                  username={username || "you"}
                  size={32}
                />
                <div className="preview-meta">
                  <span className="preview-username">
                    @{username || "you"}
                  </span>
                  {location && (
                    <span className="preview-location">📍 {location}</span>
                  )}
                </div>
              </div>

              <img
                src={selectedImage}
                alt="Story preview"
                className="preview-story-image"
              />

              {caption && (
                <div className="preview-caption-pill">
                  <p>{caption}</p>
                </div>
              )}
            </div>
          </div>

          {/* Form & Controls */}
          <form className="create-story-form-col" onSubmit={handleSubmit}>
            {/* Upload or Preset Selection */}
            <div className="create-story-section">
              <label className="create-story-label">
                {language === "ru" ? "Фотография истории" : "Story Photo"}
              </label>

              <div className="create-story-upload-row">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="button button-small button-primary create-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {language === "ru"
                    ? "Загрузить с устройства"
                    : "Upload from device"}
                </button>
              </div>

              {/* Presets Grid */}
              <div className="create-story-presets">
                <span className="presets-sublabel">
                  {language === "ru"
                    ? "Или выберите travel-кадр:"
                    : "Or pick a travel scene:"}
                </span>
                <div className="presets-cards-grid">
                  {STORY_TRAVEL_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`preset-thumb-btn ${
                        selectedImage === preset.url ? "preset-selected" : ""
                      }`}
                      onClick={() => handleApplyPreset(preset)}
                    >
                      <img src={preset.url} alt={preset.label} />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom URL Input */}
              <div className="custom-url-row">
                <input
                  type="url"
                  className="input-text"
                  placeholder={
                    language === "ru"
                      ? "Или вставьте ссылку на фото (URL)"
                      : "Or paste image URL"
                  }
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                />
                <button
                  type="button"
                  className="button button-small button-outline"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      setSelectedImage(customUrlInput.trim());
                    }
                  }}
                >
                  {language === "ru" ? "Применить" : "Apply"}
                </button>
              </div>
            </div>

            {/* Caption Input */}
            <div className="create-story-section">
              <label className="create-story-label">
                {language === "ru" ? "Подпись к истории" : "Caption"}
              </label>
              <input
                type="text"
                className="input-text"
                maxLength={100}
                placeholder={
                  language === "ru"
                    ? "Например: Встречаем закат в горах 🌄"
                    : "e.g. Chasing the golden sunset 🌄"
                }
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <span className="input-hint">
                {caption.length}/100 {language === "ru" ? "символов" : "chars"}
              </span>
            </div>

            {/* Location Input */}
            <div className="create-story-section">
              <label className="create-story-label">
                {language === "ru" ? "Геолокация" : "Location"}
              </label>
              <input
                type="text"
                className="input-text"
                maxLength={50}
                placeholder={
                  language === "ru"
                    ? "Например: Рим, Италия или Алматы"
                    : "e.g. Rome, Italy or Bali"
                }
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <p className="story-lifespan-notice">
              ⏱️{" "}
              {language === "ru"
                ? "История будет активна в течение 24 часов."
                : "Your story will be visible for 24 hours."}
            </p>

            {/* Actions */}
            <div className="create-story-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {language === "ru" ? "Отмена" : "Cancel"}
              </button>
              <button
                type="submit"
                className="button button-primary create-publish-btn"
                disabled={isSubmitting || !selectedImage}
              >
                {isSubmitting
                  ? language === "ru"
                    ? "Публикация..."
                    : "Publishing..."
                  : language === "ru"
                  ? "Опубликовать историю ✨"
                  : "Share to Stories ✨"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
