'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Coins, Search, PlusCircle, Loader2, CheckCircle2,
  ArrowUpCircle, ArrowDownCircle, Send, IndianRupee, X,
  Settings, Save, User, Star,
} from 'lucide-react'
import { portalSupabase, getPortalSession, type CoinConfig, type CoinProfile } from '@/lib/portal-db'

// ── helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateProfile(
  tenantId: string, phone: string, name?: string
): Promise<CoinProfile> {
  const { data: existing } = await portalSupabase
    .from('coin_profiles').select('*').eq('tenant_id', tenantId).eq('phone', phone).maybeSingle()
  if (existing) {
    if (name && !existing.name) {
      await portalSupabase.from('coin_profiles').update({ name }).eq('tenant_id', tenantId).eq('phone', phone)
      existing.name = name
    }
    return existing as CoinProfile
  }
  const { data: created, error } = await portalSupabase
    .from('coin_profiles').insert({ tenant_id: tenantId, phone, name: name || null, balance: 0 })
    .select().maybeSingle()
  if (error || !created) throw new Error(error?.message || 'Failed to create profile')
  return created as CoinProfile
}

async function fetchProfile(tenantId: string, phone: string): Promise<CoinProfile | null> {
  const { data } = await portalSupabase
    .from('coin_profiles').select('*').eq('tenant_id', tenantId).eq('phone', phone).maybeSingle()
  return data ?? null
}

interface TxRow { id: string; type: 'credit'|'debit'; coins: number; note?: string; created_at: string }
async function fetchTransactions(tenantId: string, profileId: string): Promise<TxRow[]> {
  const { data } = await portalSupabase.from('coin_transactions')
    .select('*').eq('tenant_id', tenantId).eq('profile_id', profileId)
    .order('created_at', { ascending: false }).limit(20)
  return (data ?? []) as TxRow[]
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PortalCoins() {
  const router = useRouter()
  const [tenantId,      setTenantId]  = useState('')
  const [config,        setConfig]    = useState<CoinConfig | null>(null)
  const [configLoading, setCfgLoad]   = useState(true)
  const [tab,           setTab]       = useState<'add' | 'balance' | 'settings'>('add')

  useEffect(() => {
    getPortalSession().then(sess => {
      if (!sess) { router.replace('/portal'); return }
      setTenantId(sess.tenantId)
      portalSupabase.from('coin_config').select('*').eq('tenant_id', sess.tenantId).maybeSingle()
        .then(({ data }) => { setConfig(data ?? null); setCfgLoad(false) })
    })
  }, [router])

  const reload = async () => {
    if (!tenantId) return
    const { data } = await portalSupabase.from('coin_config').select('*').eq('tenant_id', tenantId).maybeSingle()
    setConfig(data ?? null)
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-[#F59E0B]" /> Coin Loyalty System
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Award coins on every purchase · check &amp; redeem customer balance</p>
      </div>

      {/* Config pills */}
      {!configLoading && config && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            [`₹${config.spend_per_coin}`, '= 1 Coin earned'],
            ['1 Coin', `= ₹${config.coin_value} discount`],
            [`${config.min_redeem}`, 'min coins to redeem'],
          ].map(([v, l]) => (
            <div key={v} className="p-3 rounded-xl border border-white/10 bg-white/5 text-center">
              <p className="text-[#F59E0B] font-bold text-lg">{v}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { id: 'add',      label: 'Add Coins',      icon: PlusCircle },
          { id: 'balance',  label: 'Check Balance',  icon: Search },
          { id: 'settings', label: 'Settings',       icon: Settings },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all
              ${tab === id ? 'bg-[#F59E0B] text-black' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {configLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : !config ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm text-center">
          No coin config found. Run the seed SQL to create default coin rules for this tenant.
        </div>
      ) : tab === 'add' ? (
        <AddCoinsTab tenantId={tenantId} config={config} />
      ) : tab === 'settings' ? (
        <SettingsTab tenantId={tenantId} config={config} onSaved={reload} />
      ) : (
        <CheckBalanceTab tenantId={tenantId} config={config} />
      )}
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ tenantId, config, onSaved }: { tenantId: string; config: CoinConfig; onSaved: () => void }) {
  const [spend,   setSpend]   = useState(String(config.spend_per_coin))
  const [val,     setVal]     = useState(String(config.coin_value))
  const [minR,    setMinR]    = useState(String(config.min_redeem))
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [err,     setErr]     = useState('')

  const spendN = Number(spend) || 0
  const valN   = Number(val)   || 0
  const minN   = Number(minR)  || 0
  const preview = spendN > 0 ? Math.floor(1000 / spendN) : 0

  const save = async () => {
    if (spendN <= 0 || valN <= 0 || minN <= 0) { setErr('All values must be > 0'); return }
    setSaving(true); setErr('')
    const { error } = await portalSupabase.from('coin_config')
      .update({ spend_per_coin: spendN, coin_value: valN, min_redeem: minN })
      .eq('id', config.id).eq('tenant_id', tenantId)
    setSaving(false)
    if (error) { setErr(error.message); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    onSaved()
  }

  const inp = 'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[#F59E0B]/50 focus:outline-none'

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-bold text-[#F59E0B] flex items-center gap-2"><Settings className="w-4 h-4" /> Coin Rules</h3>

      {/* Preview */}
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-4 text-center">
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Preview — per ₹1,000 bill</p>
        <p className="text-[#F59E0B] font-black text-3xl">{preview} coins earned</p>
        <p className="text-gray-500 text-xs mt-1">1 coin = ₹{valN} · min redeem = {minN} (= ₹{(minN * valN).toFixed(0)})</p>
      </div>

      <div><label className="text-[11px] text-gray-400 mb-1 block">₹ spend per 1 coin earned</label><input type="number" min={1} value={spend} onChange={e => setSpend(e.target.value)} className={inp} /></div>
      <div><label className="text-[11px] text-gray-400 mb-1 block">₹ discount per 1 coin redeemed</label><input type="number" min={0.1} step={0.1} value={val} onChange={e => setVal(e.target.value)} className={inp} /></div>
      <div><label className="text-[11px] text-gray-400 mb-1 block">Minimum coins to redeem at once</label><input type="number" min={1} value={minR} onChange={e => setMinR(e.target.value)} className={inp} /></div>

      {/* Presets */}
      <div>
        <p className="text-[10px] text-gray-500 mb-2">Quick Presets</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '10 coins/₹1000', spend: '100', val: '1', min: '50' },
            { label: '20 coins/₹1000', spend: '50',  val: '1', min: '50' },
            { label: '5 coins/₹1000',  spend: '200', val: '1', min: '20' },
            { label: '25 coins/₹1000', spend: '40',  val: '1', min: '100' },
          ].map(p => (
            <button key={p.label} onClick={() => { setSpend(p.spend); setVal(p.val); setMinR(p.min) }}
              className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs hover:border-[#F59E0B]/40 hover:text-white transition-colors text-left">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{err}</p>}
      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-[#F59E0B] text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}

// ── Add Coins Tab ─────────────────────────────────────────────────────────────
function AddCoinsTab({ tenantId, config }: { tenantId: string; config: CoinConfig }) {
  const [phone,  setPhone]  = useState('')
  const [bill,   setBill]   = useState('')
  const [name,   setName]   = useState('')
  const [loading,setLoad]   = useState(false)
  const [err,    setErr]    = useState('')
  const [result, setResult] = useState<{ earned: number; balance: number; phone: string; name: string | null } | null>(null)

  const preview = bill && Number(bill) >= config.spend_per_coin
    ? Math.floor(Number(bill) / config.spend_per_coin) : 0

  const submit = async () => {
    if (phone.length !== 10 || !bill || Number(bill) < config.spend_per_coin) return
    setLoad(true); setErr('')
    try {
      const earned  = Math.floor(Number(bill) / config.spend_per_coin)
      const profile = await getOrCreateProfile(tenantId, phone, name || undefined)
      const newBal  = profile.balance + earned
      const { error: ue } = await portalSupabase.from('coin_profiles')
        .update({ balance: newBal }).eq('tenant_id', tenantId).eq('phone', phone)
      if (ue) throw new Error(ue.message)
      await portalSupabase.from('coin_transactions').insert({
        tenant_id: tenantId, profile_id: profile.id,
        type: 'credit', coins: earned, note: `Bill ₹${bill}`,
      })
      setResult({ earned, balance: newBal, phone, name: name || profile.name || null })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed') }
    setLoad(false)
  }

  const sendWA = () => {
    if (!result) return
    const msg = `Dear ${result.name || 'Customer'},\n\n✅ *${result.earned} Coins* added!\n\n💰 Bill: ₹${bill}\n🪙 Earned: +${result.earned}\n📊 Balance: ${result.balance} coins (= ₹${(result.balance * config.coin_value).toFixed(0)} discount)\n\nThank you for your visit! 🙏`
    window.open(`https://wa.me/91${result.phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (result) return (
    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 text-center space-y-4">
      <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
      <h3 className="text-lg font-bold text-green-400">Coins Added!</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">Bill Amount</p>
          <p className="text-white font-bold text-lg flex items-center justify-center gap-1"><IndianRupee className="w-4 h-4" />{bill}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">Coins Earned</p>
          <p className="text-[#F59E0B] font-bold text-lg flex items-center justify-center gap-1"><Coins className="w-4 h-4" />+{result.earned}</p>
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-gray-500 text-xs mb-1">New Balance</p>
        <p className="text-[#F59E0B] font-black text-3xl">{result.balance} coins</p>
        <p className="text-gray-600 text-xs mt-1">= ₹{(result.balance * config.coin_value).toFixed(0)} discount value</p>
      </div>
      <button onClick={sendWA}
        className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#20BD5A] transition">
        <Send className="w-4 h-4" /> Send via WhatsApp
      </button>
      <button onClick={() => { setPhone(''); setBill(''); setName(''); setResult(null); setErr('') }}
        className="w-full py-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-xl text-sm hover:bg-white/10 transition">
        Add Another Purchase
      </button>
    </div>
  )

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-bold text-[#F59E0B] flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Award Coins for Purchase</h3>

      <div>
        <label className="text-[11px] text-gray-400 mb-1 block">Phone Number *</label>
        <input type="tel" inputMode="numeric" value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile number" maxLength={10}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-mono tracking-wider focus:border-[#F59E0B]/50 focus:outline-none" />
        {phone && phone.length < 10 && <p className="text-gray-600 text-xs mt-1">{10 - phone.length} digits remaining</p>}
      </div>
      <div>
        <label className="text-[11px] text-gray-400 mb-1 block">Customer Name (optional)</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[#F59E0B]/50 focus:outline-none" />
      </div>
      <div>
        <label className="text-[11px] text-gray-400 mb-1 block">Bill Amount (₹) *</label>
        <input type="number" inputMode="numeric" value={bill} onChange={e => setBill(e.target.value)}
          placeholder={`Min ₹${config.spend_per_coin}`} min={1}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg focus:border-[#F59E0B]/50 focus:outline-none" />
        {preview > 0 && (
          <p className="text-[#F59E0B]/70 text-xs mt-1">Will earn: <strong className="text-[#F59E0B]">{preview} coins</strong></p>
        )}
      </div>

      {err && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-red-400 text-sm"><X className="w-4 h-4 shrink-0" />{err}</div>}

      <button onClick={submit}
        disabled={loading || phone.length !== 10 || !bill || Number(bill) < config.spend_per_coin}
        className="w-full py-3 bg-[#F59E0B] text-black rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Coins className="w-4 h-4" /> Add Coins</>}
      </button>
    </div>
  )
}

// ── Check Balance Tab ─────────────────────────────────────────────────────────
function CheckBalanceTab({ tenantId, config }: { tenantId: string; config: CoinConfig }) {
  const [phone,     setPhone]    = useState('')
  const [loading,   setLoad]     = useState(false)
  const [profile,   setProfile]  = useState<CoinProfile | null>(null)
  const [txns,      setTxns]     = useState<TxRow[]>([])
  const [searched,  setSearched] = useState(false)
  const [redeemAmt, setRedeem]   = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemErr, setRedeemErr] = useState('')
  const [redeemOk,  setRedeemOk] = useState('')

  type TxRow = { id: string; type: 'credit'|'debit'; coins: number; note?: string; created_at: string }

  const search = async () => {
    if (phone.length !== 10) return
    setLoad(true); setSearched(false)
    const p = await fetchProfile(tenantId, phone)
    setProfile(p)
    if (p) setTxns(await fetchTransactions(tenantId, p.id))
    setSearched(true); setLoad(false); setRedeemErr(''); setRedeemOk('')
  }

  const redeem = async () => {
    if (!profile || !redeemAmt) return
    const coins = Number(redeemAmt)
    if (coins < config.min_redeem) { setRedeemErr(`Minimum ${config.min_redeem} coins`); return }
    if (coins > profile.balance)   { setRedeemErr('Insufficient balance'); return }
    setRedeeming(true); setRedeemErr('')
    const newBal = profile.balance - coins
    const { error } = await portalSupabase.from('coin_profiles')
      .update({ balance: newBal }).eq('tenant_id', tenantId).eq('phone', phone)
    if (error) { setRedeemErr(error.message); setRedeeming(false); return }
    await portalSupabase.from('coin_transactions').insert({
      tenant_id: tenantId, profile_id: profile.id, type: 'debit',
      coins, note: `Redeemed ₹${(coins * config.coin_value).toFixed(0)} discount`,
    })
    setRedeemOk(`✅ Redeemed ${coins} coins = ₹${(coins * config.coin_value).toFixed(0)} discount`)
    setRedeem('')
    const p = await fetchProfile(tenantId, phone)
    if (p) { setProfile(p); setTxns(await fetchTransactions(tenantId, p.id)) }
    setRedeeming(false)
  }

  const sendWA = () => {
    if (!profile) return
    const msg = `Dear ${profile.name || 'Customer'},\n\n📊 Coin Balance: *${profile.balance} coins*\n💰 Value: ₹${(profile.balance * config.coin_value).toFixed(0)} discount\n\nThank you for your loyalty! 🙏`
    window.open(`https://wa.me/91${profile.phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#F59E0B] flex items-center gap-2"><Search className="w-4 h-4" /> Check Customer Balance</h3>
        <div className="flex gap-2">
          <input type="tel" inputMode="numeric" value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile number" maxLength={10}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-mono tracking-wider focus:border-[#F59E0B]/50 focus:outline-none" />
          <button onClick={search} disabled={loading || phone.length !== 10}
            className="px-5 py-3 bg-[#F59E0B] text-black rounded-xl font-bold text-sm disabled:opacity-40">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {searched && profile && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F59E0B]/15 flex items-center justify-center">
              <User className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-white font-semibold">{profile.name ?? 'Customer'}</p>
              <p className="text-gray-500 text-xs font-mono">{profile.phone.slice(0,5)} {profile.phone.slice(5)}</p>
            </div>
          </div>

          <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">Current Balance</p>
            <p className="text-[#F59E0B] font-black text-4xl flex items-center justify-center gap-2">
              <Coins className="w-8 h-8" />{profile.balance}
            </p>
            <p className="text-gray-600 text-xs mt-1">= ₹{(profile.balance * config.coin_value).toFixed(0)} discount value</p>
          </div>

          {profile.balance >= config.min_redeem && (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-400 font-medium">Redeem Coins</p>
              <div className="flex gap-2">
                <input type="number" value={redeemAmt} onChange={e => setRedeem(e.target.value)}
                  placeholder={`Min ${config.min_redeem} coins`} min={config.min_redeem} max={profile.balance}
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#F59E0B]/50" />
                <button onClick={redeem}
                  disabled={redeeming || !redeemAmt || Number(redeemAmt) < config.min_redeem || Number(redeemAmt) > profile.balance}
                  className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl text-sm font-bold border border-red-500/30 disabled:opacity-40 hover:bg-red-500/30 transition">
                  {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
                </button>
              </div>
              {redeemAmt && Number(redeemAmt) >= config.min_redeem && (
                <p className="text-gray-500 text-xs">Discount value: <span className="text-green-400 font-semibold">₹{(Number(redeemAmt) * config.coin_value).toFixed(0)}</span></p>
              )}
              {redeemErr && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{redeemErr}</p>}
              {redeemOk  && <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{redeemOk}</p>}
            </div>
          )}

          <button onClick={sendWA}
            className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#20BD5A] transition">
            <Send className="w-4 h-4" /> Send Balance via WhatsApp
          </button>

          {txns.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Recent Transactions</p>
              <div className="space-y-2">
                {txns.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      {tx.type === 'credit'
                        ? <ArrowUpCircle className="w-4 h-4 text-green-400 shrink-0" />
                        : <ArrowDownCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      <div>
                        <p className="text-white/80 text-xs font-medium">{tx.type === 'credit' ? 'Earned' : 'Redeemed'}</p>
                        {tx.note && <p className="text-gray-600 text-[10px]">{tx.note}</p>}
                        <p className="text-gray-700 text-[10px]">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.coins}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {searched && !profile && !loading && (
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
          <Star className="w-8 h-8 text-amber-400/50 mx-auto mb-2" />
          <p className="text-amber-400 font-medium text-sm">No customer found.</p>
          <p className="text-gray-600 text-xs mt-1">Use the Add Coins tab to create their profile.</p>
        </div>
      )}
    </div>
  )
}

