import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { fetchCharacterOcid, fetchCharacterBasic } from './mapleApiService'
import type { NexonCharacterBasic } from '../types'

const COL = 'characterCache'
const TTL_MS = 24 * 60 * 60 * 1000

interface CacheEntry {
  ocid: string
  characterClass: string
  characterLevel: number
  guildName: string | null
  characterImage: string
  cachedAt: Timestamp
}

async function getCache(characterName: string): Promise<NexonCharacterBasic | null> {
  try {
    const snap = await getDoc(doc(db, COL, characterName))
    if (!snap.exists()) return null

    const data = snap.data() as CacheEntry
    if (Date.now() - data.cachedAt.toMillis() > TTL_MS) return null

    return {
      date: '',
      character_name: characterName,
      world_name: '',
      character_gender: '',
      character_class: data.characterClass,
      character_class_level: '',
      character_level: data.characterLevel,
      character_exp: 0,
      character_exp_rate: '',
      character_guild_name: data.guildName,
      character_image: data.characterImage,
    }
  } catch {
    return null
  }
}

async function setCache(
  characterName: string,
  ocid: string,
  info: NexonCharacterBasic,
): Promise<void> {
  try {
    await setDoc(doc(db, COL, characterName), {
      ocid,
      characterClass: info.character_class,
      characterLevel: info.character_level,
      guildName: info.character_guild_name,
      characterImage: info.character_image,
      cachedAt: serverTimestamp(),
    })
  } catch {
    // 캐시 저장 실패는 무시
  }
}

/**
 * 캐릭터 정보를 캐시 우선으로 조회.
 * signal이 abort되면 API 호출을 즉시 중단.
 */
export async function getOrFetchCharacter(
  characterName: string,
  signal?: AbortSignal,
  forceRefresh = false,
): Promise<NexonCharacterBasic | null> {
  if (signal?.aborted) return null

  if (!forceRefresh) {
    const cached = await getCache(characterName)
    if (cached) return cached
  }

  if (signal?.aborted) return null

  try {
    const ocid = await fetchCharacterOcid(characterName, signal)
    const info = await fetchCharacterBasic(ocid, signal)
    setCache(characterName, ocid, info).catch(() => {})
    return info
  } catch (err) {
    // AbortError는 조용히 null 반환
    if (err instanceof DOMException && err.name === 'AbortError') return null
    return null
  }
}
