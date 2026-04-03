'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BedDouble, Loader2, CheckCircle2, XCircle, RefreshCw,
  ChevronDown, ChevronUp, Bell, BellOff, Phone, CalendarDays,
  Users, Copy, Check, Receipt,
} from 'lucide-react'
import { portalSupabase, getPortalSession, type ThirdPartyOrder } from '@/lib/portal-db'

// ── OTA platform detection from external_order_id prefix ─────────────────────
function detectPlatform(extId: string): { label: string; color: string; bg: string } {
  const id = (extId || '').toUpperCase()
  if (id.startsWith('OYO'))  return { label: 'OYO',         color: '#EE2A7B', bg: '#EE2A7B15' }
  if (id.startsWith('MMT'))  return { label: 'MakeMyTrip',  color: '#1A6BCC', bg: '#1A6BCC15' }
  if (id.startsWith('GO'))   return { label: 'Goibibo',     color: '#9333EA', bg: '#9333EA15' }
  if (id.startsWith('BKG'))  return { label: 'Booking.com', color: '#003580', bg: '#00358015' }
  if (id.startsWith('CT'))   return { label: 'Cleartrip',   color: '#F97316', bg: '#F9731615' }
  if (id.startsWith('YT'))   return { label: 'Yatra',       color: '#16A34A', bg: '#16A34A15' }
  return { label: 'Online', color: '#6B7280', bg: '#6B728015' }
}

// Hotel booking statuses
const BOOKING_STATUSES = ['new', 'acknowledged', 'confirmed', 'completed', 'cancelled'] as const
const STATUS_COLORS: Record<string, string> = {
  new:          '#EF4444',
  acknowledged: '#F59E0B',
  confirmed:    '#0066CC',
  completed:    '#16A34A',
  cancelled:    '#6B7280',
}
// Human-readable labels shown on buttons
const STATUS_LABELS: Record<string, string> = {
  acknowledged: 'Acknowledge',
  confirmed:    'Confirm Booking',
  completed:    'Check Out',
  cancelled:    'Cancel',
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
      gain.gain.setValueAtTime(0.35, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur)
    }
    beep(660, 0, 0.15); beep(880, 0.2, 0.15); beep(660, 0.4, 0.15); beep(880, 0.6, 0.25)
  } catch { /* blocked */ }
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PortalBookings() {
  const router = useRouter()
  const [tenantId,  setTid]      = useState('')
  const [bookings,  setBookings] = useState<ThirdPartyOrder[]>([])
  const [loading,   setLoad]     = useState(true)
  const [tab,       setTab]      = useState<'all'|'new'|'confirmed'|'done'>('all')
  const [expanded,  setExpanded] = useState<string | null>(null)
  const [updating,  setUpdating] = useState<string | null>(null)
  const [alarmOn,   setAlarmOn]  = useState(true)
  const [copied,    setCopied]   = useState<string | null>(null)
  const [updateErr, setUpdateErr] = useState<string | null>(null)
  const alarmRef = useRef(true)
  const tenantRef = useRef('')

  const load = useCallback(async (tid: string) => {
    const { data, error } = await portalSupabase
      .from('third_party_orders')
      .select('*')
      .eq('tenant_id', tid)
      .eq('platform', 'other')
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error) setBookings(data ?? [])
  }, [])

  useEffect(() => {
    getPortalSession().then(sess => {
      if (!sess) { router.replace('/portal'); return }
      tenantRef.current = sess.tenantId
      setTid(sess.tenantId)
      load(sess.tenantId).finally(() => setLoad(false))
    })
  }, [router, load])

  // Realtime
  useEffect(() => {
    if (!tenantId) return
    const unlock = () => { const c = getCtx(); if (c?.state === 'suspended') c.resume() }
    window.addEventListener('click', unlock, { once: true })

    const ch = portalSupabase.channel(`bookings-${tenantId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'third_party_orders', filter: `tenant_id=eq.${tenantId}` },
        (payload: { new: ThirdPartyOrder }) => {
          if ((payload.new?.platform || '') === 'other') {
            load(tenantId)
            if (alarmRef.current) playAlarm()
          }
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'third_party_orders', filter: `tenant_id=eq.${tenantId}` },
        () => load(tenantId))
      .subscribe()

    return () => {
      window.removeEventListener('click', unlock)
      portalSupabase.removeChannel(ch)
    }
  }, [tenantId, load])

  const updateBooking = useCallback(async (id: string, status: string) => {
    setUpdateErr(null)
    setUpdating(id)
    const tid = tenantRef.current
    const { error } = await portalSupabase.from('third_party_orders')
      .update({ status, is_read: true }).eq('id', id).eq('tenant_id', tid)
    if (error) {
      console.error('[updateBooking]', error)
      setUpdateErr(
        error.code === '42501'
          ? 'Permission denied — run migration-portal-rls.sql in Supabase SQL Editor to enable status updates.'
          : error.message
      )
    } else {
      await load(tid)
    }
    setUpdating(null)
  }, [load])

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(phone); setTimeout(() => setCopied(null), 2000)
    })
  }

  const filtered = bookings.filter(b => {
    if (tab === 'all')       return true
    if (tab === 'new')       return b.status === 'new' || b.status === 'acknowledged'
    if (tab === 'confirmed') return b.status === 'confirmed'
    if (tab === 'done')      return b.status === 'completed' || b.status === 'cancelled'
    return true
  })

  const newCount = bookings.filter(b => b.status === 'new').length

  // Stats
  const stats = {
    total:     bookings.length,
    new:       bookings.filter(b => b.status === 'new').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    revenue:   bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.subtotal || 0), 0),
  }

  function getBaseUrl() {
    if (typeof window === 'undefined') return 'https://gentechservice.in'
    return window.location.origin
  }

  const bookingUrl = `${getBaseUrl()}/book?t=${encodeURIComponent(tenantId)}`
  const bookingQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(bookingUrl)}`

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-[#0066CC]" /> Hotel Bookings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            OYO / MakeMyTrip / Booking.com + direct website enquiries
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setAlarmOn(p => { alarmRef.current = !p; return !p }) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition
              ${alarmOn ? 'bg-[#0066CC]/20 border-[#0066CC]/40 text-[#0066CC]' : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
            {alarmOn ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {alarmOn ? 'Alarm On' : 'Alarm Off'}
          </button>
          <button onClick={() => load(tenantId)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* RLS error banner */}
      {updateErr && (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold text-red-400 mb-0.5">Status update failed</p>
            <p className="text-red-400/80">{updateErr}</p>
          </div>
          <button onClick={() => setUpdateErr(null)} className="ml-auto text-red-500 hover:text-red-300"><XCircle className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: stats.total,      color: 'text-white' },
          { label: 'New',       value: stats.new,        color: 'text-red-400' },
          { label: 'Confirmed', value: stats.confirmed,  color: 'text-blue-400' },
          { label: 'Revenue',   value: `&#8377;${stats.revenue.toLocaleString('en-IN')}`, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] text-center">
            <p className={`text-xl font-bold ${s.color}`} dangerouslySetInnerHTML={{ __html: String(s.value) }} />
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Direct booking link */}
      {tenantId && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col sm:flex-row items-center gap-4">
          <img src={bookingQrUrl} alt="Booking QR" className="w-[80px] h-[80px] rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-0.5">Direct Booking Link</p>
            <p className="text-xs text-blue-300 break-all font-mono">{bookingUrl}</p>
            <p className="text-[10px] text-blue-500 mt-1">
              Share on Google Business profile, WhatsApp, or print this QR for customers to book rooms directly.
            </p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(bookingUrl); setCopied('link'); setTimeout(() => setCopied(null), 2000) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition shrink-0"
          >
            {copied === 'link' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'link' ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { id: 'all',       label: 'All Bookings' },
          { id: 'new',       label: `New${newCount > 0 ? ` (${newCount})` : ''}` },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'done',      label: 'Done' },
        ] as { id: 'all'|'new'|'confirmed'|'done'; label: string }[]).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all
              ${tab === id
                ? id === 'new' && newCount > 0 ? 'bg-red-500 text-white' : 'bg-[#0066CC] text-white'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading bookings...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <BedDouble className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No {tab === 'new' ? 'new' : ''} bookings.</p>
          <p className="text-gray-600 text-xs mt-1">
            Hotel bookings from OYO / MakeMyTrip will appear here. Share the booking link above for direct reservations.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(b => {
          const id = b.id!
          const isExpanded = expanded === id
          const isUpdating = updating === id
          const platform  = detectPlatform(b.external_order_id)
          const sColor    = STATUS_COLORS[b.status] || '#6B7280'
          const age       = Math.round((Date.now() - new Date(b.created_at).getTime()) / 60000)

          return (
            <div key={id} className={`border rounded-2xl overflow-hidden transition
              ${!b.is_read && b.status === 'new'
                ? 'bg-blue-500/5 border-blue-500/30 shadow-[0_0_0_1px_rgba(0,102,204,0.18)]'
                : 'bg-white/5 border-white/10'}`}>
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : id)}>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-black px-2 py-1 rounded-lg text-white shrink-0"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.label.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-blue-400" />
                      {b.customer_name || 'Guest'}
                      {!b.is_read && b.status === 'new' && (
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {b.external_order_id} · {age < 60 ? `${age}m ago` : age < 1440 ? `${Math.floor(age/60)}h ago` : `${Math.floor(age/1440)}d ago`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">&#8377;{(b.subtotal || 0).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: sColor + '20', color: sColor }}>
                    {b.status}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-white/5 px-4 py-3 space-y-3">
                  {/* Guest info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
                    {b.customer_phone && (
                      <button
                        onClick={() => copyPhone(b.customer_phone!)}
                        className="flex items-center gap-2 hover:text-white transition"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                        {b.customer_phone}
                        {copied === b.customer_phone
                          ? <Check className="w-3 h-3 text-green-400" />
                          : <Copy className="w-3 h-3 opacity-40" />}
                      </button>
                    )}
                    {b.delivery_address && (
                      <div className="flex items-start gap-2">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0 text-blue-400 mt-0.5" />
                        <span className="leading-relaxed">{b.delivery_address}</span>
                      </div>
                    )}
                  </div>

                  {/* Items / room details */}
                  {(() => {
                    try {
                      if (!b.items) return null
                      const items: { name: string; nights?: number; price: number }[] =
                        Array.isArray(b.items) ? b.items : JSON.parse(b.items as unknown as string)
                      if (!items.length) return null
                      return (
                        <div className="bg-white/5 rounded-xl p-3 space-y-1">
                          {items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-gray-300 flex items-center gap-1.5">
                                <BedDouble className="w-3 h-3 text-blue-400" />
                                {item.name}
                                {item.nights ? (
                                  <span className="flex items-center gap-1 text-gray-500">
                                    <Users className="w-3 h-3" /> {item.nights} nights
                                  </span>
                                ) : null}
                              </span>
                              <span className="text-white font-semibold">&#8377;{item.price.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs border-t border-white/10 pt-1 mt-1">
                            <span className="text-gray-500">Platform fee</span>
                            <span className="text-gray-400">&#8377;{(b.platform_fee || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-white">Total</span>
                            <span className="text-white">&#8377;{b.total.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )
                    } catch { return null }
                  })()}

                  {/* Status actions */}
                  {b.status !== 'completed' && b.status !== 'cancelled' && (
                    <div className="flex gap-2 flex-wrap">
                      {BOOKING_STATUSES
                        .slice(BOOKING_STATUSES.indexOf(b.status as typeof BOOKING_STATUSES[number]) + 1)
                        .filter(s => s !== 'cancelled')
                        .map(next => (
                          <button key={next} onClick={() => updateBooking(id, next)} disabled={isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] disabled:opacity-50 transition capitalize">
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            {STATUS_LABELS[next] ?? `Mark ${next}`}
                          </button>
                        ))}
                      <button onClick={() => updateBooking(id, 'cancelled')} disabled={isUpdating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 transition">
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                      {/* Bill guest in POS */}
                      <Link href="/portal/pos" target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition">
                        <Receipt className="w-3 h-3" /> Bill Guest
                      </Link>
                    </div>
                  )}
                  {(b.status === 'completed' || b.status === 'cancelled') && (
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-600 capitalize">Booking {b.status}</p>
                      <Link href="/portal/pos" target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition">
                        <Receipt className="w-3 h-3" /> Bill Guest
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
