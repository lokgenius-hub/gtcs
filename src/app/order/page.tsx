'use client'
import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Plus, Minus, Trash2, ShoppingCart, CheckCircle2, Loader2,
  Leaf, Flame, X, ChefHat, ClipboardList, Bell,
} from 'lucide-react'

// Public anon Supabase client — no auth
const pub = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

type MenuItem = { id: string; name: string; price: number; category: string; is_veg: boolean }
type CartItem = MenuItem & { qty: number }

function genOrderId() {
  const d = new Date()
  const dt = d.toISOString().slice(2, 10).replace(/-/g, '')
  return `TBL-${dt}-${Math.floor(1000 + Math.random() * 9000)}`
}

// ── Main component (reads ?t= and ?table= from URL) ──────────────────────────
function OrderPage() {
  const searchParams = useSearchParams()
  const tenantId  = searchParams.get('t')   || ''
  const tableParam = searchParams.get('table') || ''

  const [menu,       setMenu]       = useState<MenuItem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [tenantName, setTenantName] = useState('')

  const [cart,       setCart]       = useState<CartItem[]>([])
  const [showCart,   setShowCart]   = useState(false)
  const [tableNo,    setTableNo]    = useState(tableParam)
  const [custName,   setCustName]   = useState('')
  const [note,       setNote]       = useState('')
  const [submitting, setSubmit]     = useState(false)
  const [done,       setDone]       = useState<string | null>(null)
  const [activeTab,  setTab]        = useState('All')

  // Load menu items
  useEffect(() => {
    if (!tenantId) { setFetchError('No restaurant specified. Scan the QR code again.'); setLoading(false); return }
    ;(async () => {
      setLoading(true)
      const { data, error } = await pub
        .from('menu_items')
        .select('id,name,price,category,is_veg')
        .eq('tenant_id', tenantId)
        .or('is_available.eq.true,is_active.eq.true')
        .order('category').order('name')
      if (error) { setFetchError('Menu not available. Please ask staff.'); setLoading(false); return }
      if (!data || data.length === 0) { setFetchError('No menu items found. Please ask staff.'); setLoading(false); return }
      setMenu(data)
      setTenantName(tenantId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      setLoading(false)
    })()
  }, [tenantId])

  const categories = ['All', ...Array.from(new Set(menu.map(i => i.category)))]
  const displayed  = activeTab === 'All' ? menu : menu.filter(i => i.category === activeTab)

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      return ex
        ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { ...item, qty: 1 }]
    })
  }, [])

  const changeQty = useCallback((id: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0)
    )
  }, [])

  const totalItems = cart.reduce((s, c) => s + c.qty, 0)
  const totalAmt   = cart.reduce((s, c) => s + c.qty * c.price, 0)

  async function placeOrder() {
    if (!tableNo.trim()) { alert('Please enter your table number.'); return }
    if (cart.length === 0) return
    setSubmit(true)
    const orderId = genOrderId()
    const items = cart.map(c => ({ name: c.name, price: c.price, qty: c.qty, category: c.category }))
    const { error } = await pub.from('pos_orders').insert({
      tenant_id:     tenantId,
      order_number:  orderId,
      items:         JSON.stringify(items),
      total:         totalAmt,
      payment_mode:  'Pay at Counter',
      status:        'pending',
      table_number:  tableNo.trim(),
      customer_name: custName.trim() || null,
      customer_note: note.trim() || null,
      item_count:    totalItems,
      item_summary:  items.map(i => `${i.qty}× ${i.name}`).join(', '),
    })
    setSubmit(false)
    if (error) { alert('Could not place order: ' + error.message); return }
    setDone(orderId)
    setCart([])
    setShowCart(false)
  }

  // ── Order confirmed ───────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-white font-black text-2xl mb-2">Order Placed!</h1>
        <p className="text-white/50 text-sm mb-1">Table <strong className="text-white">{tableNo}</strong></p>
        <p className="text-white/30 text-xs mb-6 font-mono">{done}</p>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-sm text-green-300">
          <ChefHat className="w-6 h-6 mx-auto mb-2" />
          Your order is with the kitchen.<br />Payment at the counter when done.
        </div>
        <button onClick={() => setDone(null)} className="mt-6 text-white/35 text-sm hover:text-white/60 transition-colors">
          ← Order more items
        </button>
      </div>
    </div>
  )

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#0066CC] animate-spin" />
    </div>
  )

  if (fetchError) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-6 text-center">
      <div>
        <Bell className="w-12 h-12 text-yellow-500/50 mx-auto mb-4" />
        <p className="text-red-400 font-semibold mb-2">{fetchError}</p>
        <p className="text-white/30 text-sm">URL format: /order?t=restaurant_id&amp;table=5</p>
      </div>
    </div>
  )

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A1628] text-white pb-28">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#050A14]/95 backdrop-blur border-b border-white/5">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="font-black text-base leading-none">{tenantName}</p>
            {tableNo && <p className="text-[11px] text-white/40 mt-0.5">Table {tableNo}</p>}
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-[#0066CC] text-white text-sm font-semibold px-4 py-2 rounded-xl"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-[11px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Table number if not in URL */}
        {!tableParam && (
          <div className="px-4 pb-3 max-w-lg mx-auto">
            <input
              type="text"
              value={tableNo}
              onChange={e => setTableNo(e.target.value)}
              placeholder="Enter your table number"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0066CC]/50"
            />
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto max-w-lg mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setTab(cat)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all
                ${activeTab === cat ? 'bg-[#0066CC] text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {displayed.map(item => {
          const inCart = cart.find(c => c.id === item.id)
          return (
            <div key={item.id} className="flex items-center gap-3 bg-[#111C2E] rounded-2xl p-3.5 border border-white/5">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                ${item.is_veg ? 'border-green-500' : 'border-red-500'}`}>
                {item.is_veg
                  ? <Leaf className="w-2.5 h-2.5 text-green-500" />
                  : <Flame className="w-2.5 h-2.5 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                <p className="text-white/35 text-xs">{item.category}</p>
              </div>
              <p className="text-white font-bold text-sm shrink-0">₹{item.price}</p>
              {!inCart ? (
                <button onClick={() => addToCart(item)} className="w-8 h-8 bg-[#0066CC] rounded-xl flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 bg-white/8 rounded-lg flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{inCart.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 bg-[#0066CC] rounded-lg flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Floating cart bar */}
      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-20">
          <button
            onClick={() => setShowCart(true)}
            className="w-full max-w-lg bg-[#0066CC] text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-between px-5"
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{totalItems} items</span>
            <span>View Cart →</span>
            <span className="font-black">₹{totalAmt}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCart(false)} />
          <div className="relative bg-[#0D1B2E] rounded-t-3xl p-5 max-h-[85vh] flex flex-col">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#0066CC]" /> Your Order
              </h2>
              <button onClick={() => setShowCart(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-white/40 text-xs">₹{item.price} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">₹{item.price * item.qty}</span>
                    <button onClick={() => changeQty(item.id, -1)} className="text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <input type="text" value={custName} onChange={e => setCustName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 mb-2 focus:outline-none" />
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Special instructions (e.g. less spicy)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 mb-4 focus:outline-none" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">Total</span>
              <span className="text-white font-black text-xl">₹{totalAmt}</span>
            </div>
            <p className="text-white/30 text-xs text-center mb-4">Payment at the counter after your meal</p>

            <button
              onClick={placeOrder}
              disabled={submitting || cart.length === 0 || !tableNo.trim()}
              className="w-full bg-[#0066CC] text-white font-bold py-4 rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChefHat className="w-5 h-5" />}
              {submitting ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap in Suspense (required for useSearchParams in static export)
export default function OrderPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0066CC] animate-spin" />
      </div>
    }>
      <OrderPage />
    </Suspense>
  )
}
