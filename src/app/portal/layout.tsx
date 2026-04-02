'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, LayoutDashboard, Package, Users, BarChart3, LogOut, Menu, ChevronRight, Layers, Star, UserCheck, Lock } from 'lucide-react'
import { portalSupabase, PLAN_COLORS, PLAN_LABELS, canAccess, type PortalSession } from '@/lib/portal-db'

const ALL_NAV = [
  { href: '/portal/pos',       label: 'POS Billing',     icon: ShoppingCart,    module: 'pos',       group: 'main'    },
  { href: '/portal/dashboard', label: 'Dashboard',       icon: LayoutDashboard, module: 'dashboard', group: 'main'    },
  { href: '/portal/products',  label: 'Products / Menu', icon: Package,         module: 'products',  group: 'main'    },
  { href: '/portal/customers', label: 'Customers',       icon: Users,           module: 'customers', group: 'main'    },
  { href: '/portal/reports',   label: 'Reports',         icon: BarChart3,       module: 'reports',   group: 'main'    },
  { href: '/portal/inventory', label: 'Inventory',       icon: Layers,          module: 'inventory', group: 'modules' },
  { href: '/portal/staff',     label: 'Staff',           icon: UserCheck,       module: 'staff',     group: 'modules' },
  { href: '/portal/coins',     label: 'Coins / Loyalty', icon: Star,            module: 'coins',     group: 'modules' },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router  = useRouter()
  const path    = usePathname()
  const [session, setSession]   = useState<PortalSession | null>(null)
  const [sideOpen, setSide]     = useState(false)

  useEffect(() => {
    portalSupabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.replace('/portal'); return }
      const meta = s.user?.user_metadata ?? {}
      setSession({
        userId:   s.user.id,
        email:    s.user.email ?? '',
        tenantId: (meta.tenant_id as string) || 'sharda',
        plan:     (meta.plan     as string) || 'starter',
        name:     (meta.name     as string) || (s.user.email?.split('@')[0] ?? 'User'),
      })
    })
    const { data: { subscription } } = portalSupabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT' || !s) router.replace('/portal')
    })
    return () => subscription.unsubscribe()
  }, [router])

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

        {/* User + Logout */}
        <div className="p-3 border-t border-white/5">
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
          <button onClick={logout} className="text-gray-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0A1628]">
          {children}
        </main>
      </div>
    </div>
  )
}
