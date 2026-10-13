import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  ScrollView,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import Svg, {
  G,
  Path,
  Circle,
  Defs,
  ClipPath,
} from "react-native-svg";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

export type VisitedPlace = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  kind?: "country" | "city";
  country?: string;
  city?: string;
};

export type MapViewProps = {
  user?: User | null;
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

const worldLand = feature(
  worldData as never,
  worldData.objects.land as never,
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
      // ignore
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
  москва: { lat: 55.7558, lon: 37.6173, city: "Moscow", country: "Russia" },
  moscow: { lat: 55.7558, lon: 37.6173, city: "Moscow", country: "Russia" },
  "санкт-петербург": { lat: 59.9343, lon: 30.3351, city: "Saint Petersburg", country: "Russia" },
  "saint petersburg": { lat: 59.9343, lon: 30.3351, city: "Saint Petersburg", country: "Russia" },
  рим: { lat: 41.9028, lon: 12.4964, city: "Rome", country: "Italy" },
  rome: { lat: 41.9028, lon: 12.4964, city: "Rome", country: "Italy" },
  париж: { lat: 48.8566, lon: 2.3522, city: "Paris", country: "France" },
  paris: { lat: 48.8566, lon: 2.3522, city: "Paris", country: "France" },
  лондон: { lat: 51.5074, lon: -0.1278, city: "London", country: "United Kingdom" },
  london: { lat: 51.5074, lon: -0.1278, city: "London", country: "United Kingdom" },
  токио: { lat: 35.6762, lon: 139.6503, city: "Tokyo", country: "Japan" },
  tokyo: { lat: 35.6762, lon: 139.6503, city: "Tokyo", country: "Japan" },
  дубай: { lat: 25.2048, lon: 55.2708, city: "Dubai", country: "United Arab Emirates" },
  dubai: { lat: 25.2048, lon: 55.2708, city: "Dubai", country: "United Arab Emirates" },
  "нью-йорк": { lat: 40.7128, lon: -74.006, city: "New York", country: "United States of America" },
  "new york": { lat: 40.7128, lon: -74.006, city: "New York", country: "United States of America" },
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

  for (const p of places) {
    if (!p) continue;
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
      if (countriesWithCities.has(countryName.toLowerCase())) continue;
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
  mode = "profile",
  places: propPlaces,
}: MapViewProps) {
  const [internalPlaces, setInternalPlaces] = useState<VisitedPlace[]>([]);
  const places = propPlaces !== undefined ? propPlaces : internalPlaces;
  const setPlaces = (next: VisitedPlace[]) => {
    setInternalPlaces(next);
  };

  const [loading, setLoading] = useState(Boolean(user));
  const [rotation, setRotation] = useState(0);

  const isInteractingGlobe = useRef(false);
  const lastGlobeTouchX = useRef<number | null>(null);
  const lastGlobeTouchTime = useRef<number>(0);
  const globeVelocity = useRef<number>(0);

  // Silky smooth 60 FPS requestAnimationFrame auto-rotation with seamless physics
  useEffect(() => {
    if (mode !== "globe") return undefined;

    let animId: number;
    let prevTime = Date.now();

    const renderLoop = () => {
      const now = Date.now();
      const dt = Math.min(50, now - prevTime) / 1000;
      prevTime = now;

      if (!isInteractingGlobe.current) {
        if (Math.abs(globeVelocity.current) > 0.05) {
          setRotation((r) => (r + globeVelocity.current) % 360);
          globeVelocity.current *= 0.94;
        } else {
          // Perfectly steady 28 deg/sec continuous rotation without any hiccups
          setRotation((r) => (r + dt * 28) % 360);
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [mode]);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [mapZoom, setMapZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const transformRef = useRef({ zoom: 1, x: 0, y: 0 });
  const containerLayout = useRef({ width: 360, height: 260 });
  const onPlacesChangeRef = useRef(onPlacesChange);

  useEffect(() => {
    onPlacesChangeRef.current = onPlacesChange;
  }, [onPlacesChange]);

  const mapWidth = mode === "profile" ? 960 : 620;
  const mapHeight = 500;

  const projection = useMemo(() => {
    if (mode === "profile") {
      return geoNaturalEarth1().fitSize([960, 500], world as any);
    }
    return geoOrthographic()
      .rotate([rotation, -10, 0])
      .clipAngle(90)
      .fitExtent(
        [
          [68, 8],
          [552, 492],
        ],
        { type: "Sphere" },
      );
  }, [mode, rotation]);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);
  const countries = (world as any).features as any[];

  // Storage and Firestore sync
  useEffect(() => {
    let active = true;
    const loadPlaces = async () => {
      if (!user) {
        try {
          const local = await AsyncStorage.getItem("skyring-guest-places");
          if (local && active) {
            const parsed = JSON.parse(local);
            const normalized = normalizePlaces(parsed);
            setPlaces(normalized);
            onPlacesChangeRef.current?.(normalized);
          }
        } catch {
          if (active) setPlaces([]);
        }
        if (active) setLoading(false);
      } else {
        try {
          setLoading(true);
          const snapshot = await getDoc(doc(db, "users", user.uid));
          if (!active) return;
          const savedPlaces =
            (snapshot.data()?.visitedCountries as VisitedPlace[] | undefined) ?? [];
          const normalized = normalizePlaces(savedPlaces);
          setPlaces(normalized);
          onPlacesChangeRef.current?.(normalized);
        } catch {
          // ignore
        } finally {
          if (active) setLoading(false);
        }
      }
    };

    void loadPlaces();
    return () => {
      active = false;
    };
  }, [user]);

  const applyTransform = (nextZoom: number, nextX: number, nextY: number) => {
    const clampedZoom = Math.min(36, Math.max(1, Number(nextZoom.toFixed(3))));
    let clampedX = nextX;
    let clampedY = nextY;

    if (clampedZoom === 1) {
      clampedX = 0;
      clampedY = 0;
    } else {
      const minX = 960 * (1 - clampedZoom);
      const maxX = 0;
      const minY = 500 * (1 - clampedZoom);
      const maxY = 0;

      clampedX = Math.max(minX - 160, Math.min(maxX + 160, clampedX));
      clampedY = Math.max(minY - 120, Math.min(maxY + 120, clampedY));
    }

    transformRef.current = { zoom: clampedZoom, x: clampedX, y: clampedY };
    setMapZoom(clampedZoom);
    setPanOffset({ x: clampedX, y: clampedY });
  };

  const zoomAround = (targetZoom: number, focusSvgX = 480, focusSvgY = 250) => {
    const current = transformRef.current;
    const clampedZoom = Math.min(36, Math.max(1, Number(targetZoom.toFixed(3))));

    if (clampedZoom === 1) {
      applyTransform(1, 0, 0);
      return;
    }

    const lx = (focusSvgX - current.x) / current.zoom;
    const ly = (focusSvgY - current.y) / current.zoom;

    const nextX = focusSvgX - lx * clampedZoom;
    const nextY = focusSvgY - ly * clampedZoom;

    applyTransform(clampedZoom, nextX, nextY);
  };

  const getSvgCoordinates = (viewX: number, viewY: number) => {
    const { width, height } = containerLayout.current;
    if (width <= 0 || height <= 0) return { x: 480, y: 250 };

    const svgAspect = 960 / 500;
    const viewAspect = width / height;

    let renderW = width;
    let renderH = height;
    let offsetX = 0;
    let offsetY = 0;

    if (viewAspect > svgAspect) {
      renderW = height * svgAspect;
      offsetX = (width - renderW) / 2;
    } else {
      renderH = width / svgAspect;
      offsetY = (height - renderH) / 2;
    }

    const clampedX = Math.max(0, Math.min(renderW, viewX - offsetX));
    const clampedY = Math.max(0, Math.min(renderH, viewY - offsetY));

    return {
      x: (clampedX / renderW) * 960,
      y: (clampedY / renderH) * 500,
    };
  };

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

  const addCountry = async (country: any) => {
    const countryName = country.properties?.name ?? countryKey(country);
    const key = countryKey(country);
    const id = String(country.id ?? "");
    const targetName = countryName.toLowerCase();

    const isVisited = isCountryVisited(country);
    let nextPlaces: VisitedPlace[];

    if (isVisited) {
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
      await AsyncStorage.setItem("skyring-guest-places", JSON.stringify(nextPlaces));
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
      await AsyncStorage.setItem("skyring-guest-places", JSON.stringify(nextPlaces));
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

  const searchPlaces = async (autoAdd = true) => {
    const query = search.trim();
    if (!query) return;

    setSearching(true);
    setSearchError("");
    const normalized = query.toLowerCase();

    const countryMatch = findCountryFeatureByName(normalized);
    if (countryMatch) {
      if (autoAdd) {
        await addCountry(countryMatch);
        setSearch("");
        setSearching(false);
        return;
      }
    }

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
        const first = results[0];
        const lat = Number(first.lat);
        const lon = Number(first.lon);
        const countryFeature = findCountryFeatureForCoord(lon, lat);
        const country =
          countryFeature?.properties?.name ||
          first.address?.country ||
          "";
        const cityName =
          first.name ||
          first.address?.city ||
          first.address?.town ||
          first.address?.village ||
          first.display_name.split(",")[0].trim();

        const label =
          country && cityName && country.toLowerCase() !== cityName.toLowerCase()
            ? `${country}, ${cityName}`
            : (cityName || country);

        await addPlaceDirect({
          id: `${first.place_id}`,
          latitude: lat,
          longitude: lon,
          label,
          country: country || undefined,
          city: cityName || undefined,
          kind: country && cityName ? "city" : "country",
        });
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

  // PanResponder gesture handling
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartCenter = useRef<{ x: number; y: number } | null>(null);
  const lastSingleSvg = useRef<{ x: number; y: number } | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const touches = evt.nativeEvent.touches;
          if (mode === "globe") {
            isInteractingGlobe.current = true;
            globeVelocity.current = 0;
            if (touches.length >= 1) {
              lastGlobeTouchX.current = touches[0].pageX;
              lastGlobeTouchTime.current = Date.now();
            }
            return;
          }

          if (touches.length === 1) {
            const svgPt = getSvgCoordinates(touches[0].locationX, touches[0].locationY);
            lastSingleSvg.current = svgPt;
            pinchStartDist.current = null;
          } else if (touches.length >= 2) {
            const t1 = touches[0];
            const t2 = touches[1];
            const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
            pinchStartDist.current = dist;

            const midX = (t1.locationX + t2.locationX) / 2;
            const midY = (t1.locationY + t2.locationY) / 2;
            pinchStartCenter.current = getSvgCoordinates(midX, midY);
            lastSingleSvg.current = null;
          }
        },
        onPanResponderMove: (
          evt: GestureResponderEvent,
          _gestureState: PanResponderGestureState,
        ) => {
          const touches = evt.nativeEvent.touches;

          if (mode === "globe") {
            if (touches.length >= 1 && lastGlobeTouchX.current !== null) {
              const currentX = touches[0].pageX;
              const now = Date.now();
              const dx = currentX - lastGlobeTouchX.current;
              const dt = Math.max(1, now - lastGlobeTouchTime.current);

              // High sensitivity for effortless finger dragging
              const deltaRot = dx * 0.85;
              setRotation((r) => (r + deltaRot) % 360);

              // Responsive flick velocity
              globeVelocity.current = (dx / dt) * 14;

              lastGlobeTouchX.current = currentX;
              lastGlobeTouchTime.current = now;
            }
            return;
          }

          if (touches.length >= 2) {
            const t1 = touches[0];
            const t2 = touches[1];
            const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
            const midX = (t1.locationX + t2.locationX) / 2;
            const midY = (t1.locationY + t2.locationY) / 2;
            const currMidSvg = getSvgCoordinates(midX, midY);

            if (pinchStartDist.current && pinchStartDist.current > 0 && pinchStartCenter.current) {
              const ratio = dist / pinchStartDist.current;
              const current = transformRef.current;
              const targetZoom = Math.min(36, Math.max(1, current.zoom * ratio));

              const dMidX = currMidSvg.x - pinchStartCenter.current.x;
              const dMidY = currMidSvg.y - pinchStartCenter.current.y;

              const lx = (currMidSvg.x - current.x) / current.zoom;
              const ly = (currMidSvg.y - current.y) / current.zoom;

              const nextX = currMidSvg.x - lx * targetZoom + dMidX;
              const nextY = currMidSvg.y - ly * targetZoom + dMidY;

              applyTransform(targetZoom, nextX, nextY);
            }

            pinchStartDist.current = dist;
            pinchStartCenter.current = currMidSvg;
          } else if (touches.length === 1) {
            const svgPt = getSvgCoordinates(touches[0].locationX, touches[0].locationY);
            if (transformRef.current.zoom > 1 && lastSingleSvg.current) {
              const dSvgX = svgPt.x - lastSingleSvg.current.x;
              const dSvgY = svgPt.y - lastSingleSvg.current.y;
              const current = transformRef.current;

              applyTransform(current.zoom, current.x + dSvgX, current.y + dSvgY);
            }
            lastSingleSvg.current = svgPt;
          }
        },
        onPanResponderRelease: (
          evt: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ) => {
          if (mode === "globe") {
            isInteractingGlobe.current = false;
            lastGlobeTouchX.current = null;
            // Cap velocity
            if (Math.abs(globeVelocity.current) > 8) {
              globeVelocity.current = Math.sign(globeVelocity.current) * 8;
            }
            return;
          }

          pinchStartDist.current = null;
          pinchStartCenter.current = null;
          lastSingleSvg.current = null;

          if (
            Math.abs(gestureState.dx) < 6 &&
            Math.abs(gestureState.dy) < 6 &&
            !readOnly
          ) {
            const touch = evt.nativeEvent;
            const svgPt = getSvgCoordinates(touch.locationX, touch.locationY);
            const current = transformRef.current;
            const mapX = (svgPt.x - current.x) / current.zoom;
            const mapY = (svgPt.y - current.y) / current.zoom;

            const geo = projection.invert ? projection.invert([mapX, mapY]) : null;
            if (geo && !isNaN(geo[0]) && !isNaN(geo[1])) {
              const country = findCountryFeatureForCoord(geo[0], geo[1]);
              if (country) {
                void addCountry(country);
              }
            }
          }
        },
        onPanResponderTerminate: () => {
          if (mode === "globe") {
            isInteractingGlobe.current = false;
            lastGlobeTouchX.current = null;
          }
          pinchStartDist.current = null;
          pinchStartCenter.current = null;
          lastSingleSvg.current = null;
        },
      }),
    [mode, readOnly, projection],
  );

  const visitedCountryFeatures = useMemo(() => {
    return countries.filter((c) => isCountryVisited(c));
  }, [countries, places]);

  const cityPlaces = places.filter((place) => !isCountryPlace(place));
  const globeCenter =
    mode === "globe" ? (projection.invert?.([310, 250]) ?? null) : null;
  const visiblePlaces = cityPlaces.filter((place) => {
    if (mode !== "globe") return true;
    return globeCenter
      ? geoDistance([place.longitude, place.latitude], globeCenter) <=
          Math.PI / 2
      : false;
  });

  return (
    <View style={styles.container}>
      <View
        style={styles.mapPanel}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          containerLayout.current = { width, height };
        }}
        {...panResponder.panHandlers}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        >
          {mode === "globe" && (
            <Defs>
              <ClipPath id="globe-clip">
                <Circle cx="310" cy="250" r="243" />
              </ClipPath>
            </Defs>
          )}
          <G
            transform={
              mode === "profile"
                ? `translate(${panOffset.x}, ${panOffset.y}) scale(${mapZoom})`
                : undefined
            }
          >
            {mode === "globe" && (
              <Circle cx="310" cy="250" r="242" fill="rgba(23, 63, 59, 0.04)" />
            )}
            <G clipPath={mode === "globe" ? "url(#globe-clip)" : undefined}>
              {mode === "globe" ? (
                <>
                  {/* Single optimized path for all world continents - 0ms render time */}
                  {(() => {
                    const landD = pathGenerator(worldLand);
                    if (!landD) return null;
                    return (
                      <Path
                        d={landD}
                        fill="rgba(23, 63, 59, 0.06)"
                        stroke="#173f3b"
                        strokeWidth={0.8}
                      />
                    );
                  })()}

                  {/* Highlight only visited countries */}
                  {visitedCountryFeatures.map((country) => {
                    const pathD = pathGenerator(country);
                    if (!pathD) return null;

                    return (
                      <Path
                        key={`visited-${countryKey(country)}`}
                        d={pathD}
                        fill="#dcf2df"
                        stroke="#387f58"
                        strokeWidth={1.2}
                      />
                    );
                  })}
                </>
              ) : (
                countries.map((country) => {
                  const visited = isCountryVisited(country);
                  const pathD = pathGenerator(country);
                  if (!pathD) return null;

                  return (
                    <Path
                      key={countryKey(country)}
                      d={pathD}
                      fill={visited ? "#dcf2df" : "transparent"}
                      stroke={visited ? "#387f58" : "#173f3b"}
                      strokeWidth={0.8}
                      vectorEffect={mode === "profile" ? "non-scaling-stroke" : undefined}
                    />
                  );
                })
              )}
            </G>

            {visiblePlaces.map((place) => {
              const pt = projection([place.longitude, place.latitude]);
              if (!pt) return null;
              const r =
                mode === "profile"
                  ? Math.max(0.12, 3.2 / Math.pow(mapZoom, 0.9))
                  : 3.2;
              const strokeW =
                mode === "profile"
                  ? Math.max(0.04, 1.1 / Math.pow(mapZoom, 0.9))
                  : 1.1;
              return (
                <Circle
                  key={place.id}
                  cx={pt[0]}
                  cy={pt[1]}
                  r={r}
                  fill="#e76f51"
                  stroke="#ffffff"
                  strokeWidth={strokeW}
                />
              );
            })}
          </G>
        </Svg>

        {/* Zoom Controls */}
        {mode === "profile" && !readOnly && (
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => zoomAround(transformRef.current.zoom * 1.35)}
              activeOpacity={0.7}
            >
              <Text style={styles.zoomButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => zoomAround(transformRef.current.zoom / 1.35)}
              activeOpacity={0.7}
            >
              <Text style={styles.zoomButtonText}>−</Text>
            </TouchableOpacity>
            {mapZoom > 1 && (
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => zoomAround(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.zoomButtonText}>↺</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.loadingText}>
              {language === "ru" ? "Загрузка карты..." : "Loading map..."}
            </Text>
          </View>
        )}
      </View>

      {/* Place search panel if not readOnly */}
      {!readOnly && mode === "profile" && (
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>
            {language === "ru" ? "ДОБАВИТЬ МЕСТО" : "ADD A PLACE"}
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={
                language === "ru" ? "Например, Лиссабон или Япония" : "Try Lisbon or Japan"
              }
              placeholderTextColor="#88a19c"
              onSubmitEditing={() => void searchPlaces(true)}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => void searchPlaces(true)}
              disabled={searching}
            >
              <Text style={styles.searchButtonText}>
                {searching
                  ? language === "ru"
                    ? "Поиск..."
                    : "Searching..."
                  : language === "ru"
                    ? "Добавить"
                    : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
          {searchError ? (
            <Text style={styles.errorText}>{searchError}</Text>
          ) : null}
          {searchResults.length > 0 && (
            <ScrollView style={styles.resultsList}>
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.place_id}
                  style={styles.resultItem}
                  onPress={() => {
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
                    void addPlaceDirect({
                      id: `${result.place_id}`,
                      latitude: lat,
                      longitude: lon,
                      label,
                      country: country || undefined,
                      city: cityName || undefined,
                      kind: country && cityName ? "city" : "country",
                    });
                  }}
                >
                  <Text style={styles.resultMain}>
                    {result.display_name.split(",")[0]}
                  </Text>
                  <Text style={styles.resultSub} numberOfLines={1}>
                    {result.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  mapPanel: {
    width: "100%",
    height: 380,
    backgroundColor: "#f7f4ed",
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#173f3b",
  },
  zoomControls: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "column",
    gap: 6,
    zIndex: 10,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "rgba(247, 244, 237, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#173f3b",
  },
  loadingBox: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(23, 63, 59, 0.9)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    gap: 8,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
  },
  searchSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.15)",
  },
  searchLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#173f3b",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#173f3b",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#173f3b",
  },
  searchButton: {
    backgroundColor: "#e76f51",
    paddingHorizontal: 16,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
  errorText: {
    color: "#c34f3e",
    fontSize: 11,
    marginTop: 6,
  },
  resultsList: {
    maxHeight: 180,
    marginTop: 10,
  },
  resultItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ede6",
  },
  resultMain: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#173f3b",
  },
  resultSub: {
    fontSize: 11,
    color: "#55706b",
    marginTop: 2,
  },
});
