import type { User } from 'firebase/auth'

export type AuthMode = 'login' | 'register'
export type Page = 'home' | 'profile' | 'map' | 'posts'
export type AuthUser = User | null
