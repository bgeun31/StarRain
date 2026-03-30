import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { fetchUserProfile } from '../services/userService'
import type { UserProfile, UserRole } from '../types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  canEdit: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]             = useState<User | null>(null)
  const [profile, setProfile]       = useState<UserProfile | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const p = await fetchUserProfile(firebaseUser.uid)
        setProfile(p)
      } else {
        setProfile(null)
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
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const currentUser = auth.currentUser
    if (!currentUser || !currentUser.email) {
      throw new Error('로그인된 사용자 정보를 확인할 수 없습니다.')
    }

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
    await reauthenticateWithCredential(currentUser, credential)
    await updatePassword(currentUser, newPassword)
  }

  const role    = profile?.role ?? null
  const canEdit = role === 'editor' || role === 'admin'
  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, profile, role, loading,
      canEdit, isAdmin,
      signIn, signOut, changePassword,
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
