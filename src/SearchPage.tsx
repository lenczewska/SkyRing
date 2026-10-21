import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { User } from "firebase/auth";
import type { UserSummary } from "./types";
import {
  getLocalFollowing,
  searchTravelers,
  toggleFollow,
} from "./lib/friendsService";
import { WORLD_COUNTRIES, type CountryData } from "./lib/worldLocations";
import UserAvatar from "./UserAvatar";

type SearchPageProps = {
  user: User | null;
  username?: string;
  language: "en" | "ru";
  onRequestAuth?: () => void;
};

type SearchTab = "all" | "people" | "countries" | "places";

export type PlaceResult = {
  id: string;
  cityName: string;
  cityNameAlt: string;
  countryName: string;
  countryNameAlt: string;
  countryFlag: string;
  countryCode: string;
};

const POPULAR_SEARCH_CHIPS = [
  { label: "🇯🇵 Япония", query: "Япония", tab: "countries" as SearchTab },
  { label: "🇮🇹 Италия", query: "Италия", tab: "countries" as SearchTab },
  { label: "🇫🇷 Франция", query: "Франция", tab: "countries" as SearchTab },
  { label: "🇹🇷 Турция", query: "Турция", tab: "countries" as SearchTab },
  { label: "🇪🇸 Испания", query: "Испания", tab: "countries" as SearchTab },
  { label: "🇦🇿 Азербайджан", query: "Азербайджан", tab: "countries" as SearchTab },
  { label: "Рим", query: "Рим", tab: "places" as SearchTab },
  { label: "Париж", query: "Париж", tab: "places" as SearchTab },
  { label: "Токио", query: "Токио", tab: "places" as SearchTab },
  { label: "Баку", query: "Баку", tab: "places" as SearchTab },
  { label: "Стамбул", query: "Стамбул", tab: "places" as SearchTab },
];

export default function SearchPage({
  user,
  username = "",
  language,
  onRequestAuth,
}: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get("q") ?? "";
  const initialTab = (searchParams.get("type") as SearchTab) || "all";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);

  // People results
  const [travelers, setTravelers] = useState<UserSummary[]>([]);
  const [loadingTravelers, setLoadingTravelers] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Sync state with URL params
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    const urlType = (searchParams.get("type") as SearchTab) || "all";
    if (urlQ !== query) setQuery(urlQ);
    if (urlType !== activeTab) setActiveTab(urlType);
  }, [searchParams]);

  // Update URL params on user query or tab change
  const updateUrl = (newQuery: string, newTab: SearchTab) => {
    const nextParams = new URLSearchParams();
    if (newQuery.trim()) nextParams.set("q", newQuery.trim());
    if (newTab !== "all") nextParams.set("type", newTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    updateUrl(query, tab);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    updateUrl(val, activeTab);
  };

  // Search travelers with debounce
  useEffect(() => {
    let active = true;
    setLoadingTravelers(true);

    const timer = setTimeout(() => {
      searchTravelers(query, user?.uid, username).then((results) => {
        if (!active) return;
        setTravelers(results);

        const currentFollowing = getLocalFollowing(user?.uid);
        const fMap: Record<string, boolean> = {};
        currentFollowing.forEach((id) => {
          fMap[id.toLowerCase()] = true;
        });
        setFollowingMap(fMap);
        setLoadingTravelers(false);
      });
    }, 160);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, user?.uid, username]);

  // Follow / Unfollow handler
  const handleToggleFollow = async (t: UserSummary) => {
    if (!user) {
      onRequestAuth?.();
      return;
    }
    const isNow = !followingMap[t.username.toLowerCase()];
    setFollowingMap((prev) => ({
      ...prev,
      [t.username.toLowerCase()]: isNow,
      [t.uid.toLowerCase()]: isNow,
    }));

    await toggleFollow(
      { uid: user.uid, username: username || "traveller" },
      { uid: t.uid, username: t.username },
    );
  };

  // Filter countries
  const filteredCountries = useMemo<CountryData[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty, return top featured countries
      const featuredCodes = ["IT", "FR", "JP", "ES", "TR", "US", "RU", "AZ", "DE", "GR", "PT", "TH"];
      return WORLD_COUNTRIES.filter((c) => featuredCodes.includes(c.code));
    }
    return WORLD_COUNTRIES.filter((c) => {
      const matchRu = c.ru.toLowerCase().includes(q);
      const matchEn = c.en.toLowerCase().includes(q);
      const matchCode = c.code.toLowerCase() === q;
      return matchRu || matchEn || matchCode;
    });
  }, [query]);

  // Filter places / cities
  const filteredPlaces = useMemo<PlaceResult[]>(() => {
    const q = query.trim().toLowerCase();
    const results: PlaceResult[] = [];

    for (const c of WORLD_COUNTRIES) {
      const cNameRu = c.ru;
      const cNameEn = c.en;
      const cName = language === "ru" ? cNameRu : cNameEn;
      const cNameAlt = language === "ru" ? cNameEn : cNameRu;

      for (const city of c.cities) {
        const cityName = language === "ru" ? city.ru : city.en;
        const cityNameAlt = language === "ru" ? city.en : city.ru;

        if (!q) {
          // If query is empty, pick top world capital/popular cities
          if (results.length < 18) {
            results.push({
              id: `${c.code}-${city.en}`,
              cityName,
              cityNameAlt,
              countryName: cName,
              countryNameAlt: cNameAlt,
              countryFlag: c.flag,
              countryCode: c.code,
            });
          }
          continue;
        }

        const matchCityRu = city.ru.toLowerCase().includes(q);
        const matchCityEn = city.en.toLowerCase().includes(q);
        const matchCountryRu = cNameRu.toLowerCase().includes(q);
        const matchCountryEn = cNameEn.toLowerCase().includes(q);

        if (matchCityRu || matchCityEn || matchCountryRu || matchCountryEn) {
          results.push({
            id: `${c.code}-${city.en}`,
            cityName,
            cityNameAlt,
            countryName: cName,
            countryNameAlt: cNameAlt,
            countryFlag: c.flag,
            countryCode: c.code,
          });
        }
      }
    }

    return results;
  }, [query, language]);

  // Handle clicking a country to switch to people in that country
  const handleCountryTravelersSearch = (countryName: string) => {
    handleQueryChange(countryName);
    handleTabChange("people");
  };

  // Handle clicking a city to switch to people in that city
  const handleCityTravelersSearch = (cityName: string) => {
    handleQueryChange(cityName);
    handleTabChange("people");
  };

  const copy =
    language === "ru"
      ? {
          eyebrow: "ПОИСК И ИССЛЕДОВАНИЕ",
          title: "Места, страны и люди, которые вдохновляют.",
          subtitle:
            "Находите единомышленников, открывайте интересные страны и исследуйте новые города для будущих путешествий.",
          placeholder:
            activeTab === "people"
              ? "Поиск людей по имени, логину или городу..."
              : activeTab === "countries"
              ? "Поиск стран (например: Япония, Италия, Франция)..."
              : activeTab === "places"
              ? "Поиск городов и мест (например: Рим, Париж, Токио)..."
              : "Поиск мест, стран, городов и друзей...",
          tabAll: "Все",
          tabPeople: "Люди",
          tabCountries: "Страны",
          tabPlaces: "Места и города",
          quickTags: "Популярные запросы:",
          clear: "Очистить",
          peopleTitle: "Люди и путешественники",
          countriesTitle: "Страны мира",
          placesTitle: "Места и популярные города",
          viewAllPeople: "Все путешественники",
          viewAllCountries: "Все страны",
          viewAllPlaces: "Все города",
          openMap: "На карте",
          diary: "Дневник",
          follow: "+ Подписаться",
          following: "В подписках",
          mutual: "Взаимно",
          placesCount: "мест",
          postsCount: "постов",
          followersCount: "подписчиков",
          catalogedCities: "городов в каталоге",
          findTravelersFromCountry: "Путешественники отсюда",
          findTravelersFromCity: "Кто здесь был",
          emptyTitle: "Ничего не найдено",
          emptySub: "Попробуйте изменить поисковый запрос или выбрать другую категорию.",
          resetSearch: "Сбросить фильтры",
          feedBtn: "Лента подписок",
          chatBtn: "Сообщение",
        }
      : {
          eyebrow: "SEARCH & EXPLORE",
          title: "Places, countries, and travelers that inspire.",
          subtitle:
            "Connect with kindred spirits, discover breathtaking countries, and explore cities for your next adventures.",
          placeholder:
            activeTab === "people"
              ? "Search people by username, name, or city..."
              : activeTab === "countries"
              ? "Search countries (e.g. Japan, Italy, France)..."
              : activeTab === "places"
              ? "Search cities and destinations (e.g. Rome, Paris)..."
              : "Search places, countries, cities, and travelers...",
          tabAll: "All",
          tabPeople: "People",
          tabCountries: "Countries",
          tabPlaces: "Places & Cities",
          quickTags: "Popular searches:",
          clear: "Clear",
          peopleTitle: "Travelers & Friends",
          countriesTitle: "Countries",
          placesTitle: "Destinations & Cities",
          viewAllPeople: "All travelers",
          viewAllCountries: "All countries",
          viewAllPlaces: "All places",
          openMap: "On Map",
          diary: "Diary",
          follow: "+ Follow",
          following: "Following",
          mutual: "Mutual",
          placesCount: "places",
          postsCount: "posts",
          followersCount: "followers",
          catalogedCities: "cataloged cities",
          findTravelersFromCountry: "Travelers here",
          findTravelersFromCity: "Who visited",
          emptyTitle: "No results found",
          emptySub: "Try refining your query or switching to another category tab.",
          resetSearch: "Reset search",
          feedBtn: "Following Feed",
          chatBtn: "Message",
        };

  const totalResultsCount =
    travelers.length + filteredCountries.length + filteredPlaces.length;

  return (
    <section className="subpage container search-page-container">
      {/* Hero Header */}
      <div className="search-page-hero">
        <div className="search-page-heading">
          <p className="eyebrow">
            <span /> {copy.eyebrow}
          </p>
          <h1>{copy.title}</h1>
          <p className="subpage-intro">{copy.subtitle}</p>
        </div>
        <Link to="/posts" className="button button-outline search-hero-feed-btn">
          {copy.feedBtn} ↗
        </Link>
      </div>

      {/* Unified Search Input Bar */}
      <div className="search-bar-outer">
        <div className="search-bar-box">
          <span className="search-bar-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="search-bar-input"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={copy.placeholder}
            autoFocus
          />
          {query && (
            <button
              className="search-bar-clear-btn"
              onClick={() => handleQueryChange("")}
              type="button"
              aria-label={copy.clear}
            >
              ×
            </button>
          )}
        </div>

        {/* Popular Quick Suggestions Chips */}
        <div className="search-quick-tags-row">
          <span className="search-quick-label">{copy.quickTags}</span>
          <div className="search-chips-scroll">
            {POPULAR_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className={`search-chip-btn ${query === chip.query ? "active" : ""}`}
                onClick={() => {
                  handleQueryChange(chip.query);
                  handleTabChange(chip.tab);
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Tabs Bar */}
      <div className="search-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "all"}
          className={`search-tab-pill ${activeTab === "all" ? "active" : ""}`}
          onClick={() => handleTabChange("all")}
        >
          <span className="search-tab-icon">✨</span>
          <span>{copy.tabAll}</span>
          {query && (
            <span className="search-tab-count">{totalResultsCount}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "people"}
          className={`search-tab-pill ${activeTab === "people" ? "active" : ""}`}
          onClick={() => handleTabChange("people")}
        >
          <span className="search-tab-icon">👥</span>
          <span>{copy.tabPeople}</span>
          <span className="search-tab-count">{travelers.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "countries"}
          className={`search-tab-pill ${activeTab === "countries" ? "active" : ""}`}
          onClick={() => handleTabChange("countries")}
        >
          <span className="search-tab-icon">🌍</span>
          <span>{copy.tabCountries}</span>
          <span className="search-tab-count">{filteredCountries.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "places"}
          className={`search-tab-pill ${activeTab === "places" ? "active" : ""}`}
          onClick={() => handleTabChange("places")}
        >
          <span className="search-tab-icon">📍</span>
          <span>{copy.tabPlaces}</span>
          <span className="search-tab-count">{filteredPlaces.length}</span>
        </button>
      </div>

      {/* Main Results Display */}
      <div className="search-results-area">
        {/* Loading Indicator for People */}
        {loadingTravelers && activeTab === "people" && (
          <div className="search-loading-row">
            <div className="brand-mark search-loader-icon" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <span>
              {language === "ru" ? "Ищем путешественников..." : "Finding travelers..."}
            </span>
          </div>
        )}

        {/* TAB: ALL */}
        {activeTab === "all" && (
          <div className="search-all-sections">
            {/* 1. People Section Preview */}
            {travelers.length > 0 && (
              <section className="search-section-block">
                <div className="search-section-header">
                  <div className="search-section-title-wrap">
                    <span className="search-section-badge">👥</span>
                    <h2>{copy.peopleTitle}</h2>
                    <span className="search-section-count">
                      ({travelers.length})
                    </span>
                  </div>
                  {travelers.length > 3 && (
                    <button
                      type="button"
                      className="search-view-more-link"
                      onClick={() => handleTabChange("people")}
                    >
                      {copy.viewAllPeople} ({travelers.length}) →
                    </button>
                  )}
                </div>
                <div className="friend-card-grid">
                  {travelers.slice(0, 4).map((t) => (
                    <TravelerSearchCard
                      key={t.uid}
                      traveler={t}
                      isFollowing={followingMap[t.username.toLowerCase()] ?? t.isFollowing}
                      copy={copy}
                      onToggleFollow={() => void handleToggleFollow(t)}
                      currentUserId={user?.uid}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. Countries Section Preview */}
            {filteredCountries.length > 0 && (
              <section className="search-section-block">
                <div className="search-section-header">
                  <div className="search-section-title-wrap">
                    <span className="search-section-badge">🌍</span>
                    <h2>{copy.countriesTitle}</h2>
                    <span className="search-section-count">
                      ({filteredCountries.length})
                    </span>
                  </div>
                  {filteredCountries.length > 4 && (
                    <button
                      type="button"
                      className="search-view-more-link"
                      onClick={() => handleTabChange("countries")}
                    >
                      {copy.viewAllCountries} ({filteredCountries.length}) →
                    </button>
                  )}
                </div>
                <div className="search-countries-grid">
                  {filteredCountries.slice(0, 4).map((c) => (
                    <CountrySearchCard
                      key={c.code}
                      country={c}
                      language={language}
                      copy={copy}
                      onExploreTravelers={() =>
                        handleCountryTravelersSearch(
                          language === "ru" ? c.ru : c.en,
                        )
                      }
                      onOpenMap={() => navigate("/map")}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3. Places Section Preview */}
            {filteredPlaces.length > 0 && (
              <section className="search-section-block">
                <div className="search-section-header">
                  <div className="search-section-title-wrap">
                    <span className="search-section-badge">📍</span>
                    <h2>{copy.placesTitle}</h2>
                    <span className="search-section-count">
                      ({filteredPlaces.length})
                    </span>
                  </div>
                  {filteredPlaces.length > 6 && (
                    <button
                      type="button"
                      className="search-view-more-link"
                      onClick={() => handleTabChange("places")}
                    >
                      {copy.viewAllPlaces} ({filteredPlaces.length}) →
                    </button>
                  )}
                </div>
                <div className="search-places-grid">
                  {filteredPlaces.slice(0, 6).map((place) => (
                    <PlaceSearchCard
                      key={place.id}
                      place={place}
                      copy={copy}
                      onExploreTravelers={() =>
                        handleCityTravelersSearch(place.cityName)
                      }
                      onOpenMap={() => navigate("/map")}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state for ALL */}
            {query && totalResultsCount === 0 && !loadingTravelers && (
              <div className="search-empty-state">
                <div className="search-empty-icon">🔍</div>
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptySub}</p>
                <button
                  type="button"
                  className="button button-coral search-empty-reset-btn"
                  onClick={() => handleQueryChange("")}
                >
                  {copy.resetSearch}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: PEOPLE */}
        {activeTab === "people" && (
          <div className="search-tab-content">
            <div className="search-tab-summary-row">
              <span>
                {query
                  ? `${copy.peopleTitle} (${travelers.length})`
                  : language === "ru"
                  ? "Рекомендованные путешественники"
                  : "Suggested community travelers"}
              </span>
            </div>

            {travelers.length === 0 && !loadingTravelers ? (
              <div className="search-empty-state">
                <div className="search-empty-icon">👤</div>
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptySub}</p>
                <button
                  type="button"
                  className="button button-coral search-empty-reset-btn"
                  onClick={() => handleQueryChange("")}
                >
                  {copy.resetSearch}
                </button>
              </div>
            ) : (
              <div className="friend-card-grid">
                {travelers.map((t) => (
                  <TravelerSearchCard
                    key={t.uid}
                    traveler={t}
                    isFollowing={followingMap[t.username.toLowerCase()] ?? t.isFollowing}
                    copy={copy}
                    onToggleFollow={() => void handleToggleFollow(t)}
                    currentUserId={user?.uid}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: COUNTRIES */}
        {activeTab === "countries" && (
          <div className="search-tab-content">
            <div className="search-tab-summary-row">
              <span>
                {copy.countriesTitle} ({filteredCountries.length})
              </span>
            </div>

            {filteredCountries.length === 0 ? (
              <div className="search-empty-state">
                <div className="search-empty-icon">🌍</div>
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptySub}</p>
                <button
                  type="button"
                  className="button button-coral search-empty-reset-btn"
                  onClick={() => handleQueryChange("")}
                >
                  {copy.resetSearch}
                </button>
              </div>
            ) : (
              <div className="search-countries-grid">
                {filteredCountries.map((c) => (
                  <CountrySearchCard
                    key={c.code}
                    country={c}
                    language={language}
                    copy={copy}
                    onExploreTravelers={() =>
                      handleCountryTravelersSearch(
                        language === "ru" ? c.ru : c.en,
                      )
                    }
                    onOpenMap={() => navigate("/map")}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PLACES */}
        {activeTab === "places" && (
          <div className="search-tab-content">
            <div className="search-tab-summary-row">
              <span>
                {copy.placesTitle} ({filteredPlaces.length})
              </span>
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="search-empty-state">
                <div className="search-empty-icon">📍</div>
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptySub}</p>
                <button
                  type="button"
                  className="button button-coral search-empty-reset-btn"
                  onClick={() => handleQueryChange("")}
                >
                  {copy.resetSearch}
                </button>
              </div>
            ) : (
              <div className="search-places-grid">
                {filteredPlaces.map((place) => (
                  <PlaceSearchCard
                    key={place.id}
                    place={place}
                    copy={copy}
                    onExploreTravelers={() =>
                      handleCityTravelersSearch(place.cityName)
                    }
                    onOpenMap={() => navigate("/map")}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ----------------------------------------------------
// Sub-components: Cards
// ----------------------------------------------------

type TravelerCardProps = {
  traveler: UserSummary;
  isFollowing?: boolean;
  copy: any;
  onToggleFollow: () => void;
  currentUserId?: string;
};

function TravelerSearchCard({
  traveler,
  isFollowing,
  copy,
  onToggleFollow,
  currentUserId,
}: TravelerCardProps) {
  const isMe = currentUserId && traveler.uid === currentUserId;

  return (
    <div className="friend-card search-traveler-card" key={traveler.uid}>
      <div className="friend-card-head">
        <Link to={`/profile/${traveler.username}`} className="friend-card-avatar-link">
          <UserAvatar
            avatar={traveler.avatar}
            username={traveler.username}
            size={48}
            className="friend-avatar"
          />
        </Link>
        <div className="friend-card-meta">
          <div className="friend-name-row">
            <Link to={`/profile/${traveler.username}`} className="friend-username-link">
              <strong>@{traveler.username}</strong>
            </Link>
            {traveler.isMutual && (
              <span className="mutual-badge">{copy.mutual}</span>
            )}
          </div>
          {traveler.location && (
            <span className="friend-location">📍 {traveler.location}</span>
          )}
        </div>
      </div>

      {traveler.bio && <p className="friend-bio">{traveler.bio}</p>}

      <div className="friend-stats-row">
        <span>
          <strong>{traveler.placesCount}</strong> {copy.placesCount}
        </span>
        <span>
          <strong>{traveler.postsCount}</strong> {copy.postsCount}
        </span>
        <span>
          <strong>{traveler.followersCount}</strong> {copy.followersCount}
        </span>
      </div>

      <div className="friend-card-footer">
        <Link
          to={`/profile/${traveler.username}`}
          className="button button-outline friend-view-btn"
        >
          {copy.diary} ↗
        </Link>
        {!isMe && (
          <button
            className={`follow-toggle-button ${isFollowing ? "following" : "follow"}`}
            onClick={onToggleFollow}
            type="button"
          >
            {isFollowing ? copy.following : copy.follow}
          </button>
        )}
      </div>
    </div>
  );
}

type CountryCardProps = {
  country: CountryData;
  language: "en" | "ru";
  copy: any;
  onExploreTravelers: () => void;
  onOpenMap: () => void;
};

function CountrySearchCard({
  country,
  language,
  copy,
  onExploreTravelers,
  onOpenMap,
}: CountryCardProps) {
  const countryName = language === "ru" ? country.ru : country.en;
  const countryNameAlt = language === "ru" ? country.en : country.ru;

  return (
    <div className="search-country-card">
      <div className="search-country-head">
        <span className="search-country-flag" aria-hidden="true">
          {country.flag}
        </span>
        <div className="search-country-title-box">
          <div className="search-country-name-row">
            <h3 className="search-country-name">{countryName}</h3>
            <span className="search-country-code">{country.code}</span>
          </div>
          <span className="search-country-alt">{countryNameAlt}</span>
        </div>
      </div>

      <div className="search-country-cities-preview">
        <span className="search-country-cities-label">
          {country.cities.length} {copy.catalogedCities}:
        </span>
        <div className="search-country-city-tags">
          {country.cities.slice(0, 4).map((city) => (
            <span key={city.en} className="search-country-city-chip">
              {language === "ru" ? city.ru : city.en}
            </span>
          ))}
          {country.cities.length > 4 && (
            <span className="search-country-city-chip more">
              +{country.cities.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="search-country-footer">
        <button
          type="button"
          className="button button-outline search-card-action-btn"
          onClick={onOpenMap}
          title={copy.openMap}
        >
          🗺️ {copy.openMap} ↗
        </button>
        <button
          type="button"
          className="button button-coral search-card-action-btn"
          onClick={onExploreTravelers}
          title={copy.findTravelersFromCountry}
        >
          👥 {copy.findTravelersFromCountry}
        </button>
      </div>
    </div>
  );
}

type PlaceCardProps = {
  place: PlaceResult;
  copy: any;
  onExploreTravelers: () => void;
  onOpenMap: () => void;
};

function PlaceSearchCard({
  place,
  copy,
  onExploreTravelers,
  onOpenMap,
}: PlaceCardProps) {
  return (
    <div className="search-place-card">
      <div className="search-place-head">
        <div className="search-place-icon-box">
          <span className="search-place-flag">{place.countryFlag}</span>
        </div>
        <div className="search-place-meta">
          <h4 className="search-place-name">{place.cityName}</h4>
          <span className="search-place-country">
            {place.countryName}
            {place.cityNameAlt && place.cityNameAlt !== place.cityName && (
              <small className="search-place-alt"> • {place.cityNameAlt}</small>
            )}
          </span>
        </div>
      </div>

      <div className="search-place-footer">
        <button
          type="button"
          className="button button-outline search-card-action-btn"
          onClick={onOpenMap}
        >
          📍 {copy.openMap} ↗
        </button>
        <button
          type="button"
          className="button button-coral search-card-action-btn"
          onClick={onExploreTravelers}
        >
          👥 {copy.findTravelersFromCity}
        </button>
      </div>
    </div>
  );
}
