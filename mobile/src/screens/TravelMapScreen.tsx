import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import MapView, { type VisitedPlace } from "../MapView";
import { db } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, type Language } from "../i18n";
import type { PlaceDetails } from "../types";

type TravelMapScreenProps = {
  language: Language;
  user: User | null;
  onRequestAuth: () => void;
};

const TRANSPORT_OPTIONS_RU = [
  "Самолёт",
  "Поезд",
  "Автобус",
  "Автомобиль",
  "Корабль",
  "Пешком",
];

const TRANSPORT_OPTIONS_EN = [
  "Plane",
  "Train",
  "Bus",
  "Car",
  "Ship",
  "On foot",
];

export default function TravelMapScreen({
  language,
  user,
  onRequestAuth,
}: TravelMapScreenProps) {
  const t = translations[language];
  const [places, setPlaces] = useState<VisitedPlace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, PlaceDetails>>({});
  const [draft, setDraft] = useState<PlaceDetails>({});
  const [saved, setSaved] = useState(false);

  const transportOptions =
    language === "ru" ? TRANSPORT_OPTIONS_RU : TRANSPORT_OPTIONS_EN;

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid))
      .then((snapshot) =>
        setDetails(
          (snapshot.data()?.placeDetails as Record<string, PlaceDetails> | undefined) ??
            {},
        ),
      )
      .catch(() => setDetails({}));
  }, [user]);

  const selectPlace = (place: VisitedPlace) => {
    setSelectedId(place.id);
    setDraft(details[place.id] ?? {});
    setSaved(false);
  };

  const saveDetails = async () => {
    if (!selectedId) return;
    const nextDetails = { ...details, [selectedId]: draft };
    setDetails(nextDetails);
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      { placeDetails: nextDetails },
      { merge: true },
    );
    setSaved(true);
  };

  const removePlace = async (placeId: string) => {
    const nextPlaces = places.filter((p) => p.id !== placeId);
    setPlaces(nextPlaces);
    if (selectedId === placeId) setSelectedId(null);
    try {
      await AsyncStorage.setItem(
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
      } catch (err) {
        console.warn("Could not sync removal:", err);
      }
    }
  };

  const selectedPlace = places.find((p) => p.id === selectedId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>
        {language === "ru" ? "КАРТА ПУТЕШЕСТВИЙ" : "TRAVEL MAP"}
      </Text>
      <Text style={styles.title}>
        {language === "ru"
          ? "Места, которые остались с вами."
          : "Places that stayed with you."}
      </Text>

      {/* Interactive Map Component */}
      <MapView
        mode="profile"
        readOnly={false}
        user={user}
        language={language}
        places={places}
        onPlacesChange={setPlaces}
        onRequestAuth={onRequestAuth}
      />

      {/* Marked Places List */}
      <View style={styles.markedSection}>
        <Text style={styles.sectionHeading}>{t.markedPlaces}</Text>
        {places.length === 0 ? (
          <Text style={styles.emptyText}>{t.emptyPlaces}</Text>
        ) : (
          <View style={styles.placesList}>
            {places.map((place) => {
              const isSelected = selectedId === place.id;
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[
                    styles.placeItem,
                    isSelected ? styles.placeItemActive : null,
                  ]}
                  onPress={() => selectPlace(place)}
                  activeOpacity={0.7}
                >
                  <View style={styles.placeDot} />
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.label}</Text>
                    <Text style={styles.placeCoords}>
                      {place.latitude.toFixed(2)}, {place.longitude.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removePlace(place.id)}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Details editor for selected place */}
      {selectedPlace && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>
            {t.tripDetails}: {selectedPlace.label}
          </Text>

          <Text style={styles.fieldLabel}>
            {language === "ru" ? "Вид транспорта" : "Transport"}
          </Text>
          <View style={styles.transportRow}>
            {transportOptions.map((opt) => {
              const isSelected = draft.transport === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.transportChip,
                    isSelected ? styles.transportChipActive : null,
                  ]}
                  onPress={() => setDraft({ ...draft, transport: opt })}
                >
                  <Text
                    style={[
                      styles.transportChipText,
                      isSelected ? styles.transportChipTextActive : null,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>{t.story}</Text>
          <TextInput
            style={styles.textArea}
            value={draft.story || ""}
            onChangeText={(text) => setDraft({ ...draft, story: text })}
            placeholder={
              language === "ru"
                ? "Напишите воспоминание об этой поездке..."
                : "Write a memory of this trip..."
            }
            placeholderTextColor="#88a19c"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={saveDetails}>
            <Text style={styles.saveBtnText}>
              {saved
                ? language === "ru"
                  ? "✓ Сохранено"
                  : "✓ Saved"
                : t.save}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f4ed",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#e76f51",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#173f3b",
    marginBottom: 16,
  },
  markedSection: {
    marginTop: 24,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#173f3b",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    color: "#55706b",
    fontStyle: "italic",
  },
  placesList: {
    gap: 8,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.15)",
  },
  placeItemActive: {
    borderColor: "#e76f51",
    backgroundColor: "rgba(231, 111, 81, 0.05)",
  },
  placeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e76f51",
    marginRight: 10,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#173f3b",
  },
  placeCoords: {
    fontSize: 11,
    color: "#55706b",
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 16,
    color: "#c34f3e",
  },
  detailsCard: {
    marginTop: 20,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.15)",
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#173f3b",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#173f3b",
    marginBottom: 6,
    marginTop: 10,
  },
  transportRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  transportChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.25)",
  },
  transportChipActive: {
    backgroundColor: "#173f3b",
    borderColor: "#173f3b",
  },
  transportChipText: {
    fontSize: 11,
    color: "#173f3b",
  },
  transportChipTextActive: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#173f3b",
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    color: "#173f3b",
    height: 80,
    textAlignVertical: "top",
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: "#173f3b",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 14,
  },
  saveBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
