import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Button from '../components/ui/Button'
import { fetchBirthYearStats, type BirthYearStat } from '../services/memberDataService'

interface Props {
  onBack: () => void
}

export default function MemberInfoPage({ onBack }: Props) {
  const [stats, setStats] = useState<BirthYearStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const total = useMemo(() => stats.reduce((sum, row) => sum + row.count, 0), [stats])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const rows = await fetchBirthYearStats()
      setStats(rows)
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
          <h1 className="text-lg font-bold text-gray-900">길드원 정보</h1>
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
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 text-sm text-gray-600">
              연생 입력 인원 합계: <span className="font-semibold text-gray-900">{total}명</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 w-56">연생(연도)</th>
                  <th className="px-5 py-3">인원</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.map((row) => (
                  <tr key={row.year} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{row.year}</td>
                    <td className="px-5 py-3 text-gray-700">{row.count}명</td>
                  </tr>
                ))}
                {stats.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-5 py-12 text-center text-sm text-gray-400">
                      연생 데이터가 없습니다.
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
