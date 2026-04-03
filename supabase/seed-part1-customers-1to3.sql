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


