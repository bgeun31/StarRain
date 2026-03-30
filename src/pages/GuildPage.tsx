import { useCallback, useEffect, useState } from 'react'
import { Shield, Bookmark, Users, LogOut, ClipboardList, RefreshCw } from 'lucide-react'

import GuildSearchBar from '../components/GuildSearchBar'
import GuildSelector from '../components/GuildSelector'
import MemberList from '../components/MemberList'
import { fetchSavedGuilds, saveGuild, removeSavedGuild, updateSavedGuildOrder } from '../services/savedGuildService'
import { writeAuditLogSilently } from '../services/auditLogService'
import { useAuth } from '../contexts/AuthContext'
import type { SavedGuild } from '../types'

interface ActiveGuild {
  guildName: string
  worldName: string
}

interface Props {
  onNavigateUsers: () => void
  onNavigateAudit: () => void
}

export default function GuildPage({ onNavigateUsers, onNavigateAudit }: Props) {
  const { profile, isAdmin, canEdit, signOut } = useAuth()
  const [savedGuilds, setSavedGuilds]         = useState<SavedGuild[]>([])
  const [activeGuild, setActiveGuild]         = useState<ActiveGuild | null>(null)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [searching, setSearching]             = useState(false)
  const [memberLoading, setMemberLoading]     = useState(false)

  useEffect(() => { loadSaved() }, [])

  async function loadSaved() {
    try {
      const data = await fetchSavedGuilds()
      setSavedGuilds(data)
    } catch (err) {
      console.error(err)
    }
  }

  function handleSearch(guildName: string, worldName: string) {
    setMemberLoading(true)
    setActiveGuild({ guildName, worldName })
    setSelectedSavedId(null)
    setSearching(false)
  }

  async function handleSave(guildName: string, worldName: string, icon?: string) {
    try {
      await saveGuild(guildName, worldName, icon)
      writeAuditLogSilently({
        action: 'savedGuild.create',
        message: `즐겨찾기 추가: ${worldName}/${guildName}${icon ? ' (아이콘 포함)' : ''}`,
        targetType: 'savedGuild',
        targetId: `${worldName}:${guildName}`,
        actor: {
          uid: profile?.uid,
          email: profile?.email,
          name: profile?.displayName,
        },
        meta: { guildName, worldName, icon: icon ?? '' },
      })
      await loadSaved()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleRemoveSaved(guild: SavedGuild) {
    if (!confirm(`"${guild.guildName}" 을(를) 즐겨찾기에서 삭제하시겠습니까?`)) return
    try {
      await removeSavedGuild(guild.id)
      writeAuditLogSilently({
        action: 'savedGuild.delete',
        message: `즐겨찾기 삭제: ${guild.worldName}/${guild.guildName}`,
        targetType: 'savedGuild',
        targetId: guild.id,
        actor: {
          uid: profile?.uid,
          email: profile?.email,
          name: profile?.displayName,
        },
        meta: { guildName: guild.guildName, worldName: guild.worldName },
      })
      await loadSaved()
      if (selectedSavedId === guild.id) {
        setSelectedSavedId(null)
        setActiveGuild(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  function handleSelectSaved(guild: SavedGuild) {
    setMemberLoading(true)
    setSelectedSavedId(guild.id)
    setActiveGuild({ guildName: guild.guildName, worldName: guild.worldName })
  }

  const handleMembersLoaded = useCallback(() => {
    setMemberLoading(false)
  }, [])

  async function handleReorderSavedGuilds(orderedIds: string[]) {
    const idSet = new Set(orderedIds)
    const reordered = orderedIds
      .map((id) => savedGuilds.find((g) => g.id === id))
      .filter((g): g is SavedGuild => Boolean(g))
    const untouched = savedGuilds.filter((g) => !idSet.has(g.id))
    const next = [...reordered, ...untouched]

    setSavedGuilds(next)
    try {
      await updateSavedGuildOrder(next.map((g) => g.id))
      writeAuditLogSilently({
        action: 'savedGuild.reorder',
        message: `즐겨찾기 순서 변경: ${next.length}개`,
        targetType: 'savedGuild',
        targetId: 'list',
        actor: {
          uid: profile?.uid,
          email: profile?.email,
          name: profile?.displayName,
        },
        meta: { orderedIds: next.map((g) => g.id) },
      })
    } catch (err) {
      console.error(err)
      await loadSaved()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex w-full items-center gap-4 px-6 py-3">

          {/* 좌: 로고 */}
          <div className="flex items-center gap-2 shrink-0">
            <img src="/icon.jpg" alt="별비" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-base font-bold text-gray-900 whitespace-nowrap">별비 길드 관리 시스템</span>
          </div>

          {/* 중앙: 검색 */}
          <div className="flex flex-1 items-center justify-center">
            {canEdit && (
              <GuildSearchBar
                onSearch={handleSearch}
                onSave={handleSave}
                loading={searching}
              />
            )}
          </div>

          {/* 우: 사용자 관리 + 로그아웃 */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={onNavigateUsers}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Users size={14} />
                  사용자 관리
                </button>
                <button
                  onClick={onNavigateAudit}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ClipboardList size={14} />
                  수정 내용
                </button>
              </>
            )}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-xs text-gray-500 hidden sm:block">
                {profile?.displayName || profile?.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="로그아웃"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 메인 */}
      <main className="flex w-full gap-0 px-6 py-6">

        {/* 좌: 즐겨찾기 사이드바 */}
        <aside className="mr-6 w-52 shrink-0">
          <div className="mb-2 flex items-center gap-1.5">
            <Bookmark size={14} className="text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">즐겨찾기</span>
          </div>
          <GuildSelector
            guilds={savedGuilds}
            selectedId={selectedSavedId}
            onSelect={handleSelectSaved}
            onRemove={canEdit ? handleRemoveSaved : undefined}
            onReorder={canEdit ? handleReorderSavedGuilds : undefined}
          />
        </aside>

        {/* 우: 컨텐츠 */}
        <section className="flex-1 min-w-0">
          {activeGuild ? (
            <div className="relative">
              {memberLoading && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <RefreshCw size={14} className="animate-spin" />
                  길드원 정보를 불러오는 중...
                </div>
              )}
              <MemberList
                key={`${activeGuild.worldName}-${activeGuild.guildName}`}
                guildName={activeGuild.guildName}
                worldName={activeGuild.worldName}
                canEdit={canEdit}
                onInitialLoadDone={handleMembersLoaded}
              />
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
              <Shield className="mb-3 opacity-25" size={48} />
              <p className="text-sm font-medium">길드를 검색하거나 즐겨찾기를 선택하세요</p>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
