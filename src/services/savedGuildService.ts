import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { SavedGuild } from '../types'

const COL = 'savedGuilds'

export async function fetchSavedGuilds(): Promise<SavedGuild[]> {
  const snap = await getDocs(collection(db, COL))
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedGuild))

  return list.sort((a, b) => {
    const orderA = Number.isFinite(a.order) ? (a.order as number) : Number.MAX_SAFE_INTEGER
    const orderB = Number.isFinite(b.order) ? (b.order as number) : Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB
    const createdA = a.createdAt?.toMillis?.() ?? 0
    const createdB = b.createdAt?.toMillis?.() ?? 0
    return createdB - createdA
  })
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

  const allSnap = await getDocs(collection(db, COL))
  const maxOrder = allSnap.docs.reduce((max, d) => {
    const order = d.data().order as number | undefined
    return typeof order === 'number' && Number.isFinite(order) ? Math.max(max, order) : max
  }, -1)

  const ref = await addDoc(collection(db, COL), {
    guildName,
    worldName,
    icon: normalizedIcon,
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function removeSavedGuild(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

export async function updateSavedGuildOrder(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return
  const batch = writeBatch(db)
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, COL, id), { order: idx })
  })
  await batch.commit()
}

export async function updateSavedGuildIcon(id: string, icon: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { icon: icon.trim() })
}
