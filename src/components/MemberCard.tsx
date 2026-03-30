import Badge from './ui/Badge'
import AltCharacterPanel from './AltCharacterPanel'
import type { MemberView } from '../types'

interface Props {
  member: MemberView
  currentGuildName: string
  canEdit: boolean
  onManageGroup: (characterName: string) => void
}

export default function MemberCard({ member, currentGuildName, canEdit, onManageGroup }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
          {member.characterLevel}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{member.characterName}</span>
            {member.isNew && <Badge variant="alt">신규</Badge>}
            {member.linkedAltNames.length > 0
              ? <Badge variant="main">부캐 있음</Badge>
              : <Badge variant="default">미연결</Badge>
            }
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{member.characterClass}</p>
        </div>
      </div>

      <AltCharacterPanel
        alts={member.alts}
        linkedAltNames={member.linkedAltNames}
        currentGuildName={currentGuildName}
        canEdit={canEdit}
        onManageAlts={() => onManageGroup(member.characterName)}
      />
    </div>
  )
}
