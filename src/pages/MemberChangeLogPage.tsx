import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Button from '../components/ui/Button'
import { fetchAuditLogs } from '../services/auditLogService'
import type { AuditLogEntry } from '../types'

interface Props {
  onBack: () => void
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
}

function readMetaString(entry: AuditLogEntry, key: string): string {
  const value = entry.meta?.[key]
  return typeof value === 'string' ? value : ''
}

function readAdded(entry: AuditLogEntry): string[] {
  return toTextList(entry.meta?.added)
}

function readRemoved(entry: AuditLogEntry): string[] {
  return toTextList(entry.meta?.removed)
}

function formatDateTime(entry: AuditLogEntry): string {
  if (!entry.createdAt) return '-'
  return entry.createdAt.toDate().toLocaleString('ko-KR', { hour12: false })
}

function formatActor(entry: AuditLogEntry): string {
  return entry.actorName || entry.actorEmail || entry.actorUid || '알 수 없음'
}

export default function MemberChangeLogPage({ onBack }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAuditLogs(800)
      const filtered = data.filter((log) => log.action === 'guild.member.change')
      setLogs(filtered)
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
          <h1 className="text-lg font-bold text-gray-900">길드원 변경 내용</h1>
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
                  <th className="px-5 py-3 w-48">시각</th>
                  <th className="px-5 py-3 w-44">길드</th>
                  <th className="px-5 py-3 w-44">동기화 사용자</th>
                  <th className="px-5 py-3">변경 내용</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const added = readAdded(log)
                  const removed = readRemoved(log)
                  const guildName = readMetaString(log, 'guildName')
                  const worldName = readMetaString(log, 'worldName')

                  return (
                    <tr key={log.id} className="align-top hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-500">{formatDateTime(log)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{guildName || '-'}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{worldName || '-'}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{formatActor(log)}</td>
                      <td className="px-5 py-3">
                        {added.length > 0 && (
                          <p className="text-xs text-green-700">
                            추가 {added.length}명: {added.slice(0, 8).join(', ')}{added.length > 8 ? ' 외' : ''}
                          </p>
                        )}
                        {removed.length > 0 && (
                          <p className="mt-1 text-xs text-red-600">
                            제외 {removed.length}명: {removed.slice(0, 8).join(', ')}{removed.length > 8 ? ' 외' : ''}
                          </p>
                        )}
                        {(added.length === 0 && removed.length === 0) && (
                          <p className="text-xs text-gray-400">변경 없음</p>
                        )}
                      </td>
                    </tr>
                  )
                })}
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
