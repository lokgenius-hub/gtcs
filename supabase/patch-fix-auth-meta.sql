-- ============================================================
-- PATCH: Fix auth.users raw_app_meta_data for all demo tenants
-- Run this ONCE in Supabase SQL Editor if users were already
-- inserted without raw_app_meta_data (causes "Database error
-- querying schema" on login).
-- ============================================================

UPDATE auth.users 
SET raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
WHERE email IN (
  'quickbite@hospiflow.in',
  'spicegarden@hospiflow.in',
  'fresco@hospiflow.in',
  'royalsuites@hospiflow.in',
  'grandhorizon@hospiflow.in',
  'grandopus@hospiflow.in'
);

-- Also fix superadmin if already created
UPDATE auth.users 
SET raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'admin@hospiflow.in'
  AND (raw_app_meta_data IS NULL OR raw_app_meta_data = '{}'::jsonb);

-- Verify
SELECT email, raw_app_meta_data 
FROM auth.users 
WHERE email LIKE '%@hospiflow.in'
ORDER BY email;
