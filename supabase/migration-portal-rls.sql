-- ──────────────────────────────────────────────────────────────────────────────
-- PORTAL RLS POLICIES
-- Allows Supabase Auth users to access their own tenant's data via the
-- HospiFlow Online Portal (gtcs.com/portal).
--
-- HOW IT WORKS:
--   Each portal user has user_metadata: { "tenant_id": "xxx", "plan": "pro" }
--   The JWT includes this metadata. RLS reads it via:
--       auth.jwt()->'user_metadata'->>'tenant_id'
--
-- RUN THIS in Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── Helper: current user's tenant_id from JWT ───────────────────────────────
-- We use this expression inline in every policy:
--   (auth.jwt()->'user_metadata'->>'tenant_id')

-- ─── menu_items — portal users can read their tenant's menu ──────────────────
DROP POLICY IF EXISTS "portal_read_menu" ON menu_items;
CREATE POLICY "portal_read_menu" ON menu_items
  FOR SELECT TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

-- Portal users can also manage (upsert/delete) their own menu items  
DROP POLICY IF EXISTS "portal_manage_menu" ON menu_items;
CREATE POLICY "portal_manage_menu" ON menu_items
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

-- ─── pos_orders — portal users can read + insert for their tenant ─────────────
DROP POLICY IF EXISTS "portal_access_pos_orders" ON pos_orders;
CREATE POLICY "portal_access_pos_orders" ON pos_orders
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

-- ─── coin_profiles — customers / loyalty ─────────────────────────────────────
DROP POLICY IF EXISTS "portal_access_coin_profiles" ON coin_profiles;
CREATE POLICY "portal_access_coin_profiles" ON coin_profiles
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

DROP POLICY IF EXISTS "portal_access_coin_transactions" ON coin_transactions;
CREATE POLICY "portal_access_coin_transactions" ON coin_transactions
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

DROP POLICY IF EXISTS "portal_access_coin_config" ON coin_config;
CREATE POLICY "portal_access_coin_config" ON coin_config
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

-- ─── staff_members & attendance ───────────────────────────────────────────────
DROP POLICY IF EXISTS "portal_access_staff" ON staff_members;
CREATE POLICY "portal_access_staff" ON staff_members
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

DROP POLICY IF EXISTS "portal_access_attendance" ON staff_attendance;
CREATE POLICY "portal_access_attendance" ON staff_attendance
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

-- ─── inventory ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "portal_access_inventory" ON inventory_items;
CREATE POLICY "portal_access_inventory" ON inventory_items
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

DROP POLICY IF EXISTS "portal_access_inv_tx" ON inventory_transactions;
CREATE POLICY "portal_access_inv_tx" ON inventory_transactions
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

-- ─── expenses ─────────────────────────────────────────────────────────────────
-- Enable RLS if not already
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_access_expenses" ON expenses;
CREATE POLICY "portal_access_expenses" ON expenses
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id'));

-- ─── DONE ─────────────────────────────────────────────────────────────────────
-- After running this, create portal users in Supabase Dashboard → Auth → Users
-- Set user_metadata to: { "tenant_id": "sharda", "plan": "pro", "name": "Hotel Name" }
--
-- Available plans: starter | growth | pro | enterprise
--   starter:    POS + Products + Dashboard
--   growth:     + Customers + Reports + Inventory
--   pro:        + Staff + Coins / Loyalty
--   enterprise: Everything + priority support
