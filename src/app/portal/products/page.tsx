'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Loader2, Leaf, Flame, Plus, Upload, Pencil, Trash2,
  X, CheckCircle2, AlertCircle, FileText,
} from 'lucide-react'
import { portalSupabase, getPortalSession, type MenuItem } from '@/lib/portal-db'

/* ── Types ─────────────────────────────────────────────────────────────── */
type DraftItem = Omit<MenuItem, 'id' | 'tenant_id' | 'sort_order'>

const BLANK: DraftItem = { name: '', category: '', price: 0, is_veg: true, tax_rate: 5, is_active: true }

/* ── CSV helpers ────────────────────────────────────────────────────────── */
// Expected CSV columns (case-insensitive): name, category, price, is_veg, tax_rate
function parseCSV(text: string): { rows: DraftItem[]; errors: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: ['CSV has no data rows'] }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
  const idx = {
    name:     header.indexOf('name'),
    category: header.indexOf('category'),
    price:    header.indexOf('price'),
    is_veg:   header.findIndex(h => h === 'is_veg' || h === 'veg'),
    tax_rate: header.findIndex(h => h === 'tax_rate' || h === 'gst' || h === 'tax'),
  }

  const errors: string[] = []
  if (idx.name < 0)     errors.push('Missing column: name')
  if (idx.category < 0) errors.push('Missing column: category')
  if (idx.price < 0)    errors.push('Missing column: price')
  if (errors.length) return { rows: [], errors }

  const rows: DraftItem[] = []
  lines.slice(1).forEach((line, i) => {
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))
    const name     = cols[idx.name] ?? ''
    const category = cols[idx.category] ?? ''
    const price    = parseFloat(cols[idx.price] ?? '0')
    if (!name || !category) { errors.push(`Row ${i + 2}: missing name/category`); return }
    if (isNaN(price))       { errors.push(`Row ${i + 2}: invalid price`); return }

    const rawVeg = (cols[idx.is_veg] ?? 'true').toLowerCase()
    const is_veg = ['true', 'yes', 'veg', '1', 'y'].includes(rawVeg)
    const tax_rate = idx.tax_rate >= 0 ? parseFloat(cols[idx.tax_rate] ?? '5') || 5 : 5

    rows.push({ name, category, price, is_veg, tax_rate, is_active: true })
  })
  return { rows, errors }
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function PortalProducts() {
  const router = useRouter()
  const [tenantId, setTenantId] = useState('')
  const [items,    setItems]    = useState<MenuItem[]>([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoad]     = useState(true)

  /* ── panel state ── */
  const [panel,    setPanel]    = useState<'none' | 'add' | 'csv'>('none')
  const [editId,   setEditId]   = useState<string | null>(null)

  /* ── add/edit form ── */
  const [form,     setForm]     = useState<DraftItem>(BLANK)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  /* ── CSV state ── */
  const [csvRows,  setCsvRows]  = useState<DraftItem[]>([])
  const [csvErrors,setCsvErrors]= useState<string[]>([])
  const [csvName,  setCsvName]  = useState('')
  const [importing,setImporting]= useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── load items ── */
  async function load(tid: string) {
    const { data } = await portalSupabase
      .from('menu_items')
      .select('id,name,price,category,is_veg,tax_rate,is_active,sort_order,tenant_id')
      .eq('tenant_id', tid)
      .order('category').order('sort_order')
    setItems(data ?? [])
  }

  useEffect(() => {
    async function init() {
      const sess = await getPortalSession()
      if (!sess) { router.replace('/portal'); return }
      setTenantId(sess.tenantId)
      await load(sess.tenantId)
      setLoad(false)
    }
    init()
  }, [router])

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  /* ── open add panel ── */
  function openAdd() {
    setForm(BLANK)
    setEditId(null)
    setPanel('add')
  }

  /* ── open edit for an item ── */
  function openEdit(item: MenuItem) {
    setForm({ name: item.name, category: item.category, price: item.price,
              is_veg: item.is_veg, tax_rate: item.tax_rate, is_active: item.is_active })
    setEditId(item.id)
    setPanel('add')
  }

  /* ── save (add or edit) ── */
  async function saveItem() {
    if (!form.name.trim() || !form.category.trim() || form.price <= 0) {
      showToast('err', 'Name, category and price are required'); return
    }
    setSaving(true)
    if (editId) {
      const { error } = await portalSupabase.from('menu_items')
        .update({ name: form.name.trim(), category: form.category.trim(),
                  price: form.price, is_veg: form.is_veg, tax_rate: form.tax_rate,
                  is_active: form.is_active })
        .eq('id', editId).eq('tenant_id', tenantId)
      if (error) { showToast('err', error.message); setSaving(false); return }
      showToast('ok', 'Item updated')
    } else {
      const maxOrder = items.length ? Math.max(...items.map(i => i.sort_order)) + 1 : 1
      const { error } = await portalSupabase.from('menu_items')
        .insert({ ...form, name: form.name.trim(), category: form.category.trim(),
                  tenant_id: tenantId, sort_order: maxOrder })
      if (error) { showToast('err', error.message); setSaving(false); return }
      showToast('ok', 'Item added')
    }
    await load(tenantId)
    setSaving(false)
    setPanel('none')
  }

  /* ── delete ── */
  async function deleteItem(id: string) {
    if (!confirm('Delete this menu item?')) return
    const { error } = await portalSupabase.from('menu_items').delete()
      .eq('id', id).eq('tenant_id', tenantId)
    if (error) { showToast('err', error.message); return }
    showToast('ok', 'Item deleted')
    await load(tenantId)
  }

  /* ── CSV file pick ── */
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const { rows, errors } = parseCSV(text)
      setCsvRows(rows)
      setCsvErrors(errors)
    }
    reader.readAsText(file)
  }

  /* ── CSV import ── */
  async function importCSV() {
    if (!csvRows.length) return
    setImporting(true)
    const maxOrder = items.length ? Math.max(...items.map(i => i.sort_order)) : 0
    const inserts = csvRows.map((r, i) => ({ ...r, tenant_id: tenantId, sort_order: maxOrder + i + 1 }))
    const { error } = await portalSupabase.from('menu_items').insert(inserts)
    if (error) { showToast('err', error.message); setImporting(false); return }
    showToast('ok', `${csvRows.length} items imported`)
    await load(tenantId)
    setImporting(false)
    setCsvRows([])
    setCsvErrors([])
    setCsvName('')
    setPanel('none')
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── filtered view (shows all items including inactive) ── */
  const activeItems = items.filter(i => i.is_active)
  const filtered = search
    ? activeItems.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()))
    : activeItems
  const cats = [...new Set(filtered.map(p => p.category))]

  /* ── categories for datalist autocomplete ── */
  const allCats = [...new Set(items.map(i => i.category))]

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* ── header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">Products / Menu</h1>
          <p className="text-xs text-gray-500 mt-0.5">{items.length} total · {activeItems.length} active</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPanel(panel === 'csv' ? 'none' : 'csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition">
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] transition">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>

      {/* ── toast ── */}
      {toast && (
        <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-sm font-medium border
          ${toast.type === 'ok'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {toast.type === 'ok'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PANEL: Add / Edit Item
      ══════════════════════════════════════════════ */}
      {panel === 'add' && (
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">{editId ? 'Edit Item' : 'Add New Item'}</h2>
            <button onClick={() => setPanel('none')}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Item Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Paneer Butter Masala"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0066CC]" />
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Category *</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Main Course"
                list="cat-list"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0066CC]" />
              <datalist id="cat-list">
                {allCats.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* Price */}
            <div>
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Price (₹) *</label>
              <input type="number" min="0" value={form.price || ''}
                onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0066CC]" />
            </div>

            {/* GST */}
            <div>
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">GST %</label>
              <select value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: Number(e.target.value) }))}
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0066CC]">
                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>

            {/* Veg toggle */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400 font-medium">Type</span>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, is_veg: true }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition
                    ${form.is_veg ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  <Leaf className="w-3 h-3" /> Veg
                </button>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, is_veg: false }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition
                    ${!form.is_veg ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  <Flame className="w-3 h-3" /> Non-Veg
                </button>
              </div>
            </div>

            {/* Active toggle (edit only) */}
            {editId && (
              <div className="flex items-center gap-2">
                <input id="active-chk" type="checkbox" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="accent-[#0066CC] w-4 h-4" />
                <label htmlFor="active-chk" className="text-xs text-gray-300">Active (visible in POS)</label>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={saveItem} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] disabled:opacity-50 transition">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {editId ? 'Save Changes' : 'Add Item'}
            </button>
            <button onClick={() => setPanel('none')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PANEL: CSV Import
      ══════════════════════════════════════════════ */}
      {panel === 'csv' && (
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Import Menu from CSV</h2>
            <button onClick={() => { setPanel('none'); setCsvRows([]); setCsvErrors([]) }}>
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Format hint */}
          <div className="flex items-start gap-2 bg-[#0066CC]/10 border border-[#0066CC]/20 rounded-xl px-3 py-2.5 mb-4">
            <FileText className="w-4 h-4 text-[#0066CC] mt-0.5 shrink-0" />
            <div className="text-xs text-gray-400 leading-relaxed">
              CSV must have headers: <span className="text-white font-mono">name, category, price, is_veg, tax_rate</span><br />
              <span className="text-gray-500">is_veg: true/false/yes/no/veg &nbsp;|&nbsp; tax_rate: 0/5/12/18/28</span><br />
              <a href="data:text/csv;charset=utf-8,name,category,price,is_veg,tax_rate%0APaneer Butter Masala,Main Course,280,true,5%0AChicken Biryani,Biryani,320,false,5"
                download="menu-template.csv"
                className="text-[#0066CC] underline mt-0.5 inline-block">
                Download template CSV
              </a>
            </div>
          </div>

          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-xl px-4 py-6 text-center cursor-pointer hover:border-[#0066CC]/50 transition mb-3">
            <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{csvName || 'Click to choose a CSV file'}</p>
            <p className="text-xs text-gray-600 mt-1">or drag and drop</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />

          {/* Errors */}
          {csvErrors.length > 0 && (
            <div className="mb-3 space-y-1">
              {csvErrors.map((e, i) => (
                <p key={i} className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {e}
                </p>
              ))}
            </div>
          )}

          {/* Preview table */}
          {csvRows.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2 font-medium">Preview — {csvRows.length} items</p>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/5 text-gray-400">
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-left px-3 py-2 font-medium">Category</th>
                      <th className="text-right px-3 py-2 font-medium">Price</th>
                      <th className="text-center px-3 py-2 font-medium">Type</th>
                      <th className="text-center px-3 py-2 font-medium">GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((r, i) => (
                      <tr key={i} className="border-t border-white/5 text-gray-300">
                        <td className="px-3 py-2">{r.name}</td>
                        <td className="px-3 py-2 text-gray-500">{r.category}</td>
                        <td className="px-3 py-2 text-right text-[#0066CC] font-semibold">₹{r.price}</td>
                        <td className="px-3 py-2 text-center">
                          {r.is_veg
                            ? <span className="text-green-500">Veg</span>
                            : <span className="text-red-400">Non-Veg</span>}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-500">{r.tax_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={importCSV} disabled={!csvRows.length || importing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] disabled:opacity-50 transition">
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {importing ? 'Importing…' : `Import ${csvRows.length || ''} Items`}
            </button>
            <button onClick={() => { setPanel('none'); setCsvRows([]); setCsvErrors([]); setCsvName('') }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── search ── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or category…"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0066CC]" />
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm mb-3">No menu items found.</p>
          <button onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066CC] text-white hover:bg-[#0055AA] transition">
            <Plus className="w-3.5 h-3.5" /> Add Your First Item
          </button>
        </div>
      )}

      {/* ── grouped list ── */}
      {cats.map(cat => (
        <div key={cat} className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{cat}</p>
          <div className="space-y-2">
            {filtered.filter(p => p.category === cat).map(p => (
              <div key={p.id}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 group">
                <div className="flex items-center gap-2">
                  {p.is_veg
                    ? <Leaf className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    : <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.is_veg ? 'Veg' : 'Non-Veg'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0066CC]">₹{p.price}</p>
                    {p.tax_rate > 0 && <p className="text-[10px] text-gray-500">GST {p.tax_rate}%</p>}
                  </div>
                  {/* action buttons — visible on hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#0066CC]/20 text-gray-400 hover:text-[#0066CC] transition"
                      title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteItem(p.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                      title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

