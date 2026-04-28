-- ============================================
-- Scrape result cache
--
-- The same product URL is added by many users; a single popular link can
-- otherwise burn through paid-scraper quota and free-tier limits in minutes.
-- We cache by *canonical* URL (tracking params stripped) so different copies
-- of the same product (utm_*, ref=, fbclid, etc.) all share the same row.
--
-- TTLs (enforced by `expires_at`, not by a cron — we just check at read time):
--   - useful results: 12 hours
--   - empty / failed:  30 minutes (don't permanently cache failures)
-- ============================================

CREATE TABLE IF NOT EXISTS scrape_cache (
  canonical_url   TEXT PRIMARY KEY,
  product_info    JSONB NOT NULL,
  has_useful_data BOOLEAN NOT NULL DEFAULT false,
  source          TEXT NOT NULL,
  fetched_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scrape_cache_expires
  ON scrape_cache (expires_at);
-- RLS stays disabled by default for this internal cache table. Only the
-- service-role-keyed Edge Function ever touches it.
