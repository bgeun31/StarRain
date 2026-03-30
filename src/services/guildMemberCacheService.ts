import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

const COL = 'guildMemberCache'

export interface StoredMember {
  characterName: string
  characterClass: string
  characterLevel: number
  guildName: string | null
}

export interface MemberListCache {
  oguildId: string
  memberNames: string[]      // 순서 보존 (diff 용)
  members: StoredMember[]    // 캐릭터 기본 정보 일괄 저장
  cachedAt: Timestamp
}

export interface MemberDiff {
  existing: string[]
  added: string[]
  removed: string[]
  isFirstLoad: boolean
}

function cacheKey(worldName: string, guildName: string) {
  return `${worldName}_${guildName}`
}

export async function getCachedMemberList(
  worldName: string,
  guildName: string,
): Promise<MemberListCache | null> {
  try {
    const snap = await getDoc(doc(db, COL, cacheKey(worldName, guildName)))
    if (!snap.exists()) return null
    const data = snap.data() as MemberListCache
    // members 필드가 없는 구형 캐시는 무시 (재조회)
    if (!data.members?.length) return null
    return data
  } catch {
    return null
  }
}

export async function setCachedMemberList(
  worldName: string,
  guildName: string,
  oguildId: string,
  members: StoredMember[],
): Promise<void> {
  try {
    await setDoc(doc(db, COL, cacheKey(worldName, guildName)), {
      oguildId,
      memberNames: members.map((m) => m.characterName),
      members,
      cachedAt: serverTimestamp(),
    })
  } catch {}
}

export function diffMemberList(
  currentNames: string[],
  cached: MemberListCache | null,
): MemberDiff {
  if (!cached) {
    return { existing: [], added: currentNames, removed: [], isFirstLoad: true }
  }
  const cachedSet  = new Set(cached.memberNames)
  const currentSet = new Set(currentNames)
  return {
    existing: currentNames.filter((n) =>  cachedSet.has(n)),
    added:    currentNames.filter((n) => !cachedSet.has(n)),
    removed:  cached.memberNames.filter((n) => !currentSet.has(n)),
    isFirstLoad: false,
  }
}
