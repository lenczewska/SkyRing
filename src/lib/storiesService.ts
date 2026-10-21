import { collection, doc, getDoc, getDocs, limit, query, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { StoryItem, UserStoryGroup } from "../types";

const SEEN_STORIES_KEY = "skyring-seen-stories";
const GUEST_STORIES_KEY = "skyring-guest-stories";

export const FAKE_USERNAMES = [
  "sophie_nomad",
  "marco_rossi",
  "elena_voyage",
  "alex_explorer",
];

// Curated travel stories - empty so no fake users/stories are shown
export const CURATED_STORY_GROUPS: UserStoryGroup[] = [];

// Presets for quick story creation if user wants to pick a travel scenery
export const STORY_TRAVEL_PRESETS = [
  {
    label: { ru: "Горы и рассвет", en: "Mountains & Sunrise" },
    location: { ru: "Швейцарские Альпы", en: "Swiss Alps" },
    caption: { ru: "Чистый воздух и бесконечные вершины 🏔️", en: "Crisp air and endless peaks 🏔️" },
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85",
  },
  {
    label: { ru: "Тропический закат", en: "Tropical Sunset" },
    location: { ru: "Бали, Индонезия", en: "Bali, Indonesia" },
    caption: { ru: "Золотой час на побережье 🌅", en: "Golden hour on the shore 🌅" },
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=85",
  },
  {
    label: { ru: "Уютный старый город", en: "Cozy Old Town" },
    location: { ru: "Прага, Чехия", en: "Prague, Czechia" },
    caption: { ru: "Улочки, дышащие средневековой сказкой 🏰", en: "Streets breathing medieval magic 🏰" },
    url: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1080&q=85",
  },
  {
    label: { ru: "Огни мегаполиса", en: "City Lights" },
    location: { ru: "Токио, Япония", en: "Tokyo, Japan" },
    caption: { ru: "Ночной ритм неонового города 🏮", en: "Night pulse of neon city 🏮" },
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1080&q=85",
  },
];

// Helper: check if story was posted within last 24 hours
export function isStoryActive(createdAtString: string): boolean {
  try {
    const created = new Date(createdAtString).getTime();
    if (Number.isNaN(created)) return false;
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - created < twentyFourHours;
  } catch {
    return false;
  }
}

// Get set of story IDs the current viewer has already watched
export function getSeenStories(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_STORIES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

// Mark a single story as viewed
export function markStoryAsSeen(storyId: string): void {
  try {
    const current = getSeenStories();
    current.add(storyId);
    window.localStorage.setItem(
      SEEN_STORIES_KEY,
      JSON.stringify(Array.from(current)),
    );
  } catch {
    // ignore
  }
}
export const markStorySeen = markStoryAsSeen;

// Local storage key for current user's own stories
function getUserStoriesStorageKey(userId?: string | null): string {
  return userId ? `skyring-stories-${userId}` : GUEST_STORIES_KEY;
}

// Retrieve local user stories
export function getLocalUserStories(userId?: string | null): StoryItem[] {
  try {
    const raw = window.localStorage.getItem(getUserStoriesStorageKey(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoryItem[];
    if (!Array.isArray(arr)) return [];
    // Filter to active (last 24h)
    return arr.filter((item) => isStoryActive(item.createdAt));
  } catch {
    return [];
  }
}

// Save local user stories
export function setLocalUserStories(
  userId: string | null | undefined,
  stories: StoryItem[],
): void {
  try {
    window.localStorage.setItem(
      getUserStoriesStorageKey(userId),
      JSON.stringify(stories),
    );
  } catch {
    // ignore
  }
}

// Fetch all story groups: current user's group + other registered users' groups
export async function getAllStoryGroups(
  currentUserId?: string | null,
  currentUsername?: string,
  currentUserAvatar?: string,
): Promise<{
  myGroup: UserStoryGroup;
  otherGroups: UserStoryGroup[];
}> {
  const seenSet = getSeenStories();

  // 1. Current user's stories
  let myStories = getLocalUserStories(currentUserId);

  if (currentUserId) {
    try {
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (Array.isArray(data.stories)) {
          const activeRemote = data.stories.filter((s: StoryItem) =>
            isStoryActive(s.createdAt),
          );
          if (activeRemote.length > 0) {
            const seenIds = new Set(myStories.map((s) => s.id));
            const merged = [...myStories];
            for (const rem of activeRemote) {
              if (!seenIds.has(rem.id)) {
                merged.push(rem);
                seenIds.add(rem.id);
              }
            }
            myStories = merged.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
            setLocalUserStories(currentUserId, myStories);
          }
        }
      }
    } catch {
      // offline fallback is already loaded
    }
  }

  const myGroup: UserStoryGroup = {
    userId: currentUserId || "me",
    username: currentUsername || "you",
    userAvatar: currentUserAvatar || "",
    stories: myStories,
    hasUnseen: myStories.some((s) => !seenSet.has(s.id)),
  };

  // 2. Fetch other registered travelers' active story groups from Firestore
  const otherGroups: UserStoryGroup[] = [];
  try {
    const usersSnap = await getDocs(query(collection(db, "users"), limit(25)));
    for (const snap of usersSnap.docs) {
      if (currentUserId && snap.id === currentUserId) continue;
      if (snap.id.startsWith("curated-")) continue;
      const data = snap.data();
      const uName = data.username || "";
      if (FAKE_USERNAMES.includes(uName.toLowerCase())) continue;
      if (currentUsername && uName.toLowerCase() === currentUsername.toLowerCase()) continue;

      if (Array.isArray(data.stories)) {
        const activeStories = data.stories.filter((s: StoryItem) => isStoryActive(s.createdAt));
        if (activeStories.length > 0) {
          otherGroups.push({
            userId: snap.id,
            username: uName || "traveler",
            userAvatar: data.avatar || "",
            stories: activeStories,
            hasUnseen: activeStories.some((s) => !seenSet.has(s.id)),
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not fetch other users' stories:", err);
  }

  // Sort groups: groups with unseen stories first, then by latest story date
  otherGroups.sort((a, b) => {
    if (a.hasUnseen && !b.hasUnseen) return -1;
    if (!a.hasUnseen && b.hasUnseen) return 1;
    const aLatest = a.stories[a.stories.length - 1]?.createdAt || "";
    const bLatest = b.stories[b.stories.length - 1]?.createdAt || "";
    return bLatest.localeCompare(aLatest);
  });

  return { myGroup, otherGroups };
}

// Add a new story
export async function publishStory({
  userId,
  username,
  userAvatar,
  mediaUrl,
  caption,
  location,
}: {
  userId?: string | null;
  username: string;
  userAvatar?: string;
  mediaUrl: string;
  caption?: string;
  location?: string;
}): Promise<StoryItem> {
  const newStory: StoryItem = {
    id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    authorId: userId || "me",
    authorUsername: username,
    authorAvatar: userAvatar || "",
    mediaUrl,
    caption: caption?.trim(),
    location: location?.trim(),
    createdAt: new Date().toISOString(),
    duration: 5000,
  };

  // 1. Save locally
  const currentLocal = getLocalUserStories(userId);
  const updatedLocal = [...currentLocal, newStory];
  setLocalUserStories(userId, updatedLocal);

  // 2. Save in Firestore if authenticated
  if (userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const existing = userSnap.exists() && Array.isArray(userSnap.data()?.stories)
        ? userSnap.data()?.stories.filter((s: StoryItem) => isStoryActive(s.createdAt))
        : [];
      await setDoc(userRef, { stories: [...existing, newStory] }, { merge: true });
    } catch (err) {
      console.warn("Could not sync story to Firestore:", err);
    }
  }

  return newStory;
}

// Delete a user's story
export async function deleteStory(
  userId: string | null | undefined,
  storyId: string,
): Promise<void> {
  const current = getLocalUserStories(userId);
  const filtered = current.filter((s) => s.id !== storyId);
  setLocalUserStories(userId, filtered);

  if (userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && Array.isArray(userSnap.data()?.stories)) {
        const remoteStories = userSnap.data().stories.filter((s: StoryItem) => s.id !== storyId);
        await setDoc(userRef, { stories: remoteStories }, { merge: true });
      }
    } catch (err) {
      console.warn("Could not delete story from Firestore:", err);
    }
  }
}

// Fetch active stories for a specific user (by username or uid)
export async function getStoriesForUser(
  usernameOrUid: string,
  currentUserId?: string | null,
  currentUsername?: string,
): Promise<UserStoryGroup | null> {
  const seenSet = getSeenStories();
  const clean = usernameOrUid.trim().toLowerCase().replace(/^@/, "");
  const cleanCurrent = (currentUsername || "").trim().toLowerCase().replace(/^@/, "");

  if (FAKE_USERNAMES.includes(clean) || clean.startsWith("curated-")) {
    return null;
  }

  // 1. Check if it's the current user themselves
  if (
    (currentUserId && clean === currentUserId.toLowerCase()) ||
    (cleanCurrent && clean === cleanCurrent) ||
    clean === "me" ||
    clean === "you"
  ) {
    const myStories = getLocalUserStories(currentUserId);
    if (myStories.length > 0) {
      return {
        userId: currentUserId || "me",
        username: currentUsername || clean,
        stories: myStories,
        hasUnseen: myStories.some((s) => !seenSet.has(s.id)),
      };
    }
  }

  // 2. Check Firestore
  try {
    let targetUid = usernameOrUid;
    const uDoc = await getDoc(doc(db, "usernames", clean));
    if (uDoc.exists()) {
      targetUid = uDoc.data().uid as string;
    }
    const userSnap = await getDoc(doc(db, "users", targetUid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (Array.isArray(data.stories)) {
        const active = data.stories.filter((s: StoryItem) => isStoryActive(s.createdAt));
        if (active.length > 0) {
          return {
            userId: targetUid,
            username: data.username || clean,
            userAvatar: data.avatar || "",
            stories: active,
            hasUnseen: active.some((s) => !seenSet.has(s.id)),
          };
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}
