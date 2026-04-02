'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, AlertTriangle, Search, Loader2, ArrowUpDown } from 'lucide-react'
import { portalSupabase, getPortalSession, type InventoryItem, type InventoryTransaction } from '@/lib/portal-db'

export default function PortalInventory() {
  const router  = useRouter()
  const [items, setItems]   = useState<InventoryItem[]>([])
  const [txns, setTxns]     = useState<InventoryTransaction[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoad]  = useState(true)
  const [tab, setTab]       = useState<'stock' | 'low' | 'txns'>('stock')

  useEffect(() => {
    async function load() {
      setLoad(true)
      try {
        const sess = await getPortalSession()
        if (!sess) { router.replace('/portal'); return }
        const tid = sess.tenantId
        const [iRes, tRes] = await Promise.all([
          portalSupabase.from('inventory_items').select('*').eq('tenant_id', tid).eq('is_active', true).order('name'),
          portalSupabase.from('inventory_transactions').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(50),
        ])
        setItems(iRes.data ?? [])
        setTxns(tRes.data ?? [])
      } catch { /* offline */ }
      finally { setLoad(false) }
    }
    load()
  }, [router])

  const lowStock = items.filter(i => i.current_stock <= i.min_stock)
  const filtered = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  const TXN_COLORS: Record<string, string> = {
    in: '#16A34A', out: '#EF4444', adjustment: '#F59E0B',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-[#F59E0B]" /> Inventory
        </h1>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {([
            { id: 'stock', label: `All Stock (${items.length})` },
            { id: 'low',   label: `⚠ Low Stock (${lowStock.length})` },
            { id: 'txns',  label: 'Transactions' },
          ] as { id: 'stock' | 'low' | 'txns'; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${tab === t.id
                  ? t.id === 'low' ? 'bg-amber-500 text-white' : 'bg-[#0066CC] text-white'
                  : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      {/* Stock list */}
      {(tab === 'stock' || tab === 'low') && !loading && (
        <>
          {tab === 'stock' && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0066CC]" />
            </div>
          )}
          <div className="space-y-2">
            {(tab === 'low' ? lowStock : filtered).length === 0 ? (
              <p className="text-center text-gray-500 py-12">
                {tab === 'low' ? '✅ No low stock items. All good!' : 'No inventory items found.'}
              </p>
            ) : (tab === 'low' ? lowStock : filtered).map(item => (
              <div key={item.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border
                ${item.current_stock <= item.min_stock
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-white/5 border-white/10'}`}>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category} · {item.unit}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${item.current_stock <= item.min_stock ? 'text-amber-400' : 'text-white'}`}>
                    {item.current_stock <= item.min_stock && <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
                    {item.current_stock} {item.unit}
                  </p>
                  <p className="text-[10px] text-gray-500">Min: {item.min_stock}</p>
                  {item.cost_per_unit > 0 && <p className="text-[10px] text-gray-600">Cost: ₹{item.cost_per_unit}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Transactions */}
      {tab === 'txns' && !loading && (
        <div className="space-y-2">
          {txns.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No inventory transactions yet.</p>
          ) : txns.map(t => (
            <div key={t.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: (TXN_COLORS[t.type] || '#6B7280') + '20' }}>
                  <ArrowUpDown className="w-4 h-4" style={{ color: TXN_COLORS[t.type] || '#6B7280' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.item_name}</p>
                  <p className="text-xs text-gray-500">{t.note || t.type} · {new Date(t.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${t.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'in' ? '+' : '-'}{t.quantity}
                </p>
                <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: (TXN_COLORS[t.type] || '#6B7280') + '20', color: TXN_COLORS[t.type] || '#6B7280' }}>
                  {t.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
