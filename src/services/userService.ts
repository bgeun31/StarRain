import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  initializeApp,
  deleteApp,
} from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { db, firebaseConfig } from '../lib/firebase'
import type { UserProfile, UserRole } from '../types'

const COL = 'users'

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, COL))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COL, uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() } as UserProfile
}

/**
 * 새 사용자 생성.
 * 관리자 세션을 유지하기 위해 보조 Firebase 앱 인스턴스로 계정을 생성한다.
 */
export async function createUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
): Promise<void> {
  const appName = `secondary-${Date.now()}`
  const secondaryApp = initializeApp(firebaseConfig, appName)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await setDoc(doc(db, COL, cred.user.uid), {
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
    })
  } finally {
    await deleteApp(secondaryApp)
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, COL, uid), { role })
}

/** Firestore 프로필만 삭제 (Firebase Auth 계정은 유지되나 로그인 시 권한 없음 처리됨) */
export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, COL, uid))
}
