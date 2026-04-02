'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Minus, Trash2, Receipt, Loader2, CheckCircle2,
  ShoppingCart, X, User, Banknote, CreditCard, Smartphone, Package,
  Bell, ChefHat, Clock, TableProperties,
} from 'lucide-react'
import { portalSupabase, getPortalSession, generateOrderNumber, type MenuItem } from '@/lib/portal-db'

type CartItem = MenuItem & { qty: number; lineTotal: number }
type PayMode  = 'Cash' | 'UPI' | 'Card'

// ─── Format ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n.toFixed(2)}`

export default function WebPOS() {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  const [products, setProducts]   = useState<MenuItem[]>([])
  const [filtered, setFiltered]   = useState<MenuItem[]>([])
  const [search, setSearch]       = useState('')
  const [loadingP, setLoadingP]   = useState(true)
  const [tenantId, setTenantId]   = useState('')

  // Table orders (from customers via QR)
  type TableOrder = { id: string; order_number: string; table_number: string; customer_name?: string; customer_note?: string; items: string; total: number; created_at: string; status: string }
  const [tableOrders,  setTableOrders]  = useState<TableOrder[]>([])
  const [posTab,       setPosTab]       = useState<'menu' | 'table'>('menu')
  const [loadingTO,    setLoadingTO]    = useState(false)
  const [toastMsg,     setToastMsg]     = useState('')

  const [cart, setCart]           = useState<CartItem[]>([])
  const [payMode, setPayMode]     = useState<PayMode>('Cash')
  const [submitting, setSubmit]   = useState(false)
  const [bill, setBill]           = useState<{ id: string; bill_no: string } | null>(null)
  const [errMsg, setErrMsg]       = useState('')
  const [custName, setCustName]   = useState('')

  // ── Load menu items from Supabase ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingP(true)
      try {
        const sess = await getPortalSession()
        if (!sess) { router.replace('/portal'); return }
        setTenantId(sess.tenantId)
        const { data, error } = await portalSupabase
          .from('menu_items')
          .select('id,name,price,category,is_veg,tax_rate,is_active,sort_order,tenant_id')
          .eq('tenant_id', sess.tenantId)
          .eq('is_active', true)
          .order('category').order('sort_order')
        if (error) { setErrMsg('Could not load menu. ' + error.message); return }
        setProducts(data ?? [])
        setFiltered(data ?? [])

        // Load pending table orders
        await loadTableOrders(sess.tenantId)
      } catch {
        setErrMsg('Could not load products. Check internet connection.')
      } finally {
        setLoadingP(false)
      }
    }
    load()
  }, [router])

  // Load pending table orders (customer QR orders)
  const loadTableOrders = useCallback(async (tid?: string) => {
    const id = tid || tenantId
    if (!id) return
    setLoadingTO(true)
    const { data } = await portalSupabase
      .from('pos_orders')
      .select('id,order_number,table_number,customer_name,customer_note,items,total,created_at,status')
      .eq('tenant_id', id)
      .in('status', ['pending', 'in-progress'])
      .order('created_at', { ascending: true })
    setTableOrders((data as TableOrder[]) ?? [])
    setLoadingTO(false)
  }, [tenantId])

  const acceptOrder = useCallback(async (id: string) => {
    await portalSupabase.from('pos_orders').update({ status: 'in-progress' }).eq('id', id)
    setToastMsg('Order accepted — kitchen notified!')
    setTimeout(() => setToastMsg(''), 3000)
    loadTableOrders()
  }, [loadTableOrders])

  const completeOrder = useCallback(async (id: string) => {
    await portalSupabase.from('pos_orders').update({ status: 'completed' }).eq('id', id)
    setToastMsg('Order marked complete.')
    setTimeout(() => setToastMsg(''), 3000)
    loadTableOrders()
  }, [loadTableOrders])

  // ── Search filter ─────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q
        ? products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          )
        : products
    )
  }, [search, products])

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const addToCart = useCallback((p: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === p.id)
      if (exists) {
        return prev.map(c =>
          c.id === p.id
            ? { ...c, qty: c.qty + 1, lineTotal: (c.qty + 1) * p.price }
            : c
        )
      }
      return [...prev, { ...p, qty: 1, lineTotal: p.price }]
    })
    setSearch('')
    searchRef.current?.focus()
  }, [])

  const changeQty = (id: string, delta: number) =>
    setCart(prev =>
      prev
        .map(c => c.id === id ? { ...c, qty: c.qty + delta, lineTotal: (c.qty + delta) * c.price } : c)
        .filter(c => c.qty > 0)
    )

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id))
  const clearCart = () => { setCart([]); setCustName(''); setBill(null); setErrMsg('') }

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal   = cart.reduce((s, c) => s + c.lineTotal, 0)
  const cgst       = cart.reduce((s, c) => s + (c.lineTotal * c.tax_rate) / 200, 0)   // half of tax_rate
  const sgst       = cgst
  const grandTotal = subtotal + cgst + sgst

  // ── Submit sale to Supabase ───────────────────────────────────────────────
  async function submitSale() {
    if (!cart.length || !tenantId) return
    setSubmit(true)
    setErrMsg('')
    try {
      const orderNumber = generateOrderNumber()
      const items = cart.map(c => ({
        item_id:   c.id,
        item_name: c.name,
        category:  c.category,
        price:     c.price,
        quantity:  c.qty,
        tax_rate:  c.tax_rate,
        total:     c.lineTotal,
      }))
      const { data, error } = await portalSupabase.from('pos_orders').insert({
        tenant_id:     tenantId,
        order_number:  orderNumber,
        order_type:    'takeaway',
        customer_name: custName || null,
        subtotal:      subtotal,
        cgst:          cgst,
        sgst:          sgst,
        total:         grandTotal,
        payment_mode:  payMode,
        status:        'paid',
        item_count:    cart.reduce((s, c) => s + c.qty, 0),
        item_summary:  cart.map(c => `${c.name}×${c.qty}`).join(', '),
        items,
      }).select('id,order_number').single()

      if (error) { setErrMsg('Failed to save bill: ' + error.message); return }
      setBill({ id: data!.id, bill_no: data!.order_number })
      setCart([])
      setCustName('')
    } catch {
      setErrMsg('Network error. Check your connection.')
    } finally {
      setSubmit(false)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col md:flex-row gap-0 overflow-hidden">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl">
          {toastMsg}
        </div>
      )}

      {/* ── Left — Product Grid + Table Orders ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs: Menu | Table Orders */}
        <div className="px-4 pt-3 pb-0 flex gap-2 border-b border-white/5">
          <button
            onClick={() => setPosTab('menu')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              posTab === 'menu' ? 'text-white border-[#0066CC]' : 'text-white/40 border-transparent hover:text-white/70'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> POS Billing
          </button>
          <button
            onClick={() => { setPosTab('table'); loadTableOrders() }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
              posTab === 'table' ? 'text-white border-[#FF6600]' : 'text-white/40 border-transparent hover:text-white/70'
            }`}
          >
            <TableProperties className="w-4 h-4" /> Table Orders
            {tableOrders.length > 0 && (
              <span className="bg-[#FF6600] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {tableOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Search bar — only on menu tab */}
        {posTab === 'menu' && (
          <div className="px-4 pt-4 pb-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products, barcode, category…"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
              />
            </div>
          </div>
        )}

        {/* Table Orders panel */}
        {posTab === 'table' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white/50 text-xs">Customer orders via QR code</p>
              <button onClick={() => loadTableOrders()} className="text-[#0066CC] text-xs font-semibold">
                {loadingTO ? 'Loading…' : '↻ Refresh'}
              </button>
            </div>
            {tableOrders.length === 0 && !loadingTO && (
              <div className="text-center py-16 text-white/25">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No pending table orders</p>
                <p className="text-xs mt-1">Customers scan QR → orders appear here</p>
              </div>
            )}
            {tableOrders.map(order => {
              let parsedItems: {name:string;qty:number;price:number}[] = []
              try { parsedItems = JSON.parse(order.items) } catch { /* ignore */ }
              return (
                <div key={order.id} className={`rounded-2xl border p-4 space-y-3 ${
                  order.status === 'in-progress'
                    ? 'bg-orange-500/8 border-orange-500/25'
                    : 'bg-white/4 border-white/10'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <TableProperties className="w-4 h-4 text-[#0066CC]" />
                        <span className="font-bold text-white text-sm">Table {order.table_number}</span>
                        {order.status === 'in-progress' && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">IN KITCHEN</span>
                        )}
                        {order.status === 'pending' && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">NEW</span>
                        )}
                      </div>
                      {order.customer_name && <p className="text-white/40 text-xs mt-0.5">{order.customer_name}</p>}
                      <p className="text-white/30 text-[10px] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}
                        &nbsp;·&nbsp;{order.order_number}
                      </p>
                    </div>
                    <span className="font-black text-white text-base">₹{order.total}</span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    {parsedItems.map((it,i) => (
                      <div key={i} className="flex justify-between text-xs text-white/60">
                        <span>{it.qty}× {it.name}</span>
                        <span>₹{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  {order.customer_note && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 text-xs text-yellow-300">
                      📝 {order.customer_note}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#FF6600] text-white text-xs font-bold py-2.5 rounded-xl"
                      >
                        <ChefHat className="w-3.5 h-3.5" /> Accept & Send to Kitchen
                      </button>
                    )}
                    {order.status === 'in-progress' && (
                      <button
                        onClick={() => completeOrder(order.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Served
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Product grid — only on menu tab */}
        {posTab === 'menu' && (
          <div className="flex-1 overflow-y-auto p-4">
            {loadingP ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading products…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                {search ? `No products match "${search}"` : 'No products added yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="text-left p-3 rounded-xl border transition-all bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#0066CC]/40 active:scale-95"
                  >
                    <p className="text-xs font-semibold text-white leading-tight line-clamp-2 mb-2">{p.name}</p>
                    <p className="text-base font-extrabold text-[#0066CC]">{fmt(p.price)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{p.category}</p>
                    {p.tax_rate > 0 && (
                      <span className="inline-block bg-green-500/10 text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded mt-1">
                        GST {p.tax_rate}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right — Cart ─────────────────────────────────────────────────── */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-l border-white/5 bg-[#050A14] overflow-hidden">

        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#0066CC]" />
            <span className="font-bold text-sm">Cart</span>
            {cart.length > 0 && (
              <span className="bg-[#0066CC] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {cart.reduce((s, c) => s + c.qty, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Success banner */}
        {bill && (
          <div className="mx-3 mt-3 flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Bill saved!</p>
              <p className="text-xs text-green-500">{bill.bill_no}</p>
            </div>
            <button onClick={() => setBill(null)} className="ml-auto text-green-600 hover:text-green-300"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Error */}
        {errMsg && !bill && (
          <div className="mx-3 mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
            {errMsg}
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-gray-600 py-12 text-sm">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-20" />
              Cart is empty.<br />Click a product to add.
            </div>
          ) : (
            cart.map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{fmt(c.price)} × {c.qty}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => changeQty(c.id, -1)}
                    className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-5 text-center">{c.qty}</span>
                  <button
                    onClick={() => changeQty(c.id, +1)}
                    className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              <p className="text-sm font-bold text-white w-16 text-right">{fmt(c.lineTotal)}</p>
                <button onClick={() => removeFromCart(c.id)} className="text-gray-500 hover:text-red-400 ml-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals + Payment */}
        {cart.length > 0 && (
          <div className="px-4 pt-3 pb-4 border-t border-white/5 space-y-3">
            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {(cgst + sgst) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>GST (CGST+SGST)</span><span>{fmt(cgst + sgst)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-extrabold text-base border-t border-white/10 pt-2">
                <span>Total</span><span>{fmt(grandTotal)}</span>
              </div>
            </div>

            {/* Customer name (optional) */}
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={custName}
                onChange={e => setCustName(e.target.value)}
                placeholder="Customer name (optional)"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-[#0066CC]"
              />
            </div>

            {/* Payment mode */}
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: 'Cash', label: 'Cash',  icon: Banknote },
                { id: 'UPI',  label: 'UPI',   icon: Smartphone },
                { id: 'Card', label: 'Card',  icon: CreditCard },
              ] as { id: PayMode; label: string; icon: React.ComponentType<{ className?: string }> }[]).map(m => (
                <button
                  key={m.id}
                  onClick={() => setPayMode(m.id)}
                  className={`flex flex-col items-center py-2 rounded-xl text-xs font-bold transition-all
                    ${payMode === m.id
                      ? 'bg-[#0066CC] text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                >
                  <m.icon className="w-4 h-4 mb-0.5" />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={submitSale}
              disabled={submitting}
              className="w-full bg-[#FF6600] hover:bg-[#E55A00] disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-500/20"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                : <><Receipt className="w-4 h-4" /> Save Bill · {fmt(grandTotal)}</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

