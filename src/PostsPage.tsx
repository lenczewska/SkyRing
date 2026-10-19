import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Post, PostComment, UserStoryGroup, UserSummary } from "./types";
import {
  getCommunityPosts,
  getFollowingPosts,
  getLocalFollowing,
  searchTravelers,
  toggleFollow,
} from "./lib/friendsService";
import {
  deleteStory,
  getAllStoryGroups,
  publishStory,
} from "./lib/storiesService";
import PostMenu from "./PostMenu";
import MapView from "./MapView";
import UserAvatar from "./UserAvatar";
import HashtagText from "./HashtagText";
import PostDetailModal from "./PostDetailModal";
import StoriesBar from "./StoriesBar";
import StoryViewerModal from "./StoryViewerModal";
import CreateStoryModal from "./CreateStoryModal";

type PostsPageProps = {
  user: User | null;
  username?: string;
  userAvatar?: string;
  language: "en" | "ru";
  onRequestAuth?: () => void;
};

type FeedTab = "following" | "all" | "my" | "archive";

export default function PostsPage({
  user,
  username = "",
  userAvatar = "",
  language,
  onRequestAuth,
}: PostsPageProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [suggested, setSuggested] = useState<UserSummary[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  const [draft, setDraft] = useState<Partial<Post>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [currentUserAllowComments, setCurrentUserAllowComments] = useState<boolean>(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({});

  const toggleDesc = (postId: string) => {
    setExpandedDescIds((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const isDescLong = (text?: string) => {
    if (!text) return false;
    return text.trim().length > 100 || text.includes("\n");
  };

  // Stories system state
  const [myStoryGroup, setMyStoryGroup] = useState<UserStoryGroup>({
    userId: user?.uid || "me",
    username: username || "you",
    userAvatar: userAvatar || "",
    stories: [],
    hasUnseen: false,
  });
  const [otherStoryGroups, setOtherStoryGroups] = useState<UserStoryGroup[]>([]);
  const [activeStoryViewer, setActiveStoryViewer] = useState<{
    groups: UserStoryGroup[];
    initialGroupIndex: number;
    initialStoryIndex: number;
  } | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  const copy =
    language === "ru"
      ? {
          eyebrow: "ЛЕНТА ПУТЕШЕСТВИЙ",
          title: "Истории, которые хочется сохранить.",
          intro:
            "Следите за поездками друзей, открывайте новые направления и делитесь своими впечатлениями.",
          tabFollowing: "Подписки",
          tabAll: "Все посты",
          tabMy: "Мои посты",
          tabArchive: "Архив",
          archivedBadge: "В архиве",
          archivedBanner: "Архивные публикации скрыты от других пользователей и видны только вам.",
          add: "ДОБАВИТЬ НОВЫЙ ПОСТ",
          image: "Фотография",
          description: "Описание",
          location: "Местоположение",
          date: "Дата поездки",
          titleLabel: "Название",
          comment: "Комментарии",
          commentPlaceholder: "Оставьте комментарий...",
          publish: "Опубликовать пост",
          emptyMy: "У вас пока нет опубликованных постов.",
          emptyArchive: "В архиве пока нет сохраненных постов.",
          emptyFollowing: "В вашей ленте подписок пока нет постов.",
          emptyFollowingSub:
            "Подпишитесь на интересных путешественников, чтобы видеть их новые истории здесь!",
          emptyAll: "Пока нет опубликованных постов.",
          remove: "Удалить",
          like: "Нравится",
          liked: "Понравилось",
          follow: "+ Подписаться",
          followingBtn: "✓ В подписках",
          findFriends: "Найти друзей",
          suggestedTitle: "Рекомендуем подписаться:",
        }
      : {
          eyebrow: "TRAVEL FEED",
          title: "Stories worth keeping.",
          intro:
            "Follow journeys of friends, discover new destinations, and share your own travel memories.",
          tabFollowing: "Following",
          tabAll: "Explore All",
          tabMy: "My Posts",
          tabArchive: "Archive",
          archivedBadge: "Archived",
          archivedBanner: "Archived posts are hidden from other users and visible only to you.",
          add: "ADD A NEW POST",
          image: "Photo",
          description: "Description",
          location: "Location",
          date: "Trip date",
          titleLabel: "Title",
          comment: "Comments",
          commentPlaceholder: "Write a comment...",
          publish: "Publish post",
          emptyMy: "You haven't published any posts yet.",
          emptyArchive: "No archived posts yet.",
          emptyFollowing: "No posts in your following feed yet.",
          emptyFollowingSub:
            "Follow other travelers to see their latest adventures, maps, and photos here!",
          emptyAll: "No posts available yet.",
          remove: "Remove",
          like: "Like",
          liked: "Liked",
          follow: "+ Follow",
          followingBtn: "✓ Following",
          findFriends: "Find travelers",
          suggestedTitle: "Recommended travelers to follow:",
        };

  // Sync following map
  const syncFollowing = () => {
    const list = getLocalFollowing(user?.uid);
    const fMap: Record<string, boolean> = {};
    list.forEach((id) => {
      fMap[id.toLowerCase()] = true;
    });
    setFollowingMap(fMap);
  };

  // Load and refresh stories
  const loadStories = async () => {
    try {
      const { myGroup, otherGroups } = await getAllStoryGroups(
        user?.uid,
        username,
        userAvatar,
      );
      setMyStoryGroup(myGroup);
      setOtherStoryGroups(otherGroups);
    } catch (err) {
      console.warn("Could not load stories:", err);
    }
  };

  useEffect(() => {
    void loadStories();
  }, [user?.uid, username, userAvatar]);

  // Only accounts with unseen stories appear in the feed tray (like Instagram)
  const unseenOtherStoryGroups = otherStoryGroups.filter((g) => g.hasUnseen);

  const handleOpenMyStory = () => {
    if (myStoryGroup.stories.length === 0) {
      if (!user) {
        onRequestAuth?.();
      } else {
        setIsCreateStoryOpen(true);
      }
      return;
    }
    const combinedGroups = [myStoryGroup, ...unseenOtherStoryGroups];
    setActiveStoryViewer({
      groups: combinedGroups,
      initialGroupIndex: 0,
      initialStoryIndex: 0,
    });
  };

  const handleOpenGroup = (index: number) => {
    const hasMy = myStoryGroup.stories.length > 0;
    const combinedGroups = hasMy
      ? [myStoryGroup, ...unseenOtherStoryGroups]
      : unseenOtherStoryGroups;
    const targetIndex = hasMy ? index + 1 : index;
    setActiveStoryViewer({
      groups: combinedGroups,
      initialGroupIndex: targetIndex,
      initialStoryIndex: 0,
    });
  };

  const handleAddStory = () => {
    if (!user) {
      onRequestAuth?.();
      return;
    }
    setIsCreateStoryOpen(true);
  };

  const handlePublishStory = async (data: {
    mediaUrl: string;
    caption?: string;
    location?: string;
  }) => {
    await publishStory({
      userId: user?.uid,
      username: username || "you",
      userAvatar: userAvatar,
      mediaUrl: data.mediaUrl,
      caption: data.caption,
      location: data.location,
    });
    await loadStories();
  };

  const handleDeleteStory = async (storyId: string) => {
    await deleteStory(user?.uid, storyId);
    await loadStories();
  };

  // Load posts based on user / feeds
  const loadFeeds = async () => {
    setLoadingFeed(true);
    syncFollowing();

    // 1. My posts
    if (user) {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const uData = snapshot.data();
        const userPosts = (uData?.posts as Post[] | undefined) ?? [];
        setMyPosts(userPosts);
        setCurrentUserAllowComments(uData?.allowComments ?? true);
      } catch {
        setMyPosts([]);
      }
    }

    // 2. Following posts
    const fPosts = await getFollowingPosts(
      user ? { uid: user.uid, username: username || "traveller" } : null,
    );
    setFollowingPosts(fPosts);

    // 3. All community posts
    const community = await getCommunityPosts(
      user ? { uid: user.uid, username: username || "traveller" } : null,
    );
    setAllPosts(community);

    // 4. Suggested travelers for empty states
    const sugg = await searchTravelers("", user?.uid, username);
    setSuggested(sugg.slice(0, 4));

    setLoadingFeed(false);
  };

  useEffect(() => {
    void loadFeeds();
  }, [user, username, language]);

  const updateDraft = <K extends keyof Post>(key: K, value: Post[K]) =>
    setDraft({ ...draft, [key]: value });

  const publish = async () => {
    if (!user || !draft.title?.trim()) {
      setPublishError(
        language === "ru"
          ? "Добавьте название поста."
          : "Add a title for your post.",
      );
      return;
    }
    setPublishing(true);
    setPublishError("");

    const post: Post = {
      id: `${Date.now()}`,
      authorId: user.uid,
      authorUsername: username || "traveller",
      authorAvatar: userAvatar || (username || "T").charAt(0).toUpperCase(),
      title: draft.title.trim(),
      image: draft.image,
      description: draft.description ?? "",
      location: draft.location ?? "",
      date: draft.date ?? new Date().toISOString().split("T")[0],
      comments: [],
      likes: [],
      createdAt: new Date().toISOString(),
      isArchived: false,
      allowComments: currentUserAllowComments,
    };

    const nextPosts = [post, ...myPosts];
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { posts: nextPosts },
        { merge: true },
      );
      setMyPosts(nextPosts);
      setAllPosts([post, ...allPosts]);
      setDraft({});
      setActiveTab("my");
    } catch {
      setPublishError(
        language === "ru"
          ? "Не удалось сохранить пост. Проверьте соединение и попробуйте ещё раз."
          : "The post could not be saved. Check your connection and try again.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const removeMyPost = async (postId: string) => {
    if (!user) return;
    const nextPosts = myPosts.filter((p) => p.id !== postId);
    setMyPosts(nextPosts);
    setAllPosts(allPosts.filter((p) => p.id !== postId));
    setFollowingPosts(followingPosts.filter((p) => p.id !== postId));
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { posts: nextPosts },
        { merge: true },
      );
    } catch (err) {
      console.warn("Could not remove post from Firestore:", err);
    }
  };

  const handleEditMyPost = async (updatedPost: Post) => {
    if (!user) return;
    const nextPosts = myPosts.map((p) =>
      p.id === updatedPost.id ? updatedPost : p,
    );
    setMyPosts(nextPosts);
    setAllPosts(allPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setFollowingPosts(
      followingPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    );

    try {
      await setDoc(
        doc(db, "users", user.uid),
        { posts: nextPosts },
        { merge: true },
      );
    } catch (err) {
      console.warn("Could not save edited post to Firestore:", err);
    }
  };

  const handleToggleArchive = async (post: Post) => {
    if (!user) return;
    const nextArchivedState = !post.isArchived;
    const updatedPost: Post = { ...post, isArchived: nextArchivedState };

    const nextPosts = myPosts.map((p) =>
      p.id === post.id ? updatedPost : p,
    );
    setMyPosts(nextPosts);
    setAllPosts(allPosts.map((p) => (p.id === post.id ? updatedPost : p)));
    setFollowingPosts(
      followingPosts.map((p) => (p.id === post.id ? updatedPost : p)),
    );

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

  const handleAddComment = async (post: Post) => {
    const text = commentInputs[post.id]?.trim();
    if (!text) return;

    if (post.allowComments === false) return;

    if (!user) {
      onRequestAuth?.();
      return;
    }

    const commentObj: PostComment = {
      id: `${Date.now()}`,
      authorId: user.uid,
      authorUsername: username || "traveller",
      authorAvatar: userAvatar || (username || "T").charAt(0).toUpperCase(),
      text,
      createdAt: new Date().toISOString(),
    };

    const updater = (list: Post[]) =>
      list.map((item) =>
        item.id === post.id
          ? { ...item, comments: [...item.comments, commentObj] }
          : item,
      );

    setMyPosts(updater);
    setFollowingPosts(updater);
    setAllPosts(updater);

    setCommentInputs((prev) => ({ ...prev, [post.id]: "" }));

    // If it's my post or Firestore author post, persist it
    if (post.authorId === user.uid || !post.authorId) {
      const updatedUserPosts = myPosts.map((p) =>
        p.id === post.id
          ? { ...p, comments: [...p.comments, commentObj] }
          : p,
      );
      await setDoc(
        doc(db, "users", user.uid),
        { posts: updatedUserPosts },
        { merge: true },
      );
    } else if (post.authorId && !post.authorId.startsWith("curated-")) {
      try {
        const authorSnap = await getDoc(doc(db, "users", post.authorId));
        if (authorSnap.exists()) {
          const authorPosts = (authorSnap.data()?.posts as Post[]) ?? [];
          const updated = authorPosts.map((p) =>
            p.id === post.id
              ? { ...p, comments: [...p.comments, commentObj] }
              : p,
          );
          await setDoc(
            doc(db, "users", post.authorId),
            { posts: updated },
            { merge: true },
          );
        }
      } catch (err) {
        console.warn("Could not save comment to author's post:", err);
      }
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (!user) {
      onRequestAuth?.();
      return;
    }

    const userKey = username || user.uid;
    const isLiked = (post.likes ?? []).includes(userKey);
    const updatedLikes = isLiked
      ? (post.likes ?? []).filter((id) => id !== userKey)
      : [...(post.likes ?? []), userKey];

    const updater = (list: Post[]) =>
      list.map((item) =>
        item.id === post.id ? { ...item, likes: updatedLikes } : item,
      );

    setMyPosts(updater);
    setFollowingPosts(updater);
    setAllPosts(updater);

    if (post.authorId === user.uid) {
      const updatedUserPosts = myPosts.map((p) =>
        p.id === post.id ? { ...p, likes: updatedLikes } : p,
      );
      await setDoc(
        doc(db, "users", user.uid),
        { posts: updatedUserPosts },
        { merge: true },
      );
    }
  };

  const handleFollowTraveler = async (t: UserSummary) => {
    if (!user) {
      onRequestAuth?.();
      return;
    }

    const isNow = !followingMap[t.username.toLowerCase()];
    setFollowingMap((prev) => ({
      ...prev,
      [t.username.toLowerCase()]: isNow,
      [t.uid.toLowerCase()]: isNow,
    }));

    await toggleFollow(
      { uid: user.uid, username: username || "traveller" },
      { uid: t.uid, username: t.username },
    );

    // Refresh following feed
    const fPosts = await getFollowingPosts({
      uid: user.uid,
      username: username || "traveller",
    });
    setFollowingPosts(fPosts);
  };

  // Filtered post lists
  const visibleFollowingPosts = followingPosts.filter((p) => !p.isArchived);
  const visibleAllPosts = allPosts.filter((p) => !p.isArchived);

  const publishedMyPosts = myPosts.filter((p) => !p.isArchived);
  const archivedMyPosts = myPosts.filter((p) => p.isArchived);

  const currentDisplayPosts =
    activeTab === "following"
      ? visibleFollowingPosts
      : activeTab === "all"
        ? visibleAllPosts
        : activeTab === "archive"
          ? archivedMyPosts
          : publishedMyPosts;

  return (
    <section className="subpage container posts-page">
      <p className="eyebrow">
        <span /> {copy.eyebrow}
      </p>
      <h1>{copy.title}</h1>
      <p className="subpage-intro">{copy.intro}</p>

      {/* Stories Tray Bar */}
      <StoriesBar
        myGroup={myStoryGroup}
        otherGroups={unseenOtherStoryGroups}
        language={language}
        onOpenMyStory={handleOpenMyStory}
        onOpenGroup={handleOpenGroup}
        onAddStory={handleAddStory}
      />

      {!user ? (
        <div className="guest-posts-wrapper">
          <section className="guest-post-intro">
            <p className="guest-map-kicker">
              {language === "ru"
                ? "СООБЩЕСТВО ПУТЕШЕСТВЕННИКОВ"
                : "TRAVEL COMMUNITY"}
            </p>
            <h2>
              {language === "ru"
                ? "Поделись своими впечатлениями о путешествии со всем миром!"
                : "Share your travel impressions with the whole world!"}
            </h2>
            <p>
              {language === "ru"
                ? "Лента историй, фотоотчёты и поиск единомышленников доступны только зарегистрированным пользователям. Присоединяйся к сообществу SkyRing, находи новых друзей и делись своими маршрутами!"
                : "Stories feed, photo reports, and traveler search are available after registration. Join the SkyRing community, connect with new friends, and share your adventures!"}
            </p>
            <div className="guest-map-cta-row">
              <button
                className="button button-coral"
                onClick={onRequestAuth}
                type="button"
              >
                {language === "ru" ? "Создать аккаунт" : "Create an account"} ↗
              </button>
              <button
                className="button button-outline"
                onClick={onRequestAuth}
                type="button"
              >
                {language === "ru" ? "Войти" : "Log in"}
              </button>
            </div>
          </section>

          <div className="guest-globe-showcase">
            <MapView
              mode="globe"
              readOnly={true}
              user={null}
              language={language}
              onRequestAuth={onRequestAuth}
            />
          </div>
        </div>
      ) : (
        <>

      {/* Composer Section (Shown when in "My Posts" tab) */}
      {user && activeTab === "my" && (
        <section className="post-composer">
          <p className="section-label">{copy.add}</p>
          <div className="post-form-grid">
            <label>
              {copy.image}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) updateDraft("image", URL.createObjectURL(file));
                }}
              />
            </label>
            {draft.image && (
              <img
                className="post-image-preview"
                src={draft.image}
                alt={copy.image}
              />
            )}
            <label>
              {copy.titleLabel}
              <input
                value={draft.title ?? ""}
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder={
                  language === "ru"
                    ? "Например: Закат на скалах Санторини"
                    : "e.g. Sunset on Santorini cliffs"
                }
              />
            </label>
            <label>
              {copy.location}
              <input
                value={draft.location ?? ""}
                onChange={(event) =>
                  updateDraft("location", event.target.value)
                }
                placeholder={
                  language === "ru"
                    ? "Например: Греция, Санторини"
                    : "e.g. Greece, Santorini"
                }
              />
            </label>
            <label>
              {copy.date}
              <input
                type="date"
                value={draft.date ?? ""}
                onChange={(event) => updateDraft("date", event.target.value)}
              />
            </label>
            <label className="span-full">
              {copy.description}
              <textarea
                value={draft.description ?? ""}
                onChange={(event) =>
                  updateDraft("description", event.target.value)
                }
                placeholder={
                  language === "ru"
                    ? "Напишите ваши впечатления, советы и эмоции от этой поездки..."
                    : "Write your impressions, tips, and feelings from this trip..."
                }
              />
              <div className="composer-hashtag-suggestions">
                <span className="hashtag-suggest-label">
                  {language === "ru" ? "Добавить хештег:" : "Add hashtag:"}
                </span>
                {["#italy", "#roma", "#japan", "#mountains", "#sea", "#adventure", "#food", "#nature", "#hiking"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="composer-hashtag-chip"
                    onClick={() => {
                      const cur = draft.description ?? "";
                      updateDraft("description", cur ? `${cur} ${t}` : t);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <button
            className="button button-coral"
            onClick={() => void publish()}
            disabled={publishing}
            type="button"
          >
            {publishing
              ? language === "ru"
                ? "Сохраняем..."
                : "Saving..."
              : copy.publish}{" "}
            ↗
          </button>
          {publishError && (
            <p className="auth-error" role="alert">
              {publishError}
            </p>
          )}
        </section>
      )}

      {/* Main Feed Content */}
      <section className="posts-feed">
        {loadingFeed ? (
          <div className="feed-loading-state">
            <p className="empty-state">
              {language === "ru"
                ? "Загрузка публикаций..."
                : "Loading travel stories..."}
            </p>
          </div>
        ) : (
          <>
            {/* Empty state for Following Feed */}
            {activeTab === "following" && currentDisplayPosts.length === 0 && (
              <div className="following-empty-panel">
                <div className="following-empty-icon">👥</div>
                <h2>{copy.emptyFollowing}</h2>
                <p>{copy.emptyFollowingSub}</p>

                {suggested.length > 0 && (
                  <div className="following-suggested-section">
                    <p className="section-label">{copy.suggestedTitle}</p>
                    <div className="friend-card-grid">
                      {suggested.map((t) => {
                        const isFollowing =
                          followingMap[t.username.toLowerCase()] ?? t.isFollowing;
                        return (
                          <div className="friend-card" key={t.uid}>
                            <div className="friend-card-head">
                              <Link
                                to={`/profile/${t.username}`}
                                className="friend-avatar-link"
                              >
                                <UserAvatar
                                  avatar={t.avatar}
                                  username={t.username}
                                  size={40}
                                  className="friend-avatar"
                                />
                              </Link>
                              <div className="friend-card-meta">
                                <Link
                                  to={`/profile/${t.username}`}
                                  className="friend-username-link"
                                >
                                  <strong>@{t.username}</strong>
                                </Link>
                                {t.location && (
                                  <span className="friend-location">
                                    📍 {t.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            {t.bio && <p className="friend-bio">{t.bio}</p>}
                            <div className="friend-card-footer">
                              <Link
                                to={`/profile/${t.username}`}
                                className="button button-outline friend-view-btn"
                              >
                                {language === "ru" ? "Профиль" : "Profile"} ↗
                              </Link>
                              <button
                                className={`follow-toggle-button ${isFollowing ? "following" : "follow"}`}
                                onClick={() => void handleFollowTraveler(t)}
                                type="button"
                              >
                                {isFollowing ? copy.followingBtn : copy.follow}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state for My Posts */}
            {activeTab === "my" && currentDisplayPosts.length === 0 && (
              <p className="empty-state">{copy.emptyMy}</p>
            )}

            {/* Empty state for All Posts */}
            {activeTab === "all" && currentDisplayPosts.length === 0 && (
              <p className="empty-state">{copy.emptyAll}</p>
            )}

            {/* Posts List */}
            {currentDisplayPosts.map((post) => {
              const authorUName = post.authorUsername || "traveller";
              const isOwn =
                user &&
                (post.authorId === user.uid ||
                  authorUName.toLowerCase() === (username || "").toLowerCase());
              const isFollowed = followingMap[authorUName.toLowerCase()] ?? false;
              const isLiked =
                user && (post.likes ?? []).includes(username || user.uid);
              const commentsCount = post.comments.length;

              return (
                <article
                  className={`post-card ${post.isArchived ? "post-archived" : ""}`}
                  key={post.id}
                >
                  {/* Top Header: Author info & Title (above photo) */}
                  <div className="post-card-top">
                    {/* Author row */}
                    <div className="post-author-header">
                      <Link
                        to={`/profile/${authorUName}`}
                        className="post-author-link"
                      >
                        <UserAvatar
                          avatar={post.authorAvatar}
                          username={authorUName}
                          size={42}
                          className="post-author-avatar"
                        />
                        <div className="post-author-info">
                          <strong className="post-author-name">
                            @{authorUName}
                          </strong>
                          {post.location && (
                            <span className="post-author-loc">📍 {post.location}</span>
                          )}
                        </div>
                      </Link>

                      <div className="post-header-actions">
                        {post.isArchived && (
                          <span className="archived-tag">
                            📦 {copy.archivedBadge}
                          </span>
                        )}

                        {!isOwn && user && (
                          <button
                            className={`mini-follow-btn ${isFollowed ? "following" : ""}`}
                            onClick={() =>
                              void handleFollowTraveler({
                                uid: post.authorId || `curated-${authorUName}`,
                                username: authorUName,
                                postsCount: 0,
                                placesCount: 0,
                                followersCount: 0,
                                followingCount: 0,
                              })
                            }
                            type="button"
                          >
                            {isFollowed ? copy.followingBtn : copy.follow}
                          </button>
                        )}
                        <span className="post-date-badge">{post.date}</span>

                        {/* 3-dots Menu visible ONLY to the person who shared the post */}
                        {isOwn && (
                          <PostMenu
                            post={post}
                            isOwn={Boolean(isOwn)}
                            language={language}
                            onEdit={handleEditMyPost}
                            onToggleArchive={handleToggleArchive}
                            onDelete={removeMyPost}
                          />
                        )}
                      </div>
                    </div>

                    {/* Title directly under author name, above photo */}
                    {post.title && (
                      <h2
                        className="post-title-link"
                        onClick={() => setSelectedPost(post)}
                      >
                        <HashtagText text={post.title} />
                      </h2>
                    )}
                  </div>

                  {/* Photo */}
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.location || post.title}
                      className="post-card-clickable-img"
                      onClick={() => setSelectedPost(post)}
                    />
                  )}

                  {/* Bottom section: Likes/Comments, Description, Comments */}
                  <div className="post-card-body">
                    {/* Like & Comments Action Bar under photo */}
                    <div className="post-actions-bar">
                      <button
                        className={`post-like-btn ${isLiked ? "liked" : ""}`}
                        onClick={() => void handleToggleLike(post)}
                        type="button"
                        title={isLiked ? copy.liked : copy.like}
                      >
                        <span className="like-icon">{isLiked ? "❤️" : "🤍"}</span>
                        <span>{post.likes?.length ?? 0}</span>
                      </button>

                      <span className="post-comments-count">
                        💬 {commentsCount} {copy.comment.toLowerCase()}
                      </span>
                    </div>

                    {/* Description after likes and comments, 2 lines max + read more */}
                    {post.description && (
                      <div className="post-description-wrapper">
                        <p
                          className={`post-description-text ${expandedDescIds[post.id] ? "expanded" : "clamped"}`}
                        >
                          <HashtagText text={post.description} />
                        </p>
                        {isDescLong(post.description) && (
                          <button
                            type="button"
                            className="post-read-more-btn"
                            onClick={() => toggleDesc(post.id)}
                          >
                            {expandedDescIds[post.id]
                              ? language === "ru"
                                ? "Свернуть"
                                : "Show less"
                              : language === "ru"
                                ? "Читать далее"
                                : "Read more"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Comments Section */}
                    {(() => {
                      const isCommentsAllowed = post.allowComments !== false;
                      return (
                        <div className="post-comments">
                          <strong>{copy.comment}</strong>
                          {post.comments.length === 0 ? (
                            <p className="no-comments-hint">
                              {!isCommentsAllowed
                                ? language === "ru"
                                  ? "Комментарии к этой записи отключены автором."
                                  : "Comments are disabled by the author."
                                : language === "ru"
                                  ? "Пока нет комментариев. Будьте первым!"
                                  : "No comments yet. Be the first to comment!"}
                            </p>
                          ) : (
                            <div className="comments-list">
                              {post.comments.map((c, index) => {
                                const isObj = typeof c !== "string";
                                const cAuthor = isObj
                                  ? c.authorUsername
                                  : authorUName;
                                const cText = isObj ? c.text : c;

                                return (
                                  <div
                                    className="comment-item"
                                    key={`${post.id}-${index}`}
                                  >
                                    <Link
                                      to={`/profile/${cAuthor}`}
                                      className="comment-author"
                                    >
                                      @{cAuthor}:
                                    </Link>{" "}
                                    <span className="comment-text">{cText}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {isCommentsAllowed ? (
                            <div className="comment-row">
                              <input
                                value={commentInputs[post.id] ?? ""}
                                onChange={(event) =>
                                  setCommentInputs({
                                    ...commentInputs,
                                    [post.id]: event.target.value,
                                  })
                                }
                                placeholder={copy.commentPlaceholder}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    void handleAddComment(post);
                                  }
                                }}
                              />
                              <button
                                className="nav-button comment-submit-btn"
                                onClick={() => void handleAddComment(post)}
                                type="button"
                                aria-label="Send comment"
                              >
                                ↗
                              </button>
                            </div>
                          ) : (
                            <div className="comments-disabled-notice">
                              <span>
                                🔒 {language === "ru"
                                  ? "Автор отключил комментарии к этому посту"
                                  : "The author has disabled comments for this post"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </article>
              );
            })}
          </>
        )}
      </section>
      </>
      )}

      {/* Detailed Post Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          language={language}
          currentUsername={username}
          onClose={() => setSelectedPost(null)}
          onLike={(pId) => {
            const p = currentDisplayPosts.find((item) => item.id === pId);
            if (p) void handleToggleLike(p);
          }}
          onComment={(pId, text) => {
            const p = currentDisplayPosts.find((item) => item.id === pId);
            if (p) {
              setCommentInputs((prev) => ({ ...prev, [pId]: text }));
              void handleAddComment(p);
            }
          }}
        />
      )}

      {/* Instagram-style Fullscreen Stories Viewer */}
      {activeStoryViewer && (
        <StoryViewerModal
          groups={activeStoryViewer.groups}
          initialGroupIndex={activeStoryViewer.initialGroupIndex}
          initialStoryIndex={activeStoryViewer.initialStoryIndex}
          currentUserId={user?.uid}
          currentUsername={username}
          currentUserAvatar={userAvatar}
          language={language}
          onClose={() => {
            setActiveStoryViewer(null);
            void loadStories();
          }}
          onDeleteStory={handleDeleteStory}
          onStoryViewed={() => {
            void loadStories();
          }}
        />
      )}

      {/* Create Story Modal */}
      {isCreateStoryOpen && (
        <CreateStoryModal
          user={user}
          username={username}
          userAvatar={userAvatar}
          language={language}
          onClose={() => setIsCreateStoryOpen(false)}
          onStoryCreated={handlePublishStory}
        />
      )}
    </section>
  );
}
