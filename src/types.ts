import type { User } from 'firebase/auth'

export type AuthMode = 'login' | 'register'
export type Page = 'home' | 'profile' | 'map' | 'posts' | 'chat'
export type AuthUser = User | null

export type VisitedPlace = {
  id: string
  latitude: number
  longitude: number
  label: string
  kind?: 'country' | 'city'
  country?: string
  city?: string
}

export type PostComment = {
  id: string
  authorId?: string
  authorUsername: string
  authorAvatar?: string
  text: string
  createdAt: string
}

export type Post = {
  id: string
  authorId?: string
  authorUsername?: string
  authorAvatar?: string
  image?: string
  title: string
  description: string
  location: string
  date: string
  comments: (string | PostComment)[]
  likes?: string[]
  createdAt?: string
  isArchived?: boolean
  allowComments?: boolean
}

export type TravelPreferences = {
  country?: string
  city?: string
  age?: number | string
  travelStyle?: string
  travelFormat?: string
  interests?: string[]
}

export type UserProfile = {
  uid: string
  username: string
  email?: string
  bio?: string
  avatar?: string
  location?: string
  country?: string
  city?: string
  age?: number | string
  travelStyle?: string
  travelFormat?: string
  interests?: string[]
  onboardingCompleted?: boolean
  allowComments?: boolean
  privateMap?: boolean
  showAgeAndLocation?: boolean
  emailNotifications?: boolean
  following?: string[]
  followers?: string[]
  visitedCountries?: VisitedPlace[]
  posts?: Post[]
  stories?: StoryItem[]
  createdAt?: string | any
}

export type UserSummary = {
  uid: string
  username: string
  bio?: string
  avatar?: string
  location?: string
  postsCount: number
  placesCount: number
  followersCount: number
  followingCount: number
  isFollowing?: boolean
  isFollower?: boolean
  isMutual?: boolean
}

export type StoryItem = {
  id: string
  authorId?: string
  authorUsername?: string
  authorAvatar?: string
  mediaUrl: string
  caption?: string
  location?: string
  createdAt: string
  duration?: number
  likes?: string[]
}

export type UserStoryGroup = {
  userId: string
  username: string
  userAvatar?: string
  stories: StoryItem[]
  hasUnseen?: boolean
  lastUpdated?: string
}

export type ChatMessage = {
  id: string
  chatId: string
  senderId: string
  senderUsername: string
  senderAvatar?: string
  text: string
  createdAt: string
  replyToStory?: {
    storyId: string
    mediaUrl: string
    caption?: string
  }
  isRead?: boolean
}

export type ChatConversation = {
  id: string
  participantIds: string[]
  participantUsernames: string[]
  otherUser: {
    uid: string
    username: string
    avatar?: string
    location?: string
    isOnline?: boolean
  }
  lastMessage?: {
    text: string
    senderUsername: string
    createdAt: string
  }
  unreadCount: number
  updatedAt: string
}
