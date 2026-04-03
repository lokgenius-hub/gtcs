'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, AlertTriangle, Search, Loader2, ArrowUpDown,
  Plus, X, CheckCircle2, AlertCircle, Pencil, Trash2,
  TrendingUp, TrendingDown, SlidersHorizontal,
} from 'lucide-react'
import { portalSupabase, getPortalSession, type InventoryItem, type InventoryTransaction } from '@/lib/portal-db'

type DraftItem = { name: string; category: string; unit: string; current_stock: number; min_stock: number; cost_per_unit: number }
const BLANK: DraftItem = { name: '', category: '', unit: 'kg', current_stock: 0, min_stock: 5, cost_per_unit: 0 }

export default function PortalInventory() {
  const router  = useRouter()
  const [tenantId, setTid]   = useState('')
  const [items,  setItems]   = useState<InventoryItem[]>([])
  const [txns,   setTxns]    = useState<InventoryTransaction[]>([])
  const [search, setSearch]  = useState('')
  const [loading,setLoad]    = useState(true)
  const [tab,    setTab]     = useState<'stock' | 'low' | 'txns'>('stock')

  /* panels */
  const [panel,    setPanel]    = useState<'none' | 'add' | 'adjust'>('none')
  const [editId,   setEditId]   = useState<string | null>(null)
  const [form,     setForm]     = useState<DraftItem>(BLANK)
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjType,  setAdjType]  = useState<'in' | 'out' | 'adjustment'>('in')
  const [adjQty,   setAdjQty]   = useState('')
  const [adjNote,  setAdjNote]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ ok: boolean; msg: string } | null>(null)

  async function load(tid: string) {
    const [iRes, tRes] = await Promise.all([
      portalSupabase.from('inventory_items').select('*').eq('tenant_id', tid).eq('is_active', true).order('name'),
      portalSupabase.from('inventory_transactions').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(50),
    ])
    setItems(iRes.data ?? [])
    setTxns(tRes.data ?? [])
  }

  useEffect(() => {
    getPortalSession().then(sess => {
      if (!sess) { router.replace('/portal'); return }
      setTid(sess.tenantId)
      load(sess.tenantId).finally(() => setLoad(false))
    })
  }, [router])

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg }); setTimeout(() => setToast(null), 3500)
  }

  function openAdd() { setForm(BLANK); setEditId(null); setPanel('add') }
  function openEdit(item: InventoryItem) {
    setForm({ name: item.name, category: item.category, unit: item.unit,
              current_stock: item.current_stock, min_stock: item.min_stock, cost_per_unit: item.cost_per_unit })
    setEditId(item.id); setPanel('add')
  }

  async function saveItem() {
    if (!form.name.trim() || !form.category.trim() || !form.unit.trim()) { showToast(false, 'Name, category and unit are required'); return }
    setSaving(true)
    if (editId) {
      const { error } = await portalSupabase.from('inventory_items')
        .update({ ...form, name: form.name.trim(), category: form.category.trim() })
        .eq('id', editId).eq('tenant_id', tenantId)
      if (error) { showToast(false, error.message); setSaving(false); return }
      showToast(true, 'Item updated')
    } else {
      const { error } = await portalSupabase.from('inventory_items')
        .insert({ ...form, name: form.name.trim(), category: form.category.trim(), tenant_id: tenantId, is_active: true })
      if (error) { showToast(false, error.message); setSaving(false); return }
      showToast(true, 'Item added')
    }
    await load(tenantId); setSaving(false); setPanel('none')
  }

  function openAdjust(item: InventoryItem) {
    setAdjustId(item.id); setAdjQty(''); setAdjNote(''); setAdjType('in'); setPanel('adjust')
  }

  async function doAdjust() {
    if (!adjustId || !adjQty || Number(adjQty) <= 0) { showToast(false, 'Enter a valid quantity'); return }
    const item = items.find(i => i.id === adjustId)
    if (!item) return
    const qty = Number(adjQty)
    const newStock = adjType === 'in'
      ? item.current_stock + qty
      : adjType === 'out'
      ? Math.max(0, item.current_stock - qty)
      : qty  // adjustment = set absolute
    setSaving(true)
    const { error: ue } = await portalSupabase.from('inventory_items')
      .update({ current_stock: newStock }).eq('id', adjustId).eq('tenant_id', tenantId)
    if (ue) { showToast(false, ue.message); setSaving(false); return }
    await portalSupabase.from('inventory_transactions').insert({
      tenant_id: tenantId, item_id: adjustId, item_name: item.name,
      type: adjType, quantity: qty,
      note: adjNote.trim() || (adjType === 'in' ? 'Stock received' : adjType === 'out' ? 'Stock used' : 'Manual adjustment'),
    })
    showToast(true, `Stock ${adjType === 'in' ? 'added' : adjType === 'out' ? 'deducted' : 'adjusted'}`)
    await load(tenantId); setSaving(false); setPanel('none')
  }

  async function deleteItem(id: string) {
    if (!confirm('Remove this item?')) return
    await portalSupabase.from('inventory_items').update({ is_active: false }).eq('id', id).eq('tenant_id', tenantId)
    showToast(true, 'Item removed')
    await load(tenantId)
  }

  const allCats = [...new Set(items.map(i => i.category))]
  const lowStock = items.filter(i => i.current_stock <= i.min_stock)
  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items

  const TXN_COLORS: Record<string, string> = { in: '#16A34A', out: '#EF4444', adjustment: '#F59E0B' }
  const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0066CC]'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#F59E0B]" /> Inventory
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{items.length} items · {lowStock.length} low stock</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {([
              { id: 'stock', label: `All (${items.length})` },
              { id: 'low',   label: `⚠ Low (${lowStock.length})` },
              { id: 'txns',  label: 'Transactions' },
            ] as { id: 'stock'|'low'|'txns'; label: string }[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${tab === t.id
                    ? t.id === 'low' ? 'bg-amber-500 text-white' : 'bg-[#0066CC] text-white'
                    : 'text-gray-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] transition">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-sm font-medium border
          ${toast.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Add/Edit Panel */}
      {panel === 'add' && (
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">{editId ? 'Edit Item' : 'Add Inventory Item'}</h2>
            <button onClick={() => setPanel('none')}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-gray-400 mb-1 block">Item Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Basmati Rice" className={inp} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Category *</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Grains" list="cat-inv" className={inp} />
              <datalist id="cat-inv">{allCats.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Unit</label>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg / litre / pcs" list="unit-list" className={inp} />
              <datalist id="unit-list">
                {['kg', 'litre', 'pcs', 'box', 'dozen', 'gram', 'ml', 'packet'].map(u => <option key={u} value={u} />)}
              </datalist>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Current Stock</label>
              <input type="number" min="0" value={form.current_stock || ''} onChange={e => setForm(f => ({ ...f, current_stock: Number(e.target.value) || 0 }))} placeholder="0" className={inp} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Min Stock (reorder level)</label>
              <input type="number" min="0" value={form.min_stock || ''} onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) || 0 }))} placeholder="5" className={inp} />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1 block">Cost per Unit (₹)</label>
              <input type="number" min="0" value={form.cost_per_unit || ''} onChange={e => setForm(f => ({ ...f, cost_per_unit: Number(e.target.value) || 0 }))} placeholder="0" className={inp} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveItem} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] disabled:opacity-50 transition">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {editId ? 'Save Changes' : 'Add Item'}
            </button>
            <button onClick={() => setPanel('none')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Adjust Stock Panel */}
      {panel === 'adjust' && adjustId && (() => {
        const item = items.find(i => i.id === adjustId)!
        return (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Adjust Stock — {item.name}</h2>
              <button onClick={() => setPanel('none')}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Current: <span className="text-white font-bold">{item.current_stock} {item.unit}</span></p>
            <div className="flex gap-2 mb-3">
              {([
                { id: 'in',         label: 'Stock In',    icon: TrendingUp   },
                { id: 'out',        label: 'Stock Out',   icon: TrendingDown },
                { id: 'adjustment', label: 'Set Exact',   icon: SlidersHorizontal },
              ] as { id: 'in'|'out'|'adjustment'; label: string; icon: React.ComponentType<{ className?: string }> }[]).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setAdjType(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition
                    ${adjType === id
                      ? id === 'in' ? 'bg-green-600 text-white' : id === 'out' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">{adjType === 'adjustment' ? 'New Stock Value' : 'Quantity'} ({item.unit})</label>
                <input type="number" min="0" value={adjQty} onChange={e => setAdjQty(e.target.value)} placeholder="0" className={inp} />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 mb-1 block">Note (optional)</label>
                <input value={adjNote} onChange={e => setAdjNote(e.target.value)} placeholder="e.g. Weekly restock" className={inp} />
              </div>
            </div>
            {adjQty && Number(adjQty) > 0 && (
              <p className="text-xs text-gray-500 mb-3">
                New stock will be: <span className="text-white font-bold">
                  {adjType === 'in' ? item.current_stock + Number(adjQty) : adjType === 'out' ? Math.max(0, item.current_stock - Number(adjQty)) : Number(adjQty)} {item.unit}
                </span>
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={doAdjust} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] disabled:opacity-50 transition">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Apply
              </button>
              <button onClick={() => setPanel('none')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition">Cancel</button>
            </div>
          </div>
        )
      })()}

      {/* Search */}
      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

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

          {(tab === 'low' ? lowStock : filtered).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm mb-3">{tab === 'low' ? '✅ No low stock items!' : 'No inventory items.'}</p>
              {tab === 'stock' && <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] transition"><Plus className="w-3.5 h-3.5" /> Add First Item</button>}
            </div>
          ) : (
            <div className="space-y-2">
              {(tab === 'low' ? lowStock : filtered).map(item => (
                <div key={item.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border group
                  ${item.current_stock <= item.min_stock ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category} · {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${item.current_stock <= item.min_stock ? 'text-amber-400' : 'text-white'}`}>
                        {item.current_stock <= item.min_stock && <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
                        {item.current_stock} {item.unit}
                      </p>
                      <p className="text-[10px] text-gray-500">Min: {item.min_stock}</p>
                      {item.cost_per_unit > 0 && <p className="text-[10px] text-gray-600">₹{item.cost_per_unit}/unit</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openAdjust(item)} className="p-1.5 rounded-lg bg-[#0066CC]/10 hover:bg-[#0066CC]/20 text-[#0066CC] transition" title="Adjust Stock"><ArrowUpDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'txns' && !loading && (
        <div className="space-y-2">
          {txns.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No transactions yet.</p>
          ) : txns.map(t => (
            <div key={t.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (TXN_COLORS[t.type] || '#6B7280') + '20' }}>
                  <ArrowUpDown className="w-4 h-4" style={{ color: TXN_COLORS[t.type] || '#6B7280' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.item_name}</p>
                  <p className="text-xs text-gray-500">{t.note || t.type} · {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${t.type === 'in' ? 'text-green-400' : t.type === 'out' ? 'text-red-400' : 'text-amber-400'}`}>
                  {t.type === 'in' ? '+' : t.type === 'out' ? '-' : '='}{t.quantity}
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

