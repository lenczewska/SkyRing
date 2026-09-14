import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  geoCentroid,
  geoContains,
  geoDistance,
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
} from "d3-geo";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type VisitedPlace = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  kind?: "country" | "city";
  country?: string;
  city?: string;
};

type MapViewProps = {
  user: User | null;
  onRequestAuth?: () => void;
  language?: "en" | "ru";
  onPlacesChange?: (places: VisitedPlace[]) => void;
  readOnly?: boolean;
  mode?: "globe" | "profile";
  places?: VisitedPlace[];
};

type GeocodeResult = {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  type?: string;
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
};

const world = feature(
  worldData as never,
  worldData.objects.countries as never,
) as never;

function countryKey(country: any) {
  return String(country.id ?? country.properties?.name ?? "");
}

export function findCountryFeatureForCoord(longitude: number, latitude: number) {
  const features = (world as any).features as any[];
  for (const feat of features) {
    try {
      if (geoContains(feat, [longitude, latitude])) {
        return feat;
      }
    } catch {
      // ignore point-in-polygon calculation error
    }
  }
  return null;
}

const COUNTRY_NAME_MAP: Record<string, string> = {
  россия: "Russia",
  russian: "Russia",
  russia: "Russia",
  италия: "Italy",
  italy: "Italy",
  китай: "China",
  china: "China",
  сша: "United States of America",
  usa: "United States of America",
  "united states": "United States of America",
  япония: "Japan",
  japan: "Japan",
  польша: "Poland",
  poland: "Poland",
  азербайджан: "Azerbaijan",
  azerbaijan: "Azerbaijan",
  франция: "France",
  france: "France",
  германия: "Germany",
  germany: "Germany",
  испания: "Spain",
  spain: "Spain",
  турция: "Turkey",
  turkey: "Turkey",
  египет: "Egypt",
  egypt: "Egypt",
  бразилия: "Brazil",
  brazil: "Brazil",
  австралия: "Australia",
  australia: "Australia",
  ангола: "Angola",
  angola: "Angola",
  великобритания: "United Kingdom",
  "united kingdom": "United Kingdom",
  англия: "United Kingdom",
  беларусь: "Belarus",
  belarus: "Belarus",
  украина: "Ukraine",
  ukraine: "Ukraine",
  казахстан: "Kazakhstan",
  kazakhstan: "Kazakhstan",
  узбекистан: "Uzbekistan",
  uzbekistan: "Uzbekistan",
  грузия: "Georgia",
  georgia: "Georgia",
  армения: "Armenia",
  armenia: "Armenia",
  португалия: "Portugal",
  portugal: "Portugal",
  греция: "Greece",
  greece: "Greece",
  австрия: "Austria",
  austria: "Austria",
  чехия: "Czechia",
  czechia: "Czechia",
  нидерланды: "Netherlands",
  netherlands: "Netherlands",
  голландия: "Netherlands",
  таиланд: "Thailand",
  тайланд: "Thailand",
  thailand: "Thailand",
  оаэ: "United Arab Emirates",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  конго: "Dem. Rep. Congo",
  "dem. rep. congo": "Dem. Rep. Congo",
};

export function findCountryFeatureByName(query: string) {
  const q = query.trim().toLowerCase();
  const features = (world as any).features as any[];
  const mapped = COUNTRY_NAME_MAP[q];
  if (mapped) {
    const f = features.find(
      (feat) => (feat.properties?.name ?? "").toLowerCase() === mapped.toLowerCase(),
    );
    if (f) return f;
  }
  return (
    features.find((feat) => (feat.properties?.name ?? "").toLowerCase() === q) ?? null
  );
}

type CityInfo = {
  lat: number;
  lon: number;
  city: string;
  country: string;
};

const COMMON_CITIES: Record<string, CityInfo> = {
  // Russia
  москва: { lat: 55.7558, lon: 37.6173, city: "Moscow", country: "Russia" },
  moscow: { lat: 55.7558, lon: 37.6173, city: "Moscow", country: "Russia" },
  "санкт-петербург": { lat: 59.9343, lon: 30.3351, city: "Saint Petersburg", country: "Russia" },
  "saint petersburg": { lat: 59.9343, lon: 30.3351, city: "Saint Petersburg", country: "Russia" },
  питер: { lat: 59.9343, lon: 30.3351, city: "Saint Petersburg", country: "Russia" },
  омск: { lat: 54.9885, lon: 73.3242, city: "Omsk", country: "Russia" },
  omsk: { lat: 54.9885, lon: 73.3242, city: "Omsk", country: "Russia" },
  казань: { lat: 55.7887, lon: 49.1221, city: "Kazan", country: "Russia" },
  kazan: { lat: 55.7887, lon: 49.1221, city: "Kazan", country: "Russia" },
  сочи: { lat: 43.6028, lon: 39.7342, city: "Sochi", country: "Russia" },
  sochi: { lat: 43.6028, lon: 39.7342, city: "Sochi", country: "Russia" },
  новосибирск: { lat: 55.0084, lon: 82.9357, city: "Novosibirsk", country: "Russia" },
  novosibirsk: { lat: 55.0084, lon: 82.9357, city: "Novosibirsk", country: "Russia" },
  екатеринбург: { lat: 56.8389, lon: 60.6057, city: "Yekaterinburg", country: "Russia" },
  yekaterinburg: { lat: 56.8389, lon: 60.6057, city: "Yekaterinburg", country: "Russia" },
  якутск: { lat: 62.0272, lon: 129.7322, city: "Yakutsk", country: "Russia" },
  yakutsk: { lat: 62.0272, lon: 129.7322, city: "Yakutsk", country: "Russia" },
  владивосток: { lat: 43.1155, lon: 131.8855, city: "Vladivostok", country: "Russia" },
  vladivostok: { lat: 43.1155, lon: 131.8855, city: "Vladivostok", country: "Russia" },
  иркутск: { lat: 52.287, lon: 104.305, city: "Irkutsk", country: "Russia" },
  irkutsk: { lat: 52.287, lon: 104.305, city: "Irkutsk", country: "Russia" },
  самара: { lat: 53.2415, lon: 50.2212, city: "Samara", country: "Russia" },
  ростов: { lat: 47.2357, lon: 39.7015, city: "Rostov-on-Don", country: "Russia" },
  "ростов-на-дону": { lat: 47.2357, lon: 39.7015, city: "Rostov-on-Don", country: "Russia" },
  уфа: { lat: 54.7388, lon: 55.9721, city: "Ufa", country: "Russia" },
  красноярск: { lat: 56.0153, lon: 92.8932, city: "Krasnoyarsk", country: "Russia" },
  воронеж: { lat: 51.6608, lon: 39.2003, city: "Voronezh", country: "Russia" },
  пермь: { lat: 58.0105, lon: 56.2502, city: "Perm", country: "Russia" },
  волгоград: { lat: 48.708, lon: 44.5133, city: "Volgograd", country: "Russia" },
  краснодар: { lat: 45.0355, lon: 38.9753, city: "Krasnodar", country: "Russia" },

  // Italy
  рим: { lat: 41.9028, lon: 12.4964, city: "Rome", country: "Italy" },
  rome: { lat: 41.9028, lon: 12.4964, city: "Rome", country: "Italy" },
  милан: { lat: 45.4642, lon: 9.19, city: "Milan", country: "Italy" },
  milan: { lat: 45.4642, lon: 9.19, city: "Milan", country: "Italy" },
  венеция: { lat: 45.4408, lon: 12.3155, city: "Venice", country: "Italy" },
  venice: { lat: 45.4408, lon: 12.3155, city: "Venice", country: "Italy" },
  флоренция: { lat: 43.7696, lon: 11.2558, city: "Florence", country: "Italy" },
  florence: { lat: 43.7696, lon: 11.2558, city: "Florence", country: "Italy" },
  неаполь: { lat: 40.8518, lon: 14.2681, city: "Naples", country: "Italy" },
  naples: { lat: 40.8518, lon: 14.2681, city: "Naples", country: "Italy" },

  // Azerbaijan
  баку: { lat: 40.4093, lon: 49.8671, city: "Baku", country: "Azerbaijan" },
  baku: { lat: 40.4093, lon: 49.8671, city: "Baku", country: "Azerbaijan" },

  // Poland
  варшава: { lat: 52.2297, lon: 21.0122, city: "Warsaw", country: "Poland" },
  warsaw: { lat: 52.2297, lon: 21.0122, city: "Warsaw", country: "Poland" },
  краков: { lat: 50.0647, lon: 19.945, city: "Krakow", country: "Poland" },
  krakow: { lat: 50.0647, lon: 19.945, city: "Krakow", country: "Poland" },

  // Japan
  токио: { lat: 35.6762, lon: 139.6503, city: "Tokyo", country: "Japan" },
  tokyo: { lat: 35.6762, lon: 139.6503, city: "Tokyo", country: "Japan" },
  киото: { lat: 35.0116, lon: 135.7681, city: "Kyoto", country: "Japan" },
  kyoto: { lat: 35.0116, lon: 135.7681, city: "Kyoto", country: "Japan" },
  осака: { lat: 34.6937, lon: 135.5023, city: "Osaka", country: "Japan" },
  osaka: { lat: 34.6937, lon: 135.5023, city: "Osaka", country: "Japan" },

  // France
  париж: { lat: 48.8566, lon: 2.3522, city: "Paris", country: "France" },
  paris: { lat: 48.8566, lon: 2.3522, city: "Paris", country: "France" },
  ницца: { lat: 43.7102, lon: 7.262, city: "Nice", country: "France" },
  nice: { lat: 43.7102, lon: 7.262, city: "Nice", country: "France" },

  // UK
  лондон: { lat: 51.5074, lon: -0.1278, city: "London", country: "United Kingdom" },
  london: { lat: 51.5074, lon: -0.1278, city: "London", country: "United Kingdom" },

  // Germany
  берлин: { lat: 52.52, lon: 13.405, city: "Berlin", country: "Germany" },
  berlin: { lat: 52.52, lon: 13.405, city: "Berlin", country: "Germany" },
  мюнхен: { lat: 48.1351, lon: 11.582, city: "Munich", country: "Germany" },
  munich: { lat: 48.1351, lon: 11.582, city: "Munich", country: "Germany" },

  // Spain
  мадрид: { lat: 40.4168, lon: -3.7038, city: "Madrid", country: "Spain" },
  madrid: { lat: 40.4168, lon: -3.7038, city: "Madrid", country: "Spain" },
  барселона: { lat: 41.3879, lon: 2.1699, city: "Barcelona", country: "Spain" },
  barcelona: { lat: 41.3879, lon: 2.1699, city: "Barcelona", country: "Spain" },

  // Netherlands
  амстердам: { lat: 52.3676, lon: 4.9041, city: "Amsterdam", country: "Netherlands" },
  amsterdam: { lat: 52.3676, lon: 4.9041, city: "Amsterdam", country: "Netherlands" },

  // Austria
  вена: { lat: 48.2082, lon: 16.3738, city: "Vienna", country: "Austria" },
  vienna: { lat: 48.2082, lon: 16.3738, city: "Vienna", country: "Austria" },

  // Czechia
  прага: { lat: 50.0755, lon: 14.4378, city: "Prague", country: "Czechia" },
  prague: { lat: 50.0755, lon: 14.4378, city: "Prague", country: "Czechia" },

  // Portugal
  лиссабон: { lat: 38.7223, lon: -9.1393, city: "Lisbon", country: "Portugal" },
  lisbon: { lat: 38.7223, lon: -9.1393, city: "Lisbon", country: "Portugal" },

  // Greece
  афины: { lat: 37.9838, lon: 23.7275, city: "Athens", country: "Greece" },
  athens: { lat: 37.9838, lon: 23.7275, city: "Athens", country: "Greece" },

  // Turkey
  стамбул: { lat: 41.0082, lon: 28.9784, city: "Istanbul", country: "Turkey" },
  istanbul: { lat: 41.0082, lon: 28.9784, city: "Istanbul", country: "Turkey" },
  анталья: { lat: 36.8969, lon: 30.7133, city: "Antalya", country: "Turkey" },
  antalya: { lat: 36.8969, lon: 30.7133, city: "Antalya", country: "Turkey" },

  // UAE
  дубай: { lat: 25.2048, lon: 55.2708, city: "Dubai", country: "United Arab Emirates" },
  dubai: { lat: 25.2048, lon: 55.2708, city: "Dubai", country: "United Arab Emirates" },

  // China
  пекин: { lat: 39.9042, lon: 116.4074, city: "Beijing", country: "China" },
  beijing: { lat: 39.9042, lon: 116.4074, city: "Beijing", country: "China" },
  шанхай: { lat: 31.2304, lon: 121.4737, city: "Shanghai", country: "China" },
  shanghai: { lat: 31.2304, lon: 121.4737, city: "Shanghai", country: "China" },

  // South Korea
  сеул: { lat: 37.5665, lon: 126.978, city: "Seoul", country: "South Korea" },
  seoul: { lat: 37.5665, lon: 126.978, city: "Seoul", country: "South Korea" },

  // Thailand
  бангкок: { lat: 13.7563, lon: 100.5018, city: "Bangkok", country: "Thailand" },
  bangkok: { lat: 13.7563, lon: 100.5018, city: "Bangkok", country: "Thailand" },
  пхукет: { lat: 7.8804, lon: 98.3923, city: "Phuket", country: "Thailand" },
  phuket: { lat: 7.8804, lon: 98.3923, city: "Phuket", country: "Thailand" },

  // Singapore
  сингапур: { lat: 1.3521, lon: 103.8198, city: "Singapore", country: "Singapore" },
  singapore: { lat: 1.3521, lon: 103.8198, city: "Singapore", country: "Singapore" },

  // USA
  "нью-йорк": { lat: 40.7128, lon: -74.006, city: "New York", country: "United States of America" },
  "new york": { lat: 40.7128, lon: -74.006, city: "New York", country: "United States of America" },
  "лос-анджелес": { lat: 34.0522, lon: -118.2437, city: "Los Angeles", country: "United States of America" },
  "los angeles": { lat: 34.0522, lon: -118.2437, city: "Los Angeles", country: "United States of America" },

  // Australia
  сидней: { lat: -33.8688, lon: 151.2093, city: "Sydney", country: "Australia" },
  sydney: { lat: -33.8688, lon: 151.2093, city: "Sydney", country: "Australia" },
  мельбурн: { lat: -37.8136, lon: 144.9631, city: "Melbourne", country: "Australia" },
  melbourne: { lat: -37.8136, lon: 144.9631, city: "Melbourne", country: "Australia" },

  // Egypt
  каир: { lat: 30.0444, lon: 31.2357, city: "Cairo", country: "Egypt" },
  cairo: { lat: 30.0444, lon: 31.2357, city: "Cairo", country: "Egypt" },

  // Brazil
  "рио-де-жанейро": { lat: -22.9068, lon: -43.1729, city: "Rio de Janeiro", country: "Brazil" },
  "rio de janeiro": { lat: -22.9068, lon: -43.1729, city: "Rio de Janeiro", country: "Brazil" },
  "сан-паулу": { lat: -23.5505, lon: -46.6333, city: "Sao Paulo", country: "Brazil" },
  "sao paulo": { lat: -23.5505, lon: -46.6333, city: "Sao Paulo", country: "Brazil" },

  // CIS
  минск: { lat: 53.9006, lon: 27.559, city: "Minsk", country: "Belarus" },
  minsk: { lat: 53.9006, lon: 27.559, city: "Minsk", country: "Belarus" },
  киев: { lat: 50.4501, lon: 30.5234, city: "Kyiv", country: "Ukraine" },
  kyiv: { lat: 50.4501, lon: 30.5234, city: "Kyiv", country: "Ukraine" },
  алматы: { lat: 43.222, lon: 76.8512, city: "Almaty", country: "Kazakhstan" },
  almaty: { lat: 43.222, lon: 76.8512, city: "Almaty", country: "Kazakhstan" },
  астана: { lat: 51.1694, lon: 71.4491, city: "Astana", country: "Kazakhstan" },
  astana: { lat: 51.1694, lon: 71.4491, city: "Astana", country: "Kazakhstan" },
  ташкент: { lat: 41.2995, lon: 69.2401, city: "Tashkent", country: "Uzbekistan" },
  tashkent: { lat: 41.2995, lon: 69.2401, city: "Tashkent", country: "Uzbekistan" },
  тбилиси: { lat: 41.7151, lon: 44.8271, city: "Tbilisi", country: "Georgia" },
  tbilisi: { lat: 41.7151, lon: 44.8271, city: "Tbilisi", country: "Georgia" },
  ереван: { lat: 40.1792, lon: 44.4991, city: "Yerevan", country: "Armenia" },
  yerevan: { lat: 40.1792, lon: 44.4991, city: "Yerevan", country: "Armenia" },
};

function isCountryPlace(place: VisitedPlace) {
  if (place.city || (place.label && place.label.includes(","))) return false;
  return place.kind === "country" || place.kind == null;
}

export function normalizePlaces(places: VisitedPlace[]): VisitedPlace[] {
  const result: VisitedPlace[] = [];
  const countriesWithCities = new Set<string>();
  const seenCityKeys = new Set<string>();
  const seenCountryKeys = new Set<string>();

  // Pass 1: Cities
  for (const p of places) {
    if (!p) continue;

    // Discard bogus Nominatim result for "Russian" in Venezuela
    if (
      p.label.toLowerCase() === "russian" &&
      Math.abs(p.latitude - 10.496) < 1 &&
      Math.abs(p.longitude - (-63.172)) < 1
    ) {
      continue;
    }

    const dict =
      COMMON_CITIES[p.label.toLowerCase()] ||
      (p.city ? COMMON_CITIES[p.city.toLowerCase()] : null);

    const countryFromCoord = findCountryFeatureForCoord(p.longitude, p.latitude)?.properties?.name;
    const country = dict?.country || p.country || countryFromCoord;
    const city =
      dict?.city ||
      p.city ||
      (p.label.includes(",") ? p.label.split(",").pop()?.trim() : p.label);

    const isCity =
      p.kind === "city" ||
      p.city != null ||
      Boolean(dict) ||
      (countryFromCoord &&
        countryFromCoord.toLowerCase() !== p.label.toLowerCase() &&
        (p.latitude !== 0 || p.longitude !== 0));

    if (isCity && country && city && country.toLowerCase() !== city.toLowerCase()) {
      const dedupeKey = `${country.toLowerCase()}:${city.toLowerCase()}`;
      if (seenCityKeys.has(dedupeKey)) continue;
      seenCityKeys.add(dedupeKey);
      countriesWithCities.add(country.toLowerCase());

      result.push({
        ...p,
        kind: "city",
        country,
        city,
        label: `${country}, ${city}`,
      });
    }
  }

  // Pass 2: Standalone countries (only if country has NO cities marked!)
  for (const p of places) {
    if (!p) continue;
    const countryFromCoord = findCountryFeatureForCoord(p.longitude, p.latitude)?.properties?.name;
    const countryName = p.country || countryFromCoord || p.label;
    const dict =
      COMMON_CITIES[p.label.toLowerCase()] ||
      (p.city ? COMMON_CITIES[p.city.toLowerCase()] : null);

    const isCity =
      p.kind === "city" ||
      p.city != null ||
      Boolean(dict) ||
      (countryFromCoord &&
        countryFromCoord.toLowerCase() !== p.label.toLowerCase() &&
        (p.latitude !== 0 || p.longitude !== 0));

    if (!isCity) {
      if (countriesWithCities.has(countryName.toLowerCase())) {
        // Redundant country centroid card: user already marked one or more cities in this country!
        continue;
      }
      const dedupeKey = `country:${countryName.toLowerCase()}`;
      if (seenCountryKeys.has(dedupeKey)) continue;
      seenCountryKeys.add(dedupeKey);

      result.push({
        ...p,
        kind: "country",
        country: countryName,
        label: countryName,
      });
    }
  }

  return result;
}

export default function MapView({
  user,
  onRequestAuth: _onRequestAuth,
  language = "en",
  onPlacesChange,
  readOnly = false,
  mode = "globe",
  places: propPlaces,
}: MapViewProps) {
  const [internalPlaces, setInternalPlaces] = useState<VisitedPlace[]>([]);
  const places = propPlaces !== undefined ? propPlaces : internalPlaces;
  const setPlaces = (next: VisitedPlace[]) => {
    setInternalPlaces(next);
  };
  const [loading, setLoading] = useState(Boolean(user));
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hoveredPlace, setHoveredPlace] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [mapZoom, setMapZoom] = useState(1);
  const mapPointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistance = useRef<number | null>(null);
  const profileMapRef = useRef<SVGSVGElement | null>(null);
  const touchDistance = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const pointerDragged = useRef(false);
  const onPlacesChangeRef = useRef(onPlacesChange);

  useEffect(() => {
    onPlacesChangeRef.current = onPlacesChange;
  }, [onPlacesChange]);

  const projection = useMemo(() => {
    if (mode === "profile")
      return geoNaturalEarth1().fitSize([960, 500], world as any);
    return geoOrthographic()
      .rotate([rotation, 0, 0])
      .clipAngle(90)
      .fitExtent(
        [
          [48, 38],
          [572, 462],
        ],
        { type: "Sphere" },
      );
  }, [mode, rotation]);
  const pathGenerator = useMemo(() => geoPath(projection), [projection]);
  const countries = (world as any).features as any[];

  useEffect(() => {
    let active = true;

    if (!user) {
      const local = window.localStorage.getItem("skyring-guest-places");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          const normalized = normalizePlaces(parsed);
          setPlaces(normalized);
          onPlacesChangeRef.current?.(normalized);
          window.localStorage.setItem(
            "skyring-guest-places",
            JSON.stringify(normalized),
          );
        } catch {
          setPlaces([]);
        }
      } else {
        setPlaces([]);
      }
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    getDoc(doc(db, "users", user.uid))
      .then((snapshot) => {
        if (!active) return;
        const resetKey = `skyring-map-reset-${user.uid}-v1`;
        if (!window.localStorage.getItem(resetKey)) {
          setPlaces([]);
          onPlacesChangeRef.current?.([]);
          window.localStorage.setItem(resetKey, "done");
          void setDoc(
            doc(db, "users", user.uid),
            { visitedCountries: [] },
            { merge: true },
          );
        } else {
          const savedPlaces =
            (snapshot.data()?.visitedCountries as VisitedPlace[] | undefined) ??
            [];
          const normalized = normalizePlaces(savedPlaces);
          setPlaces(normalized);
          onPlacesChangeRef.current?.(normalized);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const addCountry = async (country: any) => {
    const countryName = country.properties?.name ?? countryKey(country);
    const key = countryKey(country);
    const id = String(country.id ?? "");
    const targetName = countryName.toLowerCase();

    const isVisited = isCountryVisited(country);

    let nextPlaces: VisitedPlace[];
    if (isVisited) {
      // Toggle off: remove country and any places associated with this country
      nextPlaces = places.filter((p) => {
        const pCountry = (p.country ?? "").toLowerCase();
        const pLabel = p.label.toLowerCase();
        if (pCountry === targetName) return false;
        if (pLabel === targetName) return false;
        if (pLabel.startsWith(targetName + ",")) return false;
        if (p.id && (p.id.startsWith(`${key}-`) || p.id.startsWith(`${id}-`))) return false;
        return true;
      });
    } else {
      let longitude = 0;
      let latitude = 0;
      try {
        const centroid = geoCentroid(country);
        longitude = centroid[0];
        latitude = centroid[1];
      } catch {
        // fallback
      }
      const place: VisitedPlace = {
        id: `${key || id || countryName}-${latitude.toFixed(3)}-${longitude.toFixed(3)}`,
        latitude,
        longitude,
        label: countryName,
        kind: "country",
        country: countryName,
      };
      nextPlaces = normalizePlaces([...places, place]);
    }

    setPlaces(nextPlaces);
    onPlacesChangeRef.current?.(nextPlaces);

    try {
      window.localStorage.setItem(
        "skyring-guest-places",
        JSON.stringify(nextPlaces),
      );
    } catch {
      // ignore
    }

    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { visitedCountries: nextPlaces },
          { merge: true },
        );
      } catch (error) {
        console.warn("Could not save to firestore:", error);
      }
    }
  };

  const addPlaceDirect = async (place: VisitedPlace) => {
    const targetCountry = (place.country || "").toLowerCase();

    const filtered = places.filter((p) => {
      if (p.id === place.id) return false;
      // Remove duplicate city in same country
      if (
        place.kind === "city" &&
        p.kind === "city" &&
        place.country &&
        p.country &&
        place.country.toLowerCase() === p.country.toLowerCase() &&
        place.city &&
        p.city &&
        place.city.toLowerCase() === p.city.toLowerCase()
      ) {
        return false;
      }
      // If adding a city, remove redundant standalone country card for that country!
      if (
        place.kind === "city" &&
        targetCountry &&
        (p.kind === "country" || !p.kind) &&
        (p.label.toLowerCase() === targetCountry ||
          (p.country && p.country.toLowerCase() === targetCountry))
      ) {
        return false;
      }
      return true;
    });

    const nextPlaces = normalizePlaces([...filtered, place]);
    setPlaces(nextPlaces);
    onPlacesChangeRef.current?.(nextPlaces);
    setSearchResults([]);
    setSearch("");

    try {
      window.localStorage.setItem(
        "skyring-guest-places",
        JSON.stringify(nextPlaces),
      );
    } catch {
      // ignore
    }

    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { visitedCountries: nextPlaces },
          { merge: true },
        );
      } catch (error) {
        console.warn("Could not save to firestore:", error);
      }
    }
  };

  const addPlace = async (result: GeocodeResult) => {
    const lat = Number(result.lat);
    const lon = Number(result.lon);
    const countryFeature = findCountryFeatureForCoord(lon, lat);
    const country =
      countryFeature?.properties?.name ||
      result.address?.country ||
      "";
    const cityName =
      result.name ||
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.display_name.split(",")[0].trim();

    const label =
      country && cityName && country.toLowerCase() !== cityName.toLowerCase()
        ? `${country}, ${cityName}`
        : (cityName || country);

    const place: VisitedPlace = {
      id: `${result.place_id}`,
      latitude: lat,
      longitude: lon,
      label,
      country: country || undefined,
      city: cityName || undefined,
      kind: country && cityName ? "city" : "country",
    };
    await addPlaceDirect(place);
  };

  const clearPlaces = async () => {
    setPlaces([]);
    onPlacesChangeRef.current?.([]);
    try {
      window.localStorage.removeItem("skyring-guest-places");
    } catch {
      // ignore
    }
    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { visitedCountries: [] },
          { merge: true },
        );
      } catch (error) {
        console.warn("Could not clear firestore:", error);
      }
    }
  };

  const searchPlaces = async (autoAdd = true) => {
    const query = search.trim();
    if (!query) return;

    setSearching(true);
    setSearchError("");

    const normalized = query.toLowerCase();

    // 1. Check if user typed a country name (e.g. "Russian", "Russia", "Italy", "Россия", etc.)
    const countryMatch = findCountryFeatureByName(normalized);
    if (countryMatch) {
      if (autoAdd) {
        await addCountry(countryMatch);
        setSearch("");
        setSearching(false);
        return;
      }
    }

    // 2. Check if user typed a known city (e.g. "Rome", "Рим", "Moscow", "Москва", "Omsk", "Омск")
    const localMatch = COMMON_CITIES[normalized];
    if (localMatch) {
      const place: VisitedPlace = {
        id: `city-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        latitude: localMatch.lat,
        longitude: localMatch.lon,
        country: localMatch.country,
        city: localMatch.city,
        label: `${localMatch.country}, ${localMatch.city}`,
        kind: "city",
      };
      if (autoAdd) {
        await addPlaceDirect(place);
        setSearching(false);
        return;
      }
    }

    // 3. Fallback to Nominatim geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&accept-language=en&limit=5&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("Search failed");
      const results = (await response.json()) as GeocodeResult[];
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(
          language === "ru"
            ? "Ничего не найдено. Попробуйте другой запрос."
            : "Nothing found. Try another spelling.",
        );
      } else if (autoAdd) {
        await addPlace(results[0]);
      }
    } catch {
      setSearchError(
        language === "ru"
          ? "Поиск временно недоступен. Попробуйте ещё раз."
          : "Search is unavailable right now. Try again.",
      );
    } finally {
      setSearching(false);
    }
  };

  const cityPlaces = places.filter((place) => !isCountryPlace(place));

  const isCountryVisited = (country: any) => {
    const name = (country.properties?.name ?? "").toLowerCase();
    const key = countryKey(country).toLowerCase();
    const id = String(country.id ?? "").toLowerCase();

    return places.some((p) => {
      const pCountry = (p.country ?? "").toLowerCase();
      const pLabel = p.label.toLowerCase();
      if (pCountry && (pCountry === name || pCountry === key || pCountry === id)) return true;
      if (pLabel === name || pLabel === key || pLabel === id) return true;
      if (name && pLabel.startsWith(name + ",")) return true;
      if (key && pLabel.startsWith(key + ",")) return true;
      if (p.id && (p.id.startsWith(`${key}-`) || p.id.startsWith(`${id}-`))) return true;
      return false;
    });
  };
  const mapWidth = mode === "profile" ? 960 : 620;
  const mapHeight = 500;
  const globeCenter =
    mode === "globe" ? (projection.invert?.([310, 250]) ?? null) : null;
  const visiblePlaces = cityPlaces.filter((place) => {
    if (mode !== "globe") return true;
    return globeCenter
      ? geoDistance([place.longitude, place.latitude], globeCenter) <=
          Math.PI / 2
      : false;
  });

  useEffect(() => {
    if (mode === "profile" || dragging || hovering) return undefined;
    let frame = 0;
    let lastFrame = performance.now();
    const animate = (time: number) => {
      if (time - lastFrame >= 33) {
        setRotation((value) => value + 0.38);
        lastFrame = time;
      }
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [mode, dragging, hovering]);

  useEffect(() => {
    if (mode !== "profile" || readOnly || !profileMapRef.current)
      return undefined;
    const svg = profileMapRef.current;
    const getTouchDistance = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      );
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length >= 2) {
        event.preventDefault();
        touchDistance.current = getTouchDistance(event.touches);
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length < 2 || !touchDistance.current) return;
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      setMapZoom((zoom) =>
        Math.min(6, Math.max(1, zoom * (distance / touchDistance.current!))),
      );
      touchDistance.current = distance;
    };
    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) touchDistance.current = null;
    };
    const options = { passive: false };
    svg.addEventListener("touchstart", handleTouchStart, options);
    svg.addEventListener("touchmove", handleTouchMove, options);
    svg.addEventListener("touchend", handleTouchEnd, options);
    svg.addEventListener("touchcancel", handleTouchEnd, options);
    return () => {
      svg.removeEventListener("touchstart", handleTouchStart);
      svg.removeEventListener("touchmove", handleTouchMove);
      svg.removeEventListener("touchend", handleTouchEnd);
      svg.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [mode, readOnly]);

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    pointerDragged.current = false;
    setDragging(true);
  };
  const handlePointerUp = () => {
    setDragging(false);
  };
  const handlePointerEnter = () => setHovering(true);
  const handlePointerLeave = () => {
    setHovering(false);
    setDragging(false);
    pointerStart.current = null;
  };
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      if (pointerStart.current) {
        const dist = Math.hypot(
          event.clientX - pointerStart.current.x,
          event.clientY - pointerStart.current.y,
        );
        if (dist > 5) pointerDragged.current = true;
      }
      setRotation((value) => value + event.movementX * 0.25);
    }
  };
  const handleMapPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    pointerDragged.current = false;
    mapPointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (mapPointers.current.size === 2) {
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore capture failure
      }
      const pointers = [...mapPointers.current.values()];
      pinchDistance.current = Math.hypot(
        pointers[0].x - pointers[1].x,
        pointers[0].y - pointers[1].y,
      );
    }
  };
  const handleMapPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const pointer = mapPointers.current.get(event.pointerId);
    if (!pointer) return;
    if (pointerStart.current) {
      const dist = Math.hypot(
        event.clientX - pointerStart.current.x,
        event.clientY - pointerStart.current.y,
      );
      if (dist > 5) pointerDragged.current = true;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (mapPointers.current.size !== 2 || !pinchDistance.current) return;
    event.preventDefault();
    const pointers = [...mapPointers.current.values()];
    const distance = Math.hypot(
      pointers[0].x - pointers[1].x,
      pointers[0].y - pointers[1].y,
    );
    setMapZoom((zoom) =>
      Math.min(6, Math.max(1, zoom * (distance / pinchDistance.current!))),
    );
    pinchDistance.current = distance;
  };
  const handleMapPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    mapPointers.current.delete(event.pointerId);
    if (mapPointers.current.size < 2) pinchDistance.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const map = (
    <div
      className={`map-panel ${mode === "globe" ? "globe-panel" : "profile-map-panel"}`}
    >
      <svg
        ref={mode === "profile" && !readOnly ? profileMapRef : undefined}
        className={mode === "globe" ? "globe-map" : "world-map"}
        style={
          mode === "profile" && !readOnly
            ? { transform: `scale(${mapZoom})` }
            : undefined
        }
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        role="img"
        aria-label={
          mode === "globe"
            ? "Rotating interactive globe"
            : "Interactive world map"
        }
        onPointerDown={
          mode === "globe"
            ? handlePointerDown
            : mode === "profile" && !readOnly
              ? handleMapPointerDown
              : undefined
        }
        onPointerUp={
          mode === "globe"
            ? handlePointerUp
            : mode === "profile" && !readOnly
              ? handleMapPointerUp
              : undefined
        }
        onPointerCancel={
          mode === "profile" && !readOnly ? handleMapPointerUp : undefined
        }
        onPointerMove={
          mode === "globe"
            ? handlePointerMove
            : mode === "profile" && !readOnly
              ? handleMapPointerMove
              : undefined
        }
      >
        {mode === "globe" && (
          <defs>
            <clipPath id="globe-clip">
              <circle cx="310" cy="270" r="270" />
            </clipPath>
          </defs>
        )}
        <g
          onPointerEnter={mode === "globe" ? handlePointerEnter : undefined}
          onPointerLeave={mode === "globe" ? handlePointerLeave : undefined}
        >
          {mode === "globe" && (
            <circle className="globe-ocean" cx="310" cy="250" r="220" />
          )}
          <g
            className="country-shapes"
            clipPath={mode === "globe" ? "url(#globe-clip)" : undefined}
          >
            {countries.map((country) => (
              <path
                className={
                  isCountryVisited(country)
                    ? "country visited"
                    : "country"
                }
                d={pathGenerator(country) ?? undefined}
                key={countryKey(country)}
                style={{ cursor: !readOnly ? "pointer" : "default" }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (pointerDragged.current) return;
                  if (!readOnly) void addCountry(country);
                }}
                onKeyDown={
                  !readOnly
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          void addCountry(country);
                        }
                      }
                    : undefined
                }
                role={!readOnly ? "button" : undefined}
                tabIndex={!readOnly ? 0 : undefined}
              >
                <title>
                  {country.properties?.name ??
                    (language === "ru" ? "Страна" : "Country")}
                  {!readOnly
                    ? language === "ru"
                      ? " - нажмите, чтобы отметить или снять отметку"
                      : " - click to mark or unmark"
                    : ""}
                </title>
              </path>
            ))}
          </g>
        </g>
        {visiblePlaces.length > 0 && (
          <g
            className={
              mode === "globe" ? "globe-place-markers" : "profile-place-markers"
            }
          >
            {visiblePlaces.map((place) => {
              const point = projection([place.longitude, place.latitude]);
              return point ? (
                <g
                  className="map-place"
                  key={place.id}
                  transform={`translate(${point[0]}, ${point[1]})`}
                  tabIndex={0}
                  aria-label={place.label}
                  onPointerEnter={() =>
                    setHoveredPlace({
                      label: place.label,
                      x: point[0],
                      y: point[1],
                    })
                  }
                  onPointerLeave={() => setHoveredPlace(null)}
                  onFocus={() =>
                    setHoveredPlace({
                      label: place.label,
                      x: point[0],
                      y: point[1],
                    })
                  }
                  onBlur={() => setHoveredPlace(null)}
                >
                  <circle className="map-place-dot" r="4.5" />
                  <title>{place.label}</title>
                </g>
              ) : null;
            })}
          </g>
        )}
        {hoveredPlace && (
          <g
            className="map-hover-tooltip"
            transform={`translate(${hoveredPlace.x}, ${hoveredPlace.y < 35 ? hoveredPlace.y + 14 : hoveredPlace.y - 12})`}
            pointerEvents="none"
          >
            <rect
              x={-Math.max(26, (hoveredPlace.label.length * 7 + 16) / 2)}
              y={hoveredPlace.y < 35 ? 0 : -24}
              width={Math.max(52, hoveredPlace.label.length * 7 + 16)}
              height="22"
              rx="4"
              className="tooltip-box"
            />
            <path
              d={
                hoveredPlace.y < 35
                  ? "M -4 2 L 4 2 L 0 -3 Z"
                  : "M -4 -2 L 4 -2 L 0 3 Z"
              }
              className="tooltip-arrow"
            />
            <text
              y={hoveredPlace.y < 35 ? 14 : -9}
              textAnchor="middle"
              className="tooltip-text"
            >
              {hoveredPlace.label}
            </text>
          </g>
        )}
      </svg>
      {mode === "profile" && !readOnly && (
        <div className="map-overlay-label">
          <span className="plane-icon">✈</span>
          <span>
            {language === "ru"
              ? "Нажмите на страну, чтобы отметить её посещённой."
              : "Click a country to mark it as visited."}
          </span>
        </div>
      )}
      {loading && (
        <span className="map-loading">
          {language === "ru" ? "Загрузка карты..." : "Loading your map..."}
        </span>
      )}
    </div>
  );

  if (mode === "globe" || readOnly) return map;

  const copy =
    language === "ru"
      ? {
          label: "ДОБАВИТЬ МЕСТО",
          heading: "Новая отметка.",
          description: "Найдите город или страну и точно добавьте их на карту.",
          field: "Город или страна",
          placeholder: "Например, Лиссабон или Япония",
          add: "Добавить",
          searching: "Поиск...",
          empty: "Ничего не найдено. Попробуйте другой запрос.",
          unavailable: "Поиск временно недоступен. Попробуйте ещё раз.",
          clear: "Удалить все отметки",
          clearLabel: "Удалить все отметки с карты?",
        }
      : {
          label: "ADD A PLACE",
          heading: "Find your next mark.",
          description:
            "Search for a city or country and place it precisely on your map.",
          field: "City or country",
          placeholder: "Try Lisbon or Japan",
          add: "Add",
          searching: "Searching...",
          empty: "Nothing found. Try another spelling.",
          unavailable: "Search is unavailable right now. Try again.",
          clear: "Clear all marks",
          clearLabel: "Remove all marks from the map?",
        };
  return (
    <div className="profile-map-layout">
      <div className="profile-map-column">{map}</div>
      <aside className="place-search-panel">
        <p className="section-label">{copy.label}</p>
        <h2>{copy.heading}</h2>
        <p className="place-search-copy">{copy.description}</p>
        <form
          className="place-search-form"
          onSubmit={(event) => {
            event.preventDefault();
            void searchPlaces(true);
          }}
        >
          <label htmlFor="place-search">{copy.field}</label>
          <div className="place-search-row">
            <input
              id="place-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.placeholder}
            />
            <button
              className="button button-coral button-small"
              type="submit"
              disabled={searching}
            >
              {searching ? copy.searching : copy.add}
            </button>
          </div>
        </form>
        {searchError && <p className="place-search-error">{searchError}</p>}
        {searchResults.length > 0 && (
          <div className="place-search-results" aria-label={copy.field}>
            {searchResults.map((result) => (
              <button
                className="place-search-result"
                key={result.place_id}
                onClick={() => void addPlace(result)}
                type="button"
              >
                <strong>{result.display_name.split(",")[0]}</strong>
                <span>{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
        <button
          className="clear-places-button"
          onClick={() => {
            if (window.confirm(copy.clearLabel)) void clearPlaces();
          }}
          type="button"
        >
          {copy.clear}
        </button>
      </aside>
    </div>
  );
}
