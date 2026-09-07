import { useState, type FormEvent } from 'react'
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import type { AuthMode } from './types'
import { auth, db } from './firebase'

type AuthModalProps = { mode: AuthMode; onClose: () => void; onSwitch: () => void }

export default function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  const [username, setUsername] = useState('')
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'register') {
        const normalizedUsername = username.trim().toLowerCase()
        if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) throw new Error('username-format')
        const credential = await createUserWithEmailAndPassword(auth, emailOrUsername, password)
        try {
          await runTransaction(db, async (transaction) => {
            const usernameRef = doc(db, 'usernames', normalizedUsername)
            if ((await transaction.get(usernameRef)).exists()) throw new Error('username-taken')
            transaction.set(usernameRef, { uid: credential.user.uid, email: credential.user.email, username: normalizedUsername, createdAt: serverTimestamp() })
            transaction.set(doc(db, 'users', credential.user.uid), { uid: credential.user.uid, email: credential.user.email, username: normalizedUsername, createdAt: serverTimestamp(), visitedCountries: [] })
          })
        } catch (transactionError) {
          await deleteUser(credential.user)
          throw transactionError
        }
      } else {
        let email = emailOrUsername.trim()
        if (!email.includes('@')) {
          const usernameSnapshot = await getDoc(doc(db, 'usernames', email.toLowerCase()))
          if (!usernameSnapshot.exists()) throw new Error('username-not-found')
          email = usernameSnapshot.data().email as string
        }
        await signInWithEmailAndPassword(auth, email, password)
      }
      onClose()
    } catch (caught) {
      const code = (caught as { code?: string }).code
      const message = caught instanceof Error ? caught.message : ''
      setError(message === 'username-format' ? 'Username: 3-20 letters, numbers, or underscores.' : message === 'username-taken' ? 'This username is already taken.' : message === 'username-not-found' ? 'This username does not exist.' : code === 'auth/invalid-credential' ? 'Email/username or password is incorrect.' : code === 'auth/email-already-in-use' ? 'This email is already registered.' : code === 'auth/weak-password' ? 'Password must be at least 6 characters.' : code === 'permission-denied' ? 'Firestore rules need to be published.' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="auth-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="auth-modal" onSubmit={submit}><button className="auth-close nav-button" onClick={onClose} type="button" aria-label="Close">×</button><p className="eyebrow"><span /> SkyRing account</p><h2>{mode === 'login' ? 'Welcome back.' : 'Start your diary.'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Log in to continue your journey.' : 'Create a personal space for every place you love.'}</p>{mode === 'register' && <><label htmlFor="username">Username</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} pattern="[A-Za-z0-9_]{3,20}" placeholder="your_name" required /></>}<label htmlFor="email">{mode === 'login' ? 'Email or username' : 'Email'}</label><input id="email" type={mode === 'login' ? 'text' : 'email'} value={emailOrUsername} onChange={(event) => setEmailOrUsername(event.target.value)} required /><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-coral auth-submit" disabled={loading} type="submit">{loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'} <span aria-hidden="true">↗</span></button><button className="auth-switch nav-button" onClick={onSwitch} type="button">{mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Log in'}</button></form></div>
}
