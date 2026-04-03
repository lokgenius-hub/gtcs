'use client'
import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Plus, Minus, Trash2, ShoppingCart, CheckCircle2, Loader2,
  Leaf, Flame, X, ChefHat, ClipboardList, Bell, AlertCircle,
  Utensils, Package2, Bike, BedDouble, Table2,
} from 'lucide-react'

const pub = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL    || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

type MenuItem = { id: string; name: string; price: number; category: string; is_veg: boolean; description?: string }
type CartItem  = MenuItem & { qty: number }
type OrderType = 'dine-in' | 'room-service' | 'takeaway' | 'delivery'

const ORDER_TYPES: { type: OrderType; icon: React.ElementType; label: string }[] = [
  { type: 'dine-in',      icon: Utensils,  label: 'Dine In'     },
  { type: 'room-service', icon: BedDouble, label: 'Room Service' },
  { type: 'takeaway',     icon: Package2,  label: 'Takeaway'     },
  { type: 'delivery',     icon: Bike,      label: 'Delivery'     },
]

function genOrderId() {
  const dt = new Date().toISOString().slice(2,10).replace(/-/g,"")
  return `TBL-${dt}-${Math.floor(1000 + Math.random() * 9000)}`
}

function OrderPage() {
  const searchParams = useSearchParams()
  const tenantId   = searchParams.get("t")     || ""
  const tableParam = searchParams.get("table") || ""

  const [menu,      setMenu]     = useState<MenuItem[]>([])
  const [loading,   setLoading]  = useState(true)
  const [fetchErr,  setFetchErr] = useState("")
  const [tname,     setTname]    = useState("")
  const [cart,      setCart]     = useState<CartItem[]>([])
  const [showCart,  setShowCart] = useState(false)
  const [activeTab, setTab]      = useState("All")
  const [orderType, setOType]    = useState<OrderType>("dine-in")
  const [tableNo,   setTableNo]  = useState(tableParam)
  const [roomNo,    setRoomNo]   = useState("")
  const [custName,  setCustName] = useState("")
  const [phone,     setPhone]    = useState("")
  const [address,   setAddress]  = useState("")
  const [note,      setNote]     = useState("")
  const [submitting,setSubmit]   = useState(false)
  const [done,      setDone]     = useState<string | null>(null)
  const [orderErr,  setOrderErr] = useState("")

  useEffect(() => {
    if (tableParam) { setTableNo(tableParam); setOType("dine-in") }
  }, [tableParam])

  useEffect(() => {
    if (!tenantId) { setFetchErr("No restaurant specified. Please scan the QR code again."); setLoading(false); return }
    ;(async () => {
      const { data, error } = await pub
        .from("menu_items").select("id,name,price,category,is_veg,description")
        .eq("tenant_id", tenantId).eq("is_active", true)
        .order("category").order("sort_order")
      if (error || !data?.length) { setFetchErr(error?.message ?? "No menu items found."); setLoading(false); return }
      setMenu(data)
      setTname(tenantId.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase()))
      setLoading(false)
    })()
  }, [tenantId])

  const categories = ["All", ...Array.from(new Set(menu.map(i => i.category)))]
  const displayed  = activeTab === "All" ? menu : menu.filter(i => i.category === activeTab)

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => { const ex = prev.find(c => c.id === item.id); return ex ? prev.map(c => c.id===item.id ? {...c,qty:c.qty+1} : c) : [...prev,{...item,qty:1}] })
  }, [])
  const changeQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id===id ? {...c,qty:c.qty+delta} : c).filter(c => c.qty > 0))
  }, [])

  const totalItems = cart.reduce((s,c) => s+c.qty, 0)
  const subtotal   = cart.reduce((s,c) => s+c.qty*c.price, 0)
  const cgst       = parseFloat((subtotal*0.025).toFixed(2))
  const sgst       = cgst
  const total      = subtotal + cgst + sgst

  async function placeOrder() {
    setOrderErr("")
    if (!custName.trim())                              { setOrderErr("Please enter your name."); return }
    if (phone.replace(/\D/g,"").length < 10)          { setOrderErr("Please enter a valid 10-digit phone number."); return }
    if (orderType==="delivery" && !address.trim())    { setOrderErr("Please enter your delivery address."); return }
    if (orderType==="room-service" && !roomNo.trim()) { setOrderErr("Please enter your room number."); return }
    if (orderType==="dine-in" && !tableNo.trim())     { setOrderErr("Please enter your table number."); return }
    if (!cart.length)                                  { setOrderErr("Your cart is empty."); return }
    setSubmit(true)
    const orderId    = genOrderId()
    const orderItems = cart.map(c => ({item_id:c.id,item_name:c.name,price:c.price,quantity:c.qty,category:c.category,tax_rate:5,total:c.price*c.qty}))
    let effTable: string | null = null
    if (orderType==="dine-in")      effTable = tableNo.trim() || null
    if (orderType==="room-service") effTable = `Room ${roomNo.trim()}`
    let effNotes = note.trim()
    if (orderType==="delivery") effNotes = `[DELIVERY] ${address.trim()}` + (effNotes ? "\n" + effNotes : "")
    const { error } = await pub.from("pos_orders").insert({
      tenant_id:tenantId, order_number:orderId,
      order_type: orderType==="room-service" ? "dine-in" : orderType,
      table_name:effTable, customer_name:custName.trim(),
      phone:phone.trim(),
      delivery_address: orderType==="delivery" ? address.trim() : null,
      room_number: orderType==="room-service" ? roomNo.trim() : null,
      notes:effNotes||null, subtotal, cgst, sgst, total,
      payment_mode:"cash", status:"pending", item_count:totalItems,
      item_summary:orderItems.map(i=>`${i.quantity}x ${i.item_name}`).join(", "),
      items:orderItems,
    })
    setSubmit(false)
    if (error) { setOrderErr("Could not place order: "+error.message); return }
    setDone(orderId); setCart([]); setShowCart(false)
  }

  function resetOrder() {
    setDone(null); setShowCart(false)
    setCustName(""); setPhone(""); setNote(""); setAddress(""); setRoomNo("")
    if (!tableParam) setOType("dine-in")
  }

  if (done) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-white font-black text-2xl mb-2">Order Placed!</h1>
        {orderType==="dine-in"      && tableNo && <p className="text-white/50 text-sm mb-1">Table <strong className="text-white">{tableNo}</strong></p>}
        {orderType==="room-service" && roomNo  && <p className="text-white/50 text-sm mb-1">Room <strong className="text-white">{roomNo}</strong></p>}
        {orderType==="delivery"                && <p className="text-white/50 text-sm mb-1">Delivery to <strong className="text-white">{address}</strong></p>}
        {orderType==="takeaway"                && <p className="text-white/50 text-sm mb-1"><strong className="text-white">Takeaway</strong> &mdash; collect at counter</p>}
        <p className="text-white/30 text-xs mb-6 font-mono">{done}</p>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-sm text-green-300 mb-4">
          <ChefHat className="w-6 h-6 mx-auto mb-2" />
          Your order is being prepared.<br />{"We"}&apos;{"ll call"} <strong>{phone}</strong> if needed.
        </div>
        <button onClick={resetOrder} className="text-white/35 text-sm hover:text-white/60 transition-colors">&larr; Order more items</button>
      </div>
    </div>
  )

  if (loading) return <div className="min-h-screen bg-[#0A1628] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#0066CC] animate-spin" /></div>
  if (fetchErr) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-6 text-center">
      <div><Bell className="w-12 h-12 text-yellow-500/50 mx-auto mb-4" /><p className="text-red-400 font-semibold mb-2">{fetchErr}</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A1628] text-white pb-28">
      {tableParam && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-[#0066CC] flex items-center justify-center gap-3 py-2.5 px-4">
          <Table2 className="w-4 h-4 shrink-0" />
          <span className="font-bold text-sm">Table {tableParam}</span>
        </div>
      )}
      <div className={`sticky z-10 bg-[#050A14]/95 backdrop-blur border-b border-white/5 ${tableParam ? "top-9" : "top-0"}`}>
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="font-black text-base leading-none">{tname}</p>
            {tableNo && <p className="text-[11px] text-white/40 mt-0.5">Table {tableNo}</p>}
          </div>
          <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 bg-[#0066CC] text-white text-sm font-semibold px-4 py-2 rounded-xl">
            <ShoppingCart className="w-4 h-4" /> Cart
            {totalItems > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-[11px] font-bold flex items-center justify-center">{totalItems}</span>}
          </button>
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto max-w-lg mx-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => setTab(cat)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${activeTab===cat ? "bg-[#0066CC] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {displayed.map(item => {
          const inCart = cart.find(c => c.id === item.id)
          return (
            <div key={item.id} className="flex items-center gap-3 bg-[#111C2E] rounded-2xl p-3.5 border border-white/5">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${item.is_veg ? "border-green-500" : "border-red-500"}`}>
                {item.is_veg ? <Leaf className="w-2.5 h-2.5 text-green-500" /> : <Flame className="w-2.5 h-2.5 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                {item.description && <p className="text-white/35 text-xs truncate">{item.description}</p>}
              </div>
              <p className="text-white font-bold text-sm shrink-0">&#x20B9;{item.price}</p>
              {!inCart ? (
                <button onClick={() => addToCart(item)} className="w-8 h-8 bg-[#0066CC] rounded-xl flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => changeQty(item.id,-1)} className="w-7 h-7 bg-white/[0.08] rounded-lg flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="w-6 text-center text-sm font-bold">{inCart.qty}</span>
                  <button onClick={() => changeQty(item.id,1)} className="w-7 h-7 bg-[#0066CC] rounded-lg flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-20">
          <button onClick={() => setShowCart(true)} className="w-full max-w-lg bg-[#0066CC] text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-between px-5">
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{totalItems} items</span>
            <span>View Cart</span>
            <span className="font-black">&#x20B9;{Math.round(total)}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative bg-[#0D1B2E] rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <h2 className="font-black text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5 text-[#0066CC]" /> Your Order</h2>
              <button onClick={() => setShowCart(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-white/40 text-xs">&#x20B9;{item.price} x {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm shrink-0">&#x20B9;{item.price * item.qty}</span>
                    <button onClick={() => changeQty(item.id,-1)} className="text-red-400/60 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-white/[0.06] p-4 space-y-3 bg-[#090F1C] shrink-0">
                <div className="bg-white/5 rounded-xl p-3 space-y-1 text-sm">
                  <div className="flex justify-between text-white/50"><span>Subtotal</span><span>&#x20B9;{Math.round(subtotal)}</span></div>
                  <div className="flex justify-between text-white/50"><span>CGST 2.5%</span><span>&#x20B9;{cgst}</span></div>
                  <div className="flex justify-between text-white/50"><span>SGST 2.5%</span><span>&#x20B9;{sgst}</span></div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-white/[0.06]"><span>Total</span><span className="text-[#0066CC]">&#x20B9;{Math.round(total)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ORDER_TYPES.map(({ type, icon: Icon, label }) => (
                    <button key={type} onClick={() => setOType(type)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${orderType===type ? "border-[#0066CC]/50 bg-[#0066CC]/15 text-[#4DA3FF]" : "border-white/10 bg-white/5 text-white/40"}`}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <input type="text" placeholder="Your name *" value={custName} onChange={e => setCustName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none" />
                  <input type="tel" placeholder="Phone number * (10 digits)" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none" />
                  {orderType==="dine-in" && (
                    tableParam ? (
                      <div className="w-full flex items-center gap-3 bg-[#0066CC]/10 border border-[#0066CC]/30 rounded-xl px-4 py-2.5">
                        <Table2 className="w-4 h-4 text-[#0066CC] shrink-0" />
                        <span className="text-white/80 text-sm flex-1">Table <strong className="text-[#4DA3FF]">{tableNo}</strong></span>
                        <span className="text-white/30 text-xs">pre-filled</span>
                      </div>
                    ) : (
                      <input type="text" placeholder="Table number *" value={tableNo} onChange={e => setTableNo(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none" />
                    )
                  )}
                  {orderType==="room-service" && (
                    <input type="text" placeholder="Room number * (e.g. 101)" value={roomNo} onChange={e => setRoomNo(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none" />
                  )}
                  {orderType==="delivery" && (
                    <textarea placeholder="Delivery address *" value={address} onChange={e => setAddress(e.target.value)} rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none resize-none" />
                  )}
                  {orderType==="takeaway" && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Ready at counter. We will call you when ready.</span>
                    </div>
                  )}
                  <textarea placeholder="Special instructions (optional)" value={note} onChange={e => setNote(e.target.value)} rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none resize-none" />
                </div>
                {orderErr && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{orderErr}</p>}
                <button onClick={placeOrder} disabled={submitting || !cart.length}
                  className="w-full bg-[#0066CC] text-white font-bold py-4 rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChefHat className="w-5 h-5" />}
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>
                <p className="text-white/25 text-xs text-center">Payment at the counter after your meal</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A1628] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#0066CC] animate-spin" /></div>}>
      <OrderPage />
    </Suspense>
  )
}
