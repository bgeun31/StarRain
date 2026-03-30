import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Button from '../components/ui/Button'
import { fetchAuditLogs } from '../services/auditLogService'
import type { AuditLogEntry } from '../types'

interface Props {
  onBack: () => void
}

function formatDateTime(entry: AuditLogEntry): string {
  if (!entry.createdAt) return '-'
  return entry.createdAt.toDate().toLocaleString('ko-KR', { hour12: false })
}

function formatActor(entry: AuditLogEntry): string {
  return entry.actorName || entry.actorEmail || entry.actorUid || '알 수 없음'
}

export default function AuditLogPage({ onBack }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAuditLogs()
      setLogs(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex w-full items-center gap-3 px-6 py-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={16} />
            돌아가기
          </button>
          <h1 className="text-lg font-bold text-gray-900">수정 내용</h1>
          <div className="flex-1" />
          <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            새로고침
          </Button>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : error ? (
          <p className="py-12 text-center text-sm text-red-500">{error}</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 w-52">시각</th>
                  <th className="px-5 py-3 w-52">사용자</th>
                  <th className="px-5 py-3">작업</th>
                  <th className="px-5 py-3 w-56">대상</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-500">{formatDateTime(log)}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{formatActor(log)}</p>
                      {(log.actorEmail && log.actorName) && (
                        <p className="mt-0.5 text-xs text-gray-400">{log.actorEmail}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-800">{log.message}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{log.action}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 break-all">
                      {log.targetType && log.targetId ? `${log.targetType} / ${log.targetId}` : '-'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                      기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
