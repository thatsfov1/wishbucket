# scrape-url

Supabase Edge Function that extracts wishlist product metadata by calling an
Apify Actor.

The Edge Function does not scrape pages itself. It:

1. validates the submitted URL
2. canonicalizes it for cache reuse
3. reads/writes `scrape_cache`
4. calls the Apify Actor with server-side secrets
5. returns `{ success, manualEntryRequired, productInfo, error }` to the app

## Why Apify here

Supabase Edge Functions are a good API boundary, but not a good place for heavy
browser scraping. The Actor in `apify/product-scraper` runs the scraping work:

- fast path: `impit` + `metascraper`
- fallback: Playwright rendering when fast extraction is blocked or weak

## Cost notes

Apify has a `$0` Free plan with monthly platform credits and no credit card
required. It is still usage-metered: if you enable paid proxies or move to a
paid plan, usage can cost money.

By default this integration does **not** enable Apify Proxy. To use Apify Proxy,
set `APIFY_PROXY_ENABLED=true`. Only use residential proxy groups deliberately.

## Required setup

### 1. Apply the cache table

```bash
supabase db push
```

This applies:

```txt
supabase/migrations/20260427230000_scrape_cache.sql
```

### 2. Deploy the Apify Actor

From `apify/product-scraper`:

```bash
npm install
apify login
apify push
```

Copy the Actor ID from Apify. Either `username/actor-name` or
`username~actor-name` works.

### 3. Configure Supabase secrets

```bash
supabase secrets set APIFY_TOKEN=your_apify_token
supabase secrets set APIFY_ACTOR_ID=username~wishbucket-product-scraper
supabase secrets set APIFY_WAIT_SECS=75
```

Optional proxy settings:

```bash
supabase secrets set APIFY_PROXY_ENABLED=true
supabase secrets set APIFY_PROXY_GROUPS=RESIDENTIAL
```

Then deploy:

```bash
supabase functions deploy scrape-url
```

## Response shape

Successful scrape:

```json
{
  "success": true,
  "manualEntryRequired": false,
  "productInfo": {
    "title": "Product name",
    "imageUrl": "https://...",
    "price": 123.45,
    "currency": "USD",
    "description": "..."
  },
  "source": "apify",
  "cached": false
}
```

Failed scrape:

```json
{
  "success": false,
  "manualEntryRequired": true,
  "productInfo": {},
  "error": "Could not load product details automatically...",
  "source": "apify",
  "cached": false
}
```
