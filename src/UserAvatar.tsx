import { useState } from "react";

type UserAvatarProps = {
  avatar?: string;
  username?: string;
  size?: number | string;
  className?: string;
  alt?: string;
  onClick?: () => void;
};

/**
 * Universal Avatar component:
 * - Supports photo URLs (http/https/data:image/blob)
 * - Supports travel emojis / badges
 * - Falls back to capitalized initial letter
 * - Handles image error fallbacks gracefully
 */
export default function UserAvatar({
  avatar,
  username,
  size,
  className = "",
  alt,
  onClick,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const cleanName = (username || "T").replace(/^@/, "").trim();
  const initial = cleanName.charAt(0).toUpperCase() || "T";
  const isPhoto =
    avatar &&
    !imageError &&
    (avatar.startsWith("data:image") ||
      avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("blob:"));

  const isEmojiOrIcon =
    avatar && !isPhoto && avatar.length <= 4 && !/^[A-Za-z0-9]$/.test(avatar);

  const style = size
    ? {
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        minWidth: typeof size === "number" ? `${size}px` : size,
        minHeight: typeof size === "number" ? `${size}px` : size,
      }
    : undefined;

  if (isPhoto) {
    return (
      <div
        className={`user-avatar-container ${className}`}
        style={style}
        onClick={onClick}
      >
        <img
          src={avatar}
          alt={alt || `@${cleanName}`}
          className="user-avatar-img"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  if (isEmojiOrIcon) {
    return (
      <div
        className={`user-avatar-container emoji-avatar ${className}`}
        style={style}
        onClick={onClick}
      >
        <span className="user-avatar-emoji-span">{avatar}</span>
      </div>
    );
  }

  // Fallback initial
  const displayChar = avatar && avatar.length === 1 ? avatar : initial;

  return (
    <div
      className={`user-avatar-container letter-avatar ${className}`}
      style={style}
      onClick={onClick}
    >
      <span className="user-avatar-letter">{displayChar}</span>
    </div>
  );
}
