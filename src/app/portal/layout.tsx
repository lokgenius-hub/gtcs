'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, LayoutDashboard, Package, Users, BarChart3, LogOut, Menu, X, ChevronRight, Layers, Star, UserCheck } from 'lucide-react'

const NAV = [
  { href: '/portal/pos',       label: 'POS Billing',  icon: ShoppingCart,    group: 'main'    },
  { href: '/portal/dashboard', label: 'Dashboard',    icon: LayoutDashboard, group: 'main'    },
  { href: '/portal/products',  label: 'Products',     icon: Package,         group: 'main'    },
  { href: '/portal/customers', label: 'Customers',    icon: Users,           group: 'main'    },
  { href: '/portal/reports',   label: 'Reports',      icon: BarChart3,       group: 'main'    },
  { href: '/portal/inventory', label: 'Inventory',    icon: Layers,          group: 'modules' },
  { href: '/portal/staff',     label: 'Staff',        icon: UserCheck,       group: 'modules' },
  { href: '/portal/coins',     label: 'Coins / Loyalty', icon: Star,         group: 'modules' },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router  = useRouter()
  const path    = usePathname()
  const [user, setUser]       = useState<{ name?: string; email?: string } | null>(null)
  const [sideOpen, setSide]   = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('hf_token')
    if (!token) {
      router.replace('/portal')
      return
    }
    try {
      const u = JSON.parse(localStorage.getItem('hf_user') || '{}')
      setUser(u)
    } catch { /* ignore */ }
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem('hf_token')
    localStorage.removeItem('hf_refresh')
    localStorage.removeItem('hf_user')
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

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-1.5">Core</p>
          {NAV.filter(n => n.group === 'main').map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSide(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${path === href
                  ? 'bg-[#0066CC]/15 text-white border border-[#0066CC]/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {path === href && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}

          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-3 mt-4 mb-1.5">Modules</p>
          {NAV.filter(n => n.group === 'modules').map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSide(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${path === href
                  ? 'bg-[#0066CC]/15 text-white border border-[#0066CC]/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {path === href && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/5">
          {user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-white truncate">{user.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
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
          <p className="font-bold text-sm">HospiFlow POS</p>
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
