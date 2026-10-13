import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { translations, type Language } from "../i18n";
import type { Post } from "../types";

type PostsScreenProps = {
  language: Language;
  user: User | null;
  onRequestAuth: () => void;
};

export default function PostsScreen({
  language,
  user,
  onRequestAuth,
}: PostsScreenProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [location, setLocation] = useState("");
  const [story, setStory] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "posts"));
      const loaded: Post[] = [];
      snap.forEach((d) => {
        loaded.push({ id: d.id, ...d.data() } as Post);
      });
      setPosts(loaded);
    } catch {
      // Mock fallback if offline/no firestore
      setPosts([
        {
          id: "1",
          authorId: "1",
          authorName: "Alex",
          location: "Lisbon, Portugal",
          date: "May 2026",
          story: "Walking through the narrow streets of Alfama at sunset.",
          likes: 5,
          comments: [],
        },
        {
          id: "2",
          authorId: "2",
          authorName: "Elena",
          location: "Kyoto, Japan",
          date: "April 2026",
          story: "Cherry blossoms in full bloom around Arashiyama bamboo grove.",
          likes: 12,
          comments: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!location.trim() || !story.trim() || !user) return;
    setCreating(true);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split("@")[0] || "Traveler",
      location: location.trim(),
      date: new Date().toLocaleDateString(),
      story: story.trim(),
      likes: 0,
      comments: [],
    };

    try {
      await setDoc(doc(db, "posts", newPost.id), newPost);
      setPosts([newPost, ...posts]);
      setLocation("");
      setStory("");
      setShowCreate(false);
    } catch (err) {
      console.warn("Could not save post:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!user) {
      onRequestAuth();
      return;
    }
    const nextLikes = post.likes + 1;
    setPosts(
      posts.map((p) => (p.id === post.id ? { ...p, likes: nextLikes } : p)),
    );
    try {
      await updateDoc(doc(db, "posts", post.id), { likes: nextLikes });
    } catch {
      // ignore
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>
            {language === "ru" ? "ИСТОРИИ ПУТЕШЕСТВЕННИКОВ" : "TRAVEL STORIES"}
          </Text>
          <Text style={styles.title}>
            {language === "ru"
              ? "Впечатления из разных уголков мира."
              : "Impressions from around the world."}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            if (!user) {
              onRequestAuth();
            } else {
              setShowCreate(!showCreate);
            }
          }}
        >
          <Text style={styles.createBtnText}>
            {showCreate ? "✕" : "+"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create post modal/card */}
      {showCreate && (
        <View style={styles.createCard}>
          <Text style={styles.createCardTitle}>
            {language === "ru" ? "Новая история" : "New travel story"}
          </Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder={
              language === "ru" ? "Город, страна" : "City, Country"
            }
            placeholderTextColor="#88a19c"
          />
          <TextInput
            style={styles.textArea}
            value={story}
            onChangeText={setStory}
            placeholder={
              language === "ru"
                ? "Поделитесь впечатлениями и советами..."
                : "Share your impressions and tips..."
            }
            placeholderTextColor="#88a19c"
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={styles.submitPostBtn}
            onPress={handleCreatePost}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitPostBtnText}>
                {language === "ru" ? "Опубликовать ↗" : "Publish ↗"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color="#173f3b" />
      ) : (
        <View style={styles.postsList}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postTop}>
                <Text style={styles.authorName}>@{post.authorName}</Text>
                <Text style={styles.postDate}>{post.date}</Text>
              </View>
              <Text style={styles.postLocation}>📍 {post.location}</Text>
              <Text style={styles.postStory}>{post.story}</Text>
              <View style={styles.postBottom}>
                <TouchableOpacity
                  style={styles.likeBtn}
                  onPress={() => handleLike(post)}
                >
                  <Text style={styles.likeBtnText}>♥ {post.likes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#e76f51",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#173f3b",
    maxWidth: 260,
  },
  createBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e76f51",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "bold",
  },
  createCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.15)",
    marginBottom: 20,
  },
  createCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#173f3b",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#173f3b",
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    color: "#173f3b",
    marginBottom: 10,
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
    marginBottom: 12,
  },
  submitPostBtn: {
    backgroundColor: "#173f3b",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  submitPostBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  postsList: {
    gap: 14,
  },
  postCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(23, 63, 59, 0.12)",
  },
  postTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#e76f51",
  },
  postDate: {
    fontSize: 11,
    color: "#88a19c",
  },
  postLocation: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#173f3b",
    marginBottom: 6,
  },
  postStory: {
    fontSize: 13,
    color: "#55706b",
    lineHeight: 19,
    marginBottom: 10,
  },
  postBottom: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  likeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  likeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e76f51",
  },
});
