'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Plus, Search, Loader2, AlertTriangle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:4000'
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('hf_token')}` })

type Product = { id: string; name: string; selling_price: number; stock_qty: number; category?: string; barcode?: string; unit?: string; gst_percent: number }

export default function PortalProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoad]      = useState(true)

  useEffect(() => {
    fetch(`${API}/api/v1/retail/products?limit=200`, { headers: authHeaders() })
      .then(r => { if (r.status === 401) router.replace('/portal'); return r.json() })
      .then(d => setProducts(d.data?.products || []))
      .finally(() => setLoad(false))
  }, [router])

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search))
    : products

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-white">Products</h1>
        <span className="text-xs text-gray-500">{products.length} total</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0066CC]" />
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">{p.name}</p>
              <p className="text-xs text-gray-500">{p.category || 'General'} {p.barcode ? `· ${p.barcode}` : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#0066CC]">₹{p.selling_price}</p>
              <p className={`text-xs ${p.stock_qty <= 5 ? 'text-amber-400' : 'text-gray-500'}`}>
                {p.stock_qty <= 5 && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                Stock: {p.stock_qty} {p.unit || ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
          No products found. Add products via the mobile/desktop app or saas-backend API.
        </div>
      )}
    </div>
  )
}
