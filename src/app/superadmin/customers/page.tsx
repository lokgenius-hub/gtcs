'use client'
import { useEffect, useState, useCallback } from 'react'
import { portalSupabase, PLAN_COLORS, PLAN_LABELS, PLAN_MODULES } from '@/lib/portal-db'
import {
  Users, Plus, Search, RefreshCw, X, Edit3, Save, Copy, CheckCheck,
  ChevronDown, ChevronRight, Loader2, AlertTriangle, Package, UserCheck,
  ShoppingCart, TrendingUp, Building2, Mail, Phone, MapPin, Settings, Eye
} from 'lucide-react'

/* ── Types ───────────────────────────────────────────────────────────────── */
interface ConfigRow { key: string; value: string }
interface CustomerDetail {
  tenantId: string
  config: Record<string, string>
  ordersTotal: number
  revenueTotal: number
  ordersToday: number
  revenueToday: number
  staffCount: number
  inventoryLow: number
  recentOrders: Array<{ order_number: string; total: number; status: string; created_at: string; customer_name: string }>
}

const PLANS = ['starter', 'growth', 'pro', 'enterprise'] as const

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function PlanBadge({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] ?? '#6B7280'
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '22', color }}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  )
}
function fmtINR(n: number) { return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
function statusColor(s: string) {
  return s === 'paid' ? 'text-green-400' : s === 'pending' ? 'text-orange-400' : 'text-red-400'
}

/* ── New Customer SQL Generator ────────────────────────────────────────────── */
function generateSQL(form: Record<string, string>) {
  const tid  = form.tenant_id
  const plan = form.plan ?? 'starter'
  const pw   = form.password ?? 'Demo@1234'
  return `-- ⚠  BEFORE running this SQL:
--    1. Go to Supabase Dashboard → Authentication → Users → Add User
--    2. Email: ${form.email}  |  Password: ${pw}  |  ✅ Auto Confirm Email
--    3. Then run the SQL below:

-- STEP 1: Set tenant metadata on the auth user
UPDATE auth.users
SET raw_user_meta_data = '{"tenant_id":"${tid}","plan":"${plan}","name":"${form.hotel_name ?? tid}"}'::jsonb
WHERE email = '${form.email}';

-- STEP 2: Site config
INSERT INTO site_config (tenant_id, config_key, config_value) VALUES
  ('${tid}', 'hotel_name',    '${form.hotel_name ?? tid}'),
  ('${tid}', 'notify_email',  '${form.email}'),
  ('${tid}', 'business_type', '${form.business_type ?? 'restaurant'}'),
  ('${tid}', 'phone',         '${form.phone ?? ''}'),
  ('${tid}', 'address',       '${form.address ?? ''}'),
  ('${tid}', 'plan',          '${plan}')
ON CONFLICT (tenant_id, config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
`
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function CustomersPage() {
  const [tenants, setTenants]     = useState<Array<{tenantId:string; name:string; plan:string; email:string; businessType:string}>>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<CustomerDetail | null>(null)
  const [detailLoading, setDL]    = useState(false)
  const [editConfig, setEditConf] = useState<ConfigRow[]>([])
  const [saving, setSaving]       = useState(false)
  const [saveOk, setSaveOk]       = useState(false)
  const [showAdd, setShowAdd]     = useState(false)
  const [addForm, setAddForm]     = useState<Record<string,string>>({ plan: 'starter', business_type: 'restaurant', password: 'Demo@1234' })
  const [genSQL, setGenSQL]       = useState('')
  const [copied, setCopied]       = useState(false)

  /* ── Load tenant list ──────────────────────────────────────────────────── */
  const loadTenants = useCallback(async () => {
    setLoading(true)
    const { data } = await portalSupabase
      .from('site_config')
      .select('tenant_id, config_key, config_value')
      .in('config_key', ['hotel_name', 'notify_email', 'plan', 'business_type'])

    const byTenant: Record<string, Record<string, string>> = {}
    for (const row of (data ?? [])) {
      if (!byTenant[row.tenant_id]) byTenant[row.tenant_id] = {}
      byTenant[row.tenant_id][row.config_key] = row.config_value ?? ''
    }

    const exclude = new Set(['sharda', 'raj-darbar'])
    const list = Object.entries(byTenant)
      .filter(([tid]) => !exclude.has(tid) && byTenant[tid].hotel_name)
      .map(([tid, cfg]) => ({
        tenantId: tid,
        name: cfg.hotel_name ?? tid,
        plan: cfg.plan ?? 'starter',
        email: cfg.notify_email ?? '',
        businessType: cfg.business_type ?? 'restaurant',
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    setTenants(list)
    setLoading(false)
  }, [])

  useEffect(() => { loadTenants() }, [loadTenants])

  /* ── Load customer detail ─────────────────────────────────────────────── */
  async function loadDetail(tenantId: string) {
    setDL(true)
    setSelected(null)

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const iso = todayStart.toISOString()

    const [cfgRes, ordAllRes, ordTodayRes, staffRes, invRes, recentRes] = await Promise.all([
      portalSupabase.from('site_config').select('config_key, config_value').eq('tenant_id', tenantId),
      portalSupabase.from('pos_orders').select('total').eq('tenant_id', tenantId).eq('status', 'paid'),
      portalSupabase.from('pos_orders').select('total').eq('tenant_id', tenantId).gte('created_at', iso),
      portalSupabase.from('staff_members').select('id').eq('tenant_id', tenantId).eq('is_active', true),
      portalSupabase.from('inventory_items').select('id').eq('tenant_id', tenantId).eq('is_active', true).filter('current_stock', 'lte', 'min_stock'),
      portalSupabase.from('pos_orders').select('order_number, total, status, created_at, customer_name').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
    ])

    const config: Record<string, string> = {}
    for (const r of (cfgRes.data ?? [])) config[r.config_key] = r.config_value ?? ''

    const detail: CustomerDetail = {
      tenantId,
      config,
      ordersTotal: ordAllRes.data?.length ?? 0,
      revenueTotal: (ordAllRes.data ?? []).reduce((s, r) => s + Number(r.total), 0),
      ordersToday: ordTodayRes.data?.length ?? 0,
      revenueToday: (ordTodayRes.data ?? []).reduce((s, r) => s + Number(r.total), 0),
      staffCount: staffRes.data?.length ?? 0,
      inventoryLow: invRes.data?.length ?? 0,
      recentOrders: recentRes.data ?? [],
    }
    setSelected(detail)
    setEditConf(Object.entries(config).map(([key, value]) => ({ key, value })))
    setDL(false)
  }

  /* ── Save config edits ─────────────────────────────────────────────────── */
  async function saveConfig() {
    if (!selected) return
    setSaving(true)
    const upserts = editConfig.map(({ key, value }) => ({
      tenant_id: selected.tenantId,
      config_key: key,
      config_value: value,
    }))
    await portalSupabase.from('site_config').upsert(upserts, { onConflict: 'tenant_id,config_key' })
    setSaving(false)
    setSaveOk(true)
    await loadTenants()
    setTimeout(() => setSaveOk(false), 2000)
  }

  /* ── Copy SQL ───────────────────────────────────────────────────────────── */
  function copySQL() {
    const sql = generateSQL(addForm)
    setGenSQL(sql)
    navigator.clipboard?.writeText(sql).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.tenantId.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-gray-400 text-sm mt-0.5">{tenants.length} tenant{tenants.length !== 1 ? 's' : ''} on HospiFlow</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadTenants} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowAdd(true); setAddForm({ plan: 'starter', business_type: 'restaurant', password: 'Demo@1234' }); setGenSQL('') }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, tenant ID, or email…"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
        />
      </div>

      <div className="flex gap-5 flex-col lg:flex-row">
        {/* Customer list */}
        <div className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-shrink-0 ${selected ? 'lg:w-80' : 'w-full'}`}>
          {loading ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No customers found</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filtered.map(t => (
                <button
                  key={t.tenantId}
                  onClick={() => loadDetail(t.tenantId)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-800/60 transition-colors flex items-center justify-between group ${
                    selected?.tenantId === t.tenantId ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-white text-sm truncate">{t.name}</div>
                    <div className="text-gray-500 text-xs font-mono">{t.tenantId}</div>
                    {t.email && <div className="text-gray-600 text-xs truncate">{t.email}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <PlanBadge plan={t.plan} />
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {detailLoading && (
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}

        {selected && !detailLoading && (
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.config.hotel_name ?? selected.tenantId}</h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <PlanBadge plan={selected.config.plan ?? 'starter'} />
                    <span className="text-gray-400 text-xs font-mono">{selected.tenantId}</span>
                    {selected.config.business_type && (
                      <span className="text-gray-400 text-xs capitalize">{selected.config.business_type}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {selected.config.notify_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selected.config.notify_email}</span>}
                    {selected.config.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selected.config.phone}</span>}
                    {selected.config.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.config.address}</span>}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Metric tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Orders Today', value: selected.ordersToday, icon: ShoppingCart, color: 'text-green-400' },
                  { label: 'Revenue Today', value: fmtINR(selected.revenueToday), icon: TrendingUp, color: 'text-yellow-400' },
                  { label: 'Active Staff', value: selected.staffCount, icon: UserCheck, color: 'text-blue-400' },
                  { label: 'Low Stock Items', value: selected.inventoryLow, icon: Package, color: selected.inventoryLow > 0 ? 'text-red-400' : 'text-gray-500' },
                ].map(tile => (
                  <div key={tile.label} className="bg-gray-800 rounded-xl p-3 text-center">
                    <tile.icon className={`w-4 h-4 mx-auto mb-1 ${tile.color}`} />
                    <div className="text-white font-bold text-lg">{tile.value}</div>
                    <div className="text-gray-500 text-xs">{tile.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan features */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" /> Active Modules
              </h3>
              <div className="flex flex-wrap gap-2">
                {(PLAN_MODULES[selected.config.plan ?? 'starter'] ?? PLAN_MODULES.starter).map(m => (
                  <span key={m} className="text-xs bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-full capitalize">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Config editor */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-400" /> Site Config
                </h3>
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saveOk ? <CheckCheck className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                  {saving ? 'Saving…' : saveOk ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {editConfig.map((row, i) => (
                  <div key={row.key} className="flex gap-2 items-center">
                    <span className="text-gray-500 text-xs font-mono w-36 flex-shrink-0 truncate" title={row.key}>{row.key}</span>
                    <input
                      value={row.value}
                      onChange={e => setEditConf(prev => prev.map((r, j) => j === i ? { ...r, value: e.target.value } : r))}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 min-w-0"
                    />
                  </div>
                ))}
                {/* Add new config key */}
                <button
                  onClick={() => setEditConf(prev => [...prev, { key: '', value: '' }])}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-2"
                >
                  <Plus className="w-3 h-3" /> Add config row
                </button>
              </div>
            </div>

            {/* Recent orders */}
            {selected.recentOrders.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-indigo-400" /> Recent Orders
                </h3>
                <div className="space-y-1.5">
                  {selected.recentOrders.slice(0, 8).map(o => (
                    <div key={o.order_number} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50">
                      <div>
                        <span className="text-gray-300 font-mono">{o.order_number}</span>
                        <span className="text-gray-500 ml-2">{o.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-300">{fmtINR(Number(o.total))}</span>
                        <span className={`capitalize ${statusColor(o.status)}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Customer modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" /> Add New Customer
              </h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Form grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: 'tenant_id',     label: 'Tenant ID *',       placeholder: 'e.g. spice_garden', hint: 'lowercase, underscores, unique' },
                  { field: 'hotel_name',    label: 'Business Name *',   placeholder: 'e.g. Spice Garden Restaurant' },
                  { field: 'email',         label: 'Login Email *',     placeholder: 'admin@spicegarden.com' },
                  { field: 'password',      label: 'Initial Password',  placeholder: 'Demo@1234' },
                  { field: 'phone',         label: 'Phone',             placeholder: '+91-9800000000' },
                  { field: 'address',       label: 'Address',           placeholder: 'City, State' },
                ].map(({ field, label, placeholder, hint }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                    <input
                      value={addForm[field] ?? ''}
                      onChange={e => setAddForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    {hint && <p className="text-gray-600 text-xs mt-0.5">{hint}</p>}
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Plan</label>
                  <select
                    value={addForm.plan ?? 'starter'}
                    onChange={e => setAddForm(p => ({ ...p, plan: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Business Type</label>
                  <select
                    value={addForm.business_type ?? 'restaurant'}
                    onChange={e => setAddForm(p => ({ ...p, business_type: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {['restaurant', 'hotel', 'cafe', 'resort', 'canteen', 'other'].map(bt => (
                      <option key={bt} value={bt} className="capitalize">{bt.charAt(0).toUpperCase() + bt.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Plan modules preview */}
              {addForm.plan && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="text-xs font-medium text-gray-400 mb-2">Modules included in <strong className="text-white">{PLAN_LABELS[addForm.plan]}</strong> plan:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {PLAN_MODULES[addForm.plan]?.map(m => (
                      <span key={m} className="text-xs bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full capitalize">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate SQL button */}
              <div className="flex gap-3">
                <button
                  onClick={copySQL}
                  disabled={!addForm.tenant_id || !addForm.email}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to clipboard!' : 'Generate & Copy SQL'}
                </button>
              </div>

              {/* SQL preview */}
              {genSQL && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400 font-medium">SQL to run in Supabase SQL Editor:</p>
                    <a
                      href="https://supabase.com/dashboard/project/kproecqyclgujzmskqko/sql/new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Open SQL Editor ↗
                    </a>
                  </div>
                  <pre className="bg-gray-950 border border-gray-700 rounded-xl p-4 text-xs text-green-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                    {genSQL}
                  </pre>
                  <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    After running SQL, the customer can log in at <strong>/portal</strong> immediately.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
