import { useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Post } from "./types";
import LocationSelect, { type SelectOption } from "./LocationSelect";
import { WORLD_COUNTRIES } from "./lib/worldLocations";
import UserAvatar from "./UserAvatar";
import HashtagText from "./HashtagText";
import { useModalScrollLock } from "./lib/useModalScrollLock";

type CreatePostModalProps = {
  user: User | null;
  username: string;
  userAvatar?: string;
  language: "en" | "ru";
  onClose: () => void;
  onPostCreated?: (newPost: Post) => void;
};

// Travel preset imagery for quick aesthetic posts
const POST_PRESETS = [
  {
    title: "Рассвет на скалах Амальфи",
    location: "Амальфи, Италия",
    image:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85",
    description:
      "Утренний туман над морем рассеивается, окрашивая скалы в золотистый свет. #italy #amalfi #sunrise #sea",
  },
  {
    title: "Бамбуковая роща в Киото",
    location: "Киото, Япония",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=900&q=85",
    description:
      "Звук покачивающегося бамбука и кристально чистый утренний воздух. #japan #kyoto #nature #zen",
  },
  {
    title: "Вечерний Рим и закат у Колизея",
    location: "Рим, Италия",
    image:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=85",
    description:
      "Вечный город оживает золотыми огнями. Время для неспешной прогулки. #italy #rome #history",
  },
  {
    title: "Воздушные шары над Каппадокией",
    location: "Каппадокия, Турция",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=85",
    description:
      "Сотни шаров поднимаются в небо с первыми лучами солнца. #cappadocia #turkey #adventure",
  },
];

const SUGGESTED_HASHTAGS = [
  "#travel",
  "#nature",
  "#mountains",
  "#sea",
  "#sunrise",
  "#adventure",
  "#architecture",
  "#food",
];

export default function CreatePostModal({
  user,
  username = "",
  userAvatar = "",
  language,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  useModalScrollLock();

  const [title, setTitle] = useState(POST_PRESETS[0].title);
  const [description, setDescription] = useState(POST_PRESETS[0].description);
  const [location, setLocation] = useState(POST_PRESETS[0].location);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [image, setImage] = useState(POST_PRESETS[0].image);
  const [customUrl, setCustomUrl] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate location autocomplete options from WORLD_COUNTRIES
  const locationOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    WORLD_COUNTRIES.forEach((c) => {
      const countryLabel = language === "ru" ? c.ru : c.en;
      list.push({
        value: countryLabel,
        label: countryLabel,
        icon: c.flag,
      });
      c.cities.slice(0, 5).forEach((city) => {
        const cityLabel = `${language === "ru" ? city.ru : city.en}, ${countryLabel}`;
        list.push({
          value: cityLabel,
          label: cityLabel,
          icon: c.flag,
          sublabel: countryLabel,
        });
      });
    });
    return list;
  }, [language]);

  // Handle client-side image compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg(
        language === "ru"
          ? "Пожалуйста, выберите файл изображения."
          : "Please choose an image file.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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
          const compressed = canvas.toDataURL("image/jpeg", 0.86);
          setImage(compressed);
        } else {
          setImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: (typeof POST_PRESETS)[0]) => {
    setTitle(preset.title);
    setLocation(preset.location);
    setImage(preset.image);
    setDescription(preset.description);
  };

  const handleAddHashtag = (tag: string) => {
    if (!description.includes(tag)) {
      setDescription((prev) => (prev ? `${prev.trim()} ${tag}` : tag));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim()) {
      setErrorMsg(
        language === "ru"
          ? "Укажите название публикации."
          : "Please enter a post title.",
      );
      return;
    }

    setIsPublishing(true);
    setErrorMsg("");

    const newPost: Post = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: user.uid,
      authorUsername: username || "traveller",
      authorAvatar: userAvatar || (username || "T").charAt(0).toUpperCase(),
      title: title.trim(),
      image,
      description: description.trim(),
      location: location.trim(),
      date,
      comments: [],
      likes: [],
      createdAt: new Date().toISOString(),
      isArchived: false,
      allowComments,
    };

    try {
      // 1. Fetch current user posts from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const existingPosts = (userSnap.exists() && Array.isArray(userSnap.data()?.posts))
        ? userSnap.data()?.posts
        : [];

      const updatedPosts = [newPost, ...existingPosts];

      // 2. Save merged posts
      await setDoc(userRef, { posts: updatedPosts }, { merge: true });

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      onClose();
    } catch (err) {
      console.error("Failed to publish post:", err);
      setErrorMsg(
        language === "ru"
          ? "Не удалось сохранить публикацию. Попробуйте еще раз."
          : "Could not publish post. Please try again.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const copy =
    language === "ru"
      ? {
          modalTitle: "Новая публикация",
          modalSubtitle:
            "Поделитесь своими путешествиями, впечатлениями и фотографиями с сообществом.",
          titleLabel: "Название публикации *",
          titlePlaceholder: "Например: Рассвет на скалах Амальфи",
          photoLabel: "Фотография поездки",
          uploadBtn: "Загрузить фото с устройства",
          orPresets: "Или выберите красивый travel-кадр:",
          urlPlaceholder: "Или вставьте ссылку на изображение (URL)...",
          applyBtn: "Применить",
          locationLabel: "Местоположение",
          locationPlaceholder: "Выберите страну или город...",
          dateLabel: "Дата поездки",
          descLabel: "Описание и воспоминания",
          descPlaceholder:
            "Расскажите, как прошло путешествие, какие места стоит посетить и что запомнилось больше всего...",
          allowComments: "Разрешить комментарии к этой публикации",
          cancelBtn: "Отмена",
          publishBtn: "Опубликовать пост ↗",
          publishingBtn: "Публикация...",
          previewTitle: "ПРЕДПРОСМОТР КАРТОЧКИ",
        }
      : {
          modalTitle: "Create New Post",
          modalSubtitle:
            "Share your journey, impressions, and photos with the travel community.",
          titleLabel: "Post Title *",
          titlePlaceholder: "e.g. Sunrise over Amalfi cliffs",
          photoLabel: "Trip Photo",
          uploadBtn: "Upload photo from device",
          orPresets: "Or choose a travel scene:",
          urlPlaceholder: "Or paste image URL...",
          applyBtn: "Apply",
          locationLabel: "Location",
          locationPlaceholder: "Select country or city...",
          dateLabel: "Trip Date",
          descLabel: "Description & Memories",
          descPlaceholder:
            "Describe your adventure, hidden spots, and travel tips...",
          allowComments: "Allow comments on this post",
          cancelBtn: "Cancel",
          publishBtn: "Publish Post ↗",
          publishingBtn: "Publishing...",
          previewTitle: "CARD PREVIEW",
        };

  return (
    <div
      className="create-post-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="create-post-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="create-post-header">
          <div className="create-post-header-title">
            <span className="create-post-badge-icon">➕</span>
            <div>
              <h3>{copy.modalTitle}</h3>
              <p className="create-post-subtitle">{copy.modalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="create-post-close-btn"
            onClick={onClose}
            title={copy.cancelBtn}
          >
            ✕
          </button>
        </div>

        {errorMsg && <div className="create-post-error-banner">{errorMsg}</div>}

        <div className="create-post-modal-grid">
          {/* ================= LEFT: LIVE PREVIEW CARD ================= */}
          <div className="create-post-preview-col">
            <span className="create-post-col-heading">{copy.previewTitle}</span>
            <div className="create-post-card-preview">
              <div className="create-post-preview-header">
                <UserAvatar
                  avatar={userAvatar}
                  username={username || "you"}
                  size={36}
                />
                <div className="create-post-preview-author">
                  <strong>@{username || "you"}</strong>
                  {location && <span>📍 {location}</span>}
                </div>
              </div>

              {image && (
                <div className="create-post-preview-img-wrap">
                  <img src={image} alt="Preview" />
                </div>
              )}

              <div className="create-post-preview-body">
                <h4 className="create-post-preview-title">
                  {title || "Название публикации"}
                </h4>
                {description && (
                  <div className="create-post-preview-desc">
                    <HashtagText text={description} />
                  </div>
                )}
                <div className="create-post-preview-meta">
                  <span>📅 {date}</span>
                  <span>💬 {allowComments ? (language === "ru" ? "Комментарии открыты" : "Comments allowed") : (language === "ru" ? "Комментарии выключены" : "Comments off")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT: FORM FIELDS ================= */}
          <form className="create-post-form-col" onSubmit={handleSubmit}>
            {/* Title */}
            <div className="create-post-field-group">
              <label className="create-post-label">{copy.titleLabel}</label>
              <input
                type="text"
                className="input-text"
                maxLength={90}
                required
                placeholder={copy.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Photo Selection */}
            <div className="create-post-field-group">
              <label className="create-post-label">{copy.photoLabel}</label>

              <div className="create-post-upload-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="button button-small button-outline upload-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg
                    width="15"
                    height="15"
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
                  {copy.uploadBtn}
                </button>
              </div>

              {/* Presets Cards */}
              <div className="create-post-presets-wrap">
                <span className="create-post-subtext">{copy.orPresets}</span>
                <div className="create-post-presets-grid">
                  {POST_PRESETS.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      className={`create-post-preset-card ${image === p.image ? "active" : ""}`}
                      onClick={() => handleApplyPreset(p)}
                    >
                      <img src={p.image} alt={p.title} />
                      <span>{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom URL */}
              <div className="create-post-url-row">
                <input
                  type="url"
                  className="input-text"
                  placeholder={copy.urlPlaceholder}
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="button button-small button-outline"
                  onClick={() => {
                    if (customUrl.trim()) setImage(customUrl.trim());
                  }}
                >
                  {copy.applyBtn}
                </button>
              </div>
            </div>

            {/* Location & Date Row */}
            <div className="create-post-row-2">
              <div className="create-post-field-group">
                <LocationSelect
                  label={copy.locationLabel}
                  value={location}
                  onChange={setLocation}
                  options={locationOptions}
                  placeholder={copy.locationPlaceholder}
                  allowCustom={true}
                />
              </div>

              <div className="create-post-field-group">
                <label className="create-post-label">{copy.dateLabel}</label>
                <input
                  type="date"
                  className="input-text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Description & Hashtags */}
            <div className="create-post-field-group">
              <label className="create-post-label">{copy.descLabel}</label>
              <textarea
                className="input-text create-post-textarea"
                rows={3}
                placeholder={copy.descPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Suggested Hashtags */}
              <div className="create-post-hashtag-chips">
                <span className="hashtag-chips-label"># хэштеги:</span>
                {SUGGESTED_HASHTAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="hashtag-pill-btn"
                    onClick={() => handleAddHashtag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Allow Comments Toggle */}
            <div className="create-post-comments-toggle">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                />
                <span>{copy.allowComments}</span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="create-post-actions-footer">
              <button
                type="button"
                className="button button-outline"
                onClick={onClose}
                disabled={isPublishing}
              >
                {copy.cancelBtn}
              </button>
              <button
                type="submit"
                className="button button-coral create-post-submit-btn"
                disabled={isPublishing || !title.trim()}
              >
                {isPublishing ? copy.publishingBtn : copy.publishBtn}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
