import { useEffect, useState, useCallback, useRef } from 'react'
import { RefreshCw, AlertCircle, UserPlus, UserMinus, Clock } from 'lucide-react'
import MemberCard from './MemberCard'
import ManagePlayerGroupModal from './ManagePlayerGroupModal'
import Button from './ui/Button'
import { fetchGuildId, fetchGuildBasic } from '../services/mapleApiService'
import { getOrFetchCharacter } from '../services/characterCacheService'
import { buildGroupMap } from '../services/playerGroupService'
import {
  getCachedMemberList,
  setCachedMemberList,
  diffMemberList,
  type MemberDiff,
  type StoredMember,
} from '../services/guildMemberCacheService'
import type { MemberView, NexonGuildBasic, PlayerGroup } from '../types'

interface Props {
  guildName: string
  worldName: string
}

function formatAge(ms: number): string {
  const min = Math.floor(ms / 60000)
  if (min < 1)  return '방금 전'
  if (min < 60) return `${min}분 전`
  return `${Math.floor(min / 60)}시간 전`
}

export default function MemberList({ guildName, worldName }: Props) {
  const [guildInfo, setGuildInfo]   = useState<NexonGuildBasic | null>(null)
  const [members, setMembers]       = useState<MemberView[]>([])
  const [syncing, setSyncing]       = useState(false)   // 새로고침 중
  const [syncProgress, setSyncProgress] = useState({ loaded: 0, total: 0 })
  const [diff, setDiff]             = useState<MemberDiff | null>(null)
  const [syncedAt, setSyncedAt]     = useState<number | null>(null)
  const [fromCache, setFromCache]   = useState(false)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [groupModal, setGroupModal] = useState<{ characterName: string; existingGroup?: PlayerGroup } | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  /** 캐시 → 즉시 표시 후, 부캐 정보만 백그라운드 로드 */
  async function loadFromCache(signal: AbortSignal) {
    const cache = await getCachedMemberList(worldName, guildName)
    if (!cache || signal.aborted) return false

    setSyncedAt(cache.cachedAt.toMillis())
    setFromCache(true)

    // ── 캐시 데이터로 즉시 렌더링 (API 0회, Firestore 1회) ──────────────
    const groupMap = await buildGroupMap(cache.memberNames)
    if (signal.aborted) return true

    const views: MemberView[] = cache.members.map((m) => ({
      characterName: m.characterName,
      characterClass: m.characterClass,
      characterLevel: m.characterLevel,
      guildName: m.guildName ?? guildName,
      playerGroupId: groupMap.get(m.characterName)?.id ?? null,
      isNew: false,
      alts: [],  // 부캐는 아래에서 비동기 로드
    }))
    setMembers(views.sort((a, b) => b.characterLevel - a.characterLevel))

    // ── 부캐 정보 백그라운드 로드 ────────────────────────────────────────
    for (const view of views) {
      if (signal.aborted) return true
      const group = groupMap.get(view.characterName)
      if (!group) continue

      const alts: MemberView['alts'] = []
      for (const altName of group.characterNames.filter((n) => n !== view.characterName)) {
        if (signal.aborted) return true
        const ai = await getOrFetchCharacter(altName, signal)
        if (ai && ai.character_level > 0) {
          alts.push({ characterName: altName, characterClass: ai.character_class, characterLevel: ai.character_level, guildName: ai.character_guild_name ?? '' })
        }
      }

      if (alts.length > 0) {
        setMembers((prev) =>
          prev.map((m) => m.characterName === view.characterName ? { ...m, alts } : m),
        )
      }
    }

    return true
  }

  /** Nexon API 동기화 (새로고침) */
  async function syncFromApi(signal: AbortSignal) {
    setSyncing(true)
    setSyncProgress({ loaded: 0, total: 0 })

    const oguildId = await fetchGuildId(guildName, worldName, signal)
    const basic    = await fetchGuildBasic(oguildId, signal)
    if (signal.aborted) return

    setGuildInfo(basic)
    const currentNames = basic.guild_member

    const prevCache  = await getCachedMemberList(worldName, guildName)
    const memberDiff = diffMemberList(currentNames, prevCache)
    setDiff(memberDiff)
    setFromCache(false)

    const addedSet = new Set(memberDiff.added)
    const total    = currentNames.length
    const groupMap = await buildGroupMap(currentNames)
    if (signal.aborted) return

    setSyncProgress({ loaded: 0, total })

    const storedMembers: StoredMember[] = []
    const collected: MemberView[] = []

    for (let i = 0; i < currentNames.length; i++) {
      if (signal.aborted) return
      const name  = currentNames[i]
      const isNew = addedSet.has(name)
      const info  = await getOrFetchCharacter(name, signal, isNew)
      const group = groupMap.get(name)

      storedMembers.push({
        characterName: name,
        characterClass: info?.character_class ?? '알 수 없음',
        characterLevel: info?.character_level ?? 0,
        guildName: info?.character_guild_name ?? null,
      })

      const alts: MemberView['alts'] = []
      if (group) {
        for (const altName of group.characterNames.filter((n) => n !== name)) {
          if (signal.aborted) return
          const ai = await getOrFetchCharacter(altName, signal)
          if (ai && ai.character_level > 0) {
            alts.push({ characterName: altName, characterClass: ai.character_class, characterLevel: ai.character_level, guildName: ai.character_guild_name ?? '' })
          }
        }
      }

      collected.push({
        characterName: name,
        characterClass: info?.character_class ?? '알 수 없음',
        characterLevel: info?.character_level ?? 0,
        guildName: info?.character_guild_name ?? guildName,
        playerGroupId: group?.id ?? null,
        isNew,
        alts,
      })

      if (collected.length % 5 === 0 || i === total - 1) {
        setMembers([...collected].sort((a, b) => b.characterLevel - a.characterLevel))
      }
      setSyncProgress({ loaded: i + 1, total })
    }

    const now = Date.now()
    setSyncedAt(now)
    setCachedMemberList(worldName, guildName, oguildId, storedMembers).catch(() => {})
    setSyncing(false)
  }

  const load = useCallback(async (forceSync = false) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    setMembers([])
    setGuildInfo(null)
    setError('')
    setDiff(null)
    setSyncing(false)

    try {
      if (!forceSync) {
        const hit = await loadFromCache(signal)
        if (hit || signal.aborted) return
      }
      // 캐시 없음 or 강제 새로고침
      await syncFromApi(signal)
    } catch (err) {
      if (signal.aborted) return
      setSyncing(false)
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setError(msg)
    }
  }, [guildName, worldName])

  useEffect(() => {
    load()
    return () => { abortRef.current?.abort() }
  }, [load])

  const progress = syncProgress.total > 0
    ? Math.round((syncProgress.loaded / syncProgress.total) * 100)
    : 0

  const filtered = members.filter(
    (m) =>
      m.characterName.toLowerCase().includes(search.toLowerCase()) ||
      m.characterClass.toLowerCase().includes(search.toLowerCase()),
  )

  function openGroupModal(characterName: string) {
    const member = members.find((m) => m.characterName === characterName)
    const existingGroup = member?.playerGroupId
      ? ({ id: member.playerGroupId, characterNames: [characterName, ...member.alts.map((a) => a.characterName)] } as PlayerGroup)
      : undefined
    setGroupModal({ characterName, existingGroup })
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-gray-900">
            {guildName}
            <span className="ml-2 text-sm font-normal text-gray-400">{worldName}</span>
          </h2>
          {guildInfo && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-700">
                {guildInfo.guild_member_count}명
              </span>
              <span>Lv.{guildInfo.guild_level}</span>
              <span>마스터: {guildInfo.guild_master_name}</span>
            </div>
          )}
          {syncedAt && !syncing && members.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {fromCache ? '캐시' : '동기화'} {formatAge(Date.now() - syncedAt)}
            </span>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => load(true)} disabled={syncing}>
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          새로고침
        </Button>
      </div>

      {/* 변경 알림 */}
      {!syncing && diff && !diff.isFirstLoad && (diff.added.length > 0 || diff.removed.length > 0) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {diff.added.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <UserPlus size={14} />
              신규 {diff.added.length}명: {diff.added.slice(0, 3).join(', ')}{diff.added.length > 3 ? ` 외 ${diff.added.length - 3}명` : ''}
            </div>
          )}
          {diff.removed.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <UserMinus size={14} />
              탈퇴 {diff.removed.length}명: {diff.removed.slice(0, 3).join(', ')}{diff.removed.length > 3 ? ` 외 ${diff.removed.length - 3}명` : ''}
            </div>
          )}
        </div>
      )}

      {/* 새로고침 진행 바 (캐시 로드 시엔 표시 안 함) */}
      {syncing && (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-amber-700 font-medium">
              {syncProgress.total === 0
                ? '길드 정보 확인 중...'
                : diff
                  ? `동기화 중${diff.added.length > 0 ? ` (신규 ${diff.added.length}명)` : ''}`
                  : '첫 조회 중...'}
            </span>
            {syncProgress.total > 0 && (
              <span className="text-amber-500 text-xs">{syncProgress.loaded} / {syncProgress.total}</span>
            )}
          </div>
          {syncProgress.total > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
              <div className="h-full rounded-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* 오류 */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">조회 실패</p>
            <p className="mt-0.5 text-xs text-red-500 whitespace-pre-line">{error}</p>
          </div>
        </div>
      )}

      {members.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="캐릭터명 또는 직업 검색..."
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      )}

      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MemberCard key={m.characterName} member={m} currentGuildName={guildName} onManageGroup={openGroupModal} />
          ))}
        </div>
      )}

      {!syncing && !error && members.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-400">길드원이 없습니다.</p>
      )}
      {search && filtered.length === 0 && members.length > 0 && (
        <p className="py-8 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
      )}

      {groupModal && (
        <ManagePlayerGroupModal
          initialCharacterName={groupModal.characterName}
          existing={groupModal.existingGroup}
          onClose={() => setGroupModal(null)}
          onSaved={() => load(false)}
        />
      )}
    </div>
  )
}
