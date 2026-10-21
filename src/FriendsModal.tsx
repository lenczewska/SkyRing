import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { UserSummary } from "./types";
import {
  getLocalFollowing,
  searchTravelers,
  toggleFollow,
} from "./lib/friendsService";
import UserAvatar from "./UserAvatar";
import { useModalScrollLock } from "./lib/useModalScrollLock";

type FriendsModalProps = {
  mode: "followers" | "following";
  currentUser: { uid: string; username: string } | null;
  targetUser: { uid: string; username: string; followers?: string[]; following?: string[] };
  language: "en" | "ru";
  onClose: () => void;
  onFollowChange?: () => void;
};

export default function FriendsModal({
  mode,
  currentUser,
  targetUser,
  language,
  onClose,
  onFollowChange,
}: FriendsModalProps) {
  useModalScrollLock();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadList = async () => {
      const allTravelers = await searchTravelers(
        "",
        currentUser?.uid,
        currentUser?.username,
      );
      if (!active) return;

      const targetList =
        mode === "followers"
          ? targetUser.followers ?? []
          : targetUser.following ?? [];

      const currentFollowing = getLocalFollowing(currentUser?.uid);
      const fMap: Record<string, boolean> = {};
      currentFollowing.forEach((id) => {
        fMap[id.toLowerCase()] = true;
      });
      setFollowingMap(fMap);

      // Filter to matching users in target's list
      const matched = allTravelers.filter((t) => {
        const uName = t.username.toLowerCase();
        const uUid = t.uid.toLowerCase();
        return (
          targetList.some(
            (id) =>
              id.toLowerCase() === uName ||
              id.toLowerCase() === uUid,
          ) ||
          (mode === "following" && targetList.includes(t.username))
        );
      });

      setUsers(matched);
      setLoading(false);
    };

    void loadList();

    return () => {
      active = false;
    };
  }, [mode, targetUser, currentUser]);

  const handleToggleFollow = async (user: UserSummary) => {
    const isNowFollowing = !followingMap[user.username.toLowerCase()];
    setFollowingMap((prev) => ({
      ...prev,
      [user.username.toLowerCase()]: isNowFollowing,
      [user.uid.toLowerCase()]: isNowFollowing,
    }));

    await toggleFollow(currentUser, {
      uid: user.uid,
      username: user.username,
    });

    onFollowChange?.();
  };

  const title =
    mode === "followers"
      ? language === "ru"
        ? `Подписчики @${targetUser.username}`
        : `@${targetUser.username}'s Followers`
      : language === "ru"
        ? `Подписки @${targetUser.username}`
        : `@${targetUser.username} is Following`;

  const emptyMsg =
    mode === "followers"
      ? language === "ru"
        ? "Пока нет подписчиков."
        : "No followers yet."
      : language === "ru"
        ? "Пока нет подписок."
        : "Not following anyone yet.";

  return (
    <div
      className="auth-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="friends-modal" role="dialog" aria-modal="true">
        <button
          className="auth-close nav-button"
          onClick={onClose}
          type="button"
          aria-label={language === "ru" ? "Закрыть" : "Close"}
        >
          ×
        </button>

        <p className="eyebrow">
          <span /> {language === "ru" ? "СООБЩЕСТВО SKYRING" : "SKYRING COMMUNITY"}
        </p>
        <h2>{title}</h2>

        {loading ? (
          <div className="friends-modal-loading">
            {language === "ru" ? "Загрузка..." : "Loading travelers..."}
          </div>
        ) : users.length === 0 ? (
          <p className="empty-state">{emptyMsg}</p>
        ) : (
          <div className="friends-modal-list">
            {users.map((item) => {
              const isFollowing =
                followingMap[item.username.toLowerCase()] ?? item.isFollowing;
              const isSelf =
                currentUser &&
                (currentUser.uid === item.uid ||
                  currentUser.username.toLowerCase() ===
                    item.username.toLowerCase());

              return (
                <div className="friends-modal-item" key={item.uid}>
                  <Link
                    to={`/profile/${item.username}`}
                    onClick={onClose}
                    className="friends-modal-user-link"
                  >
                    <UserAvatar
                      avatar={item.avatar}
                      username={item.username}
                      size={42}
                      className="friends-item-avatar"
                    />
                    <div className="friends-item-info">
                      <div className="friends-item-name-row">
                        <strong>@{item.username}</strong>
                        {item.isMutual && (
                          <span className="mutual-badge">
                            {language === "ru" ? "Взаимно" : "Mutual"}
                          </span>
                        )}
                      </div>
                      {item.location && <small>{item.location}</small>}
                      {item.bio && <p className="friends-item-bio">{item.bio}</p>}
                    </div>
                  </Link>

                  {!isSelf && (
                    <button
                      className={`follow-toggle-button ${isFollowing ? "following" : "follow"}`}
                      onClick={() => void handleToggleFollow(item)}
                      type="button"
                    >
                      {isFollowing
                        ? language === "ru"
                          ? "В подписках"
                          : "Following"
                        : language === "ru"
                          ? "+ Подписаться"
                          : "+ Follow"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
