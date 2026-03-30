import { useState } from 'react'
import { ChevronDown, ChevronUp, User, Link2 } from 'lucide-react'
import Badge from './ui/Badge'
import type { AltView } from '../types'

interface Props {
  alts: AltView[]
  linkedAltNames: string[]
  currentGuildName: string
  canEdit: boolean
  onManageAlts: () => void
}

export default function AltCharacterPanel({ alts, linkedAltNames, currentGuildName, canEdit, onManageAlts }: Props) {
  const [open, setOpen] = useState(false)

  // 부캐 미등록
  if (linkedAltNames.length === 0) {
    return (
      <div className="mt-3 border-t border-gray-100 pt-3 flex items-center justify-between">
        <p className="text-xs text-gray-400 italic">부캐릭터 없음</p>
        {canEdit && (
          <button
            onClick={onManageAlts}
            className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600"
          >
            <Link2 size={12} />
            부캐 추가
          </button>
        )}
      </div>
    )
  }

  // 부캐 등록됐지만 Nexon API 조회 대기 중
  if (alts.length === 0) {
    return (
      <div className="mt-3 border-t border-gray-100 pt-3 flex items-center justify-between">
        <p className="text-xs text-gray-400 italic">
          로딩 중… ({linkedAltNames.join(', ')})
        </p>
        {canEdit && (
          <button
            onClick={onManageAlts}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-500"
          >
            <Link2 size={12} />
            수정
          </button>
        )}
      </div>
    )
  }

  const sameGuild  = alts.filter((a) => a.guildName === currentGuildName)
  const otherGuild = alts.filter((a) => a.guildName !== currentGuildName)

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <User size={12} />
          부캐릭터 {alts.length}개
          {otherGuild.length > 0 && (
            <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-orange-700 font-semibold">
              타 길드 {otherGuild.length}
            </span>
          )}
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {canEdit && (
          <button
            onClick={onManageAlts}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-500"
          >
            <Link2 size={12} />
            수정
          </button>
        )}
      </div>

      {open && (
        <ul className="mt-2 space-y-1.5">
          {[...sameGuild, ...otherGuild].map((alt) => (
            <li
              key={alt.characterName}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                alt.guildName !== currentGuildName
                  ? 'bg-orange-50 border border-orange-100'
                  : 'bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{alt.characterName}</span>
                <span className="text-gray-500">{alt.characterClass}</span>
                <Badge variant="level">Lv.{alt.characterLevel}</Badge>
              </span>
              <Badge variant={alt.guildName !== currentGuildName ? 'guild' : 'default'}>
                {alt.guildName || '길드 없음'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
