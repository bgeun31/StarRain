import { useState } from 'react'
import { Trash2, Shield, GripVertical, Pencil, Loader2 } from 'lucide-react'
import type { SavedGuild } from '../types'

interface Props {
  guilds: SavedGuild[]
  selectedId: string | null
  onSelect: (guild: SavedGuild) => void
  onRemove?: (guild: SavedGuild) => void
  onEditIcon?: (guild: SavedGuild, file: File) => void
  iconUpdatingId?: string | null
  onReorder?: (orderedIds: string[]) => void
}

export default function GuildSelector({
  guilds,
  selectedId,
  onSelect,
  onRemove,
  onEditIcon,
  iconUpdatingId,
  onReorder,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  function moveBefore(ids: string[], fromId: string, toId: string): string[] {
    const from = ids.indexOf(fromId)
    const to = ids.indexOf(toId)
    if (from < 0 || to < 0 || from === to) return ids
    const next = [...ids]
    const [picked] = next.splice(from, 1)
    next.splice(to, 0, picked)
    return next
  }

  function handleDrop(targetId: string) {
    if (!onReorder || !dragId || dragId === targetId) return
    const ids = guilds.map((g) => g.id)
    const nextIds = moveBefore(ids, dragId, targetId)
    onReorder(nextIds)
  }

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
            onClick={() => onSelect(g)}
            draggable={Boolean(onReorder)}
            onDragStart={() => setDragId(g.id)}
            onDragOver={(e) => {
              if (!onReorder) return
              e.preventDefault()
              setOverId(g.id)
            }}
            onDragLeave={() => setOverId((prev) => (prev === g.id ? null : prev))}
            onDrop={(e) => {
              e.preventDefault()
              handleDrop(g.id)
              setDragId(null)
              setOverId(null)
            }}
            onDragEnd={() => {
              setDragId(null)
              setOverId(null)
            }}
            className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
              selectedId === g.id
                ? 'bg-amber-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            } ${
              overId === g.id && dragId !== g.id
                ? 'ring-2 ring-amber-300 ring-inset'
                : ''
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              {onReorder && (
                <span className={`shrink-0 ${selectedId === g.id ? 'text-amber-100' : 'text-gray-300'}`} title="드래그 정렬">
                  <GripVertical size={14} />
                </span>
              )}
              <GuildIcon icon={g.icon} guildName={g.guildName} selected={selectedId === g.id} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{g.guildName}</p>
                <p className={`text-xs ${selectedId === g.id ? 'text-amber-100' : 'text-gray-400'}`}>
                  {g.worldName}
                </p>
              </div>
            </div>
            {onRemove && (
              <div className="ml-2 flex shrink-0 items-center gap-1.5">
                {onEditIcon && (
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className={`rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                      selectedId === g.id ? 'hover:bg-amber-600 text-white' : 'hover:bg-amber-100 text-amber-500'
                    }`}
                    title="아이콘 수정"
                  >
                    {iconUpdatingId === g.id ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={iconUpdatingId === g.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        onEditIcon(g, file)
                        e.currentTarget.value = ''
                      }}
                    />
                  </label>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(g) }}
                  className={`rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    selectedId === g.id ? 'hover:bg-amber-600 text-white' : 'hover:bg-red-100 text-red-400'
                  }`}
                  title="즐겨찾기 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function GuildIcon({ icon, guildName, selected }: { icon?: string; guildName: string; selected: boolean }) {
  const value = (icon ?? '').trim()
  const isImage = value.startsWith('http://') || value.startsWith('https://')

  if (isImage) {
    return (
      <img
        src={value}
        alt={`${guildName} 아이콘`}
        className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-black/5"
      />
    )
  }

  if (value) {
    return (
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-base leading-none">
        {value}
      </span>
    )
  }

  return (
    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
      selected ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-600'
    }`}>
      {guildName.slice(0, 1)}
    </span>
  )
}
