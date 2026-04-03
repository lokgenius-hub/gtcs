'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Webhook, Plus, Trash2, ToggleLeft, ToggleRight,
  Loader2, CheckCircle2, ExternalLink, AlertCircle, Copy,
} from 'lucide-react'
import { portalSupabase, getPortalSession } from '@/lib/portal-db'

type WebhookConfig = {
  id: string
  tenant_id: string
  name: string
  platform: string
  url: string
  secret?: string
  is_active: boolean
  last_called?: string
  last_status?: number
  created_at: string
}

const PLATFORMS = [
  { value: 'generic',  label: 'Generic (JSON)',  color: '#6B7280' },
  { value: 'petpuja',  label: 'PetPooja',         color: '#F59E0B' },
  { value: 'posist',   label: 'Posist',            color: '#0066CC' },
  { value: 'rista',    label: 'Rista',             color: '#9333EA' },
  { value: 'whatsapp', label: 'WhatsApp (API)',    color: '#25D366' },
]

export default function PortalWebhooks() {
  const router = useRouter()
  const [tenantId, setTid]     = useState('')
  const [hooks,    setHooks]   = useState<WebhookConfig[]>([])
  const [loading,  setLoad]    = useState(true)
  const [saving,   setSaving]  = useState(false)
  const [toast,    setToast]   = useState('')
  const [showForm, setForm]    = useState(false)

  const [name,     setName]     = useState('')
  const [platform, setPlatform] = useState('generic')
  const [url,      setUrl]      = useState('')
  const [secret,   setSecret]   = useState('')

  async function load(tid: string) {
    const { data } = await portalSupabase.from('webhook_configs')
      .select('*').eq('tenant_id', tid).order('created_at')
    setHooks(data ?? [])
  }

  useEffect(() => {
    getPortalSession().then(sess => {
      if (!sess) { router.replace('/portal'); return }
      setTid(sess.tenantId)
      load(sess.tenantId).finally(() => setLoad(false))
    })
  }, [router])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return
    setSaving(true)
    const { error } = await portalSupabase.from('webhook_configs').insert({
      tenant_id: tenantId, name: name.trim(),
      platform, url: url.trim(),
      secret: secret.trim() || null,
      is_active: true,
    })
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast('Webhook added ✓')
    setName(''); setPlatform('generic'); setUrl(''); setSecret(''); setForm(false)
    await load(tenantId)
  }

  async function toggleActive(h: WebhookConfig) {
    await portalSupabase.from('webhook_configs')
      .update({ is_active: !h.is_active }).eq('id', h.id)
    await load(tenantId)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook?')) return
    await portalSupabase.from('webhook_configs').delete().eq('id', id)
    await load(tenantId)
  }

  function copyText(t: string) {
    navigator.clipboard.writeText(t).catch(() => {})
    showToast('Copied!')
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const fnUrl = `${SUPABASE_URL}/functions/v1/forward-order`

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#0066CC] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xl">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-[#0066CC]" /> Outbound Webhooks
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Forward new orders to PetPooja, Posist, Rista, WhatsApp, or any custom URL</p>
        </div>
        <button onClick={() => setForm(f => !f)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0066CC] text-white text-sm font-semibold hover:bg-[#0055AA] transition">
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      {/* How it works */}
      <div className="mb-6 px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400 space-y-1.5">
        <p className="font-semibold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> How outbound forwarding works</p>
        <p>When a customer places an order (QR table, website), the <strong className="text-blue-300">forward-order</strong> Edge Function fires and POSTs a JSON payload to all active webhooks below.</p>
        <p>For PetPooja specifically, the payload is converted to PetPooja Open API format automatically.</p>
        <div className="flex items-center gap-2 bg-blue-500/10 rounded-lg px-2 py-1.5 mt-1">
          <span className="text-blue-300 font-mono text-[10px] flex-1 break-all">{fnUrl}</span>
          <button onClick={() => copyText(fnUrl)} className="shrink-0 text-blue-400 hover:text-blue-200 transition"><Copy className="w-3 h-3" /></button>
        </div>
        <p className="text-blue-500/70">Wire: Supabase Dashboard → Database → Webhooks → Create → Table: <strong className="text-blue-400">pos_orders</strong> → Event: INSERT → Type: Supabase Edge Function → <strong className="text-blue-400">forward-order</strong></p>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-white">New Webhook</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. PetPooja Main"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0066CC]/50" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0066CC]/50">
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Webhook URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.petpooja.com/orders/push"
              type="url"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0066CC]/50" required />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Secret / Bearer Token <span className="text-gray-600">(optional)</span></label>
            <input value={secret} onChange={e => setSecret(e.target.value)} placeholder="Bearer eyJhbGc..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0066CC]/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setForm(false)} className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0066CC] text-white text-sm font-semibold hover:bg-[#0055AA] disabled:opacity-50 transition">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Save
            </button>
          </div>
        </form>
      )}

      {loading && <div className="flex gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      {!loading && hooks.length === 0 && (
        <div className="text-center py-12">
          <Webhook className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No webhooks configured.</p>
          <p className="text-gray-600 text-xs mt-1">Add one to forward orders to PetPooja, Posist, or any custom URL.</p>
        </div>
      )}

      <div className="space-y-3">
        {hooks.map(h => {
          const pm = PLATFORMS.find(p => p.value === h.platform) ?? PLATFORMS[0]
          const age = h.last_called
            ? Math.round((Date.now() - new Date(h.last_called).getTime()) / 60000)
            : null
          return (
            <div key={h.id} className={`bg-white/5 border rounded-2xl p-4 transition ${h.is_active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg text-white shrink-0"
                    style={{ backgroundColor: pm.color + '33', color: pm.color, border: `1px solid ${pm.color}40` }}>
                    {pm.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{h.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-gray-500 truncate max-w-xs">{h.url}</p>
                      <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-400 transition shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {age !== null && (
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Last called: {age < 60 ? `${age}m ago` : `${Math.floor(age/60)}h ago`}
                        {h.last_status && (
                          <span className={`ml-1.5 font-bold ${h.last_status >= 200 && h.last_status < 300 ? 'text-green-600' : 'text-red-500'}`}>
                            {h.last_status}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(h)} title={h.is_active ? 'Disable' : 'Enable'}
                    className="text-gray-400 hover:text-white transition">
                    {h.is_active
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button onClick={() => handleDelete(h.id)} className="text-gray-600 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Integration guide */}
      <div className="mt-8 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Guides</p>
        {[
          { name: 'PetPooja', steps: ['Register at petpooja.com/integration-partner', 'Get your API endpoint + token', 'Add webhook above with Platform = PetPooja', 'Secret = your Bearer token'] },
          { name: 'Posist / Rista', steps: ['Get your webhook URL from your Posist/Rista dashboard', 'Add webhook above with Platform = Generic', 'Attach API key as secret'] },
          { name: 'WhatsApp', steps: ['Get your Cloud API token from Meta Developers', 'URL: https://graph.facebook.com/v18.0/<PHONE_ID>/messages', 'Secret: Bearer <your_token>', 'Note: Needs a proxy function to reformat for WhatsApp template messages'] },
        ].map(guide => (
          <div key={guide.name} className="bg-white/3 border border-white/5 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">{guide.name}</p>
            <ol className="list-decimal list-inside space-y-0.5">
              {guide.steps.map((s, i) => <li key={i} className="text-xs text-gray-600">{s}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}
