import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { VisitedPlace } from "./types";
import { findCountry } from "./lib/worldLocations";
import { useModalScrollLock } from "./lib/useModalScrollLock";

type VisitedPlacesModalProps = {
  username: string;
  places: VisitedPlace[];
  language?: "en" | "ru";
  isOwnProfile?: boolean;
  onClose: () => void;
};

export default function VisitedPlacesModal({
  username,
  places,
  language = "ru",
  isOwnProfile = false,
  onClose,
}: VisitedPlacesModalProps) {
  useModalScrollLock();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const copy =
    language === "ru"
      ? {
          title: "Посещённые места",
          subtitle: `Отметки на карте путешественника @${username}`,
          placesCount: (count: number) =>
            `${count} ${count === 1 ? "место" : count < 5 ? "места" : "мест"}`,
          searchPlaceholder: "Поиск по городам и странам...",
          emptySearch: "Места по вашему запросу не найдены",
          emptyPlaces:
            "Этот путешественник пока не отметил посещённые места на карте.",
          emptyOwn:
            "Вы ещё не добавили посещённые страны и города на свою карту.",
          viewOnMapBtn: "Посмотреть на карте 3D 🗺️",
          addPlacesBtn: "+ Отметить места на карте",
          close: "Закрыть",
          coordinates: "Координаты",
        }
      : {
          title: "Visited Places",
          subtitle: `Marked travel destinations by @${username}`,
          placesCount: (count: number) =>
            `${count} ${count === 1 ? "place" : "places"}`,
          searchPlaceholder: "Search cities and countries...",
          emptySearch: "No places match your query",
          emptyPlaces:
            "This traveler hasn't marked any places on the map yet.",
          emptyOwn:
            "You haven't marked any visited cities or countries on your map yet.",
          viewOnMapBtn: "View on 3D Map 🗺️",
          addPlacesBtn: "+ Mark places on map",
          close: "Close",
          coordinates: "Coordinates",
        };

  const filteredPlaces = places.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.label?.toLowerCase().includes(q) ||
      p.country?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  const handleOpenPlaceOnMap = (place: VisitedPlace) => {
    onClose();
    // Navigate to map with coordinates in URL state / search params
    navigate(`/map?lat=${place.latitude}&lng=${place.longitude}&label=${encodeURIComponent(place.label)}`);
  };

  return (
    <div
      className="visited-places-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="visited-places-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="visited-places-header">
          <div>
            <h2>🌍 {copy.title}</h2>
            <p className="visited-places-subtitle">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            className="visited-places-close-btn"
            onClick={onClose}
            aria-label={copy.close}
          >
            ✕
          </button>
        </div>

        {/* Count and actions banner */}
        <div className="visited-places-top-bar">
          <span className="visited-count-badge">
            📍 {copy.placesCount(places.length)}
          </span>

          {isOwnProfile && (
            <button
              type="button"
              className="button button-coral button-small add-place-quick-btn"
              onClick={() => {
                onClose();
                navigate("/map");
              }}
            >
              {copy.addPlacesBtn}
            </button>
          )}
        </div>

        {/* Search if there are multiple places */}
        {places.length > 3 && (
          <div className="visited-search-box">
            <input
              type="text"
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="visited-search-input"
            />
          </div>
        )}

        {/* Places List */}
        <div className="visited-places-list-container">
          {filteredPlaces.length > 0 ? (
            <div className="visited-places-grid">
              {filteredPlaces.map((place) => {
                const countryInfo = place.country
                  ? findCountry(place.country)
                  : undefined;
                const flag = countryInfo?.flag || "📍";

                return (
                  <div key={place.id} className="visited-place-card">
                    <div className="visited-place-head">
                      <span className="visited-place-flag">{flag}</span>
                      <div className="visited-place-titles">
                        <strong className="visited-place-name">
                          {place.label}
                        </strong>
                        <span className="visited-place-coords">
                          {copy.coordinates}: {place.latitude.toFixed(2)}°,{" "}
                          {place.longitude.toFixed(2)}°
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button button-outline button-small view-place-btn"
                      onClick={() => handleOpenPlaceOnMap(place)}
                    >
                      {copy.viewOnMapBtn}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : places.length > 0 ? (
            <div className="visited-empty-state">
              <p>{copy.emptySearch}</p>
            </div>
          ) : (
            <div className="visited-empty-state">
              <span className="visited-empty-icon">🗺️</span>
              <p>{isOwnProfile ? copy.emptyOwn : copy.emptyPlaces}</p>
              {isOwnProfile && (
                <button
                  type="button"
                  className="button button-coral"
                  onClick={() => {
                    onClose();
                    navigate("/map");
                  }}
                >
                  {copy.addPlacesBtn}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="visited-places-footer">
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
          >
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  );
}
