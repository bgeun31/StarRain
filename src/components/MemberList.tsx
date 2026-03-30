import { useEffect, useState, useCallback, useRef } from 'react'
import { RefreshCw, AlertCircle, UserPlus, UserMinus, Clock, LayoutGrid, Table2 } from 'lucide-react'
import MemberCard from './MemberCard'
import MemberTable from './MemberTable'
import ManagePlayerGroupModal from './ManagePlayerGroupModal'
import Button from './ui/Button'
import { fetchGuildId, fetchGuildBasic } from '../services/mapleApiService'
import { getOrFetchCharacter } from '../services/characterCacheService'
import { getAltNamesMap } from '../services/altLinkService'
import { getNobleMap, setNoble } from '../services/memberDataService'
import {
  getCachedMemberList,
  setCachedMemberList,
  diffMemberList,
  type MemberDiff,
  type StoredMember,
} from '../services/guildMemberCacheService'
import type { MemberView, NexonGuildBasic } from '../types'

interface Props {
  guildName: string
  worldName: string
  canEdit: boolean
}

function formatAge(ms: number): string {
  const min = Math.floor(ms / 60000)
  if (min < 1)  return '방금 전'
  if (min < 60) return `${min}분 전`
  return `${Math.floor(min / 60)}시간 전`
}

export default function MemberList({ guildName, worldName, canEdit }: Props) {
  const [guildInfo, setGuildInfo]       = useState<NexonGuildBasic | null>(null)
  const [members, setMembers]           = useState<MemberView[]>([])
  const [syncing, setSyncing]           = useState(false)
  const [syncProgress, setSyncProgress] = useState({ loaded: 0, total: 0 })
  const [diff, setDiff]                 = useState<MemberDiff | null>(null)
  const [syncedAt, setSyncedAt]         = useState<number | null>(null)
  const [fromCache, setFromCache]       = useState(false)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [altModal, setAltModal]         = useState<{ characterName: string; altNames: string[] } | null>(null)
  const [viewMode, setViewMode]         = useState<'card' | 'table'>('card')

  const abortRef = useRef<AbortController | null>(null)

  /** 캐시 → 즉시 표시 후, 부캐 정보만 백그라운드 로드 */
  async function loadFromCache(signal: AbortSignal) {
    const cache = await getCachedMemberList(worldName, guildName)
    if (!cache || signal.aborted) return false

    setSyncedAt(cache.cachedAt.toMillis())
    setFromCache(true)

    const [altMap, nobleMap] = await Promise.all([
      getAltNamesMap(cache.memberNames),
      getNobleMap(cache.memberNames),
    ])
    if (signal.aborted) return true

    const views: MemberView[] = cache.members.map((m) => ({
      characterName: m.characterName,
      characterClass: m.characterClass,
      characterLevel: m.characterLevel,
      guildName: m.guildName ?? guildName,
      linkedAltNames: altMap.get(m.characterName) ?? [],
      noble: nobleMap.get(m.characterName) ?? false,
      isNew: false,
      alts: [],
    }))
    setMembers(views.sort((a, b) => b.characterLevel - a.characterLevel))

    // 부캐 상세 정보 백그라운드 로드
    for (const view of views) {
      if (signal.aborted) return true
      const altNames = altMap.get(view.characterName)
      if (!altNames || altNames.length === 0) continue

      const alts: MemberView['alts'] = []
      for (const altName of altNames) {
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
    const [altMap, nobleMap] = await Promise.all([
      getAltNamesMap(currentNames),
      getNobleMap(currentNames),
    ])
    if (signal.aborted) return

    setSyncProgress({ loaded: 0, total })

    const storedMembers: StoredMember[] = []
    const collected: MemberView[] = []

    for (let i = 0; i < currentNames.length; i++) {
      if (signal.aborted) return
      const name     = currentNames[i]
      const isNew    = addedSet.has(name)
      const info     = await getOrFetchCharacter(name, signal, isNew)
      const altNames = altMap.get(name) ?? []

      storedMembers.push({
        characterName: name,
        characterClass: info?.character_class ?? '알 수 없음',
        characterLevel: info?.character_level ?? 0,
        guildName: info?.character_guild_name ?? null,
      })

      const alts: MemberView['alts'] = []
      for (const altName of altNames) {
        if (signal.aborted) return
        const ai = await getOrFetchCharacter(altName, signal)
        if (ai && ai.character_level > 0) {
          alts.push({ characterName: altName, characterClass: ai.character_class, characterLevel: ai.character_level, guildName: ai.character_guild_name ?? '' })
        }
      }

      collected.push({
        characterName: name,
        characterClass: info?.character_class ?? '알 수 없음',
        characterLevel: info?.character_level ?? 0,
        guildName: info?.character_guild_name ?? guildName,
        linkedAltNames: altNames,
        noble: nobleMap.get(name) ?? false,
        isNew,
        alts,
      })

      if (collected.length % 5 === 0 || i === total - 1) {
        setMembers([...collected].sort((a, b) => b.characterLevel - a.characterLevel))
      }
      setSyncProgress({ loaded: i + 1, total })
    }

    setSyncedAt(Date.now())
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

  function openAltModal(characterName: string) {
    const member = members.find((m) => m.characterName === characterName)
    setAltModal({ characterName, altNames: member?.linkedAltNames ?? [] })
  }

  async function handleToggleNoble(characterName: string) {
    const member = members.find((m) => m.characterName === characterName)
    if (!member) return
    const next = !member.noble
    setMembers((prev) =>
      prev.map((m) => m.characterName === characterName ? { ...m, noble: next } : m),
    )
    await setNoble(characterName, next)
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
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={13} />
              카드
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table2 size={13} />
              표
            </button>
          </div>
          <Button size="sm" variant="secondary" onClick={() => load(true)} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            새로고침
          </Button>
        </div>
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

      {/* 새로고침 진행 바 */}
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
        viewMode === 'card' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MemberCard key={m.characterName} member={m} currentGuildName={guildName} onManageGroup={openAltModal} canEdit={canEdit} />
            ))}
          </div>
        ) : (
          <MemberTable members={filtered} currentGuildName={guildName} onManageGroup={openAltModal} onToggleNoble={handleToggleNoble} canEdit={canEdit} />
        )
      )}

      {!syncing && !error && members.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-400">길드원이 없습니다.</p>
      )}
      {search && filtered.length === 0 && members.length > 0 && (
        <p className="py-8 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
      )}

      {altModal && (
        <ManagePlayerGroupModal
          characterName={altModal.characterName}
          initialAltNames={altModal.altNames}
          onClose={() => setAltModal(null)}
          onSaved={() => load(false)}
        />
      )}
    </div>
  )
}
