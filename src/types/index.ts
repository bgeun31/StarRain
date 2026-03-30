import { Timestamp } from 'firebase/firestore'

// ─── 사용자 / 권한 타입 ───────────────────────────────────────────────────────

export type UserRole = 'viewer' | 'editor' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Timestamp
}

// ─── Firebase 저장 타입 ────────────────────────────────────────────────────────

/** 즐겨찾기 길드 (Firebase 저장) */
export interface SavedGuild {
  id: string
  guildName: string
  worldName: string
  createdAt: Timestamp
}

export interface AuditLogEntry {
  id: string
  actorUid: string
  actorEmail: string
  actorName: string
  action: string
  message: string
  targetType?: string
  targetId?: string
  meta?: Record<string, unknown>
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
  linkedAltNames: string[]  // DB에 저장된 부캐 이름 목록 (비어있으면 미연결)
  noble: boolean            // 노블레스 여부 (memberData 컬렉션에 저장)
  isNew: boolean            // 이번 로드에서 새로 감지된 신규 가입자
  alts: AltView[]           // Nexon API 조회된 부캐 상세 정보
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
