'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Gift, Search, Loader2, TrendingUp, Star } from 'lucide-react'
import { portalSupabase, getPortalSession, type CoinProfile, type CoinConfig } from '@/lib/portal-db'

export default function PortalCoins() {
  const router = useRouter()
  const [customers, setCust]  = useState<CoinProfile[]>([])
  const [config, setConfig]   = useState<CoinConfig | null>(null)
  const [search, setSearch]   = useState('')
  const [loading, setLoad]    = useState(true)
  const [tab, setTab]         = useState<'customers' | 'rules'>('customers')

  useEffect(() => {
    async function load() {
      setLoad(true)
      try {
        const sess = await getPortalSession()
        if (!sess) { router.replace('/portal'); return }
        const tid = sess.tenantId
        const [cRes, rRes] = await Promise.all([
          portalSupabase.from('coin_profiles').select('*').eq('tenant_id', tid).order('balance', { ascending: false }),
          portalSupabase.from('coin_config').select('*').eq('tenant_id', tid).single(),
        ])
        setCust(cRes.data ?? [])
        setConfig(rRes.data ?? null)
      } catch { /* offline */ }
      finally { setLoad(false) }
    }
    load()
  }, [router])

  const filtered = search
    ? customers.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search))
    : customers

  const totalCoins = customers.reduce((s, c) => s + (c.balance || 0), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-[#F59E0B]" /> Coin Loyalty System
        </h1>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {(['customers', 'rules'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all
                ${tab === t ? 'bg-[#F59E0B] text-white' : 'text-gray-400 hover:text-white'}`}>
              {t === 'rules' ? 'Earn/Redeem Rules' : 'Customers'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Total Members',   value: customers.length.toLocaleString('en-IN'),  color: '#0066CC', icon: Star  },
          { label: 'Coins in Wallets', value: totalCoins.toLocaleString('en-IN'),        color: '#F59E0B', icon: Coins },
        ].map(c => (
          <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <c.icon className="w-5 h-5 mx-auto mb-1" style={{ color: c.color }} />
            <p className="text-xl font-extrabold text-white">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      {/* Customers */}
      {tab === 'customers' && !loading && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customer…"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]" />
          </div>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No loyalty customers yet.</p>
            ) : filtered.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] font-bold text-xs">
                    {(c.name || c.phone || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.name || 'Guest'}</p>
                    {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#F59E0B]">{c.balance.toLocaleString('en-IN')} coins</p>
                  <p className="text-[10px] text-gray-500">balance</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Rules */}
      {tab === 'rules' && !loading && (
        <div className="space-y-4">
          {config ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#F59E0B]" /> Active Coin Rules</h3>
              {[
                { label: 'Earn Rate',   value: `₹${config.spend_per_coin} spent = 1 coin`,            icon: '⬆️' },
                { label: 'Coin Value',  value: `1 coin = ₹${config.coin_value} discount`,             icon: '💰' },
                { label: 'Min Redeem', value: `${config.min_redeem} coins minimum`,                  icon: '🔒' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-400">{r.icon} {r.label}</span>
                  <span className="text-sm font-bold text-white">{r.value}</span>
                </div>
              ))}
              <p className="text-xs text-gray-600 mt-2">To change rules, update via the desktop app or mysharda admin.</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <Gift className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No coin config found for this tenant.</p>
              <p className="text-xs text-gray-600 mt-1">Run the seed SQL in Supabase to add default coin rules.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
