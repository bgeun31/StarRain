import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const COL = 'altLinks'

/** 여러 캐릭터에 대한 부캐 이름 맵 반환 { characterName -> string[] } */
export async function getAltNamesMap(
  characterNames: string[],
): Promise<Map<string, string[]>> {
  const snap = await getDocs(collection(db, COL))
  const map = new Map<string, string[]>()
  for (const d of snap.docs) {
    if (characterNames.includes(d.id)) {
      map.set(d.id, (d.data().alts as string[]) ?? [])
    }
  }
  return map
}

/** 부캐 목록 저장 (없으면 생성, 있으면 덮어쓰기) */
export async function setAltNames(characterName: string, alts: string[]): Promise<void> {
  await setDoc(doc(db, COL, characterName), { alts })
}

/** 부캐 연결 삭제 */
export async function deleteAltLink(characterName: string): Promise<void> {
  await deleteDoc(doc(db, COL, characterName))
}
