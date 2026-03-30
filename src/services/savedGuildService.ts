import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { SavedGuild } from '../types'

const COL = 'savedGuilds'

export async function fetchSavedGuilds(): Promise<SavedGuild[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedGuild))
}

export async function saveGuild(guildName: string, worldName: string, icon?: string): Promise<string> {
  const normalizedIcon = (icon ?? '').trim()

  // 중복 저장 방지
  const dup = query(
    collection(db, COL),
    where('guildName', '==', guildName),
    where('worldName', '==', worldName),
  )
  const snap = await getDocs(dup)
  if (!snap.empty) {
    const existing = snap.docs[0]
    const existingIcon = ((existing.data().icon as string | undefined) ?? '').trim()
    if (normalizedIcon !== existingIcon) {
      await updateDoc(existing.ref, { icon: normalizedIcon })
    }
    return existing.id
  }

  const ref = await addDoc(collection(db, COL), {
    guildName,
    worldName,
    icon: normalizedIcon,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function removeSavedGuild(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
