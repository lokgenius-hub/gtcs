'use client'
import { useEffect, useState, useCallback } from 'react'
import { QrCode, Plus, Trash2, Copy, Check, Printer, ExternalLink, Utensils, BedDouble } from 'lucide-react'
import { portalSupabase } from '@/lib/portal-db'

function getSession() {
  return portalSupabase.auth.getSession()
}

function getBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://gentechservice.in'
  return window.location.origin
}

function qrImageUrl(tenantId: string, table: string): string {
  const orderUrl = `${getBaseUrl()}/order?t=${encodeURIComponent(tenantId)}&table=${encodeURIComponent(table)}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderUrl)}`
}

export default function TablesPage() {
  const [tenantId, setTenantId] = useState('')
  const [tables, setTables]     = useState<string[]>([])
  const [newTable, setNewTable] = useState('')
  const [copied, setCopied]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getSession().then(({ data: { session: s } }) => {
      if (!s) return
      const tid = (s.user?.user_metadata?.tenant_id as string) || 'sharda'
      setTenantId(tid)
      portalSupabase
        .from('site_config')
        .select('config_value')
        .eq('tenant_id', tid)
        .eq('config_key', 'table_list')
        .maybeSingle()
        .then(({ data }) => {
          try {
            const list = JSON.parse(data?.config_value ?? '[]')
            setTables(Array.isArray(list) ? list : [])
          } catch { setTables([]) }
          setLoading(false)
        })
    })
  }, [])

  const saveTables = useCallback(async (list: string[]) => {
    const { data: { session: s } } = await getSession()
    if (!s) return
    const tid = (s.user?.user_metadata?.tenant_id as string) || 'sharda'
    await portalSupabase
      .from('site_config')
      .upsert(
        { tenant_id: tid, config_key: 'table_list', config_value: JSON.stringify(list) },
        { onConflict: 'tenant_id,config_key' }
      )
  }, [])

  const addTable = useCallback(() => {
    const name = newTable.trim()
    if (!name || tables.includes(name)) return
    const updated = [...tables, name]
    setTables(updated)
    setNewTable('')
    saveTables(updated)
  }, [newTable, tables, saveTables])

  const removeTable = useCallback((t: string) => {
    const updated = tables.filter(x => x !== t)
    setTables(updated)
    saveTables(updated)
  }, [tables, saveTables])

  const copyLink = useCallback((t: string) => {
    const url = `${getBaseUrl()}/order?t=${encodeURIComponent(tenantId)}&table=${encodeURIComponent(t)}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(t)
      setTimeout(() => setCopied(null), 2000)
    })
  }, [tenantId])

  const printQR = useCallback((t: string) => {
    const url    = `${getBaseUrl()}/order?t=${encodeURIComponent(tenantId)}&table=${encodeURIComponent(t)}`
    const imgSrc = qrImageUrl(tenantId, t)
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><title>QR - Table ${t}</title>
      <style>body{text-align:center;font-family:sans-serif;padding:40px}
      h2{margin:0 0 8px}p{color:#555;font-size:14px;margin:0 0 20px}
      img{border:2px solid #000;border-radius:8px;padding:8px}
      @media print{button{display:none}}</style></head>
      <body><h2>Table: ${t}</h2>
      <p>Scan to place your order</p>
      <img src="${imgSrc}" width="200" height="200"/><br/><br/>
      <p style="font-size:11px;color:#999">${url}</p>
      <br/><button onclick="window.print()">Print</button></body></html>`)
    w.document.close()
  }, [tenantId])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#0066CC]" />
          Tables &amp; QR Codes
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Each table gets a unique QR code. Customers scan it to place orders directly from their seat.
        </p>
      </div>

      {/* Webhook URL info */}
      <div className="mb-6 px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm text-blue-300">
        <p className="font-semibold mb-1">Zomato / Swiggy Webhook URL</p>
        <p className="text-xs text-blue-400 break-all font-mono">
          https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant={tenantId || 'YOUR_TENANT_ID'}
        </p>
        <p className="text-[11px] text-blue-500 mt-1">
          Paste this URL in your Zomato/Swiggy partner portal. Orders will appear here with alarm notification.
        </p>
      </div>

      {/* Quick-share links — no table required */}
      {tenantId && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Online Order QR (Google Business / WhatsApp) */}
          <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 text-orange-400">
              <Utensils className="w-4 h-4" />
              <p className="text-sm font-bold text-white">Online Order Link</p>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(getBaseUrl() + '/order?t=' + encodeURIComponent(tenantId))}`}
              alt="Online order QR"
              className="w-[120px] h-[120px] rounded-lg"
            />
            <p className="text-[10px] text-gray-500 break-all">
              /order?t={tenantId} (no table — shows takeaway &amp; delivery)
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  const url = `${getBaseUrl()}/order?t=${encodeURIComponent(tenantId)}`
                  navigator.clipboard.writeText(url).then(() => { setCopied('order'); setTimeout(() => setCopied(null), 2000) })
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
              >
                {copied === 'order' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'order' ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={`${getBaseUrl()}/order?t=${encodeURIComponent(tenantId)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[10px] text-orange-400/70">Share on Google Business, WhatsApp, or print</p>
          </div>

          {/* Hotel Booking QR */}
          <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 text-blue-400">
              <BedDouble className="w-4 h-4" />
              <p className="text-sm font-bold text-white">Hotel Booking Link</p>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(getBaseUrl() + '/book?t=' + encodeURIComponent(tenantId))}`}
              alt="Hotel booking QR"
              className="w-[120px] h-[120px] rounded-lg"
            />
            <p className="text-[10px] text-gray-500 break-all">
              /book?t={tenantId} (room booking — share for direct reservations)
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  const url = `${getBaseUrl()}/book?t=${encodeURIComponent(tenantId)}`
                  navigator.clipboard.writeText(url).then(() => { setCopied('book'); setTimeout(() => setCopied(null), 2000) })
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
              >
                {copied === 'book' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'book' ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={`${getBaseUrl()}/book?t=${encodeURIComponent(tenantId)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[10px] text-blue-400/70">Share on website, Google Business, or OTA profiles</p>
          </div>
        </div>
      )}

      {/* Add table input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTable}
          onChange={e => setNewTable(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTable()}
          placeholder="Table name (e.g. T1, Table 5, VIP Room)"
          className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0066CC]/50"
        />
        <button
          onClick={addTable}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066CC] text-white text-sm font-semibold hover:bg-[#0055BB] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {/* Tables grid */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading tables...</p>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tables yet. Add a table above to generate a QR code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(t => (
            <div key={t} className="bg-[#050A14] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3">
              <p className="font-bold text-white text-sm">{t}</p>
              <img
                src={qrImageUrl(tenantId, t)}
                alt={`QR for table ${t}`}
                className="w-[150px] h-[150px] rounded-lg"
              />
              <p className="text-[10px] text-gray-500 text-center break-all">
                /order?t={tenantId}&amp;table={t}
              </p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => copyLink(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                >
                  {copied === t
                    ? <Check className="w-3.5 h-3.5 text-green-400" />
                    : <Copy className="w-3.5 h-3.5" />}
                  {copied === t ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => printQR(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <a
                  href={`${getBaseUrl()}/order?t=${encodeURIComponent(tenantId)}&table=${encodeURIComponent(t)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => removeTable(t)}
                  className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
