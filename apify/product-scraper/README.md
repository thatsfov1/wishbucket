# Wishbucket Product Scraper

Apify Actor used by `supabase/functions/scrape-url`.

## Pipeline

1. `impit` fetches the product URL with a Chrome-like HTTP fingerprint.
2. `metascraper` extracts JSON-LD, OpenGraph, title, image, price, currency,
   and description.
3. If the result is weak or blocked, Playwright renders the page and extraction
   runs again.
4. The Actor writes the first result to both the default dataset and `OUTPUT`.

## Local run

```bash
corepack enable
corepack pnpm install
APIFY_LOCAL_STORAGE_DIR=./storage corepack pnpm start
```

Use `apify/input.json` or the Apify Console to provide:

```json
{
  "url": "https://example.com/product",
  "acceptLanguage": "en-US,en;q=0.9"
}
```

## Proxy usage

The Actor only uses Apify Proxy if `proxyConfiguration` is passed in the input.
The Supabase function sends that only when `APIFY_PROXY_ENABLED=true`.

Example input:

```json
{
  "url": "https://example.com/product",
  "proxyConfiguration": {
    "useApifyProxy": true
  }
}
```

Residential proxy groups can improve difficult ecommerce sites, but they can
also increase costs. Keep them off until you have a concrete target that needs
them.
