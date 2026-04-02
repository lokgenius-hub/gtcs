'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Receipt, Package, Users, IndianRupee, Loader2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { portalSupabase, getPortalSession } from '@/lib/portal-db'

type Stats = {
  today_sales: number; today_bills: number
  month_sales: number; month_bills: number
  total_products: number; total_customers: number
}

export default function PortalDashboard() {
  const router = useRouter()
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoad]  = useState(true)
  const [err, setErr]       = useState('')

  useEffect(() => {
    async function load() {
      try {
        const sess = await getPortalSession()
        if (!sess) { router.replace('/portal'); return }
        const tid = sess.tenantId

        const today     = new Date().toISOString().slice(0, 10)          // YYYY-MM-DD
        const monthStart = today.slice(0, 7) + '-01'                     // YYYY-MM-01

        const [todayRes, monthRes, menuRes, custRes] = await Promise.all([
          portalSupabase.from('pos_orders').select('total').eq('tenant_id', tid).eq('status', 'paid').gte('created_at', today),
          portalSupabase.from('pos_orders').select('total').eq('tenant_id', tid).eq('status', 'paid').gte('created_at', monthStart),
          portalSupabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).eq('is_active', true),
          portalSupabase.from('coin_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
        ])

        const todaySales = (todayRes.data ?? []).reduce((s: number, o: { total: number }) => s + Number(o.total), 0)
        const monthSales = (monthRes.data ?? []).reduce((s: number, o: { total: number }) => s + Number(o.total), 0)

        setStats({
          today_sales:    todaySales,
          today_bills:    todayRes.data?.length ?? 0,
          month_sales:    monthSales,
          month_bills:    monthRes.data?.length ?? 0,
          total_products: menuRes.count ?? 0,
          total_customers: custRes.count ?? 0,
        })
      } catch {
        setErr('Could not load dashboard data.')
      } finally {
        setLoad(false)
      }
    }
    load()
  }, [router])

  const fmt = (n: number) => `₹${n?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? 0}`

  const CARDS = stats ? [
    { label: "Today's Sales",    value: fmt(stats.today_sales),   sub: `${stats.today_bills} bills`,  icon: IndianRupee, color: '#0066CC' },
    { label: 'This Month',       value: fmt(stats.month_sales),   sub: `${stats.month_bills} bills`,  icon: TrendingUp,  color: '#16A34A' },
    { label: 'Products',         value: stats.total_products,     sub: 'active items',                icon: Package,     color: '#F59E0B' },
    { label: 'Customers',        value: stats.total_customers,    sub: 'loyalty members',             icon: Users,       color: '#8B5CF6' },
  ] : []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-extrabold text-white mb-6">Dashboard</h1>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading stats…
        </div>
      )}

      {err && <p className="text-red-400 text-sm">{err}</p>}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {CARDS.map(card => (
              <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: card.color + '20' }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <p className="text-xl font-extrabold text-white">{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <h2 className="text-sm font-bold text-gray-400 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: '/portal/pos',       label: 'New Bill',       icon: ShoppingCart, color: '#FF6600' },
              { href: '/portal/products',  label: 'Add Product',    icon: Package,      color: '#0066CC' },
              { href: '/portal/customers', label: 'New Customer',   icon: Users,        color: '#16A34A' },
              { href: '/portal/reports',   label: 'View Reports',   icon: TrendingUp,   color: '#8B5CF6' },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl p-4 transition-all">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: a.color + '20' }}>
                  <a.icon className="w-4 h-4" style={{ color: a.color }} />
                </div>
                <span className="text-sm font-semibold text-white">{a.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
