-- Schedule daily birthday reminder checks.
-- IMPORTANT:
-- 1) Replace PROJECT_REF with your Supabase project ref
-- 2) Replace SERVICE_ROLE_KEY with your real service role key
-- 3) Run this migration in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Ensure we do not create duplicate cron jobs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'check-birthdays-daily'
  ) THEN
    PERFORM cron.unschedule('check-birthdays-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'check-birthdays-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://PROJECT_REF.supabase.co/functions/v1/check-birthdays',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    );
  $$
);
