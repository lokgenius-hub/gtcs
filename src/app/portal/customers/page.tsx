'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Loader2, Phone } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:4000'
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('hf_token')}` })

type Customer = { id: string; name: string; phone?: string; outstanding_balance: number; total_purchases: number }

export default function PortalCustomers() {
  const router = useRouter()
  const [customers, setCust] = useState<Customer[]>([])
  const [search, setSearch]  = useState('')
  const [loading, setLoad]   = useState(true)

  useEffect(() => {
    fetch(`${API}/api/v1/retail/customers?limit=200`, { headers: authHeaders() })
      .then(r => { if (r.status === 401) router.replace('/portal'); return r.json() })
      .then(d => setCust(d.data?.customers || []))
      .finally(() => setLoad(false))
  }, [router])

  const filtered = search
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))
    : customers

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-white">Customers</h1>
        <span className="text-xs text-gray-500">{customers.length} total</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0066CC]" />
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">{c.name}</p>
              {c.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total: ₹{c.total_purchases?.toFixed(0) || 0}</p>
              {c.outstanding_balance > 0 && (
                <p className="text-xs text-red-400 font-bold">Due: ₹{c.outstanding_balance.toFixed(0)}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
          No customers yet.
        </div>
      )}
    </div>
  )
}
