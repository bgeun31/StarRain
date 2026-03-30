import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { PlayerGroup } from '../types'

const COL = 'playerGroups'

export async function fetchAllPlayerGroups(): Promise<PlayerGroup[]> {
  const snap = await getDocs(collection(db, COL))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlayerGroup))
}

/** 특정 캐릭터명이 속한 플레이어 그룹 찾기 */
export async function findGroupByCharacterName(characterName: string): Promise<PlayerGroup | null> {
  const q = query(
    collection(db, COL),
    where('characterNames', 'array-contains', characterName),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as PlayerGroup
}

/** 여러 캐릭터명에 대한 그룹 맵 반환 { characterName -> PlayerGroup } */
export async function buildGroupMap(
  characterNames: string[],
): Promise<Map<string, PlayerGroup>> {
  const all = await fetchAllPlayerGroups()
  const map = new Map<string, PlayerGroup>()
  for (const group of all) {
    for (const name of group.characterNames) {
      if (characterNames.includes(name)) {
        map.set(name, group)
      }
    }
  }
  return map
}

export async function createPlayerGroup(characterNames: string[], memo?: string): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    characterNames,
    memo: memo ?? '',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePlayerGroup(
  id: string,
  characterNames: string[],
  memo?: string,
): Promise<void> {
  await updateDoc(doc(db, COL, id), { characterNames, memo: memo ?? '' })
}

export async function deletePlayerGroup(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
