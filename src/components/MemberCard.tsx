import { Link2 } from 'lucide-react'
import Badge from './ui/Badge'
import AltCharacterPanel from './AltCharacterPanel'
import type { MemberView } from '../types'

interface Props {
  member: MemberView
  currentGuildName: string
  onManageGroup: (characterName: string) => void
}

export default function MemberCard({ member, currentGuildName, onManageGroup }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
            {member.characterLevel}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{member.characterName}</span>
              {member.isNew && <Badge variant="alt">신규</Badge>}
              {member.playerGroupId ? (
                <Badge variant="main">그룹 연결됨</Badge>
              ) : (
                <Badge variant="default">미연결</Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{member.characterClass}</p>
          </div>
        </div>

        {!member.playerGroupId && (
          <button
            onClick={() => onManageGroup(member.characterName)}
            className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-600 hover:bg-amber-100 transition-colors"
          >
            <Link2 size={12} />
            부캐 연결
          </button>
        )}
      </div>

      <AltCharacterPanel
        alts={member.alts}
        currentGuildName={currentGuildName}
        onManageGroup={() => onManageGroup(member.characterName)}
      />
    </div>
  )
}
