import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { setAltNames, deleteAltLink } from '../services/altLinkService'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filtered = altNames.map((n) => n.trim()).filter(Boolean)
    setLoading(true)
    setError('')
    try {
      if (filtered.length === 0) {
        await deleteAltLink(characterName)
      } else {
        await setAltNames(characterName, filtered)
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
    <Modal title={`부캐릭터 관리 — ${characterName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-500">
          {characterName}의 부캐릭터 이름을 입력하세요. 비워두고 저장하면 연결이 해제됩니다.
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
