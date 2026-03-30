import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import GuildPage from './pages/GuildPage'
import UserManagePage from './pages/UserManagePage'
import AuditLogPage from './pages/AuditLogPage'
import MemberChangeLogPage from './pages/MemberChangeLogPage'
import MemberInfoPage from './pages/MemberInfoPage'
import Button from './components/ui/Button'

function AccessDeniedScreen() {
  const { user, signOut } = useAuth()
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
          <span className="font-medium text-gray-700">{user?.email}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">접근 권한이 없습니다. 관리자에게 사용자 등록을 요청해 주세요.</p>

        <Button onClick={signOut} variant="secondary" className="w-full justify-center">
          다른 계정으로 로그인
        </Button>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const [page, setPage] = useState<'guild' | 'users' | 'audit' | 'memberChanges' | 'memberInfo'>('guild')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (!profile) return <AccessDeniedScreen />

  if (page === 'users') {
    return <UserManagePage onBack={() => setPage('guild')} />
  }

  if (page === 'audit') {
    return <AuditLogPage onBack={() => setPage('guild')} />
  }

  if (page === 'memberChanges') {
    return <MemberChangeLogPage onBack={() => setPage('guild')} />
  }

  if (page === 'memberInfo') {
    return <MemberInfoPage onBack={() => setPage('guild')} />
  }

  return (
    <GuildPage
      onNavigateMemberInfo={() => setPage('memberInfo')}
      onNavigateMemberChanges={() => setPage('memberChanges')}
      onNavigateUsers={() => setPage('users')}
      onNavigateAudit={() => setPage('audit')}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
