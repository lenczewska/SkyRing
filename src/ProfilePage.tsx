import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import MapView from "./MapView";
import type { Post, UserProfile, VisitedPlace } from "./types";
import { db } from "./firebase";
import {
  fetchUserProfile,
  getLocalFollowing,
  toggleFollow,
} from "./lib/friendsService";
import FriendsModal from "./FriendsModal";
import FriendSearchPanel from "./FriendSearchPanel";
import PostMenu from "./PostMenu";
import SettingsModal from "./SettingsModal";

type ProfilePageProps = {
  user: User | null;
  username?: string;
  language: "en" | "ru";
  onRequestAuth?: () => void;
  onUsernameChange?: (newUsername: string) => void;
};

export default function ProfilePage({
  user,
  username: currentUsername = "",
  language,
  onRequestAuth,
  onUsernameChange,
}: ProfilePageProps) {
  const { username: routeUsername } = useParams<{ username?: string }>();
  const navigate = useNavigate();

  // Target username to display
  const targetUsername = routeUsername
    ? routeUsername.toLowerCase().replace(/^@/, "")
    : currentUsername.toLowerCase();

  const isOwnProfile =
    !routeUsername ||
    (currentUsername &&
      targetUsername.toLowerCase() === currentUsername.toLowerCase());

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [places, setPlaces] = useState<VisitedPlace[]>([]);
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isMutual, setIsMutual] = useState(false);

  const [modalMode, setModalMode] = useState<"followers" | "following" | null>(
    null,
  );
  const [showSettings, setShowSettings] = useState(false);

  const copy =
    language === "ru"
      ? {
          diary: "Дневник путешествий",
          description:
            "Личное пространство для мест, воспоминаний и историй с дороги.",
          places: "мест",
          posts: "Посты",
          shared: "ПОСТЫ ПОЛЬЗОВАТЕЛЯ",
          empty: "Пока нет опубликованных постов.",
          comments: "Комментариев",
          journeys: "путешествий в",
          follow: "+ Подписаться",
          unfollow: "Отписаться",
          followingBtn: "✓ В подписках",
          mutual: "Взаимно",
          followers: "подписчиков",
          following: "подписок",
          backToMine: "← Мой профиль",
          editBio: "Редактировать статус",
          saveBio: "Сохранить",
          cancelBio: "Отмена",
          bioPlaceholder: "Напишите пару слов о себе и своих путешествиях...",
          map: "Карта путешествий",
          myDiary: "МОЙ ДНЕВНИК",
          travelerDiary: "ДНЕВНИК ПУТЕШЕСТВЕННИКА",
          note: "Здесь можно посмотреть карту и публикации пользователя.",
          findFriends: "ПОИСК ДРУЗЕЙ И ПОДПИСОК",
          createPost: "Создать пост",
          archivedTag: "В архиве",
        }
      : {
          diary: "Travel diary",
          description:
            "A personal space for places, memories, and stories from the road.",
          places: "places",
          posts: "Posts",
          shared: "USER POSTS",
          empty: "No published posts yet.",
          comments: "Comments",
          journeys: "journeys in",
          follow: "+ Follow",
          unfollow: "Unfollow",
          followingBtn: "✓ Following",
          mutual: "Mutual",
          followers: "followers",
          following: "following",
          backToMine: "← My profile",
          editBio: "Edit bio",
          saveBio: "Save",
          cancelBio: "Cancel",
          bioPlaceholder: "Write a few words about your travel style...",
          map: "Travel map",
          myDiary: "MY DIARY",
          travelerDiary: "TRAVELER DIARY",
          note: "This page displays the user's travel map and stories.",
          findFriends: "FIND FRIENDS & FOLLOWERS",
          createPost: "Create a post",
          archivedTag: "Archived",
        };

  const loadProfile = async () => {
    setLoading(true);

    if (isOwnProfile && user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        const userPosts = (data?.posts as Post[]) ?? [];
        const userPlaces = (data?.visitedCountries as VisitedPlace[]) ?? [];
        const userBio = data?.bio || data?.description || "";
        const userFollowers = (data?.followers as string[]) ?? [];
        const localFollowing = getLocalFollowing(user.uid);
        const userFollowing = data?.following ?? localFollowing;

        setPosts(userPosts);
        setPlaces(userPlaces);
        setBio(userBio);
        setBioDraft(userBio);
        setFollowersCount(userFollowers.length);
        setFollowingCount(userFollowing.length);

        setProfileData({
          uid: user.uid,
          username: currentUsername || data?.username || "traveller",
          bio: userBio,
          followers: userFollowers,
          following: userFollowing,
          visitedCountries: userPlaces,
          posts: userPosts,
          allowComments: data?.allowComments ?? true,
          privateMap: data?.privateMap ?? false,
          showAgeAndLocation: data?.showAgeAndLocation ?? true,
          emailNotifications: data?.emailNotifications ?? true,
          travelStyle: data?.travelStyle,
          travelFormat: data?.travelFormat,
          location:
            data?.location ||
            (data?.city && data?.country
              ? `${data.city}, ${data.country}`
              : data?.city || data?.country || ""),
          country: data?.country,
          city: data?.city,
          age: data?.age,
          interests: data?.interests,
        });
      } catch (err) {
        console.warn("Error loading own profile:", err);
      }
    } else {
      // Visiting another user's profile
      const data = await fetchUserProfile(targetUsername, user?.uid);
      if (data) {
        setProfileData(data);
        // If visiting someone else, hide their archived posts
        const visiblePosts = (data.posts ?? []).filter((p) => !p.isArchived);
        setPosts(visiblePosts);
        setPlaces(data.visitedCountries ?? []);
        setBio(data.bio ?? "");
        setBioDraft(data.bio ?? "");

        const localFollowing = getLocalFollowing(user?.uid);
        const isF =
          localFollowing.includes(data.uid) ||
          localFollowing.includes(data.username.toLowerCase());
        setIsFollowing(isF);

        const baseFollowers = data.followers?.length ?? 0;
        setFollowersCount(
          baseFollowers +
            (isF && !data.followers?.includes(user?.uid ?? "") ? 1 : 0),
        );
        setFollowingCount(data.following?.length ?? 0);

        // Check mutual
        const isFollowerOfCurrent = user
          ? (data.following ?? []).includes(user.uid) ||
            (currentUsername
              ? (data.following ?? []).includes(currentUsername)
              : false)
          : false;
        setIsMutual(isF && isFollowerOfCurrent);
      } else {
        // Empty placeholder profile if user not found
        setProfileData({
          uid: `generic-${targetUsername}`,
          username: targetUsername,
          bio: "",
          followers: [],
          following: [],
          visitedCountries: [],
          posts: [],
        });
        setPosts([]);
        setPlaces([]);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadProfile();
  }, [routeUsername, user?.uid, currentUsername]);

  const handleToggleFollow = async () => {
    if (!user) {
      onRequestAuth?.();
      return;
    }
    if (!profileData) return;

    const nextFollowingState = !isFollowing;
    setIsFollowing(nextFollowingState);
    setFollowersCount((prev) =>
      nextFollowingState ? prev + 1 : Math.max(0, prev - 1),
    );

    await toggleFollow(
      { uid: user.uid, username: currentUsername || "traveller" },
      { uid: profileData.uid, username: profileData.username },
    );
  };

  const handleSaveBio = async () => {
    if (!user) return;
    setSavingBio(true);
    setBio(bioDraft.trim());
    setIsEditingBio(false);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { bio: bioDraft.trim() },
        { merge: true },
      );
    } catch (err) {
      console.warn("Could not save bio to Firestore:", err);
    } finally {
      setSavingBio(false);
    }
  };

  // Post Actions (Edit, Archive, Delete) for Profile owner
  const handleEditPost = async (updatedPost: Post) => {
    if (!user) return;
    const nextPosts = posts.map((p) =>
      p.id === updatedPost.id ? updatedPost : p,
    );
    setPosts(nextPosts);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { posts: nextPosts },
        { merge: true },
      );
    } catch (err) {
      console.warn("Could not update post in Firestore:", err);
    }
  };

  const handleToggleArchivePost = async (post: Post) => {
    if (!user) return;
    const nextArchived = !post.isArchived;
    const updatedPost: Post = { ...post, isArchived: nextArchived };
    const nextPosts = posts.map((p) =>
      p.id === post.id ? updatedPost : p,
    );
    setPosts(nextPosts);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { posts: nextPosts },
        { merge: true },
      );
    } catch (err) {
      console.warn("Could not toggle archive in Firestore:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    const nextPosts = posts.filter((p) => p.id !== postId);
    setPosts(nextPosts);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { posts: nextPosts },
        { merge: true },
      );
    } catch (err) {
      console.warn("Could not delete post from Firestore:", err);
    }
  };

  const displayName = profileData?.username || targetUsername || "traveller";
  const avatarLetter = (displayName || "T").charAt(0).toUpperCase();

  return (
    <section className="profile-page container">
      {/* Back button if visiting another traveler */}
      {!isOwnProfile && (
        <div className="profile-back-nav">
          <button
            className="button button-outline back-btn"
            onClick={() => navigate("/profile")}
            type="button"
          >
            {copy.backToMine}
          </button>
        </div>
      )}

      {loading && (
        <div className="profile-loading-indicator">
          <p className="empty-state">
            {language === "ru" ? "Загрузка профиля..." : "Loading profile..."}
          </p>
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">{avatarLetter}</div>

        <div className="profile-heading">
          <div className="profile-eyebrow-row">
            <p className="eyebrow">
              <span /> {isOwnProfile ? copy.diary : copy.travelerDiary}
            </p>
            {isMutual && (
              <span className="mutual-badge-large">
                ★ {copy.mutual}
              </span>
            )}
          </div>

          <div className="profile-title-row">
            <h1>@{displayName}</h1>

            {isOwnProfile && (
              <button
                className="button button-outline profile-settings-btn"
                onClick={() => setShowSettings(true)}
                type="button"
                title={language === "ru" ? "Настройки профиля" : "Profile settings"}
              >
                ⚙️ {language === "ru" ? "Настройки" : "Settings"}
              </button>
            )}

            {!isOwnProfile && (
              <button
                className={`button follow-header-button ${isFollowing ? "following" : "button-coral"}`}
                onClick={() => void handleToggleFollow()}
                type="button"
              >
                {isFollowing ? copy.followingBtn : copy.follow}
              </button>
            )}
          </div>

          {/* Bio section */}
          {isOwnProfile && isEditingBio ? (
            <div className="bio-edit-box">
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder={copy.bioPlaceholder}
                rows={2}
                maxLength={200}
              />
              <div className="bio-actions">
                <button
                  className="button button-coral button-small"
                  onClick={() => void handleSaveBio()}
                  disabled={savingBio}
                  type="button"
                >
                  {savingBio ? "..." : copy.saveBio}
                </button>
                <button
                  className="button button-outline button-small"
                  onClick={() => setIsEditingBio(false)}
                  type="button"
                >
                  {copy.cancelBio}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-bio-row">
              <p className="profile-bio-text">
                {bio || (isOwnProfile ? copy.description : "")}
              </p>
              {isOwnProfile && (
                <button
                  className="edit-bio-link"
                  onClick={() => {
                    setBioDraft(bio);
                    setIsEditingBio(true);
                  }}
                  type="button"
                >
                  ✎ {copy.editBio}
                </button>
              )}
            </div>
          )}

          {/* Stats Bar with Clickable Modals */}
          <div className="profile-stats">
            <span className="stat-pill">
              <strong>{posts.length}</strong> {copy.posts.toLowerCase()}
            </span>
            <span className="stat-pill">
              <strong>{places.length}</strong> {copy.places.toLowerCase()}
            </span>

            <button
              className="stat-pill stat-interactive"
              onClick={() => setModalMode("followers")}
              type="button"
              title={
                language === "ru" ? "Посмотреть подписчиков" : "View followers"
              }
            >
              <strong>{followersCount}</strong> {copy.followers} ↗
            </button>

            <button
              className="stat-pill stat-interactive"
              onClick={() => setModalMode("following")}
              type="button"
              title={
                language === "ru" ? "Посмотреть подписки" : "View following"
              }
            >
              <strong>{followingCount}</strong> {copy.following} ↗
            </button>
          </div>

          {/* Traveler Preferences Badges & Interests */}
          {(profileData?.travelStyle ||
            profileData?.travelFormat ||
            (profileData?.showAgeAndLocation !== false &&
              (profileData?.location || profileData?.age)) ||
            (profileData?.interests && profileData.interests.length > 0)) && (
            <div className="profile-traveler-tags">
              {profileData?.showAgeAndLocation !== false &&
                profileData.location && (
                  <span className="traveler-tag-badge">
                    📍 {profileData.location}
                  </span>
                )}
              {profileData?.showAgeAndLocation !== false &&
                profileData.age && (
                  <span className="traveler-tag-badge">
                    🎂 {profileData.age} {language === "ru" ? "лет" : "y.o."}
                  </span>
                )}
              {profileData.travelStyle && (
                <span className="traveler-tag-badge accent">
                  🎒 {profileData.travelStyle}
                </span>
              )}
              {profileData.travelFormat && (
                <span className="traveler-tag-badge">
                  👥 {profileData.travelFormat}
                </span>
              )}
              {profileData.interests &&
                profileData.interests.map((interest) => (
                  <span className="traveler-interest-chip" key={interest}>
                    #{interest}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="profile-divider">
        <span>
          {isOwnProfile
            ? language === "ru"
              ? "МОЙ ДНЕВНИК ПУТЕШЕСТВИЙ"
              : "MY TRAVEL DIARY"
            : language === "ru"
              ? `ДНЕВНИК ПУТЕШЕСТВИЙ @${displayName.toUpperCase()}`
              : `@${displayName.toUpperCase()}'S TRAVEL DIARY`}
        </span>
        <span>{copy.note}</span>
      </div>

      {/* Travel Map */}
      <div className="profile-readonly-map">
        {!isOwnProfile && !user && profileData?.privateMap ? (
          <div className="private-map-notice">
            <span className="private-map-icon">🔒</span>
            <h3>
              {language === "ru"
                ? "Карта скрыта от гостей"
                : "Map is hidden from guests"}
            </h3>
            <p>
              {language === "ru"
                ? "Автор ограничил просмотр карты для гостей. Войдите в аккаунт, чтобы просмотреть отмеченные места."
                : "The traveler has made their map private for guests. Sign in to view visited places."}
            </p>
            {onRequestAuth && (
              <button
                className="button button-coral button-small"
                onClick={onRequestAuth}
                type="button"
              >
                {language === "ru" ? "Войти в аккаунт" : "Sign In"} ↗
              </button>
            )}
          </div>
        ) : (
          <MapView
            mode="profile"
            readOnly={true}
            user={isOwnProfile ? user : null}
            places={places}
            language={language}
            onRequestAuth={onRequestAuth ?? (() => undefined)}
          />
        )}
      </div>

      {/* User's Travel Posts */}
      <section className="profile-shared-posts">
        <div className="profile-posts-header">
          <p className="section-label">{copy.shared}</p>
          <div className="profile-posts-actions">
            {isOwnProfile && posts.some((p) => p.isArchived) && (
              <Link to="/posts" className="button button-outline button-small">
                📦 {language === "ru" ? "Архив" : "Archive"} (
                {posts.filter((p) => p.isArchived).length}) ↗
              </Link>
            )}
            {isOwnProfile && (
              <Link to="/posts" className="button button-coral button-small">
                + {copy.createPost} ↗
              </Link>
            )}
          </div>
        </div>

        {posts.filter((p) => !p.isArchived).length === 0 ? (
          <div className="empty-profile-posts">
            <p className="empty-state">{copy.empty}</p>
            {isOwnProfile && (
              <Link to="/posts" className="button button-outline">
                {language === "ru"
                  ? "Опубликовать первый пост"
                  : "Publish your first post"}{" "}
                ↗
              </Link>
            )}
          </div>
        ) : (
          <div className="profile-post-grid">
            {posts
              .filter((p) => !p.isArchived)
              .map((post) => (
                <article className="profile-post-card" key={post.id}>
                  {post.image && (
                    <img src={post.image} alt={post.location || post.title} />
                  )}
                  <div className="profile-post-content">
                    <div className="post-card-meta">
                      <div className="meta-left">
                        <span>📍 {post.location}</span>
                        <span>{post.date}</span>
                      </div>

                      {/* 3-dots Menu visible ONLY to the post owner */}
                      {isOwnProfile && (
                        <PostMenu
                          post={post}
                          isOwn={isOwnProfile}
                          language={language}
                          onEdit={handleEditPost}
                          onToggleArchive={handleToggleArchivePost}
                          onDelete={handleDeletePost}
                        />
                      )}
                    </div>

                  <h2>{post.title}</h2>
                  <p>{post.description}</p>

                  <div className="profile-post-footer">
                    <small>
                      💬 {post.comments.length} {copy.comments.toLowerCase()}
                    </small>
                    {post.likes && post.likes.length > 0 && (
                      <small>❤️ {post.likes.length}</small>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Friend Search & Discovery Component (Shown on own profile) */}
      {isOwnProfile && (
        <FriendSearchPanel
          currentUser={
            user
              ? { uid: user.uid, username: currentUsername || "traveller" }
              : null
          }
          language={language}
          onFollowChange={loadProfile}
        />
      )}

      {/* Quick Navigation Links */}
      <div className="profile-quick-links">
        <Link to="/map">
          {copy.map} <span>↗</span>
        </Link>
        <Link to="/posts">
          {copy.posts} <span>↗</span>
        </Link>
      </div>

      {/* Followers / Following List Modal */}
      {modalMode && profileData && (
        <FriendsModal
          mode={modalMode}
          currentUser={
            user
              ? { uid: user.uid, username: currentUsername || "traveller" }
              : null
          }
          targetUser={{
            uid: profileData.uid,
            username: displayName,
            followers: profileData.followers,
            following: profileData.following,
          }}
          language={language}
          onClose={() => setModalMode(null)}
          onFollowChange={loadProfile}
        />
      )}

      {/* Profile Settings Modal */}
      {showSettings && user && (
        <SettingsModal
          user={user}
          profileData={profileData}
          language={language}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={(updated) => {
            setProfileData((prev) => (prev ? { ...prev, ...updated } : prev));
            if (updated.username) {
              onUsernameChange?.(updated.username);
              navigate(`/profile/@${updated.username}`, { replace: true });
            }
          }}
          onAccountDeleted={() => {
            setShowSettings(false);
            navigate("/", { replace: true });
            window.location.reload();
          }}
        />
      )}
    </section>
  );
}
