import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import GuildPage from './pages/GuildPage'
import UserManagePage from './pages/UserManagePage'
import AuditLogPage from './pages/AuditLogPage'
import Button from './components/ui/Button'

function BootstrapScreen() {
  const { user, setupAdmin, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSetup() {
    setLoading(true)
    setError('')
    try {
      await setupAdmin()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg">
            <img src="/icon.jpg" alt="별비" className="h-10 w-10 rounded-full object-cover" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">별비 길드 관리 시스템</h2>
        <p className="text-sm text-gray-500 mb-1">
          <span className="font-medium text-gray-700">{user?.email}</span> 계정에
        </p>
        <p className="text-sm text-gray-500 mb-6">관리자 권한을 부여합니다.</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button onClick={handleSetup} disabled={loading} className="w-full justify-center mb-3">
          {loading ? '설정 중...' : '관리자로 시작하기'}
        </Button>
        <button
          onClick={signOut}
          className="flex items-center justify-center gap-1 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <LogOut size={14} />
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading, bootstrapping } = useAuth()
  const [page, setPage] = useState<'guild' | 'users' | 'audit'>('guild')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  // 로그인됐지만 Firestore 프로필 없음 → 부트스트랩
  if (bootstrapping || !profile) return <BootstrapScreen />

  if (page === 'users') {
    return <UserManagePage onBack={() => setPage('guild')} />
  }

  if (page === 'audit') {
    return <AuditLogPage onBack={() => setPage('guild')} />
  }

  return <GuildPage onNavigateUsers={() => setPage('users')} onNavigateAudit={() => setPage('audit')} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
