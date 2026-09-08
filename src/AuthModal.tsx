import { useState, type FormEvent } from 'react'
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import type { AuthMode } from './types'
import { auth, db } from './firebase'

type AuthModalProps = { mode: AuthMode; language?: 'en' | 'ru'; onClose: () => void; onSwitch: () => void }

export default function AuthModal({ mode, language = 'en', onClose, onSwitch }: AuthModalProps) {
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
      setError(language === 'ru' ? message === 'username-format' ? 'Имя пользователя: 3–20 букв, цифр или подчёркиваний.' : message === 'username-taken' ? 'Это имя пользователя уже занято.' : message === 'username-not-found' ? 'Такого имени пользователя не существует.' : code === 'auth/invalid-credential' ? 'Неверный email, логин или пароль.' : code === 'auth/email-already-in-use' ? 'Этот email уже зарегистрирован.' : code === 'auth/weak-password' ? 'Пароль должен содержать минимум 6 символов.' : code === 'permission-denied' ? 'Необходимо опубликовать правила Firestore.' : 'Что-то пошло не так. Попробуйте ещё раз.' : message === 'username-format' ? 'Username: 3-20 letters, numbers, or underscores.' : message === 'username-taken' ? 'This username is already taken.' : message === 'username-not-found' ? 'This username does not exist.' : code === 'auth/invalid-credential' ? 'Email/username or password is incorrect.' : code === 'auth/email-already-in-use' ? 'This email is already registered.' : code === 'auth/weak-password' ? 'Password must be at least 6 characters.' : code === 'permission-denied' ? 'Firestore rules need to be published.' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = language === 'ru' ? { account: 'Аккаунт SkyRing', loginTitle: 'С возвращением.', registerTitle: 'Начните дневник.', loginSubtitle: 'Войдите, чтобы продолжить путешествие.', registerSubtitle: 'Создайте личное пространство для любимых мест.', username: 'Имя пользователя', emailOrUsername: 'Email или имя пользователя', email: 'Email', password: 'Пароль', wait: 'Подождите...', login: 'Войти', register: 'Создать аккаунт', needAccount: 'Нет аккаунта? Создать', haveAccount: 'Уже есть аккаунт? Войти', usernamePlaceholder: 'ваше_имя', close: 'Закрыть' } : { account: 'SkyRing account', loginTitle: 'Welcome back.', registerTitle: 'Start your diary.', loginSubtitle: 'Log in to continue your journey.', registerSubtitle: 'Create a personal space for every place you love.', username: 'Username', emailOrUsername: 'Email or username', email: 'Email', password: 'Password', wait: 'Please wait...', login: 'Log in', register: 'Create account', needAccount: 'Need an account? Create one', haveAccount: 'Already have an account? Log in', usernamePlaceholder: 'your_name', close: 'Close' }
  return <div className="auth-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="auth-modal" onSubmit={submit}><button className="auth-close nav-button" onClick={onClose} type="button" aria-label={copy.close}>×</button><p className="eyebrow"><span /> {copy.account}</p><h2>{mode === 'login' ? copy.loginTitle : copy.registerTitle}</h2><p className="auth-subtitle">{mode === 'login' ? copy.loginSubtitle : copy.registerSubtitle}</p>{mode === 'register' && <><label htmlFor="username">{copy.username}</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} pattern="[A-Za-z0-9_]{3,20}" placeholder={copy.usernamePlaceholder} required /></>}<label htmlFor="email">{mode === 'login' ? copy.emailOrUsername : copy.email}</label><input id="email" type={mode === 'login' ? 'text' : 'email'} value={emailOrUsername} onChange={(event) => setEmailOrUsername(event.target.value)} required /><label htmlFor="password">{copy.password}</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />{error && <p className="auth-error" role="alert">{error}</p>}<button className="button button-coral auth-submit" disabled={loading} type="submit">{loading ? copy.wait : mode === 'login' ? copy.login : copy.register} <span aria-hidden="true">↗</span></button><button className="auth-switch nav-button" onClick={onSwitch} type="button">{mode === 'login' ? copy.needAccount : copy.haveAccount}</button></form></div>
}
