'use client'
import { useEffect, useState, useCallback } from 'react'
import { portalSupabase, PLAN_COLORS, PLAN_LABELS } from '@/lib/portal-db'
import {
  RefreshCw, Users, ShoppingCart, TrendingUp, Bell,
  AlertTriangle, Activity, CheckCircle2, Clock
} from 'lucide-react'

/* ── Types ───────────────────────────────────────────────────────────────── */
interface TenantSummary {
  tenantId: string
  name: string
  plan: string
  email: string
  ordersToday: number
  revenueToday: number
  pendingOrders: number
  thirdPartyNew: number
  lastOrderAt: string | null
}

interface GlobalStats {
  totalTenants: number
  totalOrdersToday: number
  totalRevenueToday: number
  totalPending: number
  totalThirdPartyNew: number
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function planBadge(plan: string) {
  const color = PLAN_COLORS[plan] ?? '#6B7280'
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '22', color }}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  )
}

function fmtINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [tenants, setTenants]   = useState<TenantSummary[]>([])
  const [stats, setStats]       = useState<GlobalStats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLast]  = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      // 1. All tenant names + emails from site_config
      const { data: cfgAll } = await portalSupabase
        .from('site_config')
        .select('tenant_id, config_key, config_value')
        .in('config_key', ['hotel_name', 'notify_email'])

      // 2. Auth users (to get plan from metadata)
      //    We can't query auth.users directly from client — read plan from site_config or pos_orders
      //    We'll also check if there's a config key 'plan' stored (we'll add that in new customer flow)
      const { data: planCfg } = await portalSupabase
        .from('site_config')
        .select('tenant_id, config_value')
        .eq('config_key', 'plan')

      // 3. Today's POS orders (all tenants)
      const { data: posToday } = await portalSupabase
        .from('pos_orders')
        .select('tenant_id, total, status, created_at')
        .gte('created_at', todayStart.toISOString())

      // 4. All pending POS orders
      const { data: posPending } = await portalSupabase
        .from('pos_orders')
        .select('tenant_id')
        .eq('status', 'pending')

      // 5. New third_party_orders
      const { data: tpNew } = await portalSupabase
        .from('third_party_orders')
        .select('tenant_id')
        .eq('status', 'new')
        .eq('is_read', false)

      // 6. Last order per tenant
      const { data: lastOrders } = await portalSupabase
        .from('pos_orders')
        .select('tenant_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200)

      // Build config maps
      const nameMap: Record<string, string> = {}
      const emailMap: Record<string, string> = {}
      for (const c of (cfgAll ?? [])) {
        if (c.config_key === 'hotel_name') nameMap[c.tenant_id] = c.config_value ?? c.tenant_id
        if (c.config_key === 'notify_email') emailMap[c.tenant_id] = c.config_value ?? ''
      }

      const planMap: Record<string, string> = {}
      for (const c of (planCfg ?? [])) {
        planMap[c.tenant_id] = c.config_value ?? 'starter'
      }

      // Collect unique tenant IDs from all sources
      const allIds = new Set<string>([
        ...Object.keys(nameMap),
        ...(posToday ?? []).map(r => r.tenant_id),
        ...(posPending ?? []).map(r => r.tenant_id),
        ...(tpNew ?? []).map(r => r.tenant_id),
      ])
      // Exclude mysharda / test tenants if desired
      allIds.delete('sharda')
      allIds.delete('raj-darbar')

      // Build tenant summaries
      const todayRevMap: Record<string, number> = {}
      const todayOrdMap: Record<string, number> = {}
      for (const o of (posToday ?? [])) {
        todayRevMap[o.tenant_id] = (todayRevMap[o.tenant_id] ?? 0) + Number(o.total ?? 0)
        todayOrdMap[o.tenant_id] = (todayOrdMap[o.tenant_id] ?? 0) + 1
      }

      const pendMap: Record<string, number> = {}
      for (const o of (posPending ?? [])) {
        pendMap[o.tenant_id] = (pendMap[o.tenant_id] ?? 0) + 1
      }

      const tpMap: Record<string, number> = {}
      for (const o of (tpNew ?? [])) {
        tpMap[o.tenant_id] = (tpMap[o.tenant_id] ?? 0) + 1
      }

      const lastMap: Record<string, string> = {}
      for (const o of (lastOrders ?? [])) {
        if (!lastMap[o.tenant_id]) lastMap[o.tenant_id] = o.created_at
      }

      const list: TenantSummary[] = Array.from(allIds).map(tid => ({
        tenantId: tid,
        name: nameMap[tid] ?? tid,
        plan: planMap[tid] ?? 'starter',
        email: emailMap[tid] ?? '',
        ordersToday: todayOrdMap[tid] ?? 0,
        revenueToday: todayRevMap[tid] ?? 0,
        pendingOrders: pendMap[tid] ?? 0,
        thirdPartyNew: tpMap[tid] ?? 0,
        lastOrderAt: lastMap[tid] ?? null,
      })).sort((a, b) => (b.ordersToday - a.ordersToday) || a.name.localeCompare(b.name))

      setTenants(list)
      setStats({
        totalTenants: list.length,
        totalOrdersToday: list.reduce((s, t) => s + t.ordersToday, 0),
        totalRevenueToday: list.reduce((s, t) => s + t.revenueToday, 0),
        totalPending: list.reduce((s, t) => s + t.pendingOrders, 0),
        totalThirdPartyNew: list.reduce((s, t) => s + t.thirdPartyNew, 0),
      })
      setLast(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            All HospiFlow customers · auto-refreshes every 30s
            {lastRefresh && (
              <span className="ml-2 text-gray-500">· updated {fmtTime(lastRefresh.toISOString())}</span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Global stat tiles */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { label: 'Customers',       value: stats.totalTenants,    icon: Users,         color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Orders Today',    value: stats.totalOrdersToday, icon: ShoppingCart, color: 'text-green-400',  bg: 'bg-green-500/10'  },
            { label: 'Revenue Today',   value: fmtINR(stats.totalRevenueToday), icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Pending Alerts',  value: stats.totalPending,    icon: Bell,          color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'New 3rd-Party',   value: stats.totalThirdPartyNew, icon: Activity,   color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map(tile => (
            <div key={tile.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className={`inline-flex p-2 rounded-xl ${tile.bg} mb-3`}>
                <tile.icon className={`w-4 h-4 ${tile.color}`} />
              </div>
              <div className="text-xl font-bold text-white">{tile.value}</div>
              <div className="text-gray-400 text-xs mt-0.5">{tile.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Customers table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            All Customers
          </h2>
          <span className="text-gray-400 text-xs">{tenants.length} active</span>
        </div>

        {loading && tenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No customers found. Run seed SQL first.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Customer', 'Plan', 'Orders Today', 'Revenue Today', 'Pending', '3rd-Party', 'Last Activity'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.tenantId} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-gray-500 text-xs font-mono">{t.tenantId}</div>
                      {t.email && <div className="text-gray-600 text-xs">{t.email}</div>}
                    </td>
                    <td className="px-4 py-3">{planBadge(t.plan)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${t.ordersToday > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                        {t.ordersToday}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-yellow-300 font-medium">
                      {t.revenueToday > 0 ? fmtINR(t.revenueToday) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {t.pendingOrders > 0 ? (
                        <span className="inline-flex items-center gap-1 text-orange-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" /> {t.pendingOrders}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-gray-700" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.thirdPartyNew > 0 ? (
                        <span className="inline-flex items-center gap-1 text-purple-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> {t.thirdPartyNew}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmtTime(t.lastOrderAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
