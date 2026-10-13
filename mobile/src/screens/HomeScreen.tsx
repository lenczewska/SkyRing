import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import type { User } from "firebase/auth";
import MapView from "../MapView";
import { translations, type Language } from "../i18n";

type HomeScreenProps = {
  language: Language;
  user: User | null;
  username?: string;
  onOpenMap: () => void;
  onRequestAuth: () => void;
};

export default function HomeScreen({
  language,
  user,
  username,
  onOpenMap,
  onRequestAuth,
}: HomeScreenProps) {
  const t = translations[language];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>
          {language === "ru" ? "ДНЕВНИК ПУТЕШЕСТВИЙ" : "TRAVEL DIARY"}
        </Text>
        <Text style={styles.title}>
          {user
            ? `${t.greeting}, ${username || "traveller"}!`
            : t.heroTitle}
        </Text>
        <Text style={styles.description}>
          {t.heroDesc}
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onOpenMap}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {user ? t.exploreMap : t.startJourney} ↗
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rotating Interactive 3D Globe */}
      <View style={styles.globeSection}>
        <Text style={styles.sectionHeading}>
          {language === "ru" ? "ВАШ ГЛОБУС" : "YOUR GLOBE"}
        </Text>
        <MapView
          mode="globe"
          readOnly
          user={user}
          language={language}
          onRequestAuth={onRequestAuth}
        />
      </View>

      {/* Inspiration Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionHeading}>
          {language === "ru" ? "ВОЗМОЖНОСТИ" : "FEATURES"}
        </Text>
        <View style={styles.featureCard}>
          <Text style={styles.featureNum}>01</Text>
          <Text style={styles.featureTitle}>
            {language === "ru" ? "Интерактивная карта" : "Interactive Map"}
          </Text>
          <Text style={styles.featureText}>
            {language === "ru"
              ? "Отмечайте посещённые страны и города в одно касание."
              : "Mark visited countries and cities with a single tap."}
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureNum}>02</Text>
          <Text style={styles.featureTitle}>
            {language === "ru" ? "Воспоминания и фото" : "Memories & Photos"}
          </Text>
          <Text style={styles.featureText}>
            {language === "ru"
              ? "Сохраняйте впечатления, транспорт и даты поездок."
              : "Save impressions, transport, and dates of your trips."}
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureNum}>03</Text>
          <Text style={styles.featureTitle}>
            {language === "ru" ? "Истории сообщества" : "Travel Stories"}
          </Text>
          <Text style={styles.featureText}>
            {language === "ru"
              ? "Делитесь своими поездками и вдохновляйтесь маршрутами других."
              : "Share your travels and get inspired by other itineraries."}
          </Text>
        </View>
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
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.15)",
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#e76f51",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#173f3b",
    lineHeight: 30,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: "#55706b",
    lineHeight: 20,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#e76f51",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  globeSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#173f3b",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  featuresSection: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.12)",
  },
  featureNum: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#e76f51",
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#173f3b",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: "#55706b",
    lineHeight: 18,
  },
});
