import { Timestamp } from 'firebase/firestore'

// ─── Firebase 저장 타입 ────────────────────────────────────────────────────────

/** 즐겨찾기 길드 (Firebase 저장) */
export interface SavedGuild {
  id: string
  guildName: string
  worldName: string
  createdAt: Timestamp
}

/**
 * 플레이어 그룹 (Firebase 저장)
 * 같은 유저의 캐릭터명들을 묶어두는 용도
 */
export interface PlayerGroup {
  id: string
  characterNames: string[]  // 본캐 + 부캐 모두 포함
  memo?: string             // 관리자 메모 (선택)
  createdAt: Timestamp
}

// ─── 넥슨 Open API 응답 타입 ──────────────────────────────────────────────────

export interface NexonGuildBasic {
  date: string
  world_name: string
  guild_name: string
  guild_level: number
  guild_fame: number
  guild_point: number
  guild_master_name: string
  guild_member_count: number
  guild_member: string[]
}

export interface NexonCharacterBasic {
  date: string
  character_name: string
  world_name: string
  character_gender: string
  character_class: string
  character_class_level: string
  character_level: number
  character_exp: number
  character_exp_rate: string
  character_guild_name: string | null
  character_image: string
}

// ─── 뷰 전용 타입 ─────────────────────────────────────────────────────────────

/** 길드원 카드에 표시할 합성 데이터 */
export interface MemberView {
  characterName: string
  characterClass: string
  characterLevel: number
  guildName: string
  playerGroupId: string | null  // Firebase playerGroup 연결 여부
  isNew: boolean                // 이번 로드에서 새로 감지된 신규 가입자
  alts: AltView[]
}

export interface AltView {
  characterName: string
  characterClass: string
  characterLevel: number
  guildName: string  // 현재 소속 길드 (넥슨 API 조회)
}

export const MAPLE_WORLDS = [
  '스카니아', '베라', '루나', '제니스', '크로아', '유니온',
  '엘리시움', '이노시스', '레드', '오로라', '아케인', '노바',
  '리부트', '리부트2',
] as const

export type MapleWorld = (typeof MAPLE_WORLDS)[number]
