-- ═══════════════════════════════════════════════════════════════════════════
-- HOSPIFLOW — 6 DEMO CUSTOMER SEED — PART 2 of 2
-- Customers: 4. royal_suites  5. grand_horizon  6. grand_opus
-- Run AFTER seed-part1-customers-1to3.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ROYAL SUITES  —  Hotel POS (rooms + billing)  (Growth plan)
--    Small hotel. Manages room items/charges through POS. No online booking.
-- ═══════════════════════════════════════════════════════════════════════════

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
) values (
  'aaaaaaaa-0004-0004-0004-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'royalsuites@hospiflow.in',
  crypt('Demo@1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"tenant_id":"royal_suites","plan":"growth","name":"Royal Suites Hotel"}',
  'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  encrypted_password = excluded.encrypted_password;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'aaaaaaaa-0004-0004-0004-000000000004',
  'royalsuites@hospiflow.in',
  '{"sub":"aaaaaaaa-0004-0004-0004-000000000004","email":"royalsuites@hospiflow.in","email_verified":true,"phone_verified":false}',
  'email', now(), now(), now()
) on conflict do nothing;

insert into site_config (tenant_id, config_key, config_value) values
  ('royal_suites', 'hotel_name',    'Royal Suites Hotel'),
  ('royal_suites', 'notify_email',  'royalsuites@hospiflow.in'),
  ('royal_suites', 'business_type', 'hotel'),
  ('royal_suites', 'phone',         '+91-9800000004'),
  ('royal_suites', 'address',       'Civil Lines, Nagpur, Maharashtra'),
  ('royal_suites', 'plan',          'growth')
on conflict (tenant_id, config_key) do update set config_value = excluded.config_value;

-- Room types as menu_items (hotel uses POS to bill room services / extras)
insert into menu_items (tenant_id, name, category, price, is_veg, tax_rate, is_active, sort_order)
values
  ('royal_suites', 'Standard Room (per night)',   'Rooms',     2500, true, 12, true, 1),
  ('royal_suites', 'Deluxe Room (per night)',      'Rooms',     3500, true, 12, true, 2),
  ('royal_suites', 'Suite (per night)',            'Rooms',     6000, true, 12, true, 3),
  ('royal_suites', 'Early Check-in Charge',        'Extras',    500,  true, 12, true, 4),
  ('royal_suites', 'Late Check-out Charge',        'Extras',    500,  true, 12, true, 5),
  ('royal_suites', 'Airport Transfer',             'Transport', 1200, true, 5,  true, 6),
  ('royal_suites', 'Laundry Service',              'Services',  300,  true, 5,  true, 7),
  ('royal_suites', 'Room Service — Full Breakfast','F&B',       450,  true, 5,  true, 8),
  ('royal_suites', 'Room Service — Dinner Set',    'F&B',       650,  true, 5,  true, 9),
  ('royal_suites', 'Mini Bar Beverages',           'F&B',       200,  true, 12, true, 10);

-- Sample hotel POS bills
insert into pos_orders (tenant_id, order_number, order_type, customer_name, subtotal, cgst, sgst, total, payment_mode, status, item_count, item_summary, items, created_at)
values
  ('royal_suites','ORD-260402-0041','dine-in','Mr. & Mrs. Sharma',  7000, 420, 420, 7840, 'card',    'paid', 2, 'Deluxe Room 2 nights', '[]', now() - interval '2 days'),
  ('royal_suites','ORD-260402-0042','dine-in','Rajesh Gupta',       6000, 360, 360, 6720, 'upi',     'paid', 1, 'Suite 1 night', '[]', now() - interval '1 day'),
  ('royal_suites','ORD-260402-0043','dine-in','Corporate — InfySys',5000, 300, 300, 5600, 'card',    'pending',   2, 'Standard Room 2 nights', '[]', now() - interval '30 minutes');

-- Inventory (hotel housekeeping)
insert into inventory_items (tenant_id, name, category, unit, current_stock, min_stock, cost_per_unit, is_active)
values
  ('royal_suites', 'Bath Towels',       'other',      'piece', 60,  20, 180, true),
  ('royal_suites', 'Bed Sheets (King)', 'other',      'piece', 30,  10, 450, true),
  ('royal_suites', 'Soap (bar)',        'other',      'piece', 200, 50, 20,  true),
  ('royal_suites', 'Shampoo Sachet',    'other',      'piece', 150, 50, 15,  true),
  ('royal_suites', 'Mineral Water 1L',  'beverages',  'piece', 80,  20, 18,  true);


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. GRAND HORIZON HOTEL  —  Hotel + OYO/MakeMyTrip alarm  (Pro plan)
--    Hotel with online booking channels. When OYO/MakeMyTrip sends a booking
--    via the webhook-orders edge function (platform='oyo'/'makemytrip'),
--    the portal alarm rings and staff see it in POS orders.
--    Staff management + coin loyalty program included.
--
--    OYO/MakeMyTrip webhook URL for their dashboard:
--    https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=grand_horizon
-- ═══════════════════════════════════════════════════════════════════════════

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
) values (
  'aaaaaaaa-0005-0005-0005-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'grandhorizon@hospiflow.in',
  crypt('Demo@1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"tenant_id":"grand_horizon","plan":"pro","name":"Grand Horizon Hotel"}',
  'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  encrypted_password = excluded.encrypted_password;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'aaaaaaaa-0005-0005-0005-000000000005',
  'grandhorizon@hospiflow.in',
  '{"sub":"aaaaaaaa-0005-0005-0005-000000000005","email":"grandhorizon@hospiflow.in","email_verified":true,"phone_verified":false}',
  'email', now(), now(), now()
) on conflict do nothing;

insert into site_config (tenant_id, config_key, config_value) values
  ('grand_horizon', 'hotel_name',         'Grand Horizon Hotel'),
  ('grand_horizon', 'notify_email',       'grandhorizon@hospiflow.in'),
  ('grand_horizon', 'notify_email_hotel', 'reception@grandhorizon.com'),
  ('grand_horizon', 'business_type',      'hotel'),
  ('grand_horizon', 'phone',              '+91-9800000005'),
  ('grand_horizon', 'address',            'Rajpur Road, Dehradun, Uttarakhand'),
  ('grand_horizon', 'oyo_webhook_enabled',       'true'),
  ('grand_horizon', 'makemytrip_webhook_enabled', 'true'),
  ('grand_horizon', 'plan',                       'pro')
on conflict (tenant_id, config_key) do update set config_value = excluded.config_value;

insert into menu_items (tenant_id, name, category, price, is_veg, tax_rate, is_active, sort_order)
values
  ('grand_horizon', 'Standard Room (per night)',  'Rooms',     3500, true, 12, true, 1),
  ('grand_horizon', 'Deluxe Mountain View',       'Rooms',     5500, true, 12, true, 2),
  ('grand_horizon', 'Heritage Suite',             'Rooms',     9500, true, 12, true, 3),
  ('grand_horizon', 'Extra Bed',                  'Extras',    800,  true, 12, true, 4),
  ('grand_horizon', 'Airport Transfer (Dehradun)','Transport', 1500, true, 5,  true, 5),
  ('grand_horizon', 'Bonfire Arrangement',        'Activities',2000, true, 18, true, 6),
  ('grand_horizon', 'Buffet Breakfast',           'F&B',       500,  true, 5,  true, 7),
  ('grand_horizon', 'Candle-light Dinner',        'F&B',       2500, true, 5,  true, 8);

-- OYO / MakeMyTrip bookings arriving via webhook → third_party_orders
-- (platform CHECK only allows: zomato, swiggy, manual, other)
insert into third_party_orders (
  tenant_id, platform, external_order_id, customer_name, customer_phone,
  delivery_address, items, subtotal, platform_fee, total, status, is_read, created_at
) values
  ('grand_horizon','other','OYO-BK-882211','Vikram Singh','+919845001122',
   'OYO | Check-in: 3 Apr 2026 | 2 nights | Deluxe Mountain View',
   '[{"name":"Deluxe Mountain View","nights":2,"price":5500}]',
   11000, 1320, 12320, 'new', false, now() - interval '12 minutes'),
  ('grand_horizon','other','MMT-HTL-556677','Anita Desai','+919845002233',
   'MakeMyTrip | Check-in: 5 Apr 2026 | 3 nights | Standard Room',
   '[{"name":"Standard Room","nights":3,"price":3500}]',
   10500, 1050, 11550, 'new', false, now() - interval '1 hour'),
  ('grand_horizon','other','OYO-BK-773344','Ravi Kumar','+919845003344',
   'OYO | Check-in: 2 Apr 2026 | 1 night | Heritage Suite',
   '[{"name":"Heritage Suite","nights":1,"price":9500}]',
   9500, 1140, 10640, 'acknowledged', true, now() - interval '3 hours');

-- POS bills
insert into pos_orders (tenant_id, order_number, order_type, customer_name, subtotal, cgst, sgst, total, payment_mode, status, item_count, item_summary, items, created_at)
values
  ('grand_horizon','ORD-260402-0051','dine-in','Vikram Singh',  11000, 660, 660, 12320, 'card',  'pending',   2, 'Deluxe Mountain View 2 nights', '[]', now() - interval '30 minutes'),
  ('grand_horizon','ORD-260402-0052','dine-in','Sharma Family', 19000, 1140,1140,21280, 'card',  'paid', 3, 'Heritage Suite 2 nights, Bonfire', '[]', now() - interval '1 day');

-- Staff
insert into staff_members (tenant_id, name, role, phone, shift, monthly_salary, is_active)
values
  ('grand_horizon', 'Manoj Tiwari',  'manager',      '+91-9811000051', 'morning', 28000, true),
  ('grand_horizon', 'Pooja Bhatt',   'other',         '+91-9811000052', 'morning', 18000, true),
  ('grand_horizon', 'Raju Negi',     'housekeeping',  '+91-9811000053', 'morning', 16000, true),
  ('grand_horizon', 'Deepak Rawat',  'accountant',    '+91-9811000054', 'night',   17000, true);

insert into coin_config (tenant_id, spend_per_coin, coin_value, min_redeem)
values ('grand_horizon', 100, 1, 200)
on conflict (tenant_id) do update set spend_per_coin = 100;

insert into inventory_items (tenant_id, name, category, unit, current_stock, min_stock, cost_per_unit, is_active)
values
  ('grand_horizon', 'Bed Sheets (King)', 'other',      'piece', 50,  15, 550, true),
  ('grand_horizon', 'Pillow Covers',     'other',      'piece', 80,  20, 120, true),
  ('grand_horizon', 'Toiletry Kit',      'other',      'piece', 100, 30, 95,  true),
  ('grand_horizon', 'Bottled Water 1L',  'beverages',  'piece', 120, 40, 18,  true),
  ('grand_horizon', 'Bonfire Wood',      'raw',        'kg',    200, 50, 12,  true);


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. THE GRAND OPUS  —  Restaurant + Hotel + Everything  (Enterprise plan)
--    Full-service property: restaurant with QR + Zomato/Swiggy,
--    hotel with OYO/MakeMyTrip bookings, staff, inventory, loyalty coins.
--    Alarm fires for ALL sources: table orders, delivery, hotel bookings.
--
--    Webhook URL:
--    https://kproecqyclgujzmskqko.supabase.co/functions/v1/webhook-orders?tenant=grand_opus
-- ═══════════════════════════════════════════════════════════════════════════

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
) values (
  'aaaaaaaa-0006-0006-0006-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'grandopus@hospiflow.in',
  crypt('Demo@1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"tenant_id":"grand_opus","plan":"enterprise","name":"The Grand Opus"}',
  'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  encrypted_password = excluded.encrypted_password;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'aaaaaaaa-0006-0006-0006-000000000006',
  'grandopus@hospiflow.in',
  '{"sub":"aaaaaaaa-0006-0006-0006-000000000006","email":"grandopus@hospiflow.in","email_verified":true,"phone_verified":false}',
  'email', now(), now(), now()
) on conflict do nothing;

insert into site_config (tenant_id, config_key, config_value) values
  ('grand_opus', 'hotel_name',              'The Grand Opus'),
  ('grand_opus', 'notify_email',            'grandopus@hospiflow.in'),
  ('grand_opus', 'notify_email_hotel',      'reservations@grandopus.com'),
  ('grand_opus', 'notify_email_restaurant', 'kitchen@grandopus.com'),
  ('grand_opus', 'business_type',           'resort'),
  ('grand_opus', 'phone',                   '+91-9800000006'),
  ('grand_opus', 'address',                 'Candolim Beach Road, Goa - 403515'),
  ('grand_opus', 'table_list',              '["T1","T2","T3","T4","T5","T6","Pool 1","Pool 2","Terrace 1","Terrace 2","Bar 1","Bar 2"]'),
  ('grand_opus', 'zomato_webhook_enabled',         'true'),
  ('grand_opus', 'swiggy_webhook_enabled',         'true'),
  ('grand_opus', 'oyo_webhook_enabled',            'true'),
  ('grand_opus', 'makemytrip_webhook_enabled',     'true'),
  ('grand_opus', 'plan',                         'enterprise')
on conflict (tenant_id, config_key) do update set config_value = excluded.config_value;

-- ── Menu: Restaurant items
insert into menu_items (tenant_id, name, category, price, is_veg, tax_rate, is_active, sort_order)
values
  ('grand_opus', 'Goan Fish Curry',         'Mains',    480, false, 5, true, 1),
  ('grand_opus', 'Prawn Xacuti',            'Mains',    620, false, 5, true, 2),
  ('grand_opus', 'Veg Cafreal',             'Mains',    340, true,  5, true, 3),
  ('grand_opus', 'Pork Sorpotel',           'Mains',    560, false, 5, true, 4),
  ('grand_opus', 'Fish Tikka',              'Starters', 420, false, 5, true, 5),
  ('grand_opus', 'Prawn Balchão',           'Starters', 480, false, 5, true, 6),
  ('grand_opus', 'Veg Spring Roll',         'Starters', 220, true,  5, true, 7),
  ('grand_opus', 'Goan Pork Sausage Pizza', 'Pizza',    580, false, 5, true, 8),
  ('grand_opus', 'Bebinca',                 'Desserts', 220, true,  5, true, 9),
  ('grand_opus', 'Feni Cocktail',           'Bar',      320, true, 18, true, 10),
  ('grand_opus', 'Kingfisher Beer',         'Bar',      180, true, 18, true, 11),
  -- Room types
  ('grand_opus', 'Sea-View Room (per night)',  'Rooms', 8500,  true, 12, true, 20),
  ('grand_opus', 'Pool Villa (per night)',     'Rooms', 18000, true, 12, true, 21),
  ('grand_opus', 'Luxury Suite (per night)',   'Rooms', 28000, true, 12, true, 22),
  ('grand_opus', 'Extra Bed (per night)',      'Extras', 1200, true, 12, true, 23),
  ('grand_opus', 'Airport Transfer (Goa)',     'Transport', 2500, true, 5, true, 24),
  ('grand_opus', 'Spa Session (60 min)',       'Wellness', 4500, true, 18, true, 25),
  ('grand_opus', 'Scuba Diving Package',       'Activities', 6500, true, 18, true, 26);

-- ── Zomato / Swiggy delivery orders
insert into third_party_orders (
  tenant_id, platform, external_order_id, customer_name, customer_phone,
  delivery_address, items, subtotal, platform_fee, total, status, is_read, created_at
) values
  ('grand_opus','zomato','ZOM-GN-441100','Rahul Fernandes','+919860001111',
   'Villa 22, Candolim, Goa',
   '[{"name":"Goan Fish Curry","qty":2,"price":480},{"name":"Kingfisher Beer","qty":2,"price":180}]',
   1320, 80, 1400, 'new', false, now() - interval '4 minutes'),
  ('grand_opus','swiggy','SWG-GN-335566','Priya Coutinho','+919860002222',
   'Flat 8, Baga Road, Goa',
   '[{"name":"Prawn Xacuti","qty":1,"price":620},{"name":"Veg Spring Roll","qty":1,"price":220}]',
   840, 60, 900, 'new', false, now() - interval '22 minutes');

-- ── OYO / MakeMyTrip hotel bookings (platform='other'; prefix in external_order_id)
insert into third_party_orders (
  tenant_id, platform, external_order_id, customer_name, customer_phone,
  delivery_address, items, subtotal, platform_fee, total, status, is_read, created_at
) values
  ('grand_opus','other','OYO-GN-991122','Mr. & Mrs. Bose','+919870001111',
   'OYO | Check-in: 4 Apr 2026 | 4 nights | Pool Villa',
   '[{"name":"Pool Villa","nights":4,"price":18000}]',
   72000, 8640, 80640, 'new', false, now() - interval '18 minutes'),
  ('grand_opus','other','MMT-GN-667788','Sundar Iyer','+919870002222',
   'MakeMyTrip | Check-in: 6 Apr 2026 | 2 nights | Sea-View Room',
   '[{"name":"Sea-View Room","nights":2,"price":8500}]',
   17000, 1700, 18700, 'new', false, now() - interval '2 hours');

-- ── POS table orders (restaurant + spa billing)
insert into pos_orders (tenant_id, order_number, order_type, table_name, customer_name, subtotal, cgst, sgst, total, payment_mode, status, item_count, item_summary, items, created_at)
values
  ('grand_opus','ORD-260402-0061','dine-in','Pool 1','Table Guest',  1100, 27.5, 27.5, 1155, 'cash', 'pending',   2, 'Goan Fish Curry, Kingfisher Beer x2', '[]', now() - interval '6 minutes'),
  ('grand_opus','ORD-260402-0062','dine-in','Terrace 1','Table Guest',1200, 30, 30, 1260, 'cash', 'pending',3, 'Prawn Xacuti, Bebinca, Feni Cocktail', '[]', now() - interval '25 minutes'),
  ('grand_opus','ORD-260402-0063','dine-in','Mr. & Mrs. Bose',     72000, 4320, 4320, 80640, 'card', 'paid', 1, 'Pool Villa 4 nights', '[]', now() - interval '1 day');

-- ── Staff (full team)
insert into staff_members (tenant_id, name, role, phone, shift, monthly_salary, is_active)
values
  ('grand_opus', 'Carlos Rodrigues', 'manager',      '+91-9811000061', 'morning', 85000, true),
  ('grand_opus', 'Susan D''Souza',   'manager',      '+91-9811000062', 'morning', 45000, true),
  ('grand_opus', 'Anand Naik',       'chef',         '+91-9811000063', 'morning', 55000, true),
  ('grand_opus', 'Rita Fernandes',   'other',        '+91-9811000064', 'morning', 22000, true),
  ('grand_opus', 'Thomas Gomes',     'waiter',       '+91-9811000065', 'evening', 20000, true),
  ('grand_opus', 'Maria Pereira',    'other',        '+91-9811000066', 'morning', 25000, true),
  ('grand_opus', 'Sanjay Velip',     'housekeeping', '+91-9811000067', 'morning', 16000, true);

-- ── Loyalty coins
insert into coin_config (tenant_id, spend_per_coin, coin_value, min_redeem)
values ('grand_opus', 100, 1.5, 200)
on conflict (tenant_id) do update set spend_per_coin = 100;

insert into coin_profiles (tenant_id, phone, name, balance)
values
  ('grand_opus', '+919860001111', 'Rahul Fernandes', 450),
  ('grand_opus', '+919870001111', 'Mr. Bose',        1200)
on conflict (tenant_id, phone) do update set balance = excluded.balance;

-- ── Inventory
insert into inventory_items (tenant_id, name, category, unit, current_stock, min_stock, cost_per_unit, is_active)
values
  ('grand_opus', 'Kingfisher Beer',   'beverages', 'piece', 200, 60,  85,  true),
  ('grand_opus', 'Feni (750ml)',      'beverages', 'bottle',48,  12,  320, true),
  ('grand_opus', 'Prawns (fresh)',    'raw',        'kg',    20,  5,   480, true),
  ('grand_opus', 'Fish (Pomfret)',    'raw',        'kg',    18,  4,   380, true),
  ('grand_opus', 'Coconut Milk',      'dairy',      'litre', 30,  8,   40,  true),
  ('grand_opus', 'Pool Towels',       'other',      'piece', 80,  20,  250, true),
  ('grand_opus', 'Luxury Toiletry',   'other',      'piece', 120, 40,  180, true),
  ('grand_opus', 'Massage Oil',       'other',      'litre', 15,  4,   850, true);


-- ═══════════════════════════════════════════════════════════════════════════
-- SUMMARY TABLE (for quick reference)
-- ═══════════════════════════════════════════════════════════════════════════
--
--  tenant_id       | Email                         | Plan       | Password   | Business
--  ─────────────────────────────────────────────────────────────────────────────────
--  quickbite       | quickbite@hospiflow.in        | starter    | Demo@1234  | Small café (POS only)
--  spice_garden    | spicegarden@hospiflow.in      | growth     | Demo@1234  | Restaurant + QR table orders
--  fresco_kitchen  | fresco@hospiflow.in           | pro        | Demo@1234  | Restaurant + QR + Zomato/Swiggy
--  royal_suites    | royalsuites@hospiflow.in      | growth     | Demo@1234  | Hotel POS (rooms & extras)
--  grand_horizon   | grandhorizon@hospiflow.in     | pro        | Demo@1234  | Hotel + OYO/MakeMyTrip alarm
--  grand_opus      | grandopus@hospiflow.in        | enterprise | Demo@1234  | Resort: restaurant+hotel+all
--
-- ── EMAIL ENQUIRY (notify-enquiry edge function) ──────────────────────────
--
--  Q: Will the existing notify-enquiry edge function work for HospiFlow
--     customers since we share the same Supabase project?
--
--  A: YES — 100% automatic. Here's why:
--
--  1. The function is already deployed at:
--     https://kproecqyclgujzmskqko.supabase.co/functions/v1/notify-enquiry
--
--  2. The Supabase Database Webhook on the `enquiries` table fires for
--     ALL tenants (no filter needed — the function reads tenant_id from
--     the inserted row).
--
--  3. The function reads notify_email from site_config (set above for each
--     tenant) and uses the global SMTP fallback if no per-tenant secret exists.
--
--  4. To use per-tenant email addresses, just add to site_config:
--       ('your_tenant', 'notify_email', 'admin@yourbusiness.com')
--       ('your_tenant', 'notify_email_hotel', 'reservations@yourbusiness.com')
--
--  5. To use a custom Gmail sender per tenant, run once:
--       supabase secrets set SMTP_USER_GRANDOPUS=noreply@grandopus.com
--       supabase secrets set SMTP_PASS_GRANDOPUS=xxxx-xxxx-xxxx-xxxx
--     (tenant ID uppercased, no hyphens)
--
-- ═══════════════════════════════════════════════════════════════════════════
