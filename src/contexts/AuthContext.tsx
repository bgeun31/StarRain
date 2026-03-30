import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { fetchUserProfile } from '../services/userService'
import type { UserProfile, UserRole } from '../types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  bootstrapping: boolean   // 로그인됐지만 Firestore 프로필이 없는 상태
  canEdit: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setupAdmin: () => Promise<void>  // 부트스트랩: 본인을 관리자로 설정
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]             = useState<User | null>(null)
  const [profile, setProfile]       = useState<UserProfile | null>(null)
  const [loading, setLoading]       = useState(true)
  const [bootstrapping, setBootstrapping] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const p = await fetchUserProfile(firebaseUser.uid)
        if (p) {
          setProfile(p)
          setBootstrapping(false)
        } else {
          // 프로필 없음 → 부트스트랩 대기
          setProfile(null)
          setBootstrapping(true)
        }
      } else {
        setProfile(null)
        setBootstrapping(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
    // 이후 onAuthStateChanged가 profile 로드 처리
  }

  async function signOut() {
    await firebaseSignOut(auth)
    setProfile(null)
    setBootstrapping(false)
  }

  /** 현재 로그인된 사용자를 관리자로 초기 설정 */
  async function setupAdmin() {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email ?? '',
      displayName: user.displayName ?? user.email?.split('@')[0] ?? '관리자',
      role: 'admin',
      createdAt: serverTimestamp(),
    })
    const p = await fetchUserProfile(user.uid)
    setProfile(p)
    setBootstrapping(false)
  }

  const role    = profile?.role ?? null
  const canEdit = role === 'editor' || role === 'admin'
  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, profile, role, loading, bootstrapping,
      canEdit, isAdmin,
      signIn, signOut, setupAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
