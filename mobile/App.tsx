import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./src/firebase";
import HomeScreen from "./src/screens/HomeScreen";
import TravelMapScreen from "./src/screens/TravelMapScreen";
import PostsScreen from "./src/screens/PostsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AuthModal from "./src/components/AuthModal";
import { translations, type Language } from "./src/i18n";
import type { AuthMode, TabPage } from "./src/types";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabPage>("home");
  const [language, setLanguage] = useState<Language>("ru");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  const t = translations[language];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          setUsername(snap.data()?.username || "");
        } catch {
          setUsername("");
        }
      } else {
        setUsername("");
      }
    });
    return unsub;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f4ed" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.brand}
          onPress={() => setActiveTab("home")}
        >
          <View style={styles.brandMark}>
            <View style={styles.ringDot} />
            <View style={styles.ringDot} />
            <View style={styles.ringDot} />
          </View>
          <Text style={styles.brandText}>SkyRing</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* Language Switcher */}
          <View style={styles.langSwitch}>
            <TouchableOpacity onPress={() => setLanguage("en")}>
              <Text
                style={[
                  styles.langText,
                  language === "en" ? styles.langActive : null,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
            <Text style={styles.langDivider}>/</Text>
            <TouchableOpacity onPress={() => setLanguage("ru")}>
              <Text
                style={[
                  styles.langText,
                  language === "ru" ? styles.langActive : null,
                ]}
              >
                RU
              </Text>
            </TouchableOpacity>
          </View>

          {/* User / Login Button */}
          {user ? (
            <TouchableOpacity
              style={styles.userButton}
              onPress={() => setActiveTab("profile")}
            >
              <Text style={styles.userButtonText} numberOfLines={1}>
                @{username || "user"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => setAuthMode("login")}
            >
              <Text style={styles.loginButtonText}>{t.login}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Screen Body */}
      <View style={styles.body}>
        {activeTab === "home" && (
          <HomeScreen
            language={language}
            user={user}
            username={username}
            onOpenMap={() => setActiveTab("map")}
            onRequestAuth={() => setAuthMode("login")}
          />
        )}
        {activeTab === "map" && (
          <TravelMapScreen
            language={language}
            user={user}
            onRequestAuth={() => setAuthMode("login")}
          />
        )}
        {activeTab === "posts" && (
          <PostsScreen
            language={language}
            user={user}
            onRequestAuth={() => setAuthMode("login")}
          />
        )}
        {activeTab === "profile" && (
          <ProfileScreen
            language={language}
            user={user}
            username={username}
            onRequestAuth={() => setAuthMode("login")}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "home" ? styles.tabActive : null]}
          onPress={() => setActiveTab("home")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "home" ? styles.tabIconActive : null,
            ]}
          >
            🏠
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "home" ? styles.tabLabelActive : null,
            ]}
          >
            {t.home}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "map" ? styles.tabActive : null]}
          onPress={() => setActiveTab("map")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "map" ? styles.tabIconActive : null,
            ]}
          >
            🗺️
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "map" ? styles.tabLabelActive : null,
            ]}
          >
            {t.map}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "posts" ? styles.tabActive : null,
          ]}
          onPress={() => setActiveTab("posts")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "posts" ? styles.tabIconActive : null,
            ]}
          >
            📖
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "posts" ? styles.tabLabelActive : null,
            ]}
          >
            {t.posts}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "profile" ? styles.tabActive : null,
          ]}
          onPress={() => setActiveTab("profile")}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "profile" ? styles.tabIconActive : null,
            ]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "profile" ? styles.tabLabelActive : null,
            ]}
          >
            {t.profile}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auth Modal */}
      {authMode && (
        <AuthModal
          visible={Boolean(authMode)}
          mode={authMode}
          language={language}
          onClose={() => setAuthMode(null)}
          onSwitchMode={setAuthMode}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f4ed",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(23, 63, 59, 0.12)",
    backgroundColor: "#f7f4ed",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandMark: {
    flexDirection: "row",
    gap: 3,
  },
  ringDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e76f51",
  },
  brandText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#173f3b",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  langSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#88a19c",
  },
  langActive: {
    color: "#173f3b",
    fontWeight: "bold",
  },
  langDivider: {
    fontSize: 12,
    color: "#88a19c",
  },
  loginButton: {
    backgroundColor: "#173f3b",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  userButton: {
    backgroundColor: "rgba(23, 63, 59, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    maxWidth: 110,
  },
  userButtonText: {
    color: "#173f3b",
    fontSize: 12,
    fontWeight: "bold",
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "rgba(23, 63, 59, 0.1)",
    paddingVertical: 8,
    paddingBottom: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {},
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: "#88a19c",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#e76f51",
    fontWeight: "bold",
  },
});
