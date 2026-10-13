import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import MapView, { type VisitedPlace } from "../MapView";
import { translations, type Language } from "../i18n";

type ProfileScreenProps = {
  language: Language;
  user: User | null;
  username?: string;
  onRequestAuth: () => void;
};

export default function ProfileScreen({
  language,
  user,
  username,
  onRequestAuth,
}: ProfileScreenProps) {
  const t = translations[language];
  const [places, setPlaces] = useState<VisitedPlace[]>([]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid))
      .then((snapshot) => {
        const p = (snapshot.data()?.visitedCountries as VisitedPlace[]) ?? [];
        setPlaces(p);
      })
      .catch(() => setPlaces([]));
  }, [user]);

  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestTitle}>
          {language === "ru"
            ? "Войдите, чтобы просмотреть профиль"
            : "Log in to view your profile"}
        </Text>
        <TouchableOpacity style={styles.loginBtn} onPress={onRequestAuth}>
          <Text style={styles.loginBtnText}>{t.login} ↗</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const countriesCount = new Set(
    places.map((p) => p.country || p.label),
  ).size;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(username || user.email || "U")[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>@{username || "traveller"}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => void signOut(auth)}
        >
          <Text style={styles.logoutBtnText}>{t.logout}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Counter */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{places.length}</Text>
          <Text style={styles.statLabel}>
            {language === "ru" ? "Отметок" : "Places"}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{countriesCount}</Text>
          <Text style={styles.statLabel}>
            {language === "ru" ? "Стран" : "Countries"}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {Math.min(100, Math.round((countriesCount / 195) * 100))}%
          </Text>
          <Text style={styles.statLabel}>
            {language === "ru" ? "Мира" : "World"}
          </Text>
        </View>
      </View>

      {/* Read-only map overview */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionHeading}>
          {language === "ru" ? "КАРТА ПУТЕШЕСТВИЙ" : "TRAVEL MAP"}
        </Text>
        <MapView
          mode="profile"
          readOnly
          user={user}
          language={language}
          places={places}
        />
      </View>
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
  guestContainer: {
    flex: 1,
    backgroundColor: "#f7f4ed",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#173f3b",
    marginBottom: 16,
    textAlign: "center",
  },
  loginBtn: {
    backgroundColor: "#e76f51",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  loginBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.12)",
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e76f51",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#173f3b",
  },
  userEmail: {
    fontSize: 12,
    color: "#88a19c",
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  logoutBtnText: {
    color: "#c34f3e",
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.12)",
    alignItems: "center",
  },
  statNum: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#173f3b",
  },
  statLabel: {
    fontSize: 11,
    color: "#55706b",
    marginTop: 2,
  },
  mapSection: {
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#173f3b",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
});
