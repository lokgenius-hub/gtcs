'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, LayoutDashboard, Package, Users, BarChart3, LogOut, Menu, ChevronRight, Layers, Star, UserCheck, Lock, Bell, BellOff, QrCode, ClipboardList, Webhook, BedDouble, CalendarCheck } from 'lucide-react'
import { portalSupabase, PLAN_COLORS, PLAN_LABELS, canAccess, getPortalSession, type PortalSession } from '@/lib/portal-db'

// ─── Audio ────────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch { return null }
  }
  return _audioCtx
}
function playAlarm() {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    const beep = (freq: number, start: number, dur: number) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    beep(880,  0,    0.12)
    beep(1100, 0.15, 0.12)
    beep(880,  0.30, 0.12)
    beep(1100, 0.45, 0.20)
  } catch { /* blocked by browser */ }
}
function unlockAudio() {
  const ctx = getAudioCtx()
  if (ctx && ctx.state === 'suspended') ctx.resume()
}

const ALL_NAV = [
  { href: '/portal/pos',       label: 'POS Billing',     icon: ShoppingCart,    module: 'pos',       group: 'main'    },
  { href: '/portal/dashboard', label: 'Dashboard',       icon: LayoutDashboard, module: 'dashboard', group: 'main'    },
  { href: '/portal/products',  label: 'Products / Menu', icon: Package,         module: 'products',  group: 'main'    },
  { href: '/portal/customers', label: 'Customers',       icon: Users,           module: 'customers', group: 'main'    },
  { href: '/portal/reports',   label: 'Reports',         icon: BarChart3,       module: 'reports',   group: 'main'    },
  { href: '/portal/tables',    label: 'Tables & QR',     icon: QrCode,          module: 'tables',    group: 'main'    },  { href: '/portal/orders',    label: 'Online Orders',   icon: ClipboardList, module: 'orders',    group: 'main'    },  { href: '/portal/inventory', label: 'Inventory',       icon: Layers,          module: 'inventory', group: 'modules' },
  { href: '/portal/staff',     label: 'Staff',           icon: UserCheck,       module: 'staff',     group: 'modules' },
  { href: '/portal/coins',     label: 'Coins / Loyalty', icon: Star,            module: 'coins',     group: 'modules' },  { href: '/portal/webhooks',  label: 'Webhooks / ERP',  icon: Webhook,       module: 'webhooks',  group: 'modules' },
  { href: '/portal/rooms',     label: 'Rooms',           icon: BedDouble,     module: 'rooms',     group: 'modules' },
  { href: '/portal/bookings',  label: 'Bookings',        icon: CalendarCheck, module: 'bookings',  group: 'modules' },]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router  = useRouter()
  const path    = usePathname()
  const [session, setSession]     = useState<PortalSession | null>(null)
  const [sideOpen, setSide]       = useState(false)
  const [unreadOrders, setUnread] = useState(0)
  const [alarmEnabled, setAlarm]  = useState(true)
  const alarmEnabledRef           = useRef(true)
  const channelRef                = useRef<ReturnType<typeof portalSupabase.channel> | null>(null)

  useEffect(() => {
    getPortalSession().then(sess => {
      if (!sess) { router.replace('/portal'); return }
      setSession(sess)
    })
    const { data: { subscription } } = portalSupabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT' || !s) router.replace('/portal')
    })
    return () => subscription.unsubscribe()
  }, [router])

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    const handler = () => unlockAudio()
    window.addEventListener('click',      handler, { once: true })
    window.addEventListener('touchstart', handler, { once: true })
    return () => {
      window.removeEventListener('click',      handler)
      window.removeEventListener('touchstart', handler)
    }
  }, [])

  // Realtime: listen for new QR table orders + Zomato/Swiggy orders
  useEffect(() => {
    if (!session) return
    const tid = session.tenantId
    portalSupabase
      .from('pos_orders')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tid)
      .eq('status', 'pending')
      .then(({ count }) => setUnread(count ?? 0))

    if (channelRef.current) portalSupabase.removeChannel(channelRef.current)
    const ch = portalSupabase
      .channel(`portal-orders-${tid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pos_orders', filter: `tenant_id=eq.${tid}` },
        (payload: { new: { status?: string } }) => {
          if (payload.new?.status === 'pending') {
            setUnread(c => c + 1)
            if (alarmEnabledRef.current) playAlarm()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'third_party_orders', filter: `tenant_id=eq.${tid}` },
        () => {
          setUnread(c => c + 1)
          if (alarmEnabledRef.current) playAlarm()
        }
      )
      .subscribe()
    channelRef.current = ch
    return () => { if (channelRef.current) portalSupabase.removeChannel(channelRef.current) }
  }, [session])

  const toggleAlarm = useCallback(() => {
    setAlarm(prev => { alarmEnabledRef.current = !prev; return !prev })
  }, [])
  const clearBadge = useCallback(() => setUnread(0), [])

  const logout = useCallback(async () => {
    await portalSupabase.auth.signOut()
    router.replace('/portal')
  }, [router])

  // Don't render shell on the login page itself
  if (path === '/portal') return <>{children}</>

  return (
    <div className="h-screen flex bg-[#0F172A] text-white overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside
        className={`${sideOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          fixed md:static inset-y-0 left-0 z-30 w-60 flex flex-col
          bg-[#050A14] border-r border-white/5 transition-transform duration-200`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5">
          <div className="w-8 h-8 bg-[#0066CC] rounded-lg flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <p className="font-extrabold text-sm leading-none">HospiFlow</p>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">Online POS Portal</p>
          </div>
        </div>

        {/* Plan badge */}
        {session && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: PLAN_COLORS[session.plan] + '10', borderColor: PLAN_COLORS[session.plan] + '30' }}>
            <span className="text-xs font-bold" style={{ color: PLAN_COLORS[session.plan] }}>{PLAN_LABELS[session.plan]} Plan</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">/{session.tenantId}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-1.5">Core</p>
          {ALL_NAV.filter(n => n.group === 'main').map(({ href, label, icon: Icon, module: mod }) => {
            const accessible = canAccess(session?.plan || 'starter', mod)
            const isPOS      = href === '/portal/pos'
            return (
              <Link
                key={href}
                href={accessible ? href : '#'}
                onClick={() => {
                  if (!accessible) return
                  setSide(false)
                  if (isPOS) clearBadge()
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${!accessible
                    ? 'opacity-40 cursor-not-allowed'
                    : path === href
                      ? 'bg-[#0066CC]/15 text-white border border-[#0066CC]/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {isPOS && unreadOrders > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadOrders > 99 ? '99+' : unreadOrders}
                  </span>
                )}
                {!accessible && <Lock className="w-3 h-3 ml-auto text-gray-600" />}
                {accessible && path === href && !(isPOS && unreadOrders > 0) && (
                  <ChevronRight className="w-3 h-3 ml-auto" />
                )}
              </Link>
            )
          })}

          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-3 mt-4 mb-1.5">Modules</p>
          {ALL_NAV.filter(n => n.group === 'modules').map(({ href, label, icon: Icon, module: mod }) => {
            const accessible = canAccess(session?.plan || 'starter', mod)
            return (
              <Link
                key={href}
                href={accessible ? href : '#'}
                onClick={() => accessible && setSide(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${!accessible
                    ? 'opacity-40 cursor-not-allowed'
                    : path === href
                      ? 'bg-[#0066CC]/15 text-white border border-[#0066CC]/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {!accessible && <Lock className="w-3 h-3 ml-auto text-gray-600" />}
                {accessible && path === href && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Alarm toggle + User + Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={toggleAlarm}
            title={alarmEnabled ? 'Mute order alarm' : 'Unmute order alarm'}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all mb-1 ${
              alarmEnabled ? 'text-green-400 hover:bg-green-500/5' : 'text-gray-500 hover:bg-white/5'
            }`}
          >
            {alarmEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            <span className="text-xs">{alarmEnabled ? 'Alarm: On' : 'Alarm: Off'}</span>
            {unreadOrders > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadOrders > 99 ? '99+' : unreadOrders}
              </span>
            )}
          </button>
          {session && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-white truncate">{session.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{session.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sideOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          onClick={() => setSide(false)}
        />
      )}

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#050A14]">
          <button onClick={() => setSide(true)} className="text-white/70">
            <Menu className="w-5 h-5" />
          </button>
          <p className="font-bold text-sm">HospiFlow Portal</p>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAlarm}
              className={`relative ${alarmEnabled ? 'text-green-400' : 'text-gray-500'}`}
            >
              {alarmEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              {unreadOrders > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                  {unreadOrders > 9 ? '9+' : unreadOrders}
                </span>
              )}
            </button>
            <button onClick={logout} className="text-gray-400 hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0A1628]">
          {children}
        </main>
      </div>
    </div>
  )
}
