import type { User } from 'firebase/auth'

export type AuthMode = 'login' | 'register'
export type Page = 'home' | 'profile'
export type AuthUser = User | null
