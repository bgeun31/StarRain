import { useState } from 'react'
import { Search, BookmarkPlus } from 'lucide-react'
import Button from './ui/Button'
import { MAPLE_WORLDS } from '../types'
import type { MapleWorld } from '../types'

interface Props {
  onSearch: (guildName: string, worldName: string) => void
  onSave: (guildName: string, worldName: string) => void
  loading: boolean
}

export default function GuildSearchBar({ onSearch, onSave, loading }: Props) {
  const [guildName, setGuildName] = useState('')
  const [worldName, setWorldName] = useState<MapleWorld>('스카니아')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = guildName.trim()
    if (!name) return
    onSearch(name, worldName)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">서버</label>
        <select
          value={worldName}
          onChange={(e) => setWorldName(e.target.value as MapleWorld)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {MAPLE_WORLDS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-40">
        <label className="mb-1 block text-xs font-medium text-gray-500">길드명</label>
        <input
          type="text"
          value={guildName}
          onChange={(e) => setGuildName(e.target.value)}
          placeholder="길드명 입력"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <Button type="submit" disabled={loading || !guildName.trim()}>
        <Search size={15} />
        {loading ? '조회 중...' : '조회'}
      </Button>

      <Button
        type="button"
        variant="secondary"
        disabled={!guildName.trim()}
        onClick={() => onSave(guildName.trim(), worldName)}
        title="즐겨찾기에 추가"
      >
        <BookmarkPlus size={15} />
        즐겨찾기
      </Button>
    </form>
  )
}
