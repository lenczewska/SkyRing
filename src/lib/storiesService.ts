import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { StoryItem, UserStoryGroup } from "../types";

const SEEN_STORIES_KEY = "skyring-seen-stories";
const GUEST_STORIES_KEY = "skyring-guest-stories";

// Curated travel stories for platform creators to provide an immediate wow experience
export const CURATED_STORY_GROUPS: UserStoryGroup[] = [
  {
    userId: "curated-sophie",
    username: "sophie_nomad",
    userAvatar: "S",
    stories: [
      {
        id: "curated-story-sophie-1",
        authorId: "curated-sophie",
        authorUsername: "sophie_nomad",
        authorAvatar: "S",
        mediaUrl:
          "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1080&q=85",
        caption: "Утренний кофе и первый луч солнца над морем ☕️✨",
        location: "Амальфи, Италия",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 5000,
      },
      {
        id: "curated-story-sophie-2",
        authorId: "curated-sophie",
        authorUsername: "sophie_nomad",
        authorAvatar: "S",
        mediaUrl:
          "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1080&q=85",
        caption: "Шёпот бамбуковой рощи на рассвете 🎋",
        location: "Киото, Япония",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        duration: 5000,
      },
    ],
  },
  {
    userId: "curated-marco",
    username: "marco_rossi",
    userAvatar: "M",
    stories: [
      {
        id: "curated-story-marco-1",
        authorId: "curated-marco",
        authorUsername: "marco_rossi",
        authorAvatar: "M",
        mediaUrl:
          "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1080&q=85",
        caption: "Вечный город в лучах заката 🏛️ Завораживает!",
        location: "Рим, Италия",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        duration: 5000,
      },
      {
        id: "curated-story-marco-2",
        authorId: "curated-marco",
        authorUsername: "marco_rossi",
        authorAvatar: "M",
        mediaUrl:
          "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1080&q=85",
        caption: "Туманное зеркало озера Блед 🏔️",
        location: "Блед, Словения",
        createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        duration: 5000,
      },
    ],
  },
  {
    userId: "curated-elena",
    username: "elena_voyage",
    userAvatar: "E",
    stories: [
      {
        id: "curated-story-elena-1",
        authorId: "curated-elena",
        authorUsername: "elena_voyage",
        authorAvatar: "E",
        mediaUrl:
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=85",
        caption: "Сотни воздушных шаров в утреннем небе! 🎈",
        location: "Каппадокия, Турция",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        duration: 5000,
      },
      {
        id: "curated-story-elena-2",
        authorId: "curated-elena",
        authorUsername: "elena_voyage",
        authorAvatar: "E",
        mediaUrl:
          "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1080&q=85",
        caption: "Фьорды за полярным кругом ❄️ Чистый восторг!",
        location: "Тромсё, Норвегия",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        duration: 5000,
      },
    ],
  },
  {
    userId: "curated-alex",
    username: "alex_explorer",
    userAvatar: "A",
    stories: [
      {
        id: "curated-story-alex-1",
        authorId: "curated-alex",
        authorUsername: "alex_explorer",
        authorAvatar: "A",
        mediaUrl:
          "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1080&q=85",
        caption: "На вершине скалы. Дышите глубже 🌲",
        location: "Йосемити, США",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        duration: 5000,
      },
      {
        id: "curated-story-alex-2",
        authorId: "curated-alex",
        authorUsername: "alex_explorer",
        authorAvatar: "A",
        mediaUrl:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=85",
        caption: "Тихий вечер на берегу океана 🌊",
        location: "Ванкувер, Канада",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        duration: 5000,
      },
    ],
  },
];

// Presets for quick story creation if user wants to pick a travel scenery
export const STORY_TRAVEL_PRESETS = [
  {
    label: "Горы и рассвет",
    location: "Швейцарские Альпы",
    caption: "Чистый воздух и бесконечные вершины 🏔️",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85",
  },
  {
    label: "Тропический закат",
    location: "Бали, Индонезия",
    caption: "Золотой час на побережье 🌅",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=85",
  },
  {
    label: "Уютный старый город",
    location: "Прага, Чехия",
    caption: "Улочки, дышащие средневековой сказкой 🏰",
    url: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1080&q=85",
  },
  {
    label: "Огни мегаполиса",
    location: "Токио, Япония",
    caption: "Ночной ритм неонового города 🏮",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1080&q=85",
  },
];

// Check if story is within 24 hours
export function isStoryActive(createdAt: string): boolean {
  try {
    const time = new Date(createdAt).getTime();
    if (Number.isNaN(time)) return true;
    return Date.now() - time < 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

// Get set of seen story IDs from local storage
export function getSeenStories(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_STORIES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

// Mark a single story or all stories of a group as seen
export function markStorySeen(storyId: string): void {
  try {
    const seen = getSeenStories();
    seen.add(storyId);
    window.localStorage.setItem(
      SEEN_STORIES_KEY,
      JSON.stringify(Array.from(seen)),
    );
  } catch {
    // ignore
  }
}

// Get stories from local cache for current user
export function getLocalUserStories(userId?: string | null): StoryItem[] {
  const key = userId ? `skyring-stories-${userId}` : GUEST_STORIES_KEY;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const list = JSON.parse(raw) as StoryItem[];
    return Array.isArray(list) ? list.filter((s) => isStoryActive(s.createdAt)) : [];
  } catch {
    return [];
  }
}

// Save stories to local cache for current user
export function setLocalUserStories(
  userId: string | null | undefined,
  stories: StoryItem[],
): void {
  const key = userId ? `skyring-stories-${userId}` : GUEST_STORIES_KEY;
  try {
    window.localStorage.setItem(key, JSON.stringify(stories));
  } catch {
    // ignore
  }
}

// Fetch all active story groups (curated + current user + other users)
export async function getAllStoryGroups(
  currentUserId?: string | null,
  currentUsername?: string,
  currentUserAvatar?: string,
): Promise<{ myGroup: UserStoryGroup; otherGroups: UserStoryGroup[] }> {
  const seenSet = getSeenStories();

  // 1. Current user group
  let myStories = getLocalUserStories(currentUserId);

  if (currentUserId) {
    try {
      const userSnap = await getDoc(doc(db, "users", currentUserId));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (Array.isArray(uData.stories)) {
          const firestoreActive = uData.stories.filter((s: StoryItem) =>
            isStoryActive(s.createdAt),
          );
          if (firestoreActive.length > 0) {
            myStories = firestoreActive;
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

  // 2. Curated & other travelers' story groups
  const otherGroups: UserStoryGroup[] = CURATED_STORY_GROUPS.map((group) => {
    const activeStories = group.stories.filter((s) => isStoryActive(s.createdAt));
    return {
      ...group,
      stories: activeStories,
      hasUnseen: activeStories.some((s) => !seenSet.has(s.id)),
    };
  }).filter((group) => group.stories.length > 0);

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

  // 2. Check Curated travelers
  const curated = CURATED_STORY_GROUPS.find(
    (g) =>
      g.username.toLowerCase() === clean || g.userId.toLowerCase() === clean,
  );
  if (curated) {
    const activeStories = curated.stories.filter((s) => isStoryActive(s.createdAt));
    if (activeStories.length > 0) {
      return {
        ...curated,
        stories: activeStories,
        hasUnseen: activeStories.some((s) => !seenSet.has(s.id)),
      };
    }
  }

  // 3. Check Firestore
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
