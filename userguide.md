# HospiFlow — Customer & Testing Guide

> This guide covers **two deployment modes** of HospiFlow:
> - **Online Portal** — web app at `gentechservice.in/portal` (cloud, multi-tenant, Supabase)
> - **HospiFlow Desktop App** — Electron app running on a local PC/tablet (offline-first, SQLite)

---

## PART 1 — Customer Types & What They Get

### Type 1 — POS Only (Starter Plan)
**Best for:** Small cafés, juice shops, sweet shops, bakeries

**What they get:**
- `gentechservice.in/portal` login with email + password
- POS Billing tab — create bills, add items, print/WhatsApp invoice
- Products/Menu tab — add/edit items with categories and price
- Dashboard — today's sales, top items
- Tables & QR — generate QR codes, print them (even Starter gets this)

**What they don't get:** Customer history, Reports, Inventory, Staff, Loyalty coins

**Demo account:**
```
Email:     quickbite@hospiflow.in
Password:  Demo@1234
Tenant ID: quickbite
```

---

### Type 2 — POS + QR Table Ordering (Growth Plan)
**Best for:** Restaurants with dine-in tables, food courts, cloud kitchens with a counter

**What they get (everything in Starter, plus):**
- **Tables & QR page** — add tables (T1, T2, VIP Room, Rooftop 1…), generate QR per table
- Customers scan QR → see the menu → place order from their phone (no app needed)
- Order appears instantly in POS → **alarm rings** in the portal
- POS has a "Table Orders" tab showing pending/in-kitchen orders
- Staff can Accept → In Kitchen → Mark Served
- Customer Management — track order history per customer
- Reports — daily/weekly/monthly revenue, top dishes
- Inventory — track stock levels, get low-stock alerts

**QR Order URL format:**
```
https://gentechservice.in/order?t=TENANT_ID&table=TABLE_NAME
```

**How alarm works:**
1. Customer scans QR at Table 3 → opens `gentechservice.in/order?t=spice_garden&table=T3`
2. Customer selects items → taps "Place Order"
3. Order inserted into `pos_orders` with `status='pending'`
4. Supabase Realtime fires → portal layout plays 4-beep alarm
5. Red badge appears on POS Billing nav item

**Demo account:**
```
Email:     spicegarden@hospiflow.in
Password:  Demo@1234
Tenant ID: spice_garden
Tables:    T1-T6, Bar 1, Bar 2, Rooftop 1, Rooftop 2
```

---

### Type 3 — POS + QR + Zomato/Swiggy (Pro Plan)
**Best for:** Restaurants on Zomato/Swiggy who also want dine-in QR + loyalty coins

**What they get (everything in Growth, plus):**
- Zomato/Swiggy online delivery orders land directly in the portal
- Same alarm rings for delivery orders — staff don't need to check Zomato app
- Staff module — attendance, salary tracking
- Loyalty Coins — award coins on spend, customers redeem at counter

**Zomato/Swiggy Setup for the Customer:**
1. Go to Zomato Partner Portal → Integrations → Webhook URL
2. Paste: `https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=fresco_kitchen`
3. Same for Swiggy Partners dashboard
4. Done — from now on every new order pings the portal directly

**Demo account:**
```
Email:     fresco@hospiflow.in
Password:  Demo@1234
Tenant ID: fresco_kitchen
Webhook:   https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=fresco_kitchen
```

---

### Type 4 — Hotel POS (Growth Plan)
**Best for:** Small hotels, guesthouses, homestays that want billing for room charges + extras

**What they get:**
- POS for room billing — charge per night, extras (laundry, transport, minibar)
- Menu/Products pre-loaded with room types as items
- Dashboard — tracked revenue
- Inventory — linen, toiletries, F&B stock
- Customer management — guest history

**No online booking integration** — this plan is for hotels that take bookings by phone/walk-in only.

**Demo account:**
```
Email:     royalsuites@hospiflow.in
Password:  Demo@1234
Tenant ID: royal_suites
```

---

### Type 5 — Hotel + OYO/MakeMyTrip Alarm (Pro Plan)
**Best for:** Hotels listed on OYO, MakeMyTrip, Booking.com who want instant notification

**What they get (everything in Growth hotel, plus):**
- When OYO or MakeMyTrip sends a new booking webhook → alarm rings in portal
- Booking details appear in the POS orders view (platform shows as "other", external_order_id starts with `OYO-` or `MMT-`)
- Staff confirms booking → marks as acknowledged
- Staff + Loyalty coins included

**OYO/MakeMyTrip Webhook Setup:**
```
OYO Partner Dashboard → Settings → Webhook:
  https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=grand_horizon

MakeMyTrip Extranet → Channel Manager → Push Notifications:
  https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=grand_horizon
```
> Note: The webhook-orders function accepts any platform. For OYO/MMT use `platform: "other"` in their webhook payload config. The external_order_id will show the OYO/MMT booking reference.

**Demo account:**
```
Email:     grandhorizon@hospiflow.in
Password:  Demo@1234
Tenant ID: grand_horizon
```

---

### Type 6 — Full Resort/Property (Enterprise Plan)
**Best for:** Hotels + restaurants, beach resorts, clubs with spa + dining + rooms + delivery

**What they get (everything):**
- Restaurant: QR table ordering + Zomato/Swiggy delivery → alarm for both
- Hotel: OYO/MakeMyTrip online booking → alarm on arrival
- Full staff management, inventory, loyalty coins
- All reports across restaurant + hotel revenue

**Demo account:**
```
Email:     grandopus@hospiflow.in
Password:  Demo@1234
Tenant ID: grand_opus
Webhook:   https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=grand_opus
Tables:    T1-T6, Pool 1-2, Terrace 1-2, Bar 1-2
```

---

## PART 2 — Email Enquiry (notify-enquiry Edge Function)

**Q: Does the email enquiry already work for HospiFlow portal customers?**

**A: YES — automatically, no extra setup needed.**

Here's why:

1. The `notify-enquiry` edge function is deployed **once** on the shared Supabase project (`kproecqyclgujzmskqko`).

2. It is triggered by a **Database Webhook** on the `enquiries` table — fires for every tenant's INSERT.

3. The function reads `tenant_id` from the enquiry row, then looks up `notify_email` from `site_config` for that tenant.

4. It sends the email using either:
   - **Per-tenant SMTP secret** (if set via `supabase secrets set SMTP_USER_GRANDOPUS=...`)
   - **Global fallback SMTP** (the default Gmail already set for mysharda)

**For each HospiFlow customer, just add to `site_config`:**
```sql
INSERT INTO site_config (tenant_id, config_key, config_value) VALUES
  ('fresco_kitchen', 'notify_email', 'admin@freskitchen.com');
```

**To use their own Gmail sender (optional):**
```bash
# Uppercase tenant_id, replace hyphens with nothing
supabase secrets set SMTP_USER_FRESCO_KITCHEN=noreply@freskitchen.com
supabase secrets set SMTP_PASS_FRESCO_KITCHEN=xxxx-xxxx-xxxx-xxxx
```

The enquiry form on `gentechservice.in/contact` already uses the shared `enquiries` table with `tenant_id = 'gtcs'` — that also works the same way.

---

## PART 3 — HospiFlow Desktop App (Electron / Offline Mode)

> **Status:** Separate product. The online portal is `gentechservice.in/portal`. The desktop app is `HospiFlow App` — an Electron-based offline POS that works without internet.

### What is the Desktop App?

| Feature | Online Portal | HospiFlow Desktop App |
|---|---|---|
| Runs where | Browser (any device) | Windows/macOS PC or tablet |
| Internet required | Yes (always online) | No (works offline) |
| Database | Supabase cloud (PostgreSQL) | SQLite (local, on device) |
| Sync | Real-time | Syncs to Supabase when online |
| Receipt printing | Browser print | Thermal printer direct (USB/ESC-POS) |
| Barcode scanner | Not supported | USB HID scanner supported |
| Customer display | No | Second screen support |
| License | SaaS subscription | Per-device license + optional sync |

### Desktop App Architecture
```
┌──────────────────────────────────────┐
│         HospiFlow Desktop App        │
│  ─────────────────────────────────── │
│  Electron shell (Node.js + Chromium) │
│  ├── React frontend (same UI)        │
│  ├── SQLite (better-sqlite3)         │
│  ├── ESC/POS thermal printer driver  │
│  └── Sync engine (background)        │
│          │                           │
│       online?                        │
│       ├── YES → sync to Supabase     │
│       └── NO  → queue for later      │
└───────────────┬──────────────────────┘
                │ (sync when connected)
                ▼
        Supabase Cloud
```

### Offline Mode — How it works
1. All POS operations (bills, orders, products, customers) write to **local SQLite**
2. If internet is available, data syncs to Supabase in real-time
3. If internet is down, app continues working — data queues locally
4. When internet returns, background sync replays queued operations
5. Conflicts (e.g., same item edited on two devices) resolved by `updated_at` timestamp

### Desktop App vs Portal — When to recommend each

| Customer situation | Recommend |
|---|---|
| Has stable internet, uses phone/tablet | Online Portal |
| PowerCut-prone area, must never stop billing | Desktop App |
| Chain with multiple outlets syncing to HQ | Desktop App + Supabase sync |
| Wants Zomato/Swiggy notifications | Online Portal (Realtime WebSocket) |
| Needs thermal printer (USB/serial) | Desktop App |
| Hotel front desk with dedicated PC | Desktop App |
| Food court cloud kitchen (no PC) | Online Portal on tablet |

---

## PART 4 — How to Test All Customer Types

### Setup the Demo Customers

Run `supabase/seed-demo-customers.sql` in Supabase SQL Editor
(`https://supabase.com/dashboard/project/kproecqyclgujzmskqko/sql/new`)

This creates auth users + sample data for all 6 tenants.

---

### Test 1: POS Only (quickbite — Starter)

```
Login: gentechservice.in/portal
Email: quickbite@hospiflow.in / Demo@1234
```

**Check:**
- [ ] Only sees: POS Billing, Dashboard, Products, Tables & QR
- [ ] Inventory/Staff/Coins are locked (lock icon shown)
- [ ] Can create a bill in POS Billing
- [ ] Tables & QR shows "No tables yet" — add T1, T2 → QR appears
- [ ] Can print QR (opens print dialog)

---

### Test 2: QR Table Ordering (spice_garden — Growth)

**Step A — Setup:**
```
Login: gentechservice.in/portal
Email: spicegarden@hospiflow.in / Demo@1234
```
- Go to Tables & QR → tables T1–T6 pre-loaded
- Copy link for T1

**Step B — Customer places order:**
- Open the copied link in a different browser tab (or phone):
  `https://gentechservice.in/order?t=spice_garden&table=T1`
- Select 2-3 dishes → Place Order

**Step C — Staff receives alarm:**
- Back in portal tab → **alarm beeps** (4 beeps)
- Red badge appears on "POS Billing" nav
- Go to POS Billing → "Table Orders" tab
- New order shows with table T1 and items
- Click Accept → status becomes In Kitchen
- Click Mark Served → completed

**Check:**
- [ ] Alarm rings within 1-2 seconds of order placement
- [ ] Badge shows correct count
- [ ] Badge clears when you click POS Billing

---

### Test 3: Zomato/Swiggy Orders (fresco_kitchen — Pro)

The seed already inserted sample `third_party_orders` rows. To simulate a live Zomato order:

**Option A — Direct SQL insert (quick test):**
```sql
INSERT INTO third_party_orders 
  (tenant_id, platform, external_order_id, customer_name, customer_phone, 
   delivery_address, items, subtotal, platform_fee, total, status, is_read)
VALUES 
  ('fresco_kitchen', 'zomato', 'ZOM-TEST-001', 'Test Customer', '+919999999999',
   '1 Test Street, Pune', '[{"name":"Margherita Pizza","qty":1,"price":320}]',
   320, 25, 345, 'new', false);
```
→ Logged in as fresco_kitchen, alarm should ring immediately.

**Option B — Real webhook test (use Postman/curl):**
```bash
curl -X POST \
  "https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=fresco_kitchen" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "zomato",
    "order_id": "ZOM-CURL-001",
    "customer": {"name": "Curl Test", "phone": "+919000000001"},
    "items": [{"name": "Margherita Pizza", "quantity": 1, "price": 320}],
    "total_amount": 345,
    "delivery_address": "Test Address, Pune"
  }'
```

**Check:**
- [ ] Portal alarm rings within 2 seconds
- [ ] Order appears in third_party_orders (visible in POS if you have a Third-Party tab — can add later)

---

### Test 4: Hotel POS (royal_suites — Growth)

```
Login: royalsuites@hospiflow.in / Demo@1234
```

**Check:**
- [ ] Products shows room types (Standard Room, Deluxe Room, Suite, etc.)
- [ ] Can create a bill: POS Billing → add "Deluxe Room x2 nights" → checkout
- [ ] No QR table orders tab (no tables configured — it's a hotel)
- [ ] Inventory shows linen/toiletries stock

---

### Test 5: Hotel + OYO/MakeMyTrip Alarm (grand_horizon — Pro)

**Simulate OYO booking webhook:**
```bash
curl -X POST \
  "https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=grand_horizon" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "other",
    "order_id": "OYO-TEST-999",
    "customer": {"name": "OYO Guest", "phone": "+919111111111"},
    "items": [{"name": "Standard Room", "quantity": 2, "price": 3500}],
    "total_amount": 7000,
    "delivery_address": "OYO | Check-in: Tomorrow | 2 nights | Standard Room"
  }'
```

**Login as grand_horizon** → alarm rings → booking appears in orders.

**Check:**
- [ ] Alarm rings for hotel booking (same as food order)
- [ ] `external_order_id` = `OYO-TEST-999` visible in order
- [ ] Staff/Coins tabs accessible (Pro plan)

---

### Test 6: Enterprise — All Alarms (grand_opus)

```
Login: grandopus@hospiflow.in / Demo@1234
```

**Test all three alarm sources in sequence:**
1. Place a QR table order (Pool 1 or Terrace 1 table)
2. Insert a Zomato delivery order via SQL or webhook
3. Insert an OYO booking via webhook
→ Each should ring the alarm independently.

**Check:**
- [ ] All 12 tables visible in Tables & QR
- [ ] All modules accessible (no locked items)
- [ ] Both restaurant items and room types in Products
- [ ] Staff list shows full team (7 members)

---

### Test 7: Alarm Mute/Unmute

- Login to any portal account
- Click the **Bell icon** at bottom of sidebar → turns grey ("Alarm: Off")
- Place a new order via SQL insert
- Alarm should NOT ring
- Click Bell again → green ("Alarm: On")
- Next order should ring again

---

### Test 8: Email Enquiry

**From the public website** (once gentechservice.in/contact form submits to `enquiries` table):

1. Submit contact form on `gentechservice.in/contact?tenant=fresco_kitchen` (or direct SQL):
```sql
INSERT INTO enquiries (tenant_id, name, email, phone, message, enquiry_type, is_read)
VALUES ('fresco_kitchen', 'Test User', 'test@test.com', '+919000000001', 
        'Test enquiry message', 'restaurant', false);
```
2. The `notify-enquiry` Supabase Database Webhook fires automatically
3. Email is sent to `notify_email` in `site_config` for `fresco_kitchen`
4. Check inbox at `fresco@hospiflow.in`

---

## PART 5 — Desktop App Testing (Electron/Offline Mode)

> The Electron app shares the same React codebase but wraps it differently.
> Until the app is packaged, you can test offline behaviour in the browser.

### Simulating Offline Mode in Browser

1. Open Chrome DevTools → Network tab → throttle to **Offline**
2. POS billing should still work if using local state
3. Actions queued (shown with a "Pending sync" indicator)
4. Switch back to **No throttling** → queued items sync

### Electron App Build Commands (when ready)

```bash
# Install Electron dependencies
npm install electron electron-builder better-sqlite3

# Run in Electron dev mode
npm run electron:dev

# Build installer
npm run electron:build
# Output: dist/HospiFlow-Setup-1.0.0.exe (Windows)
#         dist/HospiFlow-1.0.0.dmg (macOS)
```

### Electron Config (planned — `electron/main.ts`)

```typescript
// Key differences from web portal:
const config = {
  database: 'sqlite',           // instead of Supabase
  syncEnabled: true,            // sync to cloud when online
  thermalPrinter: true,         // USB ESC/POS
  offlineQueuePath: './queue',  // pending operations log
  licenseKey: 'HFLOW-XXXX-XXXX' // per-device license
}
```

### Offline Testing Checklist

```
[ ] App loads without internet
[ ] Can create a bill offline
[ ] Bill saved to local SQLite
[ ] Reconnect internet → bill appears in Supabase
[ ] Duplicate prevention (idempotent sync by order_number)
[ ] Print to thermal printer (USB) without internet
[ ] QR scanning (USB barcode scanner) works offline
```

---

## PART 6 — Quick Reference: All Customer Credentials

| # | Business | Email | Password | Plan | Key Feature |
|---|---|---|---|---|---|
| 1 | QuickBite Cafe | quickbite@hospiflow.in | Demo@1234 | Starter | POS only |
| 2 | Spice Garden | spicegarden@hospiflow.in | Demo@1234 | Growth | POS + QR table orders |
| 3 | Fresco Kitchen | fresco@hospiflow.in | Demo@1234 | Pro | POS + QR + Zomato/Swiggy |
| 4 | Royal Suites | royalsuites@hospiflow.in | Demo@1234 | Growth | Hotel POS |
| 5 | Grand Horizon | grandhorizon@hospiflow.in | Demo@1234 | Pro | Hotel + OYO/MakeMyTrip alarm |
| 6 | The Grand Opus | grandopus@hospiflow.in | Demo@1234 | Enterprise | Restaurant + Hotel + Everything |

**Portal URL:** `https://gentechservice.in/portal`

**Shared Supabase Project:** `kproecqyclgujzmskqko.supabase.co`

**Webhook-Orders Edge Function:**
```
https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=TENANT_ID
```

**QR Order Page:**
```
https://gentechservice.in/order?t=TENANT_ID&table=TABLE_NAME
```

---

## PART 7 — How to Create a New Customer (Production)

### Step 1 — Create Auth User in Supabase

Go to: `supabase.com/dashboard/project/kproecqyclgujzmskqko/auth/users`

→ Add User → fill email + password → Edit user_metadata:

```json
{
  "tenant_id": "your_cafe_name",
  "plan": "growth",
  "name": "Your Cafe Name"
}
```

### Step 2 — Insert site_config

```sql
INSERT INTO site_config (tenant_id, config_key, config_value) VALUES
  ('your_cafe_name', 'hotel_name',   'Your Cafe Name'),
  ('your_cafe_name', 'notify_email', 'owner@yourcafe.com'),
  ('your_cafe_name', 'phone',        '+91-9XXXXXXXXX'),
  ('your_cafe_name', 'address',      'Your Address');
```

### Step 3 — Add their Menu Items

```sql
INSERT INTO menu_items (tenant_id, name, category, price, is_veg, tax_rate, is_active, sort_order)
VALUES
  ('your_cafe_name', 'Masala Chai', 'Tea', 30, true, 5, true, 1),
  ('your_cafe_name', 'Espresso',    'Coffee', 80, true, 5, true, 2);
```

### Step 4 — Share with customer

Give them:
- Portal URL: `gentechservice.in/portal`
- Their email + password
- If Zomato/Swiggy: Webhook URL
- If QR ordering: Print QR codes from Tables & QR page

### Step 5 — Upgrade plan

In Supabase Auth → user → edit user_metadata → change `plan` to `starter`/`growth`/`pro`/`enterprise`

That's it — plan change takes effect on next login.

---

## Part 8 — GTCS SuperAdmin Dashboard

The SuperAdmin dashboard is a built-in admin panel in the GTCS website for managing all HospiFlow customers from a single place.

### 8.1 Access URL

```
https://gentechservice.in/superadmin
```
*(Only accessible with a Supabase superadmin account — not for customers)*

### 8.2 First-Time Setup — Create SuperAdmin User

Run this SQL **once** in Supabase SQL Editor (`kproecqyclgujzmskqko`):

```sql
-- Create the GTCS superadmin auth user
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, role, aud, created_at, updated_at
) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@hospiflow.in',
  crypt('YourStrongPassword@2026', gen_salt('bf')),
  now(),
  '{"role":"superadmin","name":"GTCS Admin"}',
  'authenticated', 'authenticated', now(), now()
) on conflict (email) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, 'admin@hospiflow.in',
  json_build_object('sub', u.id::text, 'email', 'admin@hospiflow.in')::jsonb,
  'email', now(), now(), now()
from auth.users u where u.email = 'admin@hospiflow.in'
on conflict do nothing;
```

Replace `YourStrongPassword@2026` with a strong password. Never share with customers.

### 8.3 Dashboard Features

| Feature | Description |
|---|---|
| **Live Dashboard** | Tiles: active customers, orders today, revenue today, pending alerts, new 3rd-party orders — auto-refreshes every 30s |
| **Customer Table** | All tenants with plan badge, last activity, pending order count |
| **Customer Detail** | Click any customer → metrics, active modules, site config editor, recent orders |
| **Edit Config** | Change any site_config value directly — takes effect immediately |
| **Add Customer** | Wizard form → generates SQL → copy to clipboard → paste in Supabase |

### 8.4 Adding a New Customer via SuperAdmin (Recommended Flow)

1. Go to `https://gentechservice.in/superadmin` → **Customers** page
2. Click **Add Customer** (top right)
3. Fill in:
   - **Tenant ID**: lowercase, underscores `the_curry_house` (immutable once set)
   - **Business Name**: Portal display name
   - **Login Email**: Customer's email
   - **Initial Password**: e.g. `Welcome@2026` (customer should change after first login)
   - **Plan**: Starter / Growth / Pro / Enterprise
   - **Business Type**: restaurant / hotel / cafe / resort
4. Click **Generate & Copy SQL**
5. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/kproecqyclgujzmskqko/sql/new)
6. Paste and Run → customer can log in immediately

### 8.5 What Each Plan Includes

| Plan | Modules |
|---|---|
| **Starter** | POS Billing, Products/Menu, Dashboard, Tables & QR |
| **Growth** | + Customers, Reports, Inventory |
| **Pro** | + Staff Management, Loyalty Coins |
| **Enterprise** | All modules |

### 8.6 Upgrading a Customer's Plan

**Via SuperAdmin:**  
Customers page → click tenant → Site Config → change `plan` value → Save Changes

**Also update auth metadata** (Supabase Auth → Users → Edit user_metadata → update `"plan"`).

---

## Part 9 — SQL Constraint Reference

Always use these values to avoid `CHECK constraint` errors:

| Table | Column | Valid Values |
|---|---|---|
| `pos_orders` | `status` | `pending`, `paid`, `cancelled` |
| `pos_orders` | `order_type` | `dine-in`, `takeaway`, `delivery` |
| `third_party_orders` | `platform` | `zomato`, `swiggy`, `manual`, `other` |
| `third_party_orders` | `status` | `new`, `acknowledged`, `preparing`, `ready`, `picked_up`, `delivered`, `cancelled` |
| `staff_members` | `role` | `manager`, `chef`, `waiter`, `housekeeping`, `security`, `accountant`, `other` |
| `staff_members` | `shift` | `morning`, `evening`, `night`, `full` |
| `inventory_items` | `category` | `raw`, `dry_goods`, `beverages`, `dairy`, `cleaning`, `equipment`, `other` |
| `inventory_items` | `unit` | `kg`, `g`, `litre`, `ml`, `piece`, `dozen`, `box`, `bag`, `bottle`, `other` |

**OYO / MakeMyTrip:** Use `platform = 'other'` with the platform name in `external_order_id`:
`OYO-BK-123456`, `MMT-HTL-123456`

---

## Part 10 — Quick Reference URLs

| URL | Purpose |
|---|---|
| `/portal` | Customer portal login |
| `/superadmin` | GTCS internal admin panel |
| `/order?t=TENANT_ID&table=TABLE_NAME` | Customer QR table ordering |
| `kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=TENANT_ID` | Zomato/Swiggy/OYO inbound webhook |
| `supabase.com/dashboard/project/kproecqyclgujzmskqko/sql/new` | Supabase SQL Editor |
