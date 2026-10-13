import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "en" | "ru";

export type HomeCopy = {
  navHow: string;
  navInspiration: string;
  accountAction: string;
  eyebrow: string;
  titleFirst: string;
  titleSecond: string;
  description: string;
  start: string;
  discover: string;
  idea: string;
  introFirst: string;
  introSecond: string;
  introLast: string;
  introText: string;
  orbitFirst: string;
  orbitSecond: string;
  journey: string;
  featureHeading: string;
  features: readonly (readonly [string, string, string])[];
  closingEyebrow: string;
  closingFirst: string;
  closingSecond: string;
  createSkyRing: string;
};

type CommonCopy = {
  profile: string;
  map: string;
  posts: string;
  logout: string;
  languageLabel: string;
};

export type SocialCopy = {
  friends: string;
  following: string;
  followers: string;
  follow: string;
  unfollow: string;
  followingBtn: string;
  mutual: string;
  findFriends: string;
  searchTravelers: string;
  searchPlaceholder: string;
  noUsersFound: string;
  suggestedTravelers: string;
  followingFeed: string;
  allPosts: string;
  myPosts: string;
  noFollowingPosts: string;
  noFollowingPostsSub: string;
  exploreTravelers: string;
  userNotFound: string;
  backToMyProfile: string;
  viewProfile: string;
  postsCount: string;
  placesCount: string;
  followersCount: string;
  followingCount: string;
  journeys2026: string;
  addComment: string;
  commentPlaceholder: string;
  like: string;
  liked: string;
  myDiary: string;
  userDiary: string;
  sharedPosts: string;
  noPostsYet: string;
  friendUpdates: string;
  friendUpdatesSub: string;
};

type I18nValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  common: CommonCopy;
  home: HomeCopy;
  social: SocialCopy;
};

export const translations: Record<
  Language,
  { common: CommonCopy; home: HomeCopy; social: SocialCopy }
> = {
  en: {
    common: {
      profile: "My profile",
      map: "Travel map",
      posts: "Posts",
      logout: "Log out",
      languageLabel: "Choose language",
    },
    social: {
      friends: "Friends & Following",
      following: "Following",
      followers: "Followers",
      follow: "+ Follow",
      unfollow: "Unfollow",
      followingBtn: "✓ Following",
      mutual: "Mutual",
      findFriends: "Find Travelers",
      searchTravelers: "Search by username or place...",
      searchPlaceholder: "e.g. sophie_nomad, marco, alex...",
      noUsersFound: "No travelers found.",
      suggestedTravelers: "Recommended Travelers",
      followingFeed: "Following Feed",
      allPosts: "Explore Feed",
      myPosts: "My Posts",
      noFollowingPosts: "No posts in your following feed yet.",
      noFollowingPostsSub: "Follow travelers to see their latest adventures, maps, and photos here!",
      exploreTravelers: "Find Travelers to Follow",
      userNotFound: "User not found",
      backToMyProfile: "Back to my profile",
      viewProfile: "View profile",
      postsCount: "posts",
      placesCount: "places",
      followersCount: "followers",
      followingCount: "following",
      journeys2026: "journeys in 2026",
      addComment: "Leave a comment",
      commentPlaceholder: "Write a comment...",
      like: "Like",
      liked: "Liked",
      myDiary: "MY TRAVEL DIARY",
      userDiary: "TRAVEL DIARY",
      sharedPosts: "STORIES & POSTS",
      noPostsYet: "No published posts yet.",
      friendUpdates: "FRIENDS UPDATES",
      friendUpdatesSub: "Stories from travelers you follow around the world.",
    },
    home: {
      navHow: "How it works",
      navInspiration: "Inspiration",
      accountAction: "Log in / Sign up",
      eyebrow: "Your travel diary, beautifully yours",
      titleFirst: "Every journey",
      titleSecond: "leaves a mark.",
      description:
        "SkyRing is a personal space for the places you have been, the places you dream about, and the stories in between.",
      start: "Start your diary",
      discover: "Discover the idea",
      idea: "THE IDEA",
      introFirst: "Make a home for",
      introSecond: "your way of seeing",
      introLast: " the world.",
      introText:
        "Not another checklist. A living portrait of your travels. Keep track of the moments that made a place yours, and let your personal map grow with every adventure.",
      orbitFirst: "Made for curious",
      orbitSecond: "people everywhere.",
      journey: "YOUR JOURNEY, YOUR STORY",
      featureHeading: "Start with a single place.",
      features: [
        [
          "Mark where you have been",
          "Pin countries and cities, add dates, photos, and the small stories you want to keep.",
          "feature-coral",
        ],
        [
          "Plan what comes next",
          "Keep a list of future trips so ideas never get lost and your next route is always close.",
          "feature-sky",
        ],
        [
          "Share what you love",
          "Build your personal map of memories and show friends the places that stayed with you.",
          "feature-gold",
        ],
      ],
      closingEyebrow: "The first page is yours",
      closingFirst: "Where will your story",
      closingSecond: "take you next?",
      createSkyRing: "Create your SkyRing",
    },
  },
  ru: {
    common: {
      profile: "Мой профиль",
      map: "Карта путешествий",
      posts: "Посты",
      logout: "Выйти",
      languageLabel: "Выбор языка",
    },
    social: {
      friends: "Друзья и подписки",
      following: "Подписки",
      followers: "Подписчики",
      follow: "+ Подписаться",
      unfollow: "Отписаться",
      followingBtn: "✓ В подписках",
      mutual: "Взаимно",
      findFriends: "Поиск путешественников",
      searchTravelers: "Поиск по логину или городам...",
      searchPlaceholder: "например: sophie_nomad, marco, alex...",
      noUsersFound: "Путешественники не найдены.",
      suggestedTravelers: "Рекомендации путешественников",
      followingFeed: "Лента подписок",
      allPosts: "Все посты",
      myPosts: "Мои посты",
      noFollowingPosts: "В вашей ленте подписок пока нет публикаций.",
      noFollowingPostsSub: "Подпишитесь на других путешественников, чтобы видеть их новые истории и маршруты!",
      exploreTravelers: "Найти путешественников",
      userNotFound: "Пользователь не найден",
      backToMyProfile: "Вернуться в мой профиль",
      viewProfile: "Открыть профиль",
      postsCount: "постов",
      placesCount: "мест",
      followersCount: "подписчиков",
      followingCount: "подписок",
      journeys2026: "путешествий в 2026",
      addComment: "Оставить комментарий",
      commentPlaceholder: "Напишите комментарий...",
      like: "Нравится",
      liked: "Понравилось",
      myDiary: "МОЙ ДНЕВНИК",
      userDiary: "ДНЕВНИК ПУТЕШЕСТВИЙ",
      sharedPosts: "ПУБЛИКАЦИИ И ИСТОРИИ",
      noPostsYet: "Пока нет опубликованных постов.",
      friendUpdates: "ОБНОВЛЕНИЯ ДРУЗЕЙ",
      friendUpdatesSub: "Свежие истории и маршруты людей, на которых вы подписаны.",
    },
    home: {
      navHow: "Как это работает",
      navInspiration: "Вдохновение",
      accountAction: "Войти / Регистрация",
      eyebrow: "Ваш личный дневник путешествий",
      titleFirst: "Каждое путешествие",
      titleSecond: "оставляет след.",
      description:
        "SkyRing — личное пространство для мест, где вы побывали, куда мечтаете попасть, и историй между ними.",
      start: "Начать дневник",
      discover: "Узнать больше",
      idea: "ИДЕЯ",
      introFirst: "Создайте место для",
      introSecond: "своего взгляда",
      introLast: " на мир.",
      introText:
        "Не просто список стран. Живой портрет ваших путешествий. Сохраняйте моменты, которые сделали место особенным, и дополняйте свою карту с каждой поездкой.",
      orbitFirst: "Для любопытных",
      orbitSecond: "людей со всего мира.",
      journey: "ВАШ ПУТЬ, ВАША ИСТОРИЯ",
      featureHeading: "Начните с одного места.",
      features: [
        [
          "Отметьте, где вы были",
          "Добавляйте страны и города, даты, фотографии и небольшие истории, которые хочется сохранить.",
          "feature-coral",
        ],
        [
          "Планируйте следующий шаг",
          "Храните идеи будущих поездок, чтобы они не терялись, а новый маршрут всегда был под рукой.",
          "feature-sky",
        ],
        [
          "Покажите любимое",
          "Создайте свою карту воспоминаний и расскажите друзьям о местах, которые остались в сердце.",
          "feature-gold",
        ],
      ],
      closingEyebrow: "Первая страница за вами",
      closingFirst: "Куда приведёт вас",
      closingSecond: "следующая история?",
      createSkyRing: "Создать SkyRing",
    },
  },
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    window.localStorage.getItem("skyring-language") === "ru" ? "ru" : "en",
  );
  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("skyring-language", nextLanguage);
  };
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      common: translations[language].common,
      home: translations[language].home,
      social: translations[language].social,
    }),
    [language],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

