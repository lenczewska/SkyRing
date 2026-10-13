import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Post, UserProfile, UserSummary } from "../types";

// Curated active community travelers to provide rich content right away
export const CURATED_TRAVELERS: UserProfile[] = [
  {
    uid: "curated-sophie",
    username: "sophie_nomad",
    bio: "Фотограф и путешественник. Ищу тихие уголки мира и утренний кофе с видом на горы. 🌿",
    avatar: "S",
    location: "Париж, Франция",
    followers: ["alex_explorer", "elena_voyage"],
    following: ["marco_rossi", "elena_voyage"],
    visitedCountries: [
      { id: "fr-paris", label: "France, Paris", latitude: 48.8566, longitude: 2.3522, country: "France", city: "Paris", kind: "city" },
      { id: "it-amalfi", label: "Italy, Amalfi", latitude: 40.634, longitude: 14.6027, country: "Italy", city: "Amalfi", kind: "city" },
      { id: "jp-kyoto", label: "Japan, Kyoto", latitude: 35.0116, longitude: 135.7681, country: "Japan", city: "Kyoto", kind: "city" },
      { id: "is-reyk", label: "Iceland, Reykjavik", latitude: 64.1466, longitude: -21.9426, country: "Iceland", city: "Reykjavik", kind: "city" },
    ],
    posts: [
      {
        id: "curated-post-sophie-1",
        authorId: "curated-sophie",
        authorUsername: "sophie_nomad",
        authorAvatar: "S",
        title: "Рассвет на Амальфитанском побережье",
        description: "Когда утренний туман рассеивается над морем, скалы окрашиваются в золотисто-розовый цвет. Мы взяли кофе в старой пекарне и смотрели, как просыпается городок.",
        location: "Амальфи, Италия",
        date: "2026-05-18",
        image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85",
        likes: ["alex_explorer", "elena_voyage"],
        comments: [
          {
            id: "c-s-1",
            authorUsername: "alex_explorer",
            text: "Невероятный свет! В какое время лучше всего туда ехать?",
            createdAt: "2026-05-18T10:30:00Z",
          },
          {
            id: "c-s-2",
            authorUsername: "sophie_nomad",
            text: "Лучше всего май или сентябрь — туристов меньше, а море тёплое!",
            createdAt: "2026-05-18T11:15:00Z",
          },
        ],
        createdAt: "2026-05-18T08:00:00Z",
      },
      {
        id: "curated-post-sophie-2",
        authorId: "curated-sophie",
        authorUsername: "sophie_nomad",
        authorAvatar: "S",
        title: "Бамбуковый лес Арасияма в Киото",
        description: "Звук покачивающихся бамбуковых стеблей на ветру признан одним из «100 звуковых ландшафтов Японии». Настоящее место для медитации и размышлений.",
        location: "Киото, Япония",
        date: "2026-04-12",
        image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=900&q=85",
        likes: ["marco_rossi"],
        comments: [
          {
            id: "c-s-3",
            authorUsername: "elena_voyage",
            text: "Моя давняя мечта побывать там весной!",
            createdAt: "2026-04-12T14:00:00Z",
          },
        ],
        createdAt: "2026-04-12T09:30:00Z",
      },
    ],
  },
  {
    uid: "curated-marco",
    username: "marco_rossi",
    bio: "Архитектор и исследователь старинных городов. В поиске скрытых двориков и древних историй.",
    avatar: "M",
    location: "Рим, Италия",
    followers: ["sophie_nomad"],
    following: ["alex_explorer"],
    visitedCountries: [
      { id: "it-rome", label: "Italy, Rome", latitude: 41.9028, longitude: 12.4964, country: "Italy", city: "Rome", kind: "city" },
      { id: "es-barcelona", label: "Spain, Barcelona", latitude: 41.3851, longitude: 2.1734, country: "Spain", city: "Barcelona", kind: "city" },
      { id: "ch-zermatt", label: "Switzerland, Zermatt", latitude: 45.9765, longitude: 7.7491, country: "Switzerland", city: "Zermatt", kind: "city" },
      { id: "gr-santorini", label: "Greece, Santorini", latitude: 36.3932, longitude: 25.4615, country: "Greece", city: "Santorini", kind: "city" },
    ],
    posts: [
      {
        id: "curated-post-marco-1",
        authorId: "curated-marco",
        authorUsername: "marco_rossi",
        authorAvatar: "M",
        title: "Озеро Блед на рассвете",
        description: "Островок с колокольней посреди зеркальной глади озера. Туман медленно сползает с Юлийских Альп, создавая сказочную атмосферу.",
        location: "Блед, Словения",
        date: "2026-06-02",
        image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",
        likes: ["sophie_nomad", "alex_explorer"],
        comments: [
          {
            id: "c-m-1",
            authorUsername: "sophie_nomad",
            text: "Волшебное отражение! Брали лодку напрокат?",
            createdAt: "2026-06-02T16:20:00Z",
          },
        ],
        createdAt: "2026-06-02T07:10:00Z",
      },
    ],
  },
  {
    uid: "curated-elena",
    username: "elena_voyage",
    bio: "Путешествую с рюкзаком по всему миру. Горы, фьорды, национальные парки и северные огни 🌌",
    avatar: "E",
    location: "Алматы, Казахстан",
    followers: ["sophie_nomad"],
    following: ["sophie_nomad", "marco_rossi"],
    visitedCountries: [
      { id: "ru-baikal", label: "Russia, Baikal", latitude: 53.5, longitude: 108.0, country: "Russia", city: "Baikal", kind: "city" },
      { id: "no-tromso", label: "Norway, Tromso", latitude: 69.6492, longitude: 18.9553, country: "Norway", city: "Tromso", kind: "city" },
      { id: "tr-cappa", label: "Turkey, Cappadocia", latitude: 38.6431, longitude: 34.8289, country: "Turkey", city: "Cappadocia", kind: "city" },
      { id: "kz-almaty", label: "Kazakhstan, Almaty", latitude: 43.222, longitude: 76.8512, country: "Kazakhstan", city: "Almaty", kind: "city" },
    ],
    posts: [
      {
        id: "curated-post-elena-1",
        authorId: "curated-elena",
        authorUsername: "elena_voyage",
        authorAvatar: "E",
        title: "Полет над долиной Каппадокии",
        description: "Сотни воздушных шаров взмывают над причудливыми скальными долинами на восходе солнца. Невероятный простор и ощущение свободы.",
        location: "Каппадокия, Турция",
        date: "2026-05-25",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=85",
        likes: ["sophie_nomad"],
        comments: [],
        createdAt: "2026-05-25T06:45:00Z",
      },
    ],
  },
  {
    uid: "curated-alex",
    username: "alex_explorer",
    bio: "Походные маршруты, кемпинг и пейзажи. Карта — это мой холст.",
    avatar: "A",
    location: "Ванкувер, Канада",
    followers: ["marco_rossi", "sophie_nomad"],
    following: ["sophie_nomad"],
    visitedCountries: [
      { id: "ca-vanc", label: "Canada, Vancouver", latitude: 49.2827, longitude: -123.1207, country: "Canada", city: "Vancouver", kind: "city" },
      { id: "us-yosemite", label: "USA, Yosemite", latitude: 37.8651, longitude: -119.5383, country: "United States of America", city: "Yosemite", kind: "city" },
      { id: "nz-queenstown", label: "New Zealand, Queenstown", latitude: -45.0312, longitude: 168.6626, country: "New Zealand", city: "Queenstown", kind: "city" },
    ],
    posts: [
      {
        id: "curated-post-alex-1",
        authorId: "curated-alex",
        authorUsername: "alex_explorer",
        authorAvatar: "A",
        title: "Треккинг в Йосемити",
        description: "Поднялись на вершину скалы к закату. Вид на долину захватывает дух. Тишина, нарушаемая только ветром среди сосен.",
        location: "Йосемити, США",
        date: "2026-06-10",
        image: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=900&q=85",
        likes: ["sophie_nomad", "marco_rossi"],
        comments: [],
        createdAt: "2026-06-10T19:20:00Z",
      },
    ],
  },
];

// Helper to get local cached following list for instant feedback
export function getLocalFollowing(uid?: string | null): string[] {
  if (!uid) {
    try {
      const guest = window.localStorage.getItem("skyring-guest-following");
      return guest ? JSON.parse(guest) : [];
    } catch {
      return [];
    }
  }
  try {
    const saved = window.localStorage.getItem(`skyring-following-${uid}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function setLocalFollowing(uid: string | null | undefined, list: string[]): void {
  const key = uid ? `skyring-following-${uid}` : "skyring-guest-following";
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore
  }
}

// Fetch user profile from Firestore or Curated travelers
export async function fetchUserProfile(
  usernameOrUid: string,
  _currentUserUid?: string | null,
): Promise<UserProfile | null> {
  const normalized = usernameOrUid.trim().toLowerCase().replace(/^@/, "");

  // 1. Check curated accounts first for instant match
  const curated = CURATED_TRAVELERS.find(
    (u) =>
      u.username.toLowerCase() === normalized ||
      u.uid.toLowerCase() === normalized,
  );

  // 2. Check Firestore
  let firestoreUser: UserProfile | null = null;
  try {
    // Check if username mapping exists
    const usernameDoc = await getDoc(doc(db, "usernames", normalized));
    let targetUid = usernameOrUid;
    if (usernameDoc.exists()) {
      targetUid = usernameDoc.data().uid as string;
    }

    const userDoc = await getDoc(doc(db, "users", targetUid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      firestoreUser = {
        uid: targetUid,
        username: data.username || normalized,
        email: data.email,
        bio: data.bio || (data.description ?? ""),
        avatar: (data.username || "T").charAt(0).toUpperCase(),
        location: data.location || (data.city && data.country ? `${data.city}, ${data.country}` : data.city || data.country || ""),
        country: data.country,
        city: data.city,
        age: data.age,
        travelStyle: data.travelStyle,
        travelFormat: data.travelFormat,
        interests: data.interests || [],
        onboardingCompleted: data.onboardingCompleted ?? false,
        allowComments: data.allowComments ?? true,
        privateMap: data.privateMap ?? false,
        showAgeAndLocation: data.showAgeAndLocation ?? true,
        emailNotifications: data.emailNotifications ?? true,
        following: data.following || [],
        followers: data.followers || [],
        visitedCountries: data.visitedCountries || [],
        posts: data.posts || [],
        createdAt: data.createdAt,
      };
    }
  } catch (err) {
    console.warn("Could not query Firestore for user profile:", err);
  }

  const profile = firestoreUser || curated || null;
  return profile;
}

// Search users across Firestore and Curated lists
export async function searchTravelers(
  searchQuery: string,
  currentUserUid?: string | null,
  currentUsername?: string,
): Promise<UserSummary[]> {
  const q = searchQuery.trim().toLowerCase().replace(/^@/, "");
  const currentFollowing = getLocalFollowing(currentUserUid);

  const resultsMap = new Map<string, UserSummary>();

  // Include curated matches
  for (const c of CURATED_TRAVELERS) {
    if (
      !q ||
      c.username.toLowerCase().includes(q) ||
      (c.bio && c.bio.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    ) {
      if (currentUserUid && c.uid === currentUserUid) continue;
      if (currentUsername && c.username.toLowerCase() === currentUsername.toLowerCase()) continue;

      const isFollowing =
        currentFollowing.includes(c.uid) || currentFollowing.includes(c.username);
      const isFollower = currentUserUid
        ? (c.following ?? []).includes(currentUserUid) ||
          (currentUsername ? (c.following ?? []).includes(currentUsername) : false)
        : false;

      resultsMap.set(c.username.toLowerCase(), {
        uid: c.uid,
        username: c.username,
        bio: c.bio,
        avatar: c.avatar,
        location: c.location,
        postsCount: c.posts?.length ?? 0,
        placesCount: c.visitedCountries?.length ?? 0,
        followersCount: (c.followers?.length ?? 0) + (isFollowing ? 1 : 0),
        followingCount: c.following?.length ?? 0,
        isFollowing,
        isFollower,
        isMutual: isFollowing && isFollower,
      });
    }
  }

  // Include Firestore users
  try {
    const usernamesSnap = await getDocs(query(collection(db, "usernames"), limit(20)));
    for (const snap of usernamesSnap.docs) {
      const data = snap.data();
      const uName = (data.username as string) || snap.id;
      const uUid = data.uid as string;

      if (currentUserUid && uUid === currentUserUid) continue;
      if (currentUsername && uName.toLowerCase() === currentUsername.toLowerCase()) continue;

      if (!q || uName.toLowerCase().includes(q)) {
        let placesCount = 0;
        let postsCount = 0;
        let followers: string[] = [];
        let following: string[] = [];
        let bio = "";
        let location = "";

        try {
          const uDoc = await getDoc(doc(db, "users", uUid));
          if (uDoc.exists()) {
            const uData = uDoc.data();
            placesCount = uData.visitedCountries?.length ?? 0;
            postsCount = uData.posts?.length ?? 0;
            followers = uData.followers ?? [];
            following = uData.following ?? [];
            bio = uData.bio ?? "";
            location = uData.location ?? "";
          }
        } catch {
          // ignore
        }

        const isFollowing =
          currentFollowing.includes(uUid) || currentFollowing.includes(uName);
        const isFollower = currentUserUid
          ? followers.includes(currentUserUid) ||
            (currentUsername ? followers.includes(currentUsername) : false)
          : false;

        resultsMap.set(uName.toLowerCase(), {
          uid: uUid,
          username: uName,
          bio,
          avatar: uName.charAt(0).toUpperCase(),
          location,
          postsCount,
          placesCount,
          followersCount: followers.length + (isFollowing && !followers.includes(currentUserUid ?? "") ? 1 : 0),
          followingCount: following.length,
          isFollowing,
          isFollower,
          isMutual: isFollowing && isFollower,
        });
      }
    }
  } catch (err) {
    console.warn("Could not query Firestore usernames:", err);
  }

  return Array.from(resultsMap.values());
}

// Toggle follow/unfollow for a target user
export async function toggleFollow(
  currentUser: { uid: string; username: string } | null,
  targetUser: { uid: string; username: string },
): Promise<{ isFollowing: boolean; newFollowersCount?: number }> {
  const currentUid = currentUser?.uid ?? null;
  const currentFollowing = getLocalFollowing(currentUid);
  const targetKey = targetUser.uid;
  const targetUsername = targetUser.username.toLowerCase();

  const isAlreadyFollowing =
    currentFollowing.includes(targetKey) ||
    currentFollowing.includes(targetUsername);

  let nextFollowing: string[];
  if (isAlreadyFollowing) {
    nextFollowing = currentFollowing.filter(
      (id) => id !== targetKey && id !== targetUsername,
    );
  } else {
    nextFollowing = [...currentFollowing, targetKey, targetUsername];
  }

  // Update local storage for snappiness
  setLocalFollowing(currentUid, nextFollowing);

  // If user is authenticated, sync with Firestore
  if (currentUser?.uid) {
    try {
      // 1. Update current user's following list in Firestore
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      const existingFollowing = (userSnap.data()?.following as string[]) ?? [];
      let updatedFollowing: string[];

      if (isAlreadyFollowing) {
        updatedFollowing = existingFollowing.filter(
          (id) => id !== targetKey && id !== targetUsername,
        );
      } else {
        updatedFollowing = Array.from(
          new Set([...existingFollowing, targetKey, targetUsername]),
        );
      }

      await setDoc(
        doc(db, "users", currentUser.uid),
        { following: updatedFollowing },
        { merge: true },
      );

      // 2. Update target user's followers list in Firestore (if real user)
      if (!targetUser.uid.startsWith("curated-")) {
        const targetSnap = await getDoc(doc(db, "users", targetUser.uid));
        if (targetSnap.exists()) {
          const existingFollowers =
            (targetSnap.data()?.followers as string[]) ?? [];
          let updatedFollowers: string[];

          if (isAlreadyFollowing) {
            updatedFollowers = existingFollowers.filter(
              (id) => id !== currentUser.uid && id !== currentUser.username,
            );
          } else {
            updatedFollowers = Array.from(
              new Set([
                ...existingFollowers,
                currentUser.uid,
                currentUser.username,
              ]),
            );
          }

          await setDoc(
            doc(db, "users", targetUser.uid),
            { followers: updatedFollowers },
            { merge: true },
          );
        }
      }
    } catch (err) {
      console.warn("Could not sync follow status to Firestore:", err);
    }
  }

  return { isFollowing: !isAlreadyFollowing };
}

// Fetch posts from all followed travelers
export async function getFollowingPosts(
  currentUser: { uid: string; username: string } | null,
): Promise<Post[]> {
  const followingList = getLocalFollowing(currentUser?.uid);
  const posts: Post[] = [];

  // 1. Curated accounts that are followed
  for (const curated of CURATED_TRAVELERS) {
    const isFollowed =
      followingList.includes(curated.uid) ||
      followingList.includes(curated.username.toLowerCase());
    if (isFollowed && curated.posts) {
      for (const p of curated.posts) {
        if (p.isArchived) continue;
        posts.push({
          ...p,
          authorUsername: curated.username,
          authorAvatar: curated.avatar,
        });
      }
    }
  }

  // 2. Firestore accounts that are followed
  if (currentUser?.uid && followingList.length > 0) {
    const uidsToFetch = followingList.filter((id) => !id.startsWith("curated-") && !id.includes("_") && id.length > 15);
    for (const uUid of uidsToFetch) {
      try {
        const uSnap = await getDoc(doc(db, "users", uUid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          const userPosts = (uData.posts as Post[]) ?? [];
          for (const p of userPosts) {
            if (p.isArchived) continue;
            posts.push({
              ...p,
              authorId: uUid,
              authorUsername: uData.username || p.authorUsername || "traveller",
              authorAvatar: (uData.username || "T").charAt(0).toUpperCase(),
              allowComments:
                p.allowComments !== undefined
                  ? p.allowComments
                  : uData.allowComments !== false,
            });
          }
        }
      } catch (err) {
        console.warn("Could not load followed user posts:", err);
      }
    }
  }

  // Sort descending by date or createdAt
  return posts.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime();
    const timeB = new Date(b.createdAt || b.date).getTime();
    return timeB - timeA;
  });
}

// Fetch all community posts for Discover feed
export async function getCommunityPosts(
  _currentUser?: { uid: string; username: string } | null,
): Promise<Post[]> {
  const posts: Post[] = [];

  // Add curated posts
  for (const curated of CURATED_TRAVELERS) {
    if (curated.posts) {
      for (const p of curated.posts) {
        if (p.isArchived) continue;
        posts.push({
          ...p,
          authorUsername: curated.username,
          authorAvatar: curated.avatar,
        });
      }
    }
  }

  // Add Firestore recent users' posts
  try {
    const usersSnap = await getDocs(query(collection(db, "users"), limit(10)));
    for (const docSnap of usersSnap.docs) {
      const uData = docSnap.data();
      const userPosts = (uData.posts as Post[]) ?? [];
      for (const p of userPosts) {
        if (p.isArchived) continue;
        posts.push({
          ...p,
          authorId: docSnap.id,
          authorUsername: uData.username || p.authorUsername || "traveller",
          authorAvatar: (uData.username || "T").charAt(0).toUpperCase(),
          allowComments:
            p.allowComments !== undefined
              ? p.allowComments
              : uData.allowComments !== false,
        });
      }
    }
  } catch (err) {
    console.warn("Could not load community posts:", err);
  }

  // Deduplicate by post id
  const seenIds = new Set<string>();
  const uniquePosts = posts.filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  return uniquePosts.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime();
    const timeB = new Date(b.createdAt || b.date).getTime();
    return timeB - timeA;
  });
}
