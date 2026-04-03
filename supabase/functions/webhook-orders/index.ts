/**
 * SUPABASE EDGE FUNCTION — webhook-orders
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Receives inbound orders from Zomato, Swiggy, PetPuja (or any 3rd-party
 * aggregator) and stores them in `third_party_orders`.
 *
 * SECURITY: Uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
 * All status/platform values are explicitly validated and overridden —
 * the caller CANNOT inject arbitrary status values.
 *
 * ── DEPLOY ───────────────────────────────────────────────────────────────
 *   supabase functions deploy webhook-orders --no-verify-jwt
 *
 * ── WEBHOOK URL ──────────────────────────────────────────────────────────
 *   https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders
 *     ?tenant=YOUR_TENANT_ID
 *     &platform=zomato          ← optional, auto-detected
 *
 * ── OPTIONAL SECRET (recommended for production) ─────────────────────────
 *   supabase secrets set WEBHOOK_SECRET=your_shared_secret
 *   Then Zomato/Swiggy must send X-Webhook-Secret: your_shared_secret
 */

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS ─────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-zomato-signature, x-swiggy-signature, x-webhook-secret',
}

// ── ALLOWED platforms ────────────────────────────────────────────────────────
// ONLY these values can ever land in the table — prevents injection of
// arbitrary platform names from the inbound payload.
const ALLOWED_PLATFORMS = ['zomato', 'swiggy', 'petpuja', 'manual'] as const
type FoodPlatform = typeof ALLOWED_PLATFORMS[number]

// ── SECURITY: Status is ALWAYS forced to 'new' ───────────────────────────────
// Even if the aggregator sends status='completed' or anything else,
// we override it here. Portal staff set status manually via the Orders page.
const INBOUND_STATUS = 'new' as const

// ── Types ────────────────────────────────────────────────────────────────────
interface ZomatoItem  { name: string; quantity: number; price: number }
interface SwiggyItem  { name: string; quantity: number; externalPrice: number }

interface ZomatoPayload {
  order_id?: string | number
  customer?: { name?: string; phone?: string }
  delivery_address?: { address?: string }
  order_items?: ZomatoItem[]
  subtotal?: number
  platform_fee?: number
  order_total?: number
}

interface SwiggyPayload {
  orderId?: string | number
  customerDetails?: { name?: string; mobile?: string }
  deliveryAddress?: { address?: string }
  cartItems?: SwiggyItem[]
  orderTotal?: number
  deliveryFee?: number
}

interface PetPujaPayload {
  order_no?: string | number
  customer_name?: string
  customer_mobile?: string
  order_type?: string
  items?: { item_name: string; quantity: number; amount: number }[]
  bill_total?: number
}

// ── Normalise helpers ────────────────────────────────────────────────────────
function normalizeZomato(p: ZomatoPayload) {
  const items = (p.order_items ?? []).map(i => ({ name: i.name, qty: i.quantity, price: i.price }))
  const subtotal    = p.subtotal      ?? items.reduce((s, i) => s + i.price * i.qty, 0)
  const platform_fee = p.platform_fee ?? 0
  return {
    platform:          'zomato' as FoodPlatform,
    external_order_id: `ZMT-${p.order_id ?? Date.now()}`,
    customer_name:     p.customer?.name     ?? 'Zomato Customer',
    customer_phone:    p.customer?.phone    ?? null,
    delivery_address:  p.delivery_address?.address ?? null,
    items, subtotal, platform_fee,
    total:             p.order_total        ?? subtotal + platform_fee,
  }
}

function normalizeSwiggy(p: SwiggyPayload) {
  const items = (p.cartItems ?? []).map(i => ({ name: i.name, qty: i.quantity, price: i.externalPrice }))
  const subtotal    = items.reduce((s, i) => s + i.price * i.qty, 0)
  const platform_fee = p.deliveryFee ?? 0
  return {
    platform:          'swiggy' as FoodPlatform,
    external_order_id: `SWG-${p.orderId ?? Date.now()}`,
    customer_name:     p.customerDetails?.name   ?? 'Swiggy Customer',
    customer_phone:    p.customerDetails?.mobile ?? null,
    delivery_address:  p.deliveryAddress?.address ?? null,
    items, subtotal, platform_fee,
    total:             p.orderTotal ?? subtotal + platform_fee,
  }
}

function normalizePetPuja(p: PetPujaPayload) {
  const items = (p.items ?? []).map(i => ({ name: i.item_name, qty: i.quantity, price: i.amount }))
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  return {
    platform:          'petpuja' as FoodPlatform,
    external_order_id: `PPJ-${p.order_no ?? Date.now()}`,
    customer_name:     p.customer_name   ?? 'PetPuja Customer',
    customer_phone:    p.customer_mobile ?? null,
    delivery_address:  p.order_type      ?? null,
    items, subtotal, platform_fee: 0,
    total:             p.bill_total ?? subtotal,
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const url    = new URL(req.url)
    const tenant = url.searchParams.get('tenant') || ''
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Missing ?tenant= parameter' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Optional webhook secret verification ─────────────────────────────
    const secret = Deno.env.get('WEBHOOK_SECRET')
    if (secret) {
      const provided =
        req.headers.get('x-zomato-signature') ||
        req.headers.get('x-swiggy-signature')  ||
        req.headers.get('x-webhook-secret')
      if (provided !== secret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }
    }

    const rawPayload = await req.json()

    // ── Determine platform ────────────────────────────────────────────────
    let platform: FoodPlatform = 'zomato'
    const qp = (url.searchParams.get('platform') || '').toLowerCase()

    if (ALLOWED_PLATFORMS.includes(qp as FoodPlatform)) {
      platform = qp as FoodPlatform
    } else {
      // Auto-detect from payload shape
      if ('orderId'  in rawPayload && 'cartItems'    in rawPayload) platform = 'swiggy'
      else if ('order_no' in rawPayload && 'bill_total' in rawPayload) platform = 'petpuja'
      else platform = 'zomato'
    }

    // ── Normalise payload ─────────────────────────────────────────────────
    let normalised: ReturnType<typeof normalizeZomato>
    if (platform === 'swiggy')  normalised = normalizeSwiggy(rawPayload as SwiggyPayload)
    else if (platform === 'petpuja') normalised = normalizePetPuja(rawPayload as PetPujaPayload)
    else normalised = normalizeZomato(rawPayload as ZomatoPayload)

    // ── Insert — status is ALWAYS 'new', never from payload ──────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data, error } = await supabase
      .from('third_party_orders')
      .insert({
        tenant_id:   tenant,
        raw_payload: rawPayload,
        status:      INBOUND_STATUS,   // ← ALWAYS 'new' — never overridden by caller
        is_read:     false,
        ...normalised,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[webhook-orders] Insert error:', error.message)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[webhook-orders] New ${platform} order for tenant=${tenant} id=${data?.id}`)

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[webhook-orders] Unhandled error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
