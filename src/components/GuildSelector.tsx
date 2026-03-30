import { Trash2, Shield } from 'lucide-react'
import type { SavedGuild } from '../types'

interface Props {
  guilds: SavedGuild[]
  selectedId: string | null
  onSelect: (guild: SavedGuild) => void
  onRemove?: (guild: SavedGuild) => void
}

export default function GuildSelector({ guilds, selectedId, onSelect, onRemove }: Props) {
  if (guilds.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-400">
        <Shield className="mx-auto mb-2 opacity-30" size={24} />
        <p className="text-xs">즐겨찾기한 길드가 없습니다</p>
        <p className="text-xs mt-0.5">위에서 조회 후 즐겨찾기 추가</p>
      </div>
    )
  }

  return (
    <ul className="space-y-1">
      {guilds.map((g) => (
        <li key={g.id}>
          <div
            className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
              selectedId === g.id
                ? 'bg-amber-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            onClick={() => onSelect(g)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{g.guildName}</p>
              <p className={`text-xs ${selectedId === g.id ? 'text-amber-100' : 'text-gray-400'}`}>
                {g.worldName}
              </p>
            </div>
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(g) }}
                className={`ml-2 shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedId === g.id ? 'hover:bg-amber-600 text-white' : 'hover:bg-red-100 text-red-400'
                }`}
                title="즐겨찾기 삭제"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
