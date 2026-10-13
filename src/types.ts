import type { User } from 'firebase/auth'

export type AuthMode = 'login' | 'register'
export type Page = 'home' | 'profile' | 'map' | 'posts'
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
