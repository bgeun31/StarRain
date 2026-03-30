import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { createPlayerGroup, updatePlayerGroup } from '../services/playerGroupService'
import type { PlayerGroup } from '../types'

interface Props {
  /** 수정 시 기존 그룹, 신규 시 undefined */
  existing?: PlayerGroup
  /** 길드원 목록에서 바로 시작할 때 초기 캐릭터명 */
  initialCharacterName?: string
  onClose: () => void
  onSaved: () => void
}

export default function ManagePlayerGroupModal({
  existing,
  initialCharacterName,
  onClose,
  onSaved,
}: Props) {
  const [names, setNames] = useState<string[]>(
    existing?.characterNames ?? (initialCharacterName ? [initialCharacterName] : ['']),
  )
  const [memo, setMemo] = useState(existing?.memo ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addRow() {
    setNames((prev) => [...prev, ''])
  }

  function removeRow(i: number) {
    setNames((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, val: string) {
    setNames((prev) => prev.map((v, idx) => (idx === i ? val : v)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filtered = names.map((n) => n.trim()).filter(Boolean)
    if (filtered.length < 2) {
      setError('캐릭터는 2개 이상 입력해야 합니다.')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (existing) {
        await updatePlayerGroup(existing.id, filtered, memo)
      } else {
        await createPlayerGroup(filtered, memo)
      }
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
    <Modal title={existing ? '플레이어 그룹 수정' : '플레이어 그룹 추가'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-500">
          같은 유저의 캐릭터명을 모두 입력하세요. 부캐 정보 표시에 사용됩니다.
        </p>

        <div className="space-y-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => updateRow(i, e.target.value)}
                placeholder={`캐릭터명 ${i + 1}`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {names.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
        >
          <Plus size={14} />
          캐릭터 추가
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="관리자 메모"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

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
