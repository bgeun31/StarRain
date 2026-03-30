import { useEffect, useState } from 'react'
import { ArrowLeft, UserPlus, Trash2, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { fetchAllUsers, createUser, updateUserRole, deleteUser } from '../services/userService'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { UserProfile, UserRole } from '../types'

const ROLE_COLOR: Record<UserRole, string> = {
  viewer: 'bg-gray-100 text-gray-600',
  editor: 'bg-blue-100 text-blue-700',
  admin:  'bg-amber-100 text-amber-800',
}

interface Props {
  onBack: () => void
}

export default function UserManagePage({ onBack }: Props) {
  const { profile: myProfile } = useAuth()
  const [users, setUsers]                = useState<UserProfile[]>([])
  const [loading, setLoading]            = useState(true)
  const [showAdd, setShowAdd]            = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllUsers()
      setUsers(data.sort((a, b) => a.email.localeCompare(b.email)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleRoleChange(uid: string, role: UserRole) {
    if (uid === myProfile?.uid) {
      alert('자신의 권한은 변경할 수 없습니다.')
      return
    }
    await updateUserRole(uid, role)
    await load()
  }

  async function handleDelete(u: UserProfile) {
    if (u.uid === myProfile?.uid) {
      alert('자신의 계정은 삭제할 수 없습니다.')
      return
    }
    if (!confirm(`"${u.displayName || u.email}" 계정을 삭제하시겠습니까?\n해당 사용자는 더 이상 로그인할 수 없습니다.`)) return
    await deleteUser(u.uid)
    await load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex w-full items-center gap-3 px-6 py-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={16} />
            돌아가기
          </button>
          <div className="flex-1" />
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} />
            사용자 추가
          </Button>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">이름 / 이메일</th>
                  <th className="px-5 py-3">권한</th>
                  <th className="px-5 py-3 w-48 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{u.displayName || '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        disabled={u.uid === myProfile?.uid}
                        className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 disabled:cursor-default ${ROLE_COLOR[u.role]}`}
                      >
                        <option value="viewer">뷰어</option>
                        <option value="editor">편집자</option>
                        <option value="admin">관리자</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.uid === myProfile?.uid ? (
                          <Button size="sm" variant="secondary" onClick={() => setShowChangePassword(true)}>
                            <KeyRound size={14} />
                            비밀번호 변경
                          </Button>
                        ) : (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="사용자 삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-sm text-gray-400">
                      등록된 사용자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showAdd && (
        <AddUserModal onClose={() => setShowAdd(false)} onSaved={load} />
      )}
      {showChangePassword && (
        <ChangeMyPasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  )
}

function AddUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole]             = useState<UserRole>('viewer')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createUser(email, password, displayName, role)
      onSaved()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(msg.includes('email-already-in-use') ? '이미 사용 중인 이메일입니다.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="사용자 추가" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="홍길동"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">초기 비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="6자 이상"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">권한</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="viewer">뷰어 — 읽기 전용</option>
            <option value="editor">편집자 — 부캐 관리 가능</option>
            <option value="admin">관리자 — 사용자 관리 포함 전체 권한</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={loading}>
            {loading ? '생성 중...' : '사용자 추가'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ChangeMyPasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 합니다.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }
    if (currentPassword === newPassword) {
      setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await changePassword(currentPassword, newPassword)
      alert('비밀번호가 변경되었습니다.')
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('현재 비밀번호가 올바르지 않습니다.')
      } else if (msg.includes('too-many-requests')) {
        setError('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="비밀번호 변경" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="6자 이상"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={loading}>
            {loading ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
