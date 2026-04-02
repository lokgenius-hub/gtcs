'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Minus, Trash2, Receipt, Loader2, CheckCircle2,
  ShoppingCart, X, User, Banknote, CreditCard, Smartphone,
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
      } catch {
        setErrMsg('Could not load products. Check internet connection.')
      } finally {
        setLoadingP(false)
      }
    }
    load()
  }, [router])

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

      {/* ── Left — Product Grid ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="px-4 pt-4 pb-3 bg-[#0A1628] border-b border-white/5">
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

        {/* Product grid */}
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
            disabled={false}
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

// small icon for empty product grid
function Package({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/></svg>
}
