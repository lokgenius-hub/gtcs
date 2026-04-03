'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, Loader2, CheckCircle2, XCircle, Clock, RefreshCw,
  Utensils, Building2, ChevronDown, ChevronUp, BellOff, AlertTriangle,
} from 'lucide-react'
import { portalSupabase, getPortalSession, type ThirdPartyOrder, type PosOrder } from '@/lib/portal-db'

// ── Platform helpers ──────────────────────────────────────────────────────────
const PLATFORM_META: Record<string, { label: string; color: string }> = {
  zomato:  { label: 'Zomato',  color: '#E23744' },
  swiggy:  { label: 'Swiggy',  color: '#FC8019' },
  petpuja: { label: 'PetPuja', color: '#16A34A' },
  manual:  { label: 'Manual',  color: '#6B7280' },
}
function pmeta(p: string) {
  return PLATFORM_META[p.toLowerCase()] ?? { label: p, color: '#6B7280' }
}

// Food-only platforms — hotel/OTA bookings go to /portal/bookings
const FOOD_PLATFORMS = ['zomato', 'swiggy', 'petpuja', 'manual']

const STATUS_ORDER = ['new', 'acknowledged', 'preparing', 'completed', 'cancelled']
const STATUS_COLORS: Record<string, string> = {
  new:          '#EF4444',
  acknowledged: '#F59E0B',
  preparing:    '#0066CC',
  completed:    '#16A34A',
  cancelled:    '#6B7280',
}
// Human-readable labels for status buttons
const STATUS_LABELS: Record<string, string> = {
  acknowledged: 'Acknowledge',
  preparing:    'Start Preparing',
  completed:    'Mark Delivered',
  cancelled:    'Cancel',
}

function parseItems(raw: unknown): { name: string; qty?: number; price: number }[] {
  if (!raw) return []
  try {
    const arr = Array.isArray(raw) ? raw : JSON.parse(raw as string)
    return arr as { name: string; qty?: number; price: number }[]
  } catch { return [] }
}

// ── Alarm ─────────────────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null
function getCtx() {
  if (typeof window === 'undefined') return null
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch { return null }
  }
  return _ctx
}
function playAlarm() {
  try {
    const ctx = getCtx(); if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    const beep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq; osc.type = 'sine'
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur)
    }
    beep(880, 0, 0.12); beep(1100, 0.15, 0.12); beep(880, 0.30, 0.12); beep(1100, 0.45, 0.20)
  } catch { /* blocked by browser */ }
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PortalOrders() {
  const router = useRouter()
  const [tenantId, setTid]      = useState('')
  const [tpOrders, setTpOrders] = useState<ThirdPartyOrder[]>([])
  const [qrOrders, setQrOrders] = useState<PosOrder[]>([])
  const [loading,  setLoad]     = useState(true)
  const [tab,      setTab]      = useState<'all'|'new'|'inprogress'|'done'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [alarmOn,  setAlarmOn]  = useState(true)
  const [updateErr, setUpdateErr] = useState<string | null>(null)
  const alarmRef  = useRef(true)
  const tenantRef = useRef('')

  const load = useCallback(async (tid: string) => {
    const [tpRes, qrRes] = await Promise.all([
      portalSupabase.from('third_party_orders').select('*')
        .eq('tenant_id', tid)
        .in('platform', FOOD_PLATFORMS)
        .order('created_at', { ascending: false })
        .limit(100),
      portalSupabase.from('pos_orders').select('*')
        .eq('tenant_id', tid)
        .in('status', ['pending', 'in-progress'])
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setTpOrders(tpRes.data ?? [])
    setQrOrders(qrRes.data ?? [])
  }, [])

  useEffect(() => {
    getPortalSession().then(sess => {
      if (!sess) { router.replace('/portal'); return }
      tenantRef.current = sess.tenantId
      setTid(sess.tenantId)
      load(sess.tenantId).finally(() => setLoad(false))
    })
  }, [router, load])

  // Realtime + alarm
  useEffect(() => {
    if (!tenantId) return
    const unlock = () => { const c = getCtx(); if (c?.state === 'suspended') c.resume() }
    window.addEventListener('click', unlock, { once: true })

    const ch = portalSupabase.channel(`food-orders-${tenantId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'third_party_orders', filter: `tenant_id=eq.${tenantId}` },
        (payload: { new: ThirdPartyOrder }) => {
          if (FOOD_PLATFORMS.includes((payload.new?.platform || '').toLowerCase())) {
            load(tenantId)
            if (alarmRef.current) playAlarm()
          }
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pos_orders', filter: `tenant_id=eq.${tenantId}` },
        () => {
          // Fire on ANY new QR/table order for this tenant — no status filter
          load(tenantId)
          if (alarmRef.current) playAlarm()
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pos_orders', filter: `tenant_id=eq.${tenantId}` },
        () => load(tenantId))
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'third_party_orders', filter: `tenant_id=eq.${tenantId}` },
        () => load(tenantId))
      .subscribe()

    return () => {
      window.removeEventListener('click', unlock)
      portalSupabase.removeChannel(ch)
    }
  }, [tenantId, load])

  const toggleAlarm = () => {
    setAlarmOn(prev => { alarmRef.current = !prev; return !prev })
  }

  const updateTP = useCallback(async (id: string, status: string) => {
    setUpdateErr(null)
    setUpdating(id)
    const tid = tenantRef.current
    const { error } = await portalSupabase.from('third_party_orders')
      .update({ status, is_read: true }).eq('id', id).eq('tenant_id', tid)
    if (error) {
      console.error('[updateTP]', error)
      setUpdateErr(
        error.code === '42501'
          ? 'Permission denied — run migration-portal-rls.sql in Supabase SQL Editor.'
          : error.message
      )
    } else {
      await load(tid)
    }
    setUpdating(null)
  }, [load])

  const updateQR = useCallback(async (id: string, status: string) => {
    setUpdateErr(null)
    setUpdating(id)
    const tid = tenantRef.current
    const { error } = await portalSupabase.from('pos_orders')
      .update({ status }).eq('id', id).eq('tenant_id', tid)
    if (error) {
      console.error('[updateQR]', error)
      setUpdateErr(
        error.code === '42501'
          ? 'Permission denied — run migration-portal-rls.sql in Supabase SQL Editor.'
          : error.message
      )
    } else {
      await load(tid)
    }
    setUpdating(null)
  }, [load])

  type Row = { type: 'tp'; data: ThirdPartyOrder } | { type: 'qr'; data: PosOrder }
  const allRows: Row[] = [
    ...tpOrders.map(d => ({ type: 'tp' as const, data: d })),
    ...qrOrders.map(d => ({ type: 'qr' as const, data: d })),
  ].sort((a, b) =>
    new Date(b.data.created_at ?? 0).getTime() - new Date(a.data.created_at ?? 0).getTime()
  )

  const filtered = allRows.filter(r => {
    if (tab === 'all') return true
    const s = r.data.status
    if (tab === 'new')        return s === 'new' || s === 'pending'
    if (tab === 'inprogress') return s === 'acknowledged' || s === 'preparing' || s === 'in-progress'
    if (tab === 'done')       return s === 'completed' || s === 'cancelled'
    return true
  })

  const newCount = allRows.filter(r => {
    const s = r.data.status; return s === 'new' || s === 'pending'
  }).length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0066CC]" /> Food Orders
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            QR table orders + Zomato / Swiggy / PetPuja.
            <span className="text-blue-500 ml-1">Hotel bookings → Bookings tab</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleAlarm}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition
              ${alarmOn
                ? 'bg-[#0066CC]/20 border-[#0066CC]/40 text-[#0066CC]'
                : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
            {alarmOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {alarmOn ? 'Alarm On' : 'Alarm Off'}
          </button>
          <button
            onClick={() => load(tenantId)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { id: 'all',        label: 'All Orders' },
          { id: 'new',        label: `New${newCount > 0 ? ` (${newCount})` : ''}` },
          { id: 'inprogress', label: 'In Progress' },
          { id: 'done',       label: 'Done' },
        ] as { id: 'all'|'new'|'inprogress'|'done'; label: string }[]).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all
              ${tab === id
                ? id === 'new' && newCount > 0 ? 'bg-red-500 text-white' : 'bg-[#0066CC] text-white'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {updateErr && (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold text-red-400 mb-0.5">Status update failed</p>
            <p className="text-red-400/80">{updateErr}</p>
          </div>
          <button onClick={() => setUpdateErr(null)} className="ml-auto text-red-500 hover:text-red-300"><XCircle className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {loading && (
        <div className="flex gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No {tab === 'new' ? 'new' : ''} food orders.</p>
          {tab === 'new' && (
            <p className="text-gray-600 text-xs mt-1">
              QR table orders and Zomato/Swiggy orders will appear here instantly with alarm.
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(row => {
          const id = row.data.id!
          const isExpanded = expanded === id
          const isUpdating = updating === id

          // ── Third-party order (Zomato / Swiggy / PetPuja) ──
          if (row.type === 'tp') {
            const o = row.data
            const pm = pmeta(o.platform)
            const items = parseItems(o.items)
            const age = Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000)
            const sColor = STATUS_COLORS[o.status] || '#6B7280'

            return (
              <div key={id} className={`bg-white/5 border rounded-2xl overflow-hidden transition
                ${!o.is_read ? 'border-[#0066CC]/40 shadow-[0_0_0_1px_rgba(0,102,204,0.2)]' : 'border-white/10'}`}>
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg text-white shrink-0"
                      style={{ backgroundColor: pm.color }}>
                      {pm.label.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                        {o.customer_name || 'Customer'}
                        {!o.is_read && <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />}
                      </p>
                      <p className="text-xs text-gray-500">
                        {o.external_order_id} · {age < 60 ? `${age}m ago` : `${Math.floor(age/60)}h ago`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">&#8377;{o.total.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: sColor + '20', color: sColor }}>
                      {o.status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5 px-4 py-3 space-y-3">
                    {(o.customer_phone || o.delivery_address) && (
                      <div className="text-xs text-gray-400 space-y-0.5">
                        {o.customer_phone && <p>&#128222; {o.customer_phone}</p>}
                        {o.delivery_address && <p>&#128205; {o.delivery_address}</p>}
                      </div>
                    )}
                    {items.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-3 space-y-1">
                        {items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-gray-300">{item.name}{item.qty ? ` x${item.qty}` : ''}</span>
                            <span className="text-white font-semibold">&#8377;{item.price}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs border-t border-white/10 pt-1 mt-1">
                          <span className="text-gray-500">Platform fee</span>
                          <span className="text-gray-400">&#8377;{o.platform_fee}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white">Total</span>
                          <span className="text-white">&#8377;{o.total}</span>
                        </div>
                      </div>
                    )}
                    {o.status !== 'completed' && o.status !== 'cancelled' && (
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_ORDER.slice(STATUS_ORDER.indexOf(o.status) + 1)
                          .filter(s => s !== 'cancelled')
                          .map(next => (
                            <button key={next} onClick={() => updateTP(id, next)} disabled={isUpdating}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] disabled:opacity-50 transition capitalize">
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              {STATUS_LABELS[next] ?? `Mark ${next}`}
                            </button>
                          ))}
                        <button onClick={() => updateTP(id, 'cancelled')} disabled={isUpdating}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 transition">
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    )}
                    {(o.status === 'completed' || o.status === 'cancelled') && (
                      <p className="text-xs text-gray-600 capitalize">Order {o.status}</p>
                    )}
                  </div>
                )}
              </div>
            )
          }

          // ── QR / POS table order ──
          const o = row.data
          const age = Math.round((Date.now() - new Date(o.created_at ?? 0).getTime()) / 60000)
          const posColors: Record<string, string> = {
            pending: '#EF4444', 'in-progress': '#0066CC', completed: '#16A34A',
          }
          const sColor = posColors[o.status] || '#6B7280'

          return (
            <div key={id} className={`bg-white/5 border rounded-2xl overflow-hidden transition
              ${o.status === 'pending' ? 'border-red-500/30 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]' : 'border-white/10'}`}>
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : id)}>
                <div className="flex items-center gap-3">
                  <span className="bg-[#0066CC]/20 text-[#0066CC] text-[10px] font-black px-2 py-1 rounded-lg shrink-0 flex items-center gap-1">
                    <Utensils className="w-3 h-3" /> QR TABLE
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {o.table_name ? `Table ${o.table_name}` : 'No table'}
                      {o.customer_name ? ` · ${o.customer_name}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {o.order_number} · {age < 60 ? `${age}m ago` : `${Math.floor(age/60)}h ago`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">&#8377;{o.total.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: sColor + '20', color: sColor }}>
                    {o.status}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/5 px-4 py-3 space-y-3">
                  {o.item_summary && <p className="text-xs text-gray-400">{o.item_summary}</p>}
                  {!!(o as { notes?: string }).notes && (
                    <p className="text-xs text-amber-400">Note: {(o as { notes?: string }).notes}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {o.status === 'pending' && (
                      <button onClick={() => updateQR(id, 'in-progress')} disabled={isUpdating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] disabled:opacity-50 transition">
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                        Accept &amp; Start
                      </button>
                    )}
                    {o.status === 'in-progress' && (
                      <button onClick={() => updateQR(id, 'completed')} disabled={isUpdating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition">
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Mark Completed
                      </button>
                    )}
                    <button onClick={() => updateQR(id, 'cancelled')} disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 transition">
                      <XCircle className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!loading && tpOrders.length === 0 && (
        <div className="mt-8 px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> To receive Zomato / Swiggy / PetPuja orders:
          </p>
          <p className="text-blue-500">Paste this URL in your partner portal as the webhook endpoint:</p>
          <p className="font-mono text-[10px] bg-blue-500/10 px-2 py-1 rounded break-all">
            https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant={tenantId}
          </p>
        </div>
      )}
    </div>
  )
}
