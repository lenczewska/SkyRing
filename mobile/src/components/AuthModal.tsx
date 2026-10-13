import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { AuthMode } from "../types";

type AuthModalProps = {
  visible: boolean;
  mode: AuthMode;
  language: "en" | "ru";
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
};

export default function AuthModal({
  visible,
  mode,
  language,
  onClose,
  onSwitchMode,
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(
        language === "ru"
          ? "Пожалуйста, заполните все поля"
          : "Please fill in all fields",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const name = username.trim() || email.split("@")[0];
        await setDoc(doc(db, "users", userCred.user.uid), {
          username: name,
          email: userCred.user.email,
          createdAt: new Date().toISOString(),
          visitedCountries: [],
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.eyebrow}>
            {isLogin
              ? language === "ru"
                ? "ВХОД В АККАУНТ"
                : "WELCOME BACK"
              : language === "ru"
                ? "РЕГИСТРАЦИЯ"
                : "GET STARTED"}
          </Text>

          <Text style={styles.title}>
            {isLogin
              ? language === "ru"
                ? "Войдите в SkyRing"
                : "Log in to SkyRing"
              : language === "ru"
                ? "Создайте свой дневник"
                : "Create your travel diary"}
          </Text>

          {!isLogin && (
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={language === "ru" ? "Имя пользователя" : "Username"}
              placeholderTextColor="#88a19c"
              autoCapitalize="none"
            />
          )}

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#88a19c"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={language === "ru" ? "Пароль" : "Password"}
            placeholderTextColor="#88a19c"
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin
                  ? language === "ru"
                    ? "Войти ↗"
                    : "Log in ↗"
                  : language === "ru"
                    ? "Зарегистрироваться ↗"
                    : "Create Account ↗"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => onSwitchMode(isLogin ? "register" : "login")}
          >
            <Text style={styles.switchBtnText}>
              {isLogin
                ? language === "ru"
                  ? "Нет аккаунта? Зарегистрироваться"
                  : "Don't have an account? Sign up"
                : language === "ru"
                  ? "Уже есть аккаунт? Войти"
                  : "Already have an account? Log in"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(23, 63, 59, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#f7f4ed",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#173f3b",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 18,
    color: "#173f3b",
    fontWeight: "bold",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#e76f51",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#173f3b",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#173f3b",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#173f3b",
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  errorText: {
    color: "#c34f3e",
    fontSize: 12,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#e76f51",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 6,
  },
  submitBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
  switchBtn: {
    marginTop: 16,
    alignItems: "center",
  },
  switchBtnText: {
    color: "#173f3b",
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
