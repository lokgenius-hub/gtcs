'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, TrendingUp, TrendingDown, Receipt, Loader2, IndianRupee, Calendar } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:4000'
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('hf_token')}` })
const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

type SalesReport = {
  summary: { total_sales: number; total_bills: number; total_gst: number; avg_bill_value: number }
  by_day: { date: string; total: number; bills: number }[]
  by_payment_mode: { payment_mode: string; total: number; count: number }[]
  top_products: { product_name: string; qty_sold: number; total: number }[]
}

export default function PortalReports() {
  const router = useRouter()
  const [report, setReport]  = useState<SalesReport | null>(null)
  const [loading, setLoad]   = useState(true)
  const [err, setErr]        = useState('')
  const [period, setPeriod]  = useState('month') // today | week | month

  useEffect(() => {
    async function load() {
      setLoad(true); setErr('')
      try {
        const res = await fetch(`${API}/api/v1/reports/sales?period=${period}`, { headers: authHeaders() })
        if (res.status === 401) { router.replace('/portal'); return }
        const data = await res.json()
        if (res.ok) setReport(data.data)
        else setErr(data.message || 'Could not load reports')
      } catch {
        setErr('API not reachable. Start saas-backend first.')
      } finally {
        setLoad(false)
      }
    }
    load()
  }, [router, period])

  const PERIODS = [
    { id: 'today', label: 'Today' },
    { id: 'week',  label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ]

  const PAY_COLORS: Record<string, string> = { cash: '#16A34A', upi: '#0066CC', card: '#8B5CF6' }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#0066CC]" /> Reports
        </h1>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${period === p.id ? 'bg-[#0066CC] text-white' : 'text-gray-400 hover:text-white'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading report…</div>}
      {err && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{err}</div>}

      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sales',   value: fmt(report.summary.total_sales),  icon: IndianRupee, color: '#0066CC' },
              { label: 'Total Bills',   value: report.summary.total_bills,        icon: Receipt,     color: '#16A34A' },
              { label: 'Total GST',     value: fmt(report.summary.total_gst),     icon: TrendingUp,  color: '#F59E0B' },
              { label: 'Avg Bill',      value: fmt(report.summary.avg_bill_value),icon: TrendingDown,color: '#8B5CF6' },
            ].map(c => (
              <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: c.color + '20' }}>
                  <c.icon className="w-4 h-4" style={{ color: c.color }} />
                </div>
                <p className="text-lg font-extrabold text-white">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Payment mode breakdown */}
          {report.by_payment_mode?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-bold text-white mb-3">Payment Mode Breakdown</h3>
              <div className="space-y-2">
                {report.by_payment_mode.map(pm => {
                  const pct = report.summary.total_sales > 0
                    ? Math.round((pm.total / report.summary.total_sales) * 100) : 0
                  return (
                    <div key={pm.payment_mode}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-300 capitalize font-medium">{pm.payment_mode}</span>
                        <span className="text-white font-bold">{fmt(pm.total)}
                          <span className="text-gray-500 text-xs font-normal ml-1">({pm.count} bills)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: PAY_COLORS[pm.payment_mode] || '#6B7280' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top products */}
          {report.top_products?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-bold text-white mb-3">Top Selling Products</h3>
              <div className="space-y-2">
                {report.top_products.slice(0, 8).map((p, i) => (
                  <div key={p.product_name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-gray-400 text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-gray-200 truncate max-w-48">{p.product_name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-white font-bold">{fmt(p.total)}</span>
                      <span className="text-gray-500 text-xs ml-1">· {p.qty_sold} sold</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily breakdown */}
          {report.by_day?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" /> Daily Breakdown
              </h3>
              <div className="space-y-1.5">
                {report.by_day.map(d => (
                  <div key={d.date} className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                    <span className="text-gray-400">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <div className="text-right">
                      <span className="text-white font-semibold">{fmt(d.total)}</span>
                      <span className="text-gray-500 text-xs ml-2">{d.bills} bills</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
