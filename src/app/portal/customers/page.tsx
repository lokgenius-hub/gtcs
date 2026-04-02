'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Loader2, Phone, Coins } from 'lucide-react'
import { portalSupabase, getPortalSession, type CoinProfile } from '@/lib/portal-db'

export default function PortalCustomers() {
  const router = useRouter()
  const [customers, setCust] = useState<CoinProfile[]>([])
  const [search, setSearch]  = useState('')
  const [loading, setLoad]   = useState(true)

  useEffect(() => {
    async function load() {
      const sess = await getPortalSession()
      if (!sess) { router.replace('/portal'); return }
      const { data } = await portalSupabase
        .from('coin_profiles')
        .select('id,tenant_id,phone,name,balance,created_at')
        .eq('tenant_id', sess.tenantId)
        .order('balance', { ascending: false })
      setCust(data ?? [])
      setLoad(false)
    }
    load()
  }, [router])

  const filtered = search
    ? customers.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search))
    : customers

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#8B5CF6]" /> Loyalty Customers
        </h1>
        <span className="text-xs text-gray-500">{customers.length} members</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#8B5CF6]" />
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-12">No loyalty customers yet. Add them via the POS billing screen.</p>
      )}

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-bold text-xs">
                {(c.name || c.phone || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{c.name || 'Guest'}</p>
                {c.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-[#F59E0B] flex items-center gap-1 justify-end">
                <Coins className="w-3.5 h-3.5" />{c.balance.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-500">coins balance</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


      {!loading && filtered.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
          No customers yet.
        </div>
      )}
    </div>
  )
}
