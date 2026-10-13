import { useState, useMemo, type FormEvent } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { TravelPreferences } from "./types";
import LocationSelect from "./LocationSelect";
import { getSortedCountries, getCitiesForCountry } from "./lib/worldLocations";

type OnboardingModalProps = {
  uid: string;
  username: string;
  language?: "en" | "ru";
  onComplete: (data: TravelPreferences) => void;
};

export default function OnboardingModal({
  uid,
  username,
  language = "ru",
  onComplete,
}: OnboardingModalProps) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [travelFormat, setTravelFormat] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const copy =
    language === "ru"
      ? {
          stepBadge: "Шаг 2 из 2 • Профиль путешественника",
          title: username ? `Добро пожаловать, @${username}!` : "Расскажите о себе",
          subtitle:
            "Настройте ваш стиль путешествий, чтобы находить единомышленников и сохранять впечатления.",
          locationSection: "Откуда вы?",
          countryLabel: "Страна",
          countryPlaceholder: "Выберите страну или начните вводить...",
          cityLabel: "Город",
          cityPlaceholder: "Выберите город или начните вводить...",
          ageLabel: "Возраст",
          agePlaceholder: "например, 25",
          styleSection: "Стиль путешествия",
          formatSection: "Формат поездок",
          interestsSection: "Топ-3–5 интересов",
          interestsHint: "Выберите от 3 до 5 любимых занятий в поездках",
          selectedCount: (count: number) => `Выбрано: ${count} из 3–5`,
          submitBtn: "Завершить регистрацию",
          submitting: "Сохранение...",
          validationError:
            "Пожалуйста, укажите страну, город, возраст, выберите стиль, формат и хотя бы 3 интереса.",
        }
      : {
          stepBadge: "Step 2 of 2 • Traveler Profile",
          title: username ? `Welcome, @${username}!` : "Tell us about yourself",
          subtitle:
            "Set up your travel style to connect with like-minded explorers and save your impressions.",
          locationSection: "Where are you based?",
          countryLabel: "Country",
          countryPlaceholder: "Select country or start typing...",
          cityLabel: "City",
          cityPlaceholder: "Select city or start typing...",
          ageLabel: "Age",
          agePlaceholder: "e.g., 25",
          styleSection: "Travel Style",
          formatSection: "Travel Format",
          interestsSection: "Top 3–5 Interests",
          interestsHint: "Choose 3 to 5 of your favorite travel activities",
          selectedCount: (count: number) => `Selected: ${count} of 3–5`,
          submitBtn: "Complete Registration",
          submitting: "Saving...",
          validationError:
            "Please provide your country, city, age, style, format, and select at least 3 interests.",
        };

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

  const travelStyles = [
    {
      id: "backpacking",
      ru: "Рюкзак / Бюджет (Бэкпэкинг)",
      en: "Backpacking / Budget",
      icon: "🎒",
    },
    {
      id: "comfort",
      ru: "Комфорт / Отели",
      en: "Comfort / Hotels",
      icon: "🏨",
    },
    {
      id: "extreme",
      ru: "Экстрим / Походы / Горы",
      en: "Extreme / Hiking / Mountains",
      icon: "🧗",
    },
    {
      id: "gastro_culture",
      ru: "Гастротуризм / Культура и музеи",
      en: "Food / Culture & Museums",
      icon: "🍷",
    },
    {
      id: "family",
      ru: "Семейный отдых",
      en: "Family Vacation",
      icon: "👨‍👩‍👧",
    },
  ];

  const travelFormats = [
    {
      id: "solo",
      ru: "Соло-путешественник",
      en: "Solo traveler",
      icon: "🚶",
    },
    {
      id: "couple",
      ru: "Пара",
      en: "Couple",
      icon: "👫",
    },
    {
      id: "company",
      ru: "С компанией",
      en: "With friends / Group",
      icon: "👥",
    },
    {
      id: "family_pets",
      ru: "С детьми / питомцами",
      en: "With kids / pets",
      icon: "👶🐾",
    },
  ];

  const travelInterests = [
    { id: "photo", ru: "Фотография", en: "Photography", icon: "📷" },
    { id: "trekking", ru: "Треккинг", en: "Trekking", icon: "🥾" },
    { id: "street_food", ru: "Уличная еда", en: "Street food", icon: "🍜" },
    { id: "architecture", ru: "Архитектура", en: "Architecture", icon: "🏛" },
    { id: "surfing", ru: "Сёрфинг", en: "Surfing", icon: "🏄" },
    { id: "camping", ru: "Кемпинг", en: "Camping", icon: "⛺" },
    { id: "coffee_shops", ru: "Кофешопы", en: "Coffee shops", icon: "☕" },
    { id: "road_trips", ru: "Автопутешествия", en: "Road trips", icon: "🚗" },
  ];

  const toggleInterest = (name: string) => {
    if (interests.includes(name)) {
      setInterests(interests.filter((i) => i !== name));
    } else {
      if (interests.length >= 5) {
        // Keep max 5 by removing the first
        setInterests([...interests.slice(1), name]);
      } else {
        setInterests([...interests, name]);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!country.trim() || !city.trim() || !age.trim() || !travelStyle || !travelFormat) {
      setError(copy.validationError);
      return;
    }

    if (interests.length < 1) {
      setError(
        language === "ru"
          ? "Выберите хотя бы несколько интересов (рекомендуется от 3 до 5)."
          : "Please choose some interests (3 to 5 recommended)."
      );
      return;
    }

    setLoading(true);
    const locationString = `${city.trim()}, ${country.trim()}`;
    const prefData: TravelPreferences = {
      country: country.trim(),
      city: city.trim(),
      age: Number(age) || age.trim(),
      travelStyle,
      travelFormat,
      interests,
    };

    try {
      await setDoc(
        doc(db, "users", uid),
        {
          ...prefData,
          location: locationString,
          onboardingCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Save locally as well for fast access
      try {
        window.localStorage.setItem(
          `skyring-onboarding-${uid}`,
          JSON.stringify({ ...prefData, location: locationString })
        );
      } catch {
        // ignore
      }

      onComplete(prefData);
    } catch (err) {
      console.warn("Could not save onboarding data to Firestore:", err);
      // Fallback local save so user isn't stuck
      try {
        window.localStorage.setItem(
          `skyring-onboarding-${uid}`,
          JSON.stringify({ ...prefData, location: locationString })
        );
      } catch {
        // ignore
      }
      onComplete(prefData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-overlay" role="presentation">
      <div className="onboarding-modal" role="dialog" aria-modal="true">
        <div className="onboarding-header">
          <span className="onboarding-badge">{copy.stepBadge}</span>
          <h2>{copy.title}</h2>
          <p className="onboarding-subtitle">{copy.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Section 1: Location & Age */}
          <div className="onboarding-section">
            <h3 className="onboarding-section-title">📍 {copy.locationSection}</h3>
            <div className="onboarding-grid-3">
              <LocationSelect
                label={copy.countryLabel}
                value={country}
                onChange={(val) => {
                  setCountry(val);
                  setCity("");
                }}
                options={countryOptions}
                placeholder={copy.countryPlaceholder}
                required
                allowCustom={true}
                emptyMessage={
                  language === "ru"
                    ? "Страна не найдена"
                    : "No country found"
                }
              />

              <LocationSelect
                label={copy.cityLabel}
                value={city}
                onChange={(val) => setCity(val)}
                options={cityOptions}
                placeholder={copy.cityPlaceholder}
                required
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

              <label className="onboarding-age-label">
                <span>{copy.ageLabel} <strong className="required-star">*</strong></span>
                <input
                  type="number"
                  min="12"
                  max="120"
                  required
                  placeholder={copy.agePlaceholder}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Section 2: Travel Style */}
          <div className="onboarding-section">
            <h3 className="onboarding-section-title">🧭 {copy.styleSection}</h3>
            <div className="onboarding-choice-grid">
              {travelStyles.map((style) => {
                const label = language === "ru" ? style.ru : style.en;
                const isSelected = travelStyle === label;
                return (
                  <button
                    type="button"
                    key={style.id}
                    className={`onboarding-choice-card ${isSelected ? "active" : ""}`}
                    onClick={() => setTravelStyle(label)}
                  >
                    <span className="choice-icon">{style.icon}</span>
                    <span className="choice-label">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Travel Format */}
          <div className="onboarding-section">
            <h3 className="onboarding-section-title">👥 {copy.formatSection}</h3>
            <div className="onboarding-choice-grid">
              {travelFormats.map((format) => {
                const label = language === "ru" ? format.ru : format.en;
                const isSelected = travelFormat === label;
                return (
                  <button
                    type="button"
                    key={format.id}
                    className={`onboarding-choice-card ${isSelected ? "active" : ""}`}
                    onClick={() => setTravelFormat(label)}
                  >
                    <span className="choice-icon">{format.icon}</span>
                    <span className="choice-label">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Top 3-5 Interests */}
          <div className="onboarding-section">
            <div className="onboarding-interests-header">
              <h3 className="onboarding-section-title">✨ {copy.interestsSection}</h3>
              <span className="interests-counter">{copy.selectedCount(interests.length)}</span>
            </div>
            <p className="onboarding-hint">{copy.interestsHint}</p>
            <div className="onboarding-interests-chips">
              {travelInterests.map((interest) => {
                const label = language === "ru" ? interest.ru : interest.en;
                const isSelected = interests.includes(label);
                return (
                  <button
                    type="button"
                    key={interest.id}
                    className={`onboarding-chip ${isSelected ? "active" : ""}`}
                    onClick={() => toggleInterest(label)}
                  >
                    <span className="chip-icon">{interest.icon}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="onboarding-error">{error}</p>}

          <div className="onboarding-footer">
            <button
              type="submit"
              disabled={loading}
              className="button button-coral onboarding-submit-btn"
            >
              {loading ? copy.submitting : copy.submitBtn} ↗
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
