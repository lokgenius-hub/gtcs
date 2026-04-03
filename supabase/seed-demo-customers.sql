-- ═══════════════════════════════════════════════════════════════════════════
-- HOSPIFLOW — 6 DEMO CUSTOMER SEED
-- Run this in Supabase SQL Editor (shared project: kproecqyclgujzmskqko)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- CUSTOMERS CREATED:
--
--  1. quickbite        POS only                        Starter    quickbite@hospiflow.in
--  2. spice_garden     POS + QR table ordering         Growth     spicegarden@hospiflow.in
--  3. fresco_kitchen   POS + QR + Zomato/Swiggy        Pro        fresco@hospiflow.in
--  4. royal_suites     Hotel POS (rooms + billing)     Growth     royalsuites@hospiflow.in
--  5. grand_horizon    Hotel + OYO/MakeMyTrip alarm    Pro        grandhorizon@hospiflow.in
--  6. grand_opus       Restaurant+Hotel+All+Online     Enterprise grandopus@hospiflow.in
--
--  All passwords:  Demo@1234
--
-- EMAIL ENQUIRY (notify-enquiry edge function):
--   ✅  Already deployed on this shared Supabase project from mysharda.
--   ✅  Works automatically — it reads tenant_id from the enquiries row
--       and looks up notify_email / SMTP secrets per tenant.
--   ✅  No extra setup needed. Just set notify_email in site_config below.
--
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── STEP 0: helper – clean old demo rows if re-running ──────────────────

delete from menu_items         where tenant_id in ('quickbite','spice_garden','fresco_kitchen','royal_suites','grand_horizon','grand_opus');
delete from pos_orders         where tenant_id in ('quickbite','spice_garden','fresco_kitchen','royal_suites','grand_horizon','grand_opus');
delete from third_party_orders where tenant_id in ('quickbite','spice_garden','fresco_kitchen','royal_suites','grand_horizon','grand_opus');
delete from staff_members      where tenant_id in ('quickbite','spice_garden','fresco_kitchen','royal_suites','grand_horizon','grand_opus');
delete from inventory_items    where tenant_id in ('quickbite','spice_garden','fresco_kitchen','royal_suites','grand_horizon','grand_opus');
delete from coin_config        where tenant_id in ('quickbite','spice_garden','fresco_kitchen','royal_suites','grand_horizon','grand_opus');
delete from coin_profiles      where tenant_id in ('quickbite','spice_garden','fresco_kitchen','royal_suites','grand_horizon','grand_opus');
delete from site_config        where tenant_id in ('quickbite','spice_garden','fresco_kitchen','royal_suites','grand_horizon','grand_opus');


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. QUICKBITE CAFE  —  POS only  (Starter plan)
--    A small café that just wants a billing system.
--    No QR, no online orders. Basic pos + products + dashboard.
-- ═══════════════════════════════════════════════════════════════════════════

-- Auth user — run in Auth > Users UI or via:
--   dashboard → Auth → Add User → email: quickbite@hospiflow.in / Demo@1234
--   Edit user_metadata: {"tenant_id":"quickbite","plan":"starter","name":"QuickBite Cafe"}
-- OR via SQL (service_role required):
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
) values (
  'aaaaaaaa-0001-0001-0001-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'quickbite@hospiflow.in',
  crypt('Demo@1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"tenant_id":"quickbite","plan":"starter","name":"QuickBite Cafe"}',
  'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  encrypted_password = excluded.encrypted_password;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'aaaaaaaa-0001-0001-0001-000000000001',
  'quickbite@hospiflow.in',
  '{"sub":"aaaaaaaa-0001-0001-0001-000000000001","email":"quickbite@hospiflow.in","email_verified":true,"phone_verified":false}',
  'email', now(), now(), now()
) on conflict do nothing;

-- Site config
insert into site_config (tenant_id, config_key, config_value) values
  ('quickbite', 'hotel_name',    'QuickBite Cafe'),
  ('quickbite', 'notify_email',  'quickbite@hospiflow.in'),
  ('quickbite', 'business_type', 'cafe'),
  ('quickbite', 'phone',         '+91-9800000001'),
  ('quickbite', 'address',       'Shop 12, MG Road, Pune'),
  ('quickbite', 'plan',          'starter')
on conflict (tenant_id, config_key) do update set config_value = excluded.config_value;

-- Menu items
insert into menu_items (tenant_id, name, category, price, is_veg, tax_rate, is_active, sort_order)
values
  ('quickbite', 'Espresso',           'Coffee', 80,  true, 5, true, 1),
  ('quickbite', 'Cappuccino',         'Coffee', 120, true, 5, true, 2),
  ('quickbite', 'Cold Coffee',        'Coffee', 150, true, 5, true, 3),
  ('quickbite', 'Masala Chai',        'Tea',    50,  true, 5, true, 4),
  ('quickbite', 'Veg Sandwich',       'Snacks', 120, true, 5, true, 5),
  ('quickbite', 'Chicken Sandwich',   'Snacks', 160, false,5, true, 6),
  ('quickbite', 'Brownie',            'Bakery', 90,  true, 5, true, 7),
  ('quickbite', 'Croissant',          'Bakery', 80,  true, 5, true, 8);

-- Sample POS orders
insert into pos_orders (tenant_id, order_number, order_type, customer_name, subtotal, cgst, sgst, total, payment_mode, status, item_count, item_summary, items, created_at)
values
  ('quickbite', 'ORD-260402-0001', 'dine-in', 'Walk-in', 200, 5, 5, 210, 'cash',   'paid', 2, 'Espresso x1, Veg Sandwich x1',       '[]', now() - interval '2 hours'),
  ('quickbite', 'ORD-260402-0002', 'takeaway','Rohit S', 150, 3.75, 3.75, 157.50, 'upi', 'paid', 1, 'Cold Coffee x1', '[]', now() - interval '1 hour'),
  ('quickbite', 'ORD-260402-0003', 'dine-in', 'Walk-in', 120, 3, 3, 126, 'cash',   'pending',   1, 'Cappuccino x1', '[]', now() - interval '10 minutes');


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. SPICE GARDEN RESTAURANT  —  POS + QR Table Ordering  (Growth plan)
--    Restaurant with dine-in QR codes. Customers scan table QR → place order.
--    Orders appear in POS Table Orders tab with alarm.
--    Has customers + reports + inventory too.
-- ═══════════════════════════════════════════════════════════════════════════

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
) values (
  'aaaaaaaa-0002-0002-0002-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'spicegarden@hospiflow.in',
  crypt('Demo@1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"tenant_id":"spice_garden","plan":"growth","name":"Spice Garden Restaurant"}',
  'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  encrypted_password = excluded.encrypted_password;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'aaaaaaaa-0002-0002-0002-000000000002',
  'spicegarden@hospiflow.in',
  '{"sub":"aaaaaaaa-0002-0002-0002-000000000002","email":"spicegarden@hospiflow.in","email_verified":true,"phone_verified":false}',
  'email', now(), now(), now()
) on conflict do nothing;

insert into site_config (tenant_id, config_key, config_value) values
  ('spice_garden', 'hotel_name',    'Spice Garden Restaurant'),
  ('spice_garden', 'notify_email',  'spicegarden@hospiflow.in'),
  ('spice_garden', 'business_type', 'restaurant'),
  ('spice_garden', 'phone',         '+91-9800000002'),
  ('spice_garden', 'address',       '45 FC Road, Shivajinagar, Pune'),
  ('spice_garden', 'table_list',    '["T1","T2","T3","T4","T5","T6","Bar 1","Bar 2","Rooftop 1","Rooftop 2"]'),
  ('spice_garden', 'plan',          'growth')
on conflict (tenant_id, config_key) do update set config_value = excluded.config_value;

insert into menu_items (tenant_id, name, category, price, is_veg, tax_rate, is_active, sort_order)
values
  ('spice_garden', 'Paneer Butter Masala',  'Main Course', 280, true,  5, true, 1),
  ('spice_garden', 'Dal Makhani',           'Main Course', 220, true,  5, true, 2),
  ('spice_garden', 'Chicken Tikka Masala',  'Main Course', 340, false, 5, true, 3),
  ('spice_garden', 'Mutton Rogan Josh',     'Main Course', 420, false, 5, true, 4),
  ('spice_garden', 'Veg Biryani',           'Biryani',     260, true,  5, true, 5),
  ('spice_garden', 'Chicken Biryani',       'Biryani',     320, false, 5, true, 6),
  ('spice_garden', 'Butter Naan',           'Bread',       50,  true,  5, true, 7),
  ('spice_garden', 'Garlic Naan',           'Bread',       60,  true,  5, true, 8),
  ('spice_garden', 'Jeera Rice',            'Bread',       120, true,  5, true, 9),
  ('spice_garden', 'Masala Papad',          'Starters',    80,  true,  5, true, 10),
  ('spice_garden', 'Chicken Seekh Kebab',   'Starters',    280, false, 5, true, 11),
  ('spice_garden', 'Mango Lassi',           'Drinks',      120, true,  5, true, 12),
  ('spice_garden', 'Gulab Jamun',           'Desserts',    90,  true,  5, true, 13);

-- QR table orders (simulating customers scanning and ordering)
insert into pos_orders (tenant_id, order_number, order_type, table_name, customer_name, notes, subtotal, cgst, sgst, total, payment_mode, status, item_count, item_summary, items, created_at)
values
  ('spice_garden','ORD-260402-0011','dine-in','T1','Table Guest','No onions please', 600, 15, 15, 630, 'cash', 'pending', 3, 'Paneer Butter Masala, Dal Makhani, Butter Naan x2', '[]', now() - interval '5 minutes'),
  ('spice_garden','ORD-260402-0012','dine-in','T3','Table Guest',null, 660, 16.5, 16.5, 693, 'cash', 'pending', 2, 'Chicken Biryani, Mango Lassi', '[]', now() - interval '15 minutes'),
  ('spice_garden','ORD-260402-0013','dine-in','T5','Walk-in',null, 840, 21, 21, 882, 'cash', 'paid', 4, 'Mutton Rogan Josh, Garlic Naan x2, Gulab Jamun', '[]', now() - interval '1 hour');

-- Inventory
insert into inventory_items (tenant_id, name, category, unit, current_stock, min_stock, cost_per_unit, is_active)
values
  ('spice_garden', 'Basmati Rice',   'dry_goods', 'kg',    25, 5,  80, true),
  ('spice_garden', 'Chicken',        'raw',        'kg',    12, 3,  220, true),
  ('spice_garden', 'Mutton',         'raw',        'kg',    5,  2,  560, true),
  ('spice_garden', 'Paneer',         'dairy',      'kg',    8,  2,  320, true),
  ('spice_garden', 'Cooking Oil',    'other',      'litre', 10, 3,  130, true),
  ('spice_garden', 'Cream',          'dairy',      'litre', 4,  1,  90, true);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FRESCO KITCHEN  —  POS + QR + Zomato/Swiggy Online Orders  (Pro plan)
--    Full restaurant setup. Zomato & Swiggy send orders via webhook.
--    Portal alarm rings for BOTH table QR orders AND delivery orders.
--    Also has staff management and loyalty coins.
-- ═══════════════════════════════════════════════════════════════════════════

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
) values (
  'aaaaaaaa-0003-0003-0003-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'fresco@hospiflow.in',
  crypt('Demo@1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"tenant_id":"fresco_kitchen","plan":"pro","name":"Fresco Kitchen"}',
  'authenticated', 'authenticated', now(), now()
) on conflict (id) do update set
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  encrypted_password = excluded.encrypted_password;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'aaaaaaaa-0003-0003-0003-000000000003',
  'fresco@hospiflow.in',
  '{"sub":"aaaaaaaa-0003-0003-0003-000000000003","email":"fresco@hospiflow.in","email_verified":true,"phone_verified":false}',
  'email', now(), now(), now()
) on conflict do nothing;

insert into site_config (tenant_id, config_key, config_value) values
  ('fresco_kitchen', 'hotel_name',    'Fresco Kitchen'),
  ('fresco_kitchen', 'notify_email',  'fresco@hospiflow.in'),
  ('fresco_kitchen', 'business_type', 'restaurant'),
  ('fresco_kitchen', 'phone',         '+91-9800000003'),
  ('fresco_kitchen', 'address',       '88 Koregaon Park, Pune'),
  ('fresco_kitchen', 'table_list',    '["T1","T2","T3","T4","T5","T6","T7","T8"]'),
  ('fresco_kitchen', 'zomato_webhook_enabled', 'true'),
  ('fresco_kitchen', 'swiggy_webhook_enabled', 'true'),
  ('fresco_kitchen', 'plan',                   'pro')
on conflict (tenant_id, config_key) do update set config_value = excluded.config_value;

insert into menu_items (tenant_id, name, category, price, is_veg, tax_rate, is_active, sort_order)
values
  ('fresco_kitchen', 'Margherita Pizza',     'Pizza',   320, true,  5, true, 1),
  ('fresco_kitchen', 'Chicken BBQ Pizza',    'Pizza',   420, false, 5, true, 2),
  ('fresco_kitchen', 'Pasta Arrabbiata',     'Pasta',   280, true,  5, true, 3),
  ('fresco_kitchen', 'Pasta Chicken Pesto',  'Pasta',   360, false, 5, true, 4),
  ('fresco_kitchen', 'Bruschetta',           'Starters',180, true,  5, true, 5),
  ('fresco_kitchen', 'Chicken Wings',        'Starters',340, false, 5, true, 6),
  ('fresco_kitchen', 'Caesar Salad',         'Salads',  220, true,  5, true, 7),
  ('fresco_kitchen', 'Tiramisu',             'Desserts',200, true,  5, true, 8),
  ('fresco_kitchen', 'Fresh Lime Soda',      'Drinks',  80,  true,  5, true, 9),
  ('fresco_kitchen', 'Espresso',             'Drinks',  90,  true,  5, true, 10);

-- Zomato & Swiggy sample orders in third_party_orders
-- (normally inserted by the webhook-orders edge function)
insert into third_party_orders (
  tenant_id, platform, external_order_id, customer_name, customer_phone,
  delivery_address, items, subtotal, platform_fee, total, status, is_read, created_at
) values
  ('fresco_kitchen','zomato','ZOM-88441122','Priya Sharma','+919812345678',
   '12 Koregaon Park Annexe, Pune - 411001',
   '[{"name":"Margherita Pizza","qty":1,"price":320},{"name":"Bruschetta","qty":1,"price":180}]',
   500, 30, 530, 'new', false, now() - interval '8 minutes'),
  ('fresco_kitchen','swiggy','SWG-99001234','Amit Joshi','+919823456789',
   'Flat 5B, Viman Nagar, Pune - 411014',
   '[{"name":"Chicken BBQ Pizza","qty":1,"price":420},{"name":"Caesar Salad","qty":1,"price":220}]',
   640, 45, 685, 'new', false, now() - interval '20 minutes'),
  ('fresco_kitchen','zomato','ZOM-77330099','Neha Patil','+919834567890',
   'Plot 33, Baner Road, Pune',
   '[{"name":"Pasta Chicken Pesto","qty":1,"price":360}]',
   360, 25, 385, 'accepted', true, now() - interval '1 hour');

-- QR table orders
insert into pos_orders (tenant_id, order_number, order_type, table_name, customer_name, subtotal, cgst, sgst, total, payment_mode, status, item_count, item_summary, items, created_at)
values
  ('fresco_kitchen','ORD-260402-0031','dine-in','T2','Table Guest', 600, 15, 15, 630, 'cash', 'pending', 2, 'Margherita Pizza, Pasta Arrabbiata', '[]', now() - interval '3 minutes'),
  ('fresco_kitchen','ORD-260402-0032','dine-in','T7','Walk-in',  420, 10.5, 10.5, 441, 'upi', 'paid', 1, 'Chicken BBQ Pizza', '[]', now() - interval '45 minutes');

-- Staff
insert into staff_members (tenant_id, name, role, phone, shift, monthly_salary, is_active)
values
  ('fresco_kitchen', 'Marco Silva',   'chef',    '+91-9811000031', 'morning', 35000, true),
  ('fresco_kitchen', 'Sunita Raje',   'chef',    '+91-9811000032', 'morning', 25000, true),
  ('fresco_kitchen', 'Akash More',    'waiter',  '+91-9811000033', 'evening', 15000, true),
  ('fresco_kitchen', 'Ritika Naik',   'other',   '+91-9811000034', 'morning', 18000, true);

-- Coins / Loyalty
insert into coin_config (tenant_id, spend_per_coin, coin_value, min_redeem)
values ('fresco_kitchen', 50, 1, 100)
on conflict (tenant_id) do update set spend_per_coin = 50;


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
