import React from "react";
import { Link } from "react-router-dom";

type HashtagTextProps = {
  text: string;
  className?: string;
  language?: "en" | "ru";
  onTagClick?: (tag: string) => void;
};

// Regex to match #hashtags with unicode letters, numbers, and underscores
const HASHTAG_REGEX = /(#[a-zA-Z0-9_\u0400-\u04FF]+)/g;

export default function HashtagText({
  text,
  className = "",
  language = "ru",
  onTagClick,
}: HashtagTextProps) {
  if (!text) return null;

  const parts = text.split(HASHTAG_REGEX);

  return (
    <span className={`hashtag-text-content ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith("#") && part.length > 1) {
          const rawTag = part.slice(1).toLowerCase();
          return (
            <Link
              key={index}
              to={`/tags/${encodeURIComponent(rawTag)}`}
              className="hashtag-link"
              onClick={(e) => {
                if (onTagClick) {
                  e.stopPropagation();
                  onTagClick(rawTag);
                }
              }}
              title={
                language === "en"
                  ? `All posts tagged #${rawTag}`
                  : `Все публикации по тегу #${rawTag}`
              }
            >
              {part}
            </Link>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}

/**
 * Utility to extract all unique lowercase hashtags from a string
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(HASHTAG_REGEX);
  if (!matches) return [];
  const tags = matches.map((t) => t.slice(1).toLowerCase());
  return Array.from(new Set(tags));
}
