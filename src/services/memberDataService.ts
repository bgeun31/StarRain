import { collection, deleteField, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'

const COL = 'memberData'

function normalizeNobleCount(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n <= 0) return 0
  return Math.floor(n)
}

function normalizeBirthDate(value: unknown): string {
  const text = typeof value === 'string'
    ? value.trim()
    : (typeof value === 'number' && Number.isFinite(value) ? String(Math.floor(value)) : '')
  if (!text) return ''

  if (/^\d{4}$/.test(text)) return text
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.slice(0, 4)
  return ''
}

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

/** 여러 캐릭터의 노블 여부 일괄 저장 */
export async function setNobleBulk(characterNames: string[], noble: boolean): Promise<void> {
  const uniqueNames = Array.from(
    new Set(characterNames.map((name) => name.trim()).filter(Boolean)),
  )
  if (uniqueNames.length === 0) return

  const chunkSize = 450
  for (let i = 0; i < uniqueNames.length; i += chunkSize) {
    const batch = writeBatch(db)
    for (const name of uniqueNames.slice(i, i + chunkSize)) {
      batch.set(doc(db, COL, name), { noble }, { merge: true })
    }
    await batch.commit()
  }
}

/** 여러 캐릭터의 노블 누적 횟수 맵 반환 { characterName -> count } */
export async function getNobleCountMap(
  characterNames: string[],
): Promise<Map<string, number>> {
  const snap = await getDocs(collection(db, COL))
  const map = new Map<string, number>()
  for (const d of snap.docs) {
    if (characterNames.includes(d.id)) {
      map.set(d.id, normalizeNobleCount(d.data().nobleCount))
    }
  }
  return map
}

/** 노블 누적 횟수 저장 */
export async function setNobleCount(characterName: string, count: number): Promise<void> {
  await setDoc(doc(db, COL, characterName), { nobleCount: normalizeNobleCount(count) }, { merge: true })
}

/** 여러 캐릭터의 노블 누적 횟수 일괄 저장 */
export async function setNobleCountBulk(characterNames: string[], count: number): Promise<void> {
  const uniqueNames = Array.from(
    new Set(characterNames.map((name) => name.trim()).filter(Boolean)),
  )
  if (uniqueNames.length === 0) return

  const normalizedCount = normalizeNobleCount(count)
  const chunkSize = 450
  for (let i = 0; i < uniqueNames.length; i += chunkSize) {
    const batch = writeBatch(db)
    for (const name of uniqueNames.slice(i, i + chunkSize)) {
      batch.set(doc(db, COL, name), { nobleCount: normalizedCount }, { merge: true })
    }
    await batch.commit()
  }
}

/** 여러 캐릭터의 연생 맵 반환 { characterName -> YYYY } */
export async function getBirthDateMap(
  characterNames: string[],
): Promise<Map<string, string>> {
  const snap = await getDocs(collection(db, COL))
  const map = new Map<string, string>()
  for (const d of snap.docs) {
    if (characterNames.includes(d.id)) {
      map.set(d.id, normalizeBirthDate(d.data().birthDate))
    }
  }
  return map
}

/** 연생 저장 (빈 값이면 필드 삭제) */
export async function setBirthDate(characterName: string, birthDate: string): Promise<void> {
  const normalized = normalizeBirthDate(birthDate)
  if (!normalized) {
    await setDoc(doc(db, COL, characterName), { birthDate: deleteField() }, { merge: true })
    return
  }
  await setDoc(doc(db, COL, characterName), { birthDate: normalized }, { merge: true })
}

export interface BirthYearStat {
  year: string
  count: number
}

/** 연생(연도)별 인원 통계 */
export async function fetchBirthYearStats(): Promise<BirthYearStat[]> {
  const snap = await getDocs(collection(db, COL))
  const countMap = new Map<string, number>()

  for (const d of snap.docs) {
    const normalized = normalizeBirthDate(d.data().birthDate)
    if (!normalized) continue
    const year = normalized.slice(0, 4)
    countMap.set(year, (countMap.get(year) ?? 0) + 1)
  }

  return Array.from(countMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(a.year) - Number(b.year))
}
