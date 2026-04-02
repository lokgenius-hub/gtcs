'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Leaf, Flame } from 'lucide-react'
import { portalSupabase, getPortalSession, type MenuItem } from '@/lib/portal-db'

export default function PortalProducts() {
  const router  = useRouter()
  const [items, setItems]   = useState<MenuItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    async function load() {
      const sess = await getPortalSession()
      if (!sess) { router.replace('/portal'); return }
      const { data } = await portalSupabase
        .from('menu_items')
        .select('id,name,price,category,is_veg,tax_rate,is_active,sort_order,tenant_id')
        .eq('tenant_id', sess.tenantId)
        .eq('is_active', true)
        .order('category').order('sort_order')
      setItems(data ?? [])
      setLoad(false)
    }
    load()
  }, [router])

  const filtered = search
    ? items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
    : items

  const cats = [...new Set(filtered.map(p => p.category))]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-white">Products / Menu</h1>
        <span className="text-xs text-gray-500">{items.length} active items</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or category…"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0066CC]" />
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-12">No active menu items. Add them via the desktop app or mysharda admin.</p>
      )}

      {cats.map(cat => (
        <div key={cat} className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{cat}</p>
          <div className="space-y-2">
            {filtered.filter(p => p.category === cat).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  {p.is_veg
                    ? <Leaf className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    : <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.is_veg ? 'Veg' : 'Non-Veg'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#0066CC]">₹{p.price}</p>
                  {p.tax_rate > 0 && <p className="text-[10px] text-gray-500">GST {p.tax_rate}%</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

