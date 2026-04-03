/**
 * SUPABASE EDGE FUNCTION — forward-order
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Triggered by a Supabase Database Webhook whenever a new row is inserted
 * into `pos_orders`.
 *
 * It fetches all active `webhook_configs` for the tenant and POSTs the
 * normalised order payload to each URL — so PetPooja, Posist, Rista,
 * your own Express server, WhatsApp gateway, etc. all receive it instantly.
 *
 * ── DEPLOY ───────────────────────────────────────────────────────────────
 *   supabase functions deploy forward-order --no-verify-jwt
 *
 * ── WIRE THE TRIGGER (once, in Supabase Dashboard) ───────────────────────
 * 1. Open Supabase Dashboard → Database → Webhooks
 * 2. Click "Create a new hook"
 * 3. Name:  forward-new-order
 *    Table: pos_orders          Event: INSERT
 *    Type:  Supabase Edge Functions
 *    Function: forward-order
 *
 * ── PAYLOAD SENT TO EACH WEBHOOK URL ─────────────────────────────────────
 * {
 *   "event":      "new_order",
 *   "platform":   "website",
 *   "tenant_id":  "raj-darbar",
 *   "order": {
 *     "id":            "uuid",
 *     "order_number":  "TBL-260401-1234",
 *     "customer_name": "Rahul Sharma",
 *     "phone":         "+919876543210",
 *     "order_type":    "dine-in" | "takeaway" | "delivery" | "room-service",
 *     "table_name":    "T-3",
 *     "room_number":   "101",
 *     "delivery_address": "...",
 *     "items": [
 *       { "name": "Butter Chicken", "qty": 2, "price": 340 }
 *     ],
 *     "subtotal":      680,
 *     "cgst":          17,
 *     "sgst":          17,
 *     "total":         714,
 *     "special_notes": ""
 *   }
 * }
 *
 * ── PETPUJA INTEGRATION ───────────────────────────────────────────────────
 * PetPooja (petpooja.com) allows pushing orders via their Open API.
 * 1. Register as a PetPooja integration partner at:
 *    https://www.petpooja.com/integration-partner
 * 2. Get your API endpoint + token.
 * 3. In Portal → Webhooks, add:
 *    Name: PetPooja  |  Platform: PetPooja  |  URL: <their API endpoint>
 *    Secret: Bearer <your_token>
 * The function automatically converts to PetPooja-compatible payload.
 *
 * ── OTHER APPS ────────────────────────────────────────────────────────────
 * • Posist / Rista / EazyDiner: same approach — add their webhook URL
 * • Your own Node/Python server: just read the JSON body
 */

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderRecord {
  id: string
  tenant_id: string
  order_number?: string
  customer_name?: string
  phone?: string
  order_type?: string
  table_name?: string
  room_number?: string
  delivery_address?: string
  items?: { item_name?: string; name?: string; qty?: number; quantity?: number; price: number }[]
  subtotal?: number
  cgst?: number
  sgst?: number
  total?: number
  notes?: string
  status?: string
  created_at: string
}

interface WebhookConfig {
  id: string
  tenant_id: string
  name: string
  platform: string    // petpuja | posist | rista | generic | whatsapp
  url: string
  secret?: string
  trigger_on: string[]
  is_active: boolean
}

interface DatabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE'
  table: string
  schema: string
  record: OrderRecord
  old_record?: OrderRecord
}

// ─── Normalise items to canonical shape ──────────────────────────────────────
function normaliseItems(raw: OrderRecord['items']) {
  return (raw ?? []).map(i => ({
    name:  i.item_name ?? i.name ?? 'Item',
    qty:   i.quantity  ?? i.qty  ?? 1,
    price: i.price,
  }))
}

// ─── Generic JSON payload ─────────────────────────────────────────────────────
function buildGenericPayload(record: OrderRecord) {
  const items = normaliseItems(record.items)
  return {
    event:     'new_order',
    platform:  'website',
    tenant_id: record.tenant_id,
    order: {
      id:               record.id,
      order_number:     record.order_number,
      customer_name:    record.customer_name,
      phone:            record.phone,
      order_type:       record.order_type ?? 'dine-in',
      table_name:       record.table_name,
      room_number:      record.room_number,
      delivery_address: record.delivery_address,
      items,
      subtotal:      record.subtotal ?? 0,
      cgst:          record.cgst    ?? 0,
      sgst:          record.sgst    ?? 0,
      total:         record.total   ?? 0,
      special_notes: record.notes,
      created_at:    record.created_at,
    },
  }
}

// ─── PetPooja-compatible payload ─────────────────────────────────────────────
// Adapt to exact spec from your PetPooja account manager.
function buildPetPoojaPayload(record: OrderRecord) {
  const items = normaliseItems(record.items)
  return {
    orderSource:    'ONLINE',
    orderType:      record.order_type === 'delivery' ? 'DELIVERY'
                  : record.order_type === 'takeaway'  ? 'TAKEAWAY'
                  : 'DINE_IN',
    tableNumber:    record.table_name  ?? record.room_number ?? '',
    customerName:   record.customer_name   ?? '',
    customerMobile: record.phone           ?? '',
    deliveryAddress: record.delivery_address ?? '',
    items: items.map(i => ({
      itemName:   i.name,
      quantity:   i.qty,
      unitPrice:  i.price,
      totalPrice: i.price * i.qty,
    })),
    subTotal:    record.subtotal ?? 0,
    taxAmount:   (record.cgst ?? 0) + (record.sgst ?? 0),
    grandTotal:  record.total    ?? 0,
    orderNote:   record.notes        ?? '',
    externalOrderId: record.order_number ?? record.id,
  }
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// ─── Handler ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json() as DatabaseWebhookPayload
    const { record } = body

    if (!record?.tenant_id) {
      return new Response('Missing record', { status: 400 })
    }

    // Only forward new pending orders
    if (body.type !== 'INSERT' || record.status !== 'pending') {
      return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: CORS })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch all active webhook configs for this tenant
    const { data: webhooks } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('tenant_id', record.tenant_id)
      .eq('is_active', true)
      .contains('trigger_on', ['new_order'])

    if (!webhooks || webhooks.length === 0) {
      console.log(`[forward-order] No active webhooks for tenant ${record.tenant_id}`)
      return new Response(JSON.stringify({ forwarded: 0 }), { status: 200, headers: CORS })
    }

    // Fire all webhooks concurrently
    const results = await Promise.allSettled(
      (webhooks as WebhookConfig[]).map(async (wh) => {
        const payload = wh.platform === 'petpuja'
          ? buildPetPoojaPayload(record)
          : buildGenericPayload(record)

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent':   'HospiFlow-Webhook/1.0',
        }
        if (wh.secret) {
          headers['Authorization']     = wh.secret.startsWith('Bearer ') ? wh.secret : `Bearer ${wh.secret}`
          headers['X-Webhook-Secret']  = wh.secret
        }

        const res = await fetch(wh.url, {
          method:  'POST',
          headers,
          body:    JSON.stringify(payload),
          signal:  AbortSignal.timeout(8000),
        })

        await supabase.from('webhook_configs').update({
          last_called: new Date().toISOString(),
          last_status: res.status,
        }).eq('id', wh.id)

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          console.error(`[forward-order] Webhook "${wh.name}" → ${res.status}: ${text}`)
          throw new Error(`${res.status} ${res.statusText}`)
        }

        console.log(`[forward-order] Webhook "${wh.name}" delivered → ${res.status}`)
        return { name: wh.name, status: res.status }
      })
    )

    const ok     = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ forwarded: ok, failed }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[forward-order] Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
