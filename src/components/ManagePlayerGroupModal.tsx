import { useState } from 'react'
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { syncAltNames } from '../services/altLinkService'
import { writeAuditLogSilently } from '../services/auditLogService'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  characterName: string
  initialAltNames: string[]
  onClose: () => void
  onSaved: () => void
}

export default function ManagePlayerGroupModal({
  characterName,
  initialAltNames,
  onClose,
  onSaved,
}: Props) {
  const { profile } = useAuth()
  const [altNames, setAltNamesState] = useState<string[]>(
    initialAltNames.length > 0 ? initialAltNames : [''],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addRow() {
    setAltNamesState((prev) => [...prev, ''])
  }

  function removeRow(i: number) {
    setAltNamesState((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, val: string) {
    setAltNamesState((prev) => prev.map((v, idx) => (idx === i ? val : v)))
  }

  function moveRow(i: number, dir: -1 | 1) {
    setAltNamesState((prev) => {
      const nextIndex = i + dir
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [picked] = next.splice(i, 1)
      next.splice(nextIndex, 0, picked)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filtered = altNames.map((n) => n.trim()).filter(Boolean)
    setLoading(true)
    setError('')
    try {
      await syncAltNames(characterName, filtered)
      writeAuditLogSilently({
        action: 'altLink.sync',
        message: `부캐 연결 수정: ${characterName} (${filtered.length}명)`,
        targetType: 'member',
        targetId: characterName,
        actor: {
          uid: profile?.uid,
          email: profile?.email,
          name: profile?.displayName,
        },
        meta: { altCount: filtered.length, alts: filtered.slice(0, 50), autoMainLinked: true },
      })
      onSaved()
      onClose()
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={`부캐릭터 관리 — ${characterName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-500">
          {characterName}의 부캐릭터 이름을 입력하세요. 저장하면 입력한 캐릭터는 자동으로 본캐({characterName})와 연결됩니다.
        </p>

        <div className="space-y-2">
          {altNames.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => updateRow(i, e.target.value)}
                placeholder={`부캐릭터명 ${i + 1}`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => moveRow(i, -1)}
                disabled={i === 0}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveRow(i, 1)}
                disabled={i === altNames.length - 1}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
        >
          <Plus size={14} />
          부캐 추가
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
