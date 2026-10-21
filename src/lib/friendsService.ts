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

export const FAKE_USERNAMES = [
  "sophie_nomad",
  "marco_rossi",
  "elena_voyage",
  "alex_explorer",
];

// Curated active community travelers - empty to ensure only real users are shown
export const CURATED_TRAVELERS: UserProfile[] = [];

// Helper to get local cached following list for instant feedback
export function getLocalFollowing(uid?: string | null): string[] {
  const key = uid ? `skyring-following-${uid}` : "skyring-guest-following";
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter(
      (id) =>
        typeof id === "string" &&
        !id.startsWith("curated-") &&
        !FAKE_USERNAMES.includes(id.toLowerCase().replace(/^@/, "")),
    );
    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(key, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

// Count unique followed individuals (preventing duplicate counts when both uid and username are stored)
export function countUniqueFollowing(list?: string[] | null): number {
  if (!list || !Array.isArray(list)) return 0;
  const uniqueUsers = new Set<string>();

  for (const item of list) {
    if (!item || typeof item !== "string") continue;
    const clean = item.trim().toLowerCase().replace(/^@/, "");
    if (!clean || FAKE_USERNAMES.includes(clean) || clean.startsWith("curated-")) continue;
    uniqueUsers.add(clean);
  }

  return uniqueUsers.size;
}

export function setLocalFollowing(uid: string | null | undefined, list: string[]): void {
  const key = uid ? `skyring-following-${uid}` : "skyring-guest-following";
  const cleaned = list.filter(
    (id) =>
      typeof id === "string" &&
      !id.startsWith("curated-") &&
      !FAKE_USERNAMES.includes(id.toLowerCase().replace(/^@/, "")),
  );
  try {
    window.localStorage.setItem(key, JSON.stringify(cleaned));
  } catch {
    // ignore
  }
}

// Fetch user profile from Firestore
export async function fetchUserProfile(
  usernameOrUid: string,
  _currentUserUid?: string | null,
): Promise<UserProfile | null> {
  const normalized = usernameOrUid.trim().toLowerCase().replace(/^@/, "");
  if (FAKE_USERNAMES.includes(normalized) || normalized.startsWith("curated-")) {
    return null;
  }

  // Check Firestore
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
        avatar: data.avatar || (data.username || "T").charAt(0).toUpperCase(),
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

  return firestoreUser;
}

// Search real users across Firestore
export async function searchTravelers(
  searchQuery: string,
  currentUserUid?: string | null,
  currentUsername?: string,
): Promise<UserSummary[]> {
  const q = searchQuery.trim().toLowerCase().replace(/^@/, "");
  const currentFollowing = getLocalFollowing(currentUserUid);

  const resultsMap = new Map<string, UserSummary>();

  // Include only real Firestore users
  try {
    const usernamesSnap = await getDocs(query(collection(db, "usernames"), limit(25)));
    for (const snap of usernamesSnap.docs) {
      const data = snap.data();
      const uName = (data.username as string) || snap.id;
      const uUid = data.uid as string;

      if (FAKE_USERNAMES.includes(uName.toLowerCase()) || uUid.startsWith("curated-")) continue;
      if (currentUserUid && uUid === currentUserUid) continue;
      if (currentUsername && uName.toLowerCase() === currentUsername.toLowerCase()) continue;

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
          location =
            uData.location ||
            (uData.city && uData.country
              ? `${uData.city}, ${uData.country}`
              : uData.city || uData.country || "");
        }
      } catch {
        // ignore
      }

      const matchName = uName.toLowerCase().includes(q);
      const matchLocation = location && location.toLowerCase().includes(q);
      const matchBio = bio && bio.toLowerCase().includes(q);

      if (!q || matchName || matchLocation || matchBio) {

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
          avatar: data.avatar || uName.charAt(0).toUpperCase(),
          location,
          postsCount,
          placesCount,
          followersCount: countUniqueFollowing(followers) + (isFollowing && !followers.includes(currentUserUid ?? "") ? 1 : 0),
          followingCount: countUniqueFollowing(following),
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
      if (!targetUser.uid.startsWith("curated-") && !FAKE_USERNAMES.includes(targetUser.username.toLowerCase())) {
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

  // Firestore accounts that are followed
  if (currentUser?.uid && followingList.length > 0) {
    const uidsToFetch = followingList.filter(
      (id) => !id.startsWith("curated-") && !FAKE_USERNAMES.includes(id.toLowerCase()),
    );
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
              authorAvatar: uData.avatar || (uData.username || "T").charAt(0).toUpperCase(),
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

// Fetch all community posts for Discover feed from real Firestore users
export async function getCommunityPosts(
  _currentUser?: { uid: string; username: string } | null,
): Promise<Post[]> {
  const posts: Post[] = [];

  // Add Firestore recent users' posts
  try {
    const usersSnap = await getDocs(query(collection(db, "users"), limit(25)));
    for (const docSnap of usersSnap.docs) {
      if (docSnap.id.startsWith("curated-")) continue;
      const uData = docSnap.data();
      if (FAKE_USERNAMES.includes((uData.username || "").toLowerCase())) continue;
      const userPosts = (uData.posts as Post[]) ?? [];
      for (const p of userPosts) {
        if (p.isArchived) continue;
        posts.push({
          ...p,
          authorId: docSnap.id,
          authorUsername: uData.username || p.authorUsername || "traveller",
          authorAvatar: uData.avatar || (uData.username || "T").charAt(0).toUpperCase(),
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
