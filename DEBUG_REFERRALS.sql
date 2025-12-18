-- ============================================
-- DEBUG: Check Referral System
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if referrals table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'referrals';

-- 2. If table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  referred_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  bonus_earned INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_user_id) -- A user can only be referred once
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'referrals';

-- 4. Enable RLS and create permissive policies (if needed)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and are causing issues
DROP POLICY IF EXISTS "View referrals" ON referrals;
DROP POLICY IF EXISTS "Create referrals" ON referrals;

-- Create permissive policies (allow all for now to debug)
CREATE POLICY "Allow all referrals operations" ON referrals 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Check all users and their referral codes
SELECT 
  user_id,
  referral_code,
  referrals,
  bonus_points,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check all existing referrals
SELECT * FROM referrals;

-- 7. Test insert (replace USER_IDs with actual values)
-- INSERT INTO referrals (referrer_id, referred_user_id, bonus_earned)
-- VALUES (123456789, 987654321, 100);

