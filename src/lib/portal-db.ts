/**
 * HOSPIFLOW ONLINE PORTAL — Supabase client & helpers
 *
 * auth flow:
 *   1. Call portalSupabase.auth.signInWithPassword({ email, password })
 *   2. After sign-in, user_metadata holds { tenant_id, plan, name }
 *   3. All DB queries filter by tenant_id from the session
 *
 * How to create a customer user (Supabase Dashboard → Auth → Users):
 *   ➜ Add User → email + password
 *   ➜ Edit user_metadata JSON:
 *       { "tenant_id": "sharda", "plan": "pro", "name": "Hotel Sharda" }
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const portalSupabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    storageKey: 'hf_portal_session',
    autoRefreshToken: true,
  },
})

// ── Plan definitions ─────────────────────────────────────────────────────────

/** Module keys available per plan */
export const PLAN_MODULES: Record<string, string[]> = {
  starter:    ['pos', 'products', 'dashboard'],
  growth:     ['pos', 'products', 'dashboard', 'customers', 'reports', 'inventory'],
  pro:        ['pos', 'products', 'dashboard', 'customers', 'reports', 'inventory', 'staff', 'coins'],
  enterprise: ['pos', 'products', 'dashboard', 'customers', 'reports', 'inventory', 'staff', 'coins'],
}

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', growth: 'Growth', pro: 'Pro', enterprise: 'Enterprise',
}

export const PLAN_COLORS: Record<string, string> = {
  starter: '#6B7280', growth: '#0066CC', pro: '#9333EA', enterprise: '#F59E0B',
}

export function canAccess(plan: string, module: string): boolean {
  return (PLAN_MODULES[plan] ?? PLAN_MODULES.starter).includes(module)
}

// ── Session helper ───────────────────────────────────────────────────────────

export type PortalSession = {
  userId: string
  email: string
  tenantId: string
  plan: string
  name: string
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const { data: { session } } = await portalSupabase.auth.getSession()
  if (!session) return null
  const meta = session.user?.user_metadata ?? {}
  return {
    userId:   session.user.id,
    email:    session.user.email ?? '',
    tenantId: (meta.tenant_id as string) || 'sharda',
    plan:     (meta.plan     as string) || 'starter',
    name:     (meta.name     as string) || (session.user.email?.split('@')[0] ?? 'User'),
  }
}

// ── Database types ───────────────────────────────────────────────────────────

export type MenuItem = {
  id: string; tenant_id: string; name: string; category: string
  price: number; is_veg: boolean; tax_rate: number; is_active: boolean; sort_order: number
}

export type PosOrder = {
  id?: string; tenant_id: string; order_number: string; order_type: string
  table_name?: string; customer_name?: string; subtotal: number; cgst: number
  sgst: number; total: number; payment_mode: string; status: string
  item_count: number; item_summary?: string; items: OrderItem[]; created_at?: string
}

export type OrderItem = {
  item_id?: string; item_name: string; category?: string
  price: number; quantity: number; tax_rate: number; total: number
}

export type CoinProfile = {
  id: string; tenant_id: string; phone: string; name?: string
  balance: number; created_at: string
}

export type CoinTransaction = {
  id: string; tenant_id: string; profile_id: string; type: 'credit' | 'debit'
  coins: number; note?: string; created_at: string
}

export type CoinConfig = {
  id: string; tenant_id: string; spend_per_coin: number
  coin_value: number; min_redeem: number
}

export type StaffMember = {
  id: string; tenant_id: string; name: string; role: string
  phone?: string; shift: string; monthly_salary: number; is_active: boolean; joined_at?: string
}

export type AttendanceRecord = {
  id: string; tenant_id: string; staff_id: string; staff_name: string
  date: string; check_in?: string; check_out?: string; status: string
}

export type InventoryItem = {
  id: string; tenant_id: string; name: string; category: string; unit: string
  current_stock: number; min_stock: number; cost_per_unit: number; is_active: boolean
}

export type InventoryTransaction = {
  id: string; tenant_id: string; item_id: string; item_name: string
  type: string; quantity: number; note?: string; created_at: string
}

// ── DB helpers ───────────────────────────────────────────────────────────────

/** Generate a short order number like ORD-240402-0001 */
export function generateOrderNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${datePart}-${rand}`
}

/** Compute GST split for a line item — returns { cgst, sgst } */
export function splitGst(amount: number, taxRate: number) {
  const total_tax = (amount * taxRate) / 100
  return { cgst: total_tax / 2, sgst: total_tax / 2 }
}
