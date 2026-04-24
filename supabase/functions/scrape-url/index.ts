// Supabase Edge Function: scrape-url
// Robust product scraper. Strategy (best signal first):
//   1. JSON-LD `Product` schema  (deeply traverses @graph + arrays)
//   2. Microdata (itemtype="...Product" + itemprop="...")
//   3. Site-specific extractors  (Amazon, eBay, AliExpress)
//   4. OpenGraph / Twitter card meta tags
//   5. <title>, <link rel="image_src">, <img> fallbacks
//
// Each step only fills fields that are still empty so that high-quality
// signals always win over weaker ones.

// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProductInfo {
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  siteName?: string;
}

// ─── HTML helpers ────────────────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    );
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getMeta(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${escaped}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1].trim()) return decodeHtmlEntities(m[1].trim());
  }
  return undefined;
}

function absUrl(maybeUrl: string | undefined, base: URL): string | undefined {
  if (!maybeUrl) return undefined;
  const trimmed = maybeUrl.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `${base.protocol}${trimmed}`;
  if (trimmed.startsWith("/")) return `${base.origin}${trimmed}`;
  return `${base.origin}/${trimmed}`;
}

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

function parseJsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw));
    } catch {
      // Some sites embed invalid JSON-LD with trailing commas / HTML comments.
      // Try a forgiving cleanup before giving up.
      try {
        const cleaned = raw
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace(/,\s*([}\]])/g, "$1");
        out.push(JSON.parse(cleaned));
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

function extractProductFromJsonLd(blocks: unknown[]): ProductInfo {
  const result: ProductInfo = {};

  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const obj = node as Record<string, unknown>;

    // Walk @graph and any nested arrays/objects.
    if (obj["@graph"]) visit(obj["@graph"]);

    const type = obj["@type"];
    const types = Array.isArray(type) ? type : type ? [type] : [];
    const isProduct = types.some(
      (t) => typeof t === "string" && /product/i.test(t),
    );

    if (isProduct) {
      if (!result.title && typeof obj.name === "string") {
        result.title = obj.name.trim();
      }
      if (!result.description && typeof obj.description === "string") {
        result.description = stripHtml(obj.description);
      }
      if (!result.imageUrl) {
        const img = obj.image;
        if (typeof img === "string") {
          result.imageUrl = img;
        } else if (Array.isArray(img) && img.length > 0) {
          const first = img[0];
          if (typeof first === "string") result.imageUrl = first;
          else if (
            first &&
            typeof first === "object" &&
            typeof (first as Record<string, unknown>).url === "string"
          ) {
            result.imageUrl = (first as Record<string, string>).url;
          }
        } else if (
          img &&
          typeof img === "object" &&
          typeof (img as Record<string, unknown>).url === "string"
        ) {
          result.imageUrl = (img as Record<string, string>).url;
        }
      }

      // offers can be Offer, AggregateOffer, or array of either.
      const visitOffer = (offer: unknown): void => {
        if (!offer || typeof offer !== "object") return;
        if (Array.isArray(offer)) {
          offer.forEach(visitOffer);
          return;
        }
        const o = offer as Record<string, unknown>;
        const priceRaw =
          (o.price as string | number | undefined) ??
          (o.lowPrice as string | number | undefined) ??
          (o.highPrice as string | number | undefined);
        if (priceRaw !== undefined && result.price === undefined) {
          const p =
            typeof priceRaw === "number"
              ? priceRaw
              : parseFloat(String(priceRaw).replace(/[^\d.,-]/g, "").replace(",", "."));
          if (!isNaN(p) && p > 0) result.price = p;
        }
        if (!result.currency && typeof o.priceCurrency === "string") {
          result.currency = o.priceCurrency.toUpperCase();
        }
      };
      visitOffer(obj.offers);
    }

    // Recurse into all other object values to catch deeply nested products
    // (e.g. ItemList -> ListItem -> Product).
    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") visit(value);
    }
  };

  blocks.forEach(visit);
  return result;
}

// ─── Microdata ──────────────────────────────────────────────────────────────

function extractMicrodata(html: string): ProductInfo {
  const result: ProductInfo = {};
  // Look at any element marked as a Product
  if (!/itemtype=["'][^"']*Product["']/i.test(html)) return result;

  const itemprop = (prop: string): string | undefined => {
    const re = new RegExp(
      `<[^>]+itemprop=["']${prop}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m) return decodeHtmlEntities(m[1].trim());

    // Fallback: <span itemprop="name">Foo</span>
    const re2 = new RegExp(
      `<[^>]+itemprop=["']${prop}["'][^>]*>([\\s\\S]*?)</[^>]+>`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2) return decodeHtmlEntities(stripHtml(m2[1]));
    return undefined;
  };

  result.title = itemprop("name");
  result.description = itemprop("description");
  result.imageUrl = itemprop("image");
  const priceStr = itemprop("price");
  if (priceStr) {
    const p = parseFloat(priceStr.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (!isNaN(p) && p > 0) result.price = p;
  }
  result.currency = itemprop("priceCurrency");
  return result;
}

// ─── OpenGraph / Twitter ────────────────────────────────────────────────────

function extractOpenGraph(html: string): ProductInfo {
  const result: ProductInfo = {};
  result.title = getMeta(html, "og:title") || getMeta(html, "twitter:title");
  result.description =
    getMeta(html, "og:description") ||
    getMeta(html, "twitter:description") ||
    getMeta(html, "description");
  result.imageUrl =
    getMeta(html, "og:image:secure_url") ||
    getMeta(html, "og:image") ||
    getMeta(html, "twitter:image") ||
    getMeta(html, "twitter:image:src");
  result.siteName = getMeta(html, "og:site_name");

  const priceStr =
    getMeta(html, "product:price:amount") ||
    getMeta(html, "og:price:amount") ||
    getMeta(html, "twitter:data1");
  if (priceStr) {
    const p = parseFloat(priceStr.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (!isNaN(p) && p > 0) result.price = p;
  }
  result.currency =
    getMeta(html, "product:price:currency") ||
    getMeta(html, "og:price:currency");
  return result;
}

// ─── Site-specific extractors ───────────────────────────────────────────────

function extractAmazon(html: string): ProductInfo {
  const result: ProductInfo = {};
  const titleMatch = html.match(
    /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i,
  );
  if (titleMatch) result.title = decodeHtmlEntities(stripHtml(titleMatch[1]));

  const hiRes = html.match(/["']hiRes["']\s*:\s*["']([^"']+)["']/i);
  if (hiRes) result.imageUrl = hiRes[1];
  if (!result.imageUrl) {
    const landing = html.match(
      /id=["']landingImage["'][^>]+(?:data-old-hires|src)=["']([^"']+)["']/i,
    );
    if (landing) result.imageUrl = landing[1];
  }

  const pricePatterns = [
    /"priceAmount"\s*:\s*(\d+(?:\.\d{1,2})?)/i,
    /id=["']priceblock_(?:our|deal)price["'][^>]*>\s*[^\d]*([\d,]+(?:\.\d{1,2})?)/i,
    /class=["']a-price-whole["'][^>]*>([\d,]+)<\/span><span[^>]*class=["']a-price-fraction["'][^>]*>(\d+)/i,
    /class=["']a-offscreen["'][^>]*>\s*[^\d]*([\d,]+(?:\.\d{1,2})?)/i,
  ];
  for (const re of pricePatterns) {
    const m = html.match(re);
    if (m) {
      const whole = m[1].replace(/,/g, "");
      const frac = m[2] ? `.${m[2]}` : "";
      const p = parseFloat(`${whole}${frac}`);
      if (!isNaN(p) && p > 0) {
        result.price = p;
        break;
      }
    }
  }
  return result;
}

function extractEbay(html: string): ProductInfo {
  const result: ProductInfo = {};
  const m = html.match(
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([\d.]+)["']/i,
  );
  if (m) result.price = parseFloat(m[1]);
  const titleMatch = html.match(/<h1[^>]+class=["'][^"']*x-item-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
  if (titleMatch) result.title = decodeHtmlEntities(stripHtml(titleMatch[1]));
  return result;
}

// ─── HTML <title> + image fallbacks ─────────────────────────────────────────

function extractFromTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (m) return decodeHtmlEntities(stripHtml(m[1]));
  return undefined;
}

function extractFallbackImage(html: string, base: URL): string | undefined {
  const link = html.match(
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  );
  if (link) return absUrl(link[1], base);

  // First reasonable <img> in the body
  const img = html.match(
    /<img[^>]+(?:data-src|data-original|src)=["']([^"']+\.(?:jpe?g|png|webp|gif)[^"']*)["']/i,
  );
  if (img) return absUrl(img[1], base);
  return undefined;
}

// ─── Title cleanup ──────────────────────────────────────────────────────────

function cleanTitle(
  title: string,
  siteName: string | undefined,
  hostname: string,
): string {
  let t = title.trim();

  // Strip a trailing " | Site Name" or " - Site Name" using og:site_name
  // and the registrable hostname (e.g. "amazon.com" -> "amazon").
  const candidates = new Set<string>();
  if (siteName) candidates.add(siteName);
  const host = hostname.replace(/^www\./i, "");
  candidates.add(host);
  const baseHost = host.split(".").slice(-2, -1)[0] || host.split(".")[0];
  if (baseHost) candidates.add(baseHost);

  for (const c of candidates) {
    if (!c) continue;
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t
      .replace(new RegExp(`\\s*[-|–—:·»]\\s*${escaped}.*$`, "i"), "")
      .replace(new RegExp(`^${escaped}\\s*[-|–—:·«]\\s*`, "i"), "")
      .trim();
  }

  return t.replace(/\s+/g, " ").trim();
}

function looksLikeJustSiteName(
  title: string,
  siteName: string | undefined,
  hostname: string,
): boolean {
  const t = title.toLowerCase().trim();
  if (!t) return true;
  const host = hostname.replace(/^www\./i, "").toLowerCase();
  const baseHost = host.split(".").slice(-2, -1)[0] || host.split(".")[0];
  if (siteName && t === siteName.toLowerCase()) return true;
  if (t === host || t === baseHost) return true;
  // Common "Welcome to Foo" / "Foo - Online Store" leftovers
  if (siteName && t.startsWith(siteName.toLowerCase()) && t.length < siteName.length + 8) {
    return true;
  }
  return false;
}

// ─── Currency inference ─────────────────────────────────────────────────────

function inferCurrency(html: string): string | undefined {
  if (/₴|UAH/i.test(html)) return "UAH";
  if (/(?:zł|PLN)/i.test(html)) return "PLN";
  if (/€|EUR/.test(html)) return "EUR";
  if (/£|GBP/.test(html)) return "GBP";
  if (/¥|JPY|CNY/.test(html)) return "JPY";
  if (/\$|USD/.test(html)) return "USD";
  return undefined;
}

// ─── Bot-block detection ────────────────────────────────────────────────────

// Sites that aggressively block server-side scrapers. For these we go straight
// to the render-proxy fallback to save a wasted round-trip.
const HARD_BLOCK_HOSTS =
  /(amazon\.|zalando\.|asos\.|nike\.|adidas\.|aliexpress\.|walmart\.|bestbuy\.|target\.|nordstrom\.|farfetch\.|sephora\.|footlocker\.|ssense\.|net-a-porter\.|matchesfashion\.)/i;

function looksBlocked(html: string): boolean {
  if (!html) return true;
  // Very short responses are almost always interstitials/CAPTCHAs.
  if (html.length < 1500) return true;
  const lower = html.slice(0, 4000).toLowerCase();
  return (
    lower.includes("captcha") ||
    lower.includes("are you a human") ||
    lower.includes("robot or human") ||
    lower.includes("press &amp; hold") ||
    lower.includes("press and hold") ||
    lower.includes("access denied") ||
    lower.includes("access to this page has been denied") ||
    lower.includes("enable javascript") ||
    lower.includes("just a moment") || // Cloudflare
    lower.includes("/errors/validatecaptcha") ||
    lower.includes("api-services-support@amazon")
  );
}

function isUseful(info: ProductInfo): boolean {
  // We consider a result useful if we got both a real title AND at least one
  // of: image, price, or non-trivial description.
  if (!info.title || info.title.length < 3) return false;
  return Boolean(
    info.imageUrl || info.price !== undefined || (info.description && info.description.length > 20),
  );
}

// ─── Render-proxy fallback (Jina AI Reader) ─────────────────────────────────
// https://r.jina.ai/<url>  — returns clean rendered content.
//   Default: markdown text  (good for description fallback)
//   With `Accept: application/json` → structured { data: { title, description, content, url, images } }
//   With `X-Return-Format: html` → cleaned HTML (preserves <script type="application/ld+json">)
//
// Free for moderate use without an API key. Set JINA_API_KEY to raise limits.

async function fetchViaJinaJson(
  targetUrl: string,
): Promise<ProductInfo | null> {
  // @ts-ignore - Deno
  const apiKey = Deno.env.get("JINA_API_KEY");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-With-Images-Summary": "true",
    "X-With-Generated-Alt": "true",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`https://r.jina.ai/${targetUrl}`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data ?? json;
    if (!d || typeof d !== "object") return null;

    const result: ProductInfo = {};
    if (typeof d.title === "string" && d.title.trim()) {
      result.title = d.title.trim();
    }
    if (typeof d.description === "string" && d.description.trim()) {
      result.description = d.description.trim();
    } else if (typeof d.content === "string" && d.content.trim()) {
      // Use first meaningful paragraph as description fallback.
      const firstPara = d.content
        .split(/\n+/)
        .map((s: string) => s.trim())
        .find((s: string) => s.length > 40 && !s.startsWith("![") && !s.startsWith("#"));
      if (firstPara) result.description = firstPara;
    }
    // images is an object { "Image 1": "https://...", ... } in Jina JSON mode.
    if (d.images && typeof d.images === "object") {
      const firstImg = Object.values(d.images).find(
        (v) => typeof v === "string" && /^https?:\/\//i.test(v as string),
      );
      if (firstImg) result.imageUrl = firstImg as string;
    }
    return result;
  } catch (e) {
    console.error("Jina JSON fallback failed:", e);
    return null;
  }
}

async function fetchViaJinaHtml(targetUrl: string): Promise<string | null> {
  // @ts-ignore - Deno
  const apiKey = Deno.env.get("JINA_API_KEY");
  const headers: Record<string, string> = {
    "X-Return-Format": "html",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`https://r.jina.ai/${targetUrl}`, { headers });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.error("Jina HTML fallback failed:", e);
    return null;
  }
}

// Microlink (https://microlink.io) — hosted headless-browser metadata API.
//   Default free tier: 50 req/day per IP, no key.  Paid keys raise the limit.
//   Reliably bypasses Akamai/PerimeterX (Zalando, ASOS, Nike, etc.) where
//   direct fetch and Jina both fail. Returns parsed OG/Twitter/JSON-LD as JSON.
async function fetchViaMicrolink(
  targetUrl: string,
): Promise<ProductInfo | null> {
  // @ts-ignore - Deno
  const apiKey = Deno.env.get("MICROLINK_API_KEY");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  // `meta=true` adds the full meta-tag dictionary, which contains
  // `twitter:data1` (price) and `twitter:data2` (color) — Zalando puts its
  // price there per Microlink's own Zalando recipe.
  const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(
    targetUrl,
  )}&meta=true&audio=false&video=false&iframe=false&palette=false`;

  try {
    const res = await fetch(endpoint, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.status !== "success" || !json?.data) return null;

    const d = json.data;
    const result: ProductInfo = {};

    if (typeof d.title === "string" && d.title.trim()) {
      result.title = d.title.trim();
    }
    if (typeof d.description === "string" && d.description.trim()) {
      result.description = d.description.trim();
    }
    if (d.image && typeof d.image === "object") {
      const imgUrl = (d.image as Record<string, unknown>).url;
      if (typeof imgUrl === "string") result.imageUrl = imgUrl;
    } else if (typeof d.image === "string") {
      result.imageUrl = d.image;
    }
    if (typeof d.publisher === "string") {
      result.siteName = d.publisher;
    }

    // Price hidden in twitter meta — Zalando's own pattern, exactly as
    // documented in Microlink's Zalando recipe.
    const meta = (d.meta && typeof d.meta === "object")
      ? (d.meta as Record<string, unknown>)
      : null;
    if (meta) {
      const twData1 = meta["twitter:data1"];
      if (typeof twData1 === "string") {
        const cleaned = twData1.replace(/[^\d.,-]/g, "").replace(",", ".");
        const p = parseFloat(cleaned);
        if (!isNaN(p) && p > 0) result.price = p;
        // Try to read the currency symbol from the same string.
        if (!result.currency) {
          if (/€/.test(twData1)) result.currency = "EUR";
          else if (/£/.test(twData1)) result.currency = "GBP";
          else if (/zł/i.test(twData1)) result.currency = "PLN";
          else if (/₴/.test(twData1)) result.currency = "UAH";
          else if (/\$/.test(twData1)) result.currency = "USD";
        }
      }

      // Standard product:price meta if present.
      if (result.price === undefined) {
        const productPrice = meta["product:price:amount"] ?? meta["og:price:amount"];
        if (typeof productPrice === "string" || typeof productPrice === "number") {
          const p = parseFloat(String(productPrice).replace(/[^\d.,-]/g, "").replace(",", "."));
          if (!isNaN(p) && p > 0) result.price = p;
        }
      }
      if (!result.currency) {
        const cur = meta["product:price:currency"] ?? meta["og:price:currency"];
        if (typeof cur === "string") result.currency = cur.toUpperCase();
      }
    }

    return result;
  } catch (e) {
    console.error("Microlink fallback failed:", e);
    return null;
  }
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

function mergeProductInfo(...sources: ProductInfo[]): ProductInfo {
  const out: ProductInfo = {};
  for (const src of sources) {
    if (!out.title && src.title) out.title = src.title;
    if (!out.description && src.description) out.description = src.description;
    if (!out.imageUrl && src.imageUrl) out.imageUrl = src.imageUrl;
    if (out.price === undefined && src.price !== undefined) out.price = src.price;
    if (!out.currency && src.currency) out.currency = src.currency;
    if (!out.siteName && src.siteName) out.siteName = src.siteName;
  }
  return out;
}

function extractAll(html: string, parsedUrl: URL): ProductInfo {
  const hostname = parsedUrl.hostname;

  const jsonLd = extractProductFromJsonLd(parseJsonLdBlocks(html));
  const microdata = extractMicrodata(html);
  const og = extractOpenGraph(html);

  let siteSpecific: ProductInfo = {};
  if (/amazon\./i.test(hostname)) siteSpecific = extractAmazon(html);
  else if (/ebay\./i.test(hostname)) siteSpecific = extractEbay(html);

  // Priority: JSON-LD > Microdata > Site-specific > OpenGraph
  const merged = mergeProductInfo(jsonLd, microdata, siteSpecific, og);

  // Title fallback from <title>
  if (!merged.title) {
    const t = extractFromTitle(html);
    if (t) merged.title = t;
  }

  // Image fallback
  if (!merged.imageUrl) {
    merged.imageUrl = extractFallbackImage(html, parsedUrl);
  }

  // Make image absolute
  if (merged.imageUrl) {
    merged.imageUrl = absUrl(merged.imageUrl, parsedUrl);
    merged.imageUrl = merged.imageUrl
      ? decodeHtmlEntities(merged.imageUrl)
      : undefined;
  }

  // Decode entities once more for safety
  if (merged.title) merged.title = decodeHtmlEntities(merged.title);
  if (merged.description) {
    merged.description = decodeHtmlEntities(merged.description);
    if (merged.description.length > 500) {
      merged.description = merged.description.slice(0, 497).trim() + "...";
    }
  }

  // Title cleanup
  if (merged.title) {
    merged.title = cleanTitle(merged.title, merged.siteName, hostname);
    if (looksLikeJustSiteName(merged.title, merged.siteName, hostname)) {
      merged.title = undefined;
    }
  }

  // Currency inference if still missing but price exists
  if (!merged.currency) {
    merged.currency = inferCurrency(html);
  }

  return merged;
}

// ─── HTTP handler ───────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isHardBlocked = HARD_BLOCK_HOSTS.test(parsedUrl.hostname);
    let productInfo: ProductInfo = {};
    let usedFallback = false;

    // Step 1 – direct fetch (skip for known-blocked hosts; jump straight to proxy)
    if (!isHardBlocked) {
      const headers: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Ch-Ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        Referer: `${parsedUrl.origin}/`,
      };

      try {
        const response = await fetch(url, { headers, redirect: "follow" });
        if (response.ok) {
          const html = await response.text();
          if (!looksBlocked(html)) {
            productInfo = extractAll(html, parsedUrl);
          }
        }
      } catch (e) {
        console.error("Direct fetch failed:", e);
      }
    }

    // For sites we know Jina struggles with (Akamai/PerimeterX), prefer
    // Microlink first in the fallback chain — it uses a real headless
    // browser with proxy rotation and reliably returns metadata.
    if (!isUseful(productInfo) && isHardBlocked) {
      usedFallback = true;
      const microlink = await fetchViaMicrolink(url);
      if (microlink) {
        productInfo = mergeProductInfo(productInfo, microlink);
      }
    }

    // Step 2 – render-proxy fallback (Jina HTML mode keeps JSON-LD intact)
    if (!isUseful(productInfo)) {
      usedFallback = true;
      const proxiedHtml = await fetchViaJinaHtml(url);
      if (proxiedHtml && !looksBlocked(proxiedHtml)) {
        const proxiedInfo = extractAll(proxiedHtml, parsedUrl);
        productInfo = mergeProductInfo(productInfo, proxiedInfo);
      }
    }

    // Step 3 – Jina JSON mode (works even when HTML mode returns markdown).
    if (!isUseful(productInfo)) {
      usedFallback = true;
      const jinaJson = await fetchViaJinaJson(url);
      if (jinaJson) {
        productInfo = mergeProductInfo(productInfo, jinaJson);
      }
    }

    // Step 4 – last-resort Microlink for non-hard-blocked sites that still
    // produced nothing (e.g. niche shops also using Akamai).
    if (!isUseful(productInfo) && !isHardBlocked) {
      usedFallback = true;
      const microlink = await fetchViaMicrolink(url);
      if (microlink) {
        productInfo = mergeProductInfo(productInfo, microlink);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        url,
        productInfo,
        usedFallback,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error processing URL:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process URL";
    return new Response(
      JSON.stringify({ error: errorMessage, productInfo: {} }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
