import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { MemberView } from '../types'
import Badge from './ui/Badge'

type SortKey = 'level' | 'name'
type SortDir = 'asc' | 'desc'

interface Props {
  members: MemberView[]
  currentGuildName: string
  canEdit: boolean
  onManageGroup: (characterName: string) => void
  onToggleNoble: (characterName: string) => void
  onUpdateNobleCount: (characterName: string, count: number) => void
  onUpdateBirthDate: (characterName: string, birthDate: string) => void
  onOpenBulkNobleEdit: () => void
  onOpenBulkNobleCountEdit: () => void
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={13} className="text-gray-300" />
  return sortDir === 'asc'
    ? <ChevronUp size={13} className="text-amber-500" />
    : <ChevronDown size={13} className="text-amber-500" />
}

export default function MemberTable({
  members,
  currentGuildName,
  canEdit,
  onManageGroup,
  onToggleNoble,
  onUpdateNobleCount,
  onUpdateBirthDate,
  onOpenBulkNobleEdit,
  onOpenBulkNobleCountEdit,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('level')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'level' ? 'desc' : 'asc')
    }
  }

  const sorted = [...members].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'level') return (a.characterLevel - b.characterLevel) * dir
    return a.characterName.localeCompare(b.characterName, 'ko') * dir
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 w-20">
              <button
                onClick={() => handleSort('level')}
                className="flex items-center gap-1 hover:text-gray-600 transition-colors"
              >
                레벨
                <SortIcon col="level" sortKey={sortKey} sortDir={sortDir} />
              </button>
            </th>
            <th className="px-4 py-3">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-1 hover:text-gray-600 transition-colors"
              >
                캐릭터명
                <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </button>
            </th>
            <th className="px-4 py-3">직업</th>
            <th className="px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <span>노블</span>
                {canEdit && (
                  <button
                    onClick={onOpenBulkNobleEdit}
                    className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    일괄 수정
                  </button>
                )}
              </div>
            </th>
            <th className="px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <span>누적 횟수</span>
                {canEdit && (
                  <button
                    onClick={onOpenBulkNobleCountEdit}
                    className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    일괄 수정
                  </button>
                )}
              </div>
            </th>
            <th className="px-4 py-3 text-center">연생</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">부캐릭터</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((m) => {
            const displayAlts = m.alts.length > 0 ? m.alts.map((a) => a.characterName) : m.linkedAltNames
            const hasAlts = m.linkedAltNames.length > 0
            const isLinkedAlt = Boolean(m.mainCharacterName)

            return (
              <tr
                key={m.characterName}
                className={`transition-colors ${canEdit ? 'hover:bg-amber-50 cursor-pointer' : ''}`}
                onClick={() => canEdit && onManageGroup(m.characterName)}
              >
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {m.characterLevel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{m.characterName}</span>
                    {m.isNew && <Badge variant="alt">신규</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{m.characterClass}</td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  {canEdit ? (
                    <button
                      onClick={() => onToggleNoble(m.characterName)}
                      className={`inline-flex h-7 w-10 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        m.noble
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {m.noble ? 'O' : 'X'}
                    </button>
                  ) : (
                    <span className={`text-xs font-bold ${m.noble ? 'text-amber-600' : 'text-gray-300'}`}>
                      {m.noble ? 'O' : 'X'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  {canEdit ? (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={m.nobleCount}
                      onChange={(e) => onUpdateNobleCount(m.characterName, Number(e.target.value))}
                      className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ) : (
                    <span className={`text-xs font-semibold ${m.nobleCount > 0 ? 'text-amber-700' : 'text-gray-300'}`}>
                      {m.nobleCount > 0 ? `${m.nobleCount}회` : '-'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  {canEdit ? (
                    <input
                      key={`${m.characterName}-${m.birthDate ?? ''}`}
                      type="text"
                      inputMode="numeric"
                      defaultValue={m.birthDate ?? ''}
                      onBlur={(e) => onUpdateBirthDate(m.characterName, e.target.value)}
                      placeholder="YYYY"
                      className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-center text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ) : (
                    <span className={`text-xs font-semibold ${m.birthDate ? 'text-gray-700' : 'text-gray-300'}`}>
                      {m.birthDate || '-'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {isLinkedAlt
                    ? <Badge variant="guild">본캐: {m.mainCharacterName}</Badge>
                    : hasAlts
                    ? <Badge variant="main">부캐 있음</Badge>
                    : <Badge variant="default">미연결</Badge>
                  }
                </td>
                <td className="px-4 py-3">
                  {displayAlts.length > 0 ? (
                    <ul className="ml-2 space-y-1 text-gray-600">
                      {displayAlts.map((name) => {
                        const alt = m.alts.find((a) => a.characterName === name)
                        const inOtherGuild = alt && alt.guildName !== currentGuildName
                        return (
                          <li key={name} className="leading-5">
                            <span className={inOtherGuild ? 'text-orange-500 font-medium' : ''}>
                              {name}
                              {alt?.guildName ? (
                                <span className={`ml-1 ${inOtherGuild ? 'text-orange-400' : 'text-gray-400'}`}>
                                  ({alt.guildName})
                                </span>
                              ) : (
                                <span className="ml-1 text-gray-300">(조회중)</span>
                              )}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
