import { useEffect, useState } from 'react'
import { Shield, Bookmark } from 'lucide-react'
import GuildSearchBar from '../components/GuildSearchBar'
import GuildSelector from '../components/GuildSelector'
import MemberList from '../components/MemberList'
import { fetchSavedGuilds, saveGuild, removeSavedGuild } from '../services/savedGuildService'
import type { SavedGuild } from '../types'

interface ActiveGuild {
  guildName: string
  worldName: string
}

export default function GuildPage() {
  const [savedGuilds, setSavedGuilds] = useState<SavedGuild[]>([])
  const [activeGuild, setActiveGuild] = useState<ActiveGuild | null>(null)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [sidebarOpen] = useState(true)

  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    try {
      const data = await fetchSavedGuilds()
      setSavedGuilds(data)
    } catch (err) {
      console.error(err)
    }
  }

  function handleSearch(guildName: string, worldName: string) {
    setActiveGuild({ guildName, worldName })
    setSelectedSavedId(null)
    setSearching(false)
  }

  async function handleSave(guildName: string, worldName: string) {
    try {
      await saveGuild(guildName, worldName)
      await loadSaved()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleRemoveSaved(guild: SavedGuild) {
    if (!confirm(`"${guild.guildName}" 을(를) 즐겨찾기에서 삭제하시겠습니까?`)) return
    try {
      await removeSavedGuild(guild.id)
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
    setSelectedSavedId(guild.id)
    setActiveGuild({ guildName: guild.guildName, worldName: guild.worldName })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <Shield className="text-amber-500 shrink-0" size={26} />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">StarRain 길드 관리</h1>
          </div>
          <GuildSearchBar
            onSearch={handleSearch}
            onSave={handleSave}
            loading={searching}
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl gap-0 px-6 py-6">
        {/* 사이드바: 즐겨찾기 길드 */}
        {sidebarOpen && (
          <aside className="mr-6 w-52 shrink-0">
            <div className="mb-2 flex items-center gap-1.5">
              <Bookmark size={14} className="text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">즐겨찾기</span>
            </div>
            <GuildSelector
              guilds={savedGuilds}
              selectedId={selectedSavedId}
              onSelect={handleSelectSaved}
              onRemove={handleRemoveSaved}
            />
          </aside>
        )}

        {/* 메인 컨텐츠 */}
        <section className="flex-1 min-w-0">
          {activeGuild ? (
            <MemberList
              key={`${activeGuild.worldName}-${activeGuild.guildName}`}
              guildName={activeGuild.guildName}
              worldName={activeGuild.worldName}
            />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
              <Shield className="mb-3 opacity-25" size={48} />
              <p className="text-sm font-medium">길드를 검색해 주세요</p>
              <p className="text-xs mt-1 text-gray-300">
                상단 검색창에서 서버와 길드명을 입력하세요
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
