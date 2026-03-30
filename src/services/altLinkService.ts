import {
  doc,
  getDocs,
  collection,
  writeBatch,
  deleteField,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const COL = 'altLinks'

interface AltLinkDoc {
  alts?: string[]
  mainCharacter?: string
}

function normalizeNames(names: string[], selfName?: string): string[] {
  const self = (selfName ?? '').trim()
  return Array.from(
    new Set(
      names
        .map((name) => name.trim())
        .filter((name) => Boolean(name) && name !== self),
    ),
  )
}

function readDocAlts(docId: string, data?: AltLinkDoc): string[] {
  return normalizeNames((data?.alts as string[] | undefined) ?? [], docId)
}

/** 여러 캐릭터에 대한 부캐/본캐 링크 맵 반환 */
export async function getAltLinkMaps(
  characterNames: string[],
): Promise<{
  altMap: Map<string, string[]>
  mainMap: Map<string, string>
}> {
  const snap = await getDocs(collection(db, COL))
  const altMap = new Map<string, string[]>()
  const mainMap = new Map<string, string>()

  for (const d of snap.docs) {
    if (!characterNames.includes(d.id)) continue
    const data = d.data() as AltLinkDoc
    altMap.set(d.id, readDocAlts(d.id, data))

    const main = (data.mainCharacter ?? '').trim()
    if (main) {
      mainMap.set(d.id, main)
    }
  }

  return { altMap, mainMap }
}

/** 여러 캐릭터에 대한 부캐 이름 맵 반환 { characterName -> string[] } */
export async function getAltNamesMap(
  characterNames: string[],
): Promise<Map<string, string[]>> {
  const { altMap } = await getAltLinkMaps(characterNames)
  return altMap
}

/** 여러 캐릭터에 대한 본캐 맵 반환 { characterName -> mainCharacter } */
export async function getMainCharacterMap(
  characterNames: string[],
): Promise<Map<string, string>> {
  const { mainMap } = await getAltLinkMaps(characterNames)
  return mainMap
}

/**
 * 부캐 목록 저장 + 부캐 문서에 본캐 연결 자동 반영.
 * - mainCharacter의 alts를 갱신
 * - 각 alt 문서의 mainCharacter를 mainCharacter로 설정
 * - 기존 연결에서 빠진 alt는 mainCharacter 해제
 * - 다른 본캐에 연결되어 있던 alt는 이전 본캐 목록에서 제거
 */
export async function syncAltNames(mainCharacter: string, alts: string[]): Promise<void> {
  const main = mainCharacter.trim()
  if (!main) return

  const nextAlts = normalizeNames(alts, main)
  const snap = await getDocs(collection(db, COL))
  const docs = new Map<string, AltLinkDoc>()
  for (const d of snap.docs) {
    docs.set(d.id, d.data() as AltLinkDoc)
  }

  const prevAlts = readDocAlts(main, docs.get(main))
  const removedAlts = prevAlts.filter((name) => !nextAlts.includes(name))
  const batch = writeBatch(db)

  // 본캐의 부캐 목록 갱신
  batch.set(doc(db, COL, main), { alts: nextAlts }, { merge: true })

  // 빠진 부캐는 본캐 연결 해제
  for (const alt of removedAlts) {
    const altDoc = docs.get(alt)
    if ((altDoc?.mainCharacter ?? '').trim() === main) {
      batch.set(doc(db, COL, alt), { mainCharacter: deleteField() }, { merge: true })
    }
  }

  // 새/유지 부캐 연결 반영 + 이전 본캐 목록 정리
  for (const alt of nextAlts) {
    const altDoc = docs.get(alt)
    const prevMain = (altDoc?.mainCharacter ?? '').trim()

    if (prevMain && prevMain !== main) {
      const prevMainDoc = docs.get(prevMain)
      const prevMainAlts = readDocAlts(prevMain, prevMainDoc).filter((name) => name !== alt)
      batch.set(doc(db, COL, prevMain), { alts: prevMainAlts }, { merge: true })
      docs.set(prevMain, { ...(prevMainDoc ?? {}), alts: prevMainAlts })
    }

    batch.set(doc(db, COL, alt), { mainCharacter: main }, { merge: true })
  }

  await batch.commit()
}

/** 하위 호환: 기존 API 호출은 자동 연동 로직으로 처리 */
export async function setAltNames(characterName: string, alts: string[]): Promise<void> {
  await syncAltNames(characterName, alts)
}

/** 하위 호환: 부캐 연결 삭제는 빈 목록 저장으로 처리 */
export async function deleteAltLink(characterName: string): Promise<void> {
  await syncAltNames(characterName, [])
}
