'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { portalSupabase } from '@/lib/portal-db'
import { Shield, LayoutDashboard, Users, LogOut, Loader2, Menu, X, Building2 } from 'lucide-react'

const NAV = [
  { href: '/superadmin/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/superadmin/customers', label: 'Customers',   icon: Users },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const path     = usePathname()
  const [ready, setReady]     = useState(false)
  const [name, setName]       = useState('SuperAdmin')
  const [mobileOpen, setMob]  = useState(false)

  // Login page (/superadmin) must render without this layout shell
  const isLoginPage = path === '/superadmin' || path === '/superadmin/'

  useEffect(() => {
    if (isLoginPage) return // login page handles its own auth check
    portalSupabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/superadmin'); return }
      const meta = session.user?.user_metadata ?? {}
      if (meta.role !== 'superadmin') {
        portalSupabase.auth.signOut().then(() => router.replace('/superadmin'))
        return
      }
      setName((meta.name as string) || session.user.email?.split('@')[0] || 'SuperAdmin')
      setReady(true)
    })
  }, [router, isLoginPage])

  async function signOut() {
    await portalSupabase.auth.signOut()
    router.replace('/superadmin')
  }

  if (isLoginPage) return <>{children}</>

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full bg-gray-900 ${mobile ? '' : 'border-r border-gray-800'}`}>
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">GTCS Admin</div>
            <div className="text-gray-400 text-xs">HospiFlow Control</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(item => {
          const active = path?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMob(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center">
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-medium truncate">{name}</div>
            <div className="text-gray-500 text-xs">SuperAdmin</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-56 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 flex flex-col flex-shrink-0">
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMob(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setMob(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-indigo-400" />
          <span className="text-white font-semibold text-sm">GTCS Admin</span>
          {mobileOpen && (
            <button onClick={() => setMob(false)} className="ml-auto text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
