

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wishlist_items'
      AND column_name IN ('original_url', 'affiliate_url')
  ) THEN
    EXECUTE $f$
      UPDATE wishlist_items
      SET url = COALESCE(
        NULLIF(url, ''),
        NULLIF(affiliate_url, ''),
        NULLIF(original_url, ''),
        url
      )
      WHERE url IS NULL OR url = ''
    $f$;
  END IF;
END $$;

ALTER TABLE wishlist_items DROP COLUMN IF EXISTS original_url;
ALTER TABLE wishlist_items DROP COLUMN IF EXISTS affiliate_url;
