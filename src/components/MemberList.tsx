import { useEffect, useState, useCallback, useRef } from 'react'
import { RefreshCw, AlertCircle, UserPlus, UserMinus, Clock, LayoutGrid, Table2 } from 'lucide-react'
import MemberCard from './MemberCard'
import MemberTable from './MemberTable'
import ManagePlayerGroupModal from './ManagePlayerGroupModal'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { fetchGuildId, fetchGuildBasic } from '../services/mapleApiService'
import { getOrFetchCharacter } from '../services/characterCacheService'
import { getAltLinkMaps } from '../services/altLinkService'
import {
  getNobleMap,
  getNobleCountMap,
  setNoble,
  setNobleBulk,
  setNobleCount,
  setNobleCountBulk,
} from '../services/memberDataService'
import { writeAuditLogSilently } from '../services/auditLogService'
import { useAuth } from '../contexts/AuthContext'
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
  onInitialLoadDone?: () => void
}

function formatAge(ms: number): string {
  const min = Math.floor(ms / 60000)
  if (min < 1)  return '방금 전'
  if (min < 60) return `${min}분 전`
  return `${Math.floor(min / 60)}시간 전`
}

export default function MemberList({ guildName, worldName, canEdit, onInitialLoadDone }: Props) {
  const { profile } = useAuth()
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
  const [showBulkNobleEdit, setShowBulkNobleEdit] = useState(false)
  const [showBulkNobleCountEdit, setShowBulkNobleCountEdit] = useState(false)
  const [viewMode, setViewMode]         = useState<'card' | 'table'>('card')

  const abortRef = useRef<AbortController | null>(null)

  /** 캐시 → 즉시 표시 후, 부캐 정보만 백그라운드 로드 */
  async function loadFromCache(signal: AbortSignal) {
    const cache = await getCachedMemberList(worldName, guildName)
    if (!cache || signal.aborted) return false

    setSyncedAt(cache.cachedAt.toMillis())
    setFromCache(true)

    const [linkMaps, nobleMap, nobleCountMap] = await Promise.all([
      getAltLinkMaps(cache.memberNames),
      getNobleMap(cache.memberNames),
      getNobleCountMap(cache.memberNames),
    ])
    const altMap = linkMaps.altMap
    const mainMap = linkMaps.mainMap
    if (signal.aborted) return true

    const views: MemberView[] = cache.members.map((m) => ({
      characterName: m.characterName,
      characterClass: m.characterClass,
      characterLevel: m.characterLevel,
      guildName: m.guildName ?? guildName,
      linkedAltNames: altMap.get(m.characterName) ?? [],
      mainCharacterName: mainMap.get(m.characterName),
      noble: nobleMap.get(m.characterName) ?? false,
      nobleCount: nobleCountMap.get(m.characterName) ?? 0,
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

    if (!memberDiff.isFirstLoad && (memberDiff.added.length > 0 || memberDiff.removed.length > 0)) {
      writeAuditLogSilently({
        action: 'guild.member.change',
        message: `길드원 변경: ${worldName}/${guildName} (추가 ${memberDiff.added.length}, 제외 ${memberDiff.removed.length})`,
        targetType: 'guild',
        targetId: `${worldName}:${guildName}`,
        actor: {
          uid: profile?.uid,
          email: profile?.email,
          name: profile?.displayName,
        },
        meta: {
          guildName,
          worldName,
          added: memberDiff.added.slice(0, 300),
          removed: memberDiff.removed.slice(0, 300),
        },
      })
    }

    const addedSet = new Set(memberDiff.added)
    const total    = currentNames.length
    const [linkMaps, nobleMap, nobleCountMap] = await Promise.all([
      getAltLinkMaps(currentNames),
      getNobleMap(currentNames),
      getNobleCountMap(currentNames),
    ])
    const altMap = linkMaps.altMap
    const mainMap = linkMaps.mainMap
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
        mainCharacterName: mainMap.get(name),
        noble: nobleMap.get(name) ?? false,
        nobleCount: nobleCountMap.get(name) ?? 0,
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
    } finally {
      if (!signal.aborted) {
        onInitialLoadDone?.()
      }
    }
  }, [guildName, worldName, onInitialLoadDone])

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
    writeAuditLogSilently({
      action: 'member.noble.update',
      message: `노블 변경: ${characterName} -> ${next ? 'O' : 'X'}`,
      targetType: 'member',
      targetId: characterName,
      actor: {
        uid: profile?.uid,
        email: profile?.email,
        name: profile?.displayName,
      },
      meta: { guildName, worldName, noble: next },
    })
  }

  async function handleUpdateNobleCount(characterName: string, count: number) {
    const normalizedCount = Math.max(0, Math.min(3, Math.floor(count)))
    setMembers((prev) =>
      prev.map((m) => m.characterName === characterName ? { ...m, nobleCount: normalizedCount } : m),
    )
    await setNobleCount(characterName, normalizedCount)
    writeAuditLogSilently({
      action: 'member.nobleCount.update',
      message: `누적 횟수 변경: ${characterName} -> ${normalizedCount}회`,
      targetType: 'member',
      targetId: characterName,
      actor: {
        uid: profile?.uid,
        email: profile?.email,
        name: profile?.displayName,
      },
      meta: { guildName, worldName, nobleCount: normalizedCount },
    })
  }

  async function handleBulkNobleUpdate(characterNames: string[], noble: boolean) {
    const normalized = Array.from(
      new Set(characterNames.map((name) => name.trim()).filter(Boolean)),
    )
    if (normalized.length === 0) {
      throw new Error('캐릭터명을 1개 이상 입력해 주세요.')
    }

    const memberNameSet = new Set(members.map((m) => m.characterName))
    const matched = normalized.filter((name) => memberNameSet.has(name))
    const notFound = normalized.filter((name) => !memberNameSet.has(name))
    if (matched.length === 0) {
      throw new Error('입력한 이름 중 일치하는 길드원이 없습니다.')
    }

    await setNobleBulk(matched, noble)
    const matchedSet = new Set(matched)
    setMembers((prev) =>
      prev.map((m) => matchedSet.has(m.characterName) ? { ...m, noble } : m),
    )

    writeAuditLogSilently({
      action: 'member.noble.bulkUpdate',
      message: `노블 일괄 변경: ${matched.length}명 -> ${noble ? 'O' : 'X'}`,
      targetType: 'member',
      targetId: `${worldName}:${guildName}`,
      actor: {
        uid: profile?.uid,
        email: profile?.email,
        name: profile?.displayName,
      },
      meta: {
        guildName,
        worldName,
        noble,
        updatedCount: matched.length,
        notFoundCount: notFound.length,
        targets: matched.slice(0, 200),
      },
    })

    return { updatedCount: matched.length, notFound }
  }

  async function handleBulkNobleCountUpdate(characterNames: string[], count: number) {
    const normalized = Array.from(
      new Set(characterNames.map((name) => name.trim()).filter(Boolean)),
    )
    if (normalized.length === 0) {
      throw new Error('캐릭터명을 1개 이상 입력해 주세요.')
    }

    const memberNameSet = new Set(members.map((m) => m.characterName))
    const matched = normalized.filter((name) => memberNameSet.has(name))
    const notFound = normalized.filter((name) => !memberNameSet.has(name))
    if (matched.length === 0) {
      throw new Error('입력한 이름 중 일치하는 길드원이 없습니다.')
    }

    await setNobleCountBulk(matched, count)
    const matchedSet = new Set(matched)
    const normalizedCount = Math.max(1, Math.min(3, Math.floor(count)))
    setMembers((prev) =>
      prev.map((m) => matchedSet.has(m.characterName) ? { ...m, nobleCount: normalizedCount } : m),
    )

    writeAuditLogSilently({
      action: 'member.nobleCount.bulkUpdate',
      message: `누적 횟수 일괄 변경: ${matched.length}명 -> ${normalizedCount}회`,
      targetType: 'member',
      targetId: `${worldName}:${guildName}`,
      actor: {
        uid: profile?.uid,
        email: profile?.email,
        name: profile?.displayName,
      },
      meta: {
        guildName,
        worldName,
        nobleCount: normalizedCount,
        updatedCount: matched.length,
        notFoundCount: notFound.length,
        targets: matched.slice(0, 200),
      },
    })

    return { updatedCount: matched.length, notFound }
  }

  async function handleResetAllNobleCount() {
    const names = members.map((m) => m.characterName)
    if (names.length === 0) {
      throw new Error('초기화할 길드원이 없습니다.')
    }

    await setNobleCountBulk(names, 0)
    setMembers((prev) => prev.map((m) => ({ ...m, nobleCount: 0 })))

    writeAuditLogSilently({
      action: 'member.nobleCount.resetAll',
      message: `누적 횟수 전체 초기화: ${names.length}명`,
      targetType: 'member',
      targetId: `${worldName}:${guildName}`,
      actor: {
        uid: profile?.uid,
        email: profile?.email,
        name: profile?.displayName,
      },
      meta: {
        guildName,
        worldName,
        resetCount: names.length,
      },
    })
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
          <MemberTable
            members={filtered}
            currentGuildName={guildName}
            onManageGroup={openAltModal}
            onToggleNoble={handleToggleNoble}
            onUpdateNobleCount={handleUpdateNobleCount}
            onOpenBulkNobleEdit={() => setShowBulkNobleEdit(true)}
            onOpenBulkNobleCountEdit={() => setShowBulkNobleCountEdit(true)}
            canEdit={canEdit}
          />
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
      {showBulkNobleEdit && (
        <BulkNobleEditModal
          onClose={() => setShowBulkNobleEdit(false)}
          availableCharacterNames={members.map((m) => m.characterName)}
          onApply={handleBulkNobleUpdate}
        />
      )}
      {showBulkNobleCountEdit && (
        <BulkNobleCountEditModal
          onClose={() => setShowBulkNobleCountEdit(false)}
          onResetAll={handleResetAllNobleCount}
          onApply={handleBulkNobleCountUpdate}
        />
      )}
    </div>
  )
}

function BulkNobleEditModal({
  onClose,
  availableCharacterNames,
  onApply,
}: {
  onClose: () => void
  availableCharacterNames: string[]
  onApply: (characterNames: string[], noble: boolean) => Promise<{ updatedCount: number; notFound: string[] }>
}) {
  const [rawNames, setRawNames] = useState('')
  const [target, setTarget]     = useState<'O' | 'X'>('O')
  const [applyAll, setApplyAll] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const names = applyAll
      ? availableCharacterNames
      : Array.from(
        new Set(rawNames.split(/[\n,]/).map((name) => name.trim()).filter(Boolean)),
      )
    if (names.length === 0) {
      setError(applyAll ? '적용할 길드원이 없습니다.' : '캐릭터명을 1개 이상 입력해 주세요.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await onApply(names, target === 'O')
      const summary = `노블 ${target}로 ${result.updatedCount}명 반영했습니다.`
      if (result.notFound.length > 0) {
        alert(`${summary}\n미일치 ${result.notFound.length}명: ${result.notFound.slice(0, 5).join(', ')}${result.notFound.length > 5 ? ' 외' : ''}`)
      } else {
        alert(summary)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '일괄 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="노블 일괄 수정" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">캐릭터명</label>
          <textarea
            value={rawNames}
            onChange={(e) => setRawNames(e.target.value)}
            placeholder={'캐릭터명1\n캐릭터명2, 캐릭터명3'}
            rows={6}
            disabled={applyAll}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="mt-1 text-xs text-gray-400">줄바꿈 또는 콤마(,)로 여러 명을 입력할 수 있습니다.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={applyAll}
            onChange={(e) => setApplyAll(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
          />
          전체 선택 (현재 길드원 전체 {availableCharacterNames.length}명 적용)
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">반영 값</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTarget('O')}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                target === 'O'
                  ? 'border-amber-300 bg-amber-100 text-amber-700'
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              O
            </button>
            <button
              type="button"
              onClick={() => setTarget('X')}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                target === 'X'
                  ? 'border-gray-400 bg-gray-100 text-gray-700'
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              X
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={loading}>
            {loading ? '반영 중...' : '일괄 반영'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function BulkNobleCountEditModal({
  onClose,
  onResetAll,
  onApply,
}: {
  onClose: () => void
  onResetAll: () => Promise<void>
  onApply: (characterNames: string[], count: number) => Promise<{ updatedCount: number; notFound: string[] }>
}) {
  const [rawNames, setRawNames] = useState('')
  const [target, setTarget]     = useState<1 | 2 | 3>(1)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const names = Array.from(
      new Set(rawNames.split(/[\n,]/).map((name) => name.trim()).filter(Boolean)),
    )
    if (names.length === 0) {
      setError('캐릭터명을 1개 이상 입력해 주세요.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await onApply(names, target)
      const summary = `누적 횟수 ${target}회로 ${result.updatedCount}명 반영했습니다.`
      if (result.notFound.length > 0) {
        alert(`${summary}\n미일치 ${result.notFound.length}명: ${result.notFound.slice(0, 5).join(', ')}${result.notFound.length > 5 ? ' 외' : ''}`)
      } else {
        alert(summary)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '일괄 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetAll() {
    if (!confirm('누적 횟수를 전체 0회로 초기화하시겠습니까?')) return
    setLoading(true)
    setError('')
    try {
      await onResetAll()
      alert('누적 횟수를 전체 초기화했습니다.')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '초기화 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="누적 횟수 일괄 수정" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">캐릭터명</label>
          <textarea
            value={rawNames}
            onChange={(e) => setRawNames(e.target.value)}
            placeholder={'캐릭터명1\n캐릭터명2, 캐릭터명3'}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="mt-1 text-xs text-gray-400">줄바꿈 또는 콤마(,)로 여러 명을 입력할 수 있습니다.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">반영 값</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTarget(n as 1 | 2 | 3)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  target === n
                    ? 'border-amber-300 bg-amber-100 text-amber-700'
                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {n}회
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="danger" onClick={handleResetAll} disabled={loading}>
            모두 초기화
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={loading}>
            {loading ? '반영 중...' : '일괄 반영'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
