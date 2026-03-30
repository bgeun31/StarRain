import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const COL = 'memberData'

/** 여러 캐릭터의 노블 여부 맵 반환 { characterName -> noble } */
export async function getNobleMap(
  characterNames: string[],
): Promise<Map<string, boolean>> {
  const snap = await getDocs(collection(db, COL))
  const map = new Map<string, boolean>()
  for (const d of snap.docs) {
    if (characterNames.includes(d.id)) {
      map.set(d.id, (d.data().noble as boolean) ?? false)
    }
  }
  return map
}

/** 노블 여부 저장 */
export async function setNoble(characterName: string, noble: boolean): Promise<void> {
  await setDoc(doc(db, COL, characterName), { noble }, { merge: true })
}
