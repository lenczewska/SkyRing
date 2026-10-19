import UserAvatar from "./UserAvatar";
import type { UserStoryGroup } from "./types";

type StoriesBarProps = {
  myGroup: UserStoryGroup;
  otherGroups: UserStoryGroup[];
  language: "en" | "ru";
  onOpenMyStory: () => void;
  onOpenGroup: (index: number) => void;
  onAddStory: () => void;
};

export default function StoriesBar({
  myGroup,
  otherGroups,
  language,
  onOpenMyStory,
  onOpenGroup,
  onAddStory,
}: StoriesBarProps) {
  const hasMyStories = myGroup.stories.length > 0;

  return (
    <div className="stories-bar-section">
      <div className="stories-bar-container">
        {/* Current user's story / Add story button */}
        <div className="story-item story-my-item">
          <div
            className={`story-avatar-wrapper ${
              hasMyStories
                ? myGroup.hasUnseen
                  ? "story-ring-unseen"
                  : "story-ring-seen"
                : "story-ring-empty"
            }`}
            onClick={() => {
              if (hasMyStories) {
                onOpenMyStory();
              } else {
                onAddStory();
              }
            }}
            role="button"
            tabIndex={0}
            title={
              hasMyStories
                ? language === "ru"
                  ? "Посмотреть вашу историю"
                  : "View your story"
                : language === "ru"
                ? "Добавить историю"
                : "Add story"
            }
          >
            <div className="story-avatar-inner">
              <UserAvatar
                avatar={myGroup.userAvatar}
                username={myGroup.username || "me"}
                size={58}
              />
            </div>
            {/* Plus badge */}
            <button
              className="story-add-badge-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddStory();
              }}
              title={language === "ru" ? "Добавить историю" : "Add story"}
              aria-label={language === "ru" ? "Добавить историю" : "Add story"}
              type="button"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <span className="story-username">
            {language === "ru" ? "Ваша история" : "Your story"}
          </span>
        </div>

        {/* Other travelers' stories */}
        {otherGroups.map((group, index) => {
          const isUnseen = group.hasUnseen;
          return (
            <div
              key={group.userId}
              className="story-item"
              onClick={() => onOpenGroup(index)}
              role="button"
              tabIndex={0}
              title={`@${group.username}`}
            >
              <div
                className={`story-avatar-wrapper ${
                  isUnseen ? "story-ring-unseen" : "story-ring-seen"
                }`}
              >
                <div className="story-avatar-inner">
                  <UserAvatar
                    avatar={group.userAvatar}
                    username={group.username}
                    size={58}
                  />
                </div>
              </div>
              <span className="story-username" title={group.username}>
                @{group.username}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
