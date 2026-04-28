// Supabase Edge Function: scrape-url
//
// This function is intentionally only an orchestrator. It keeps Apify secrets
// off the client, caches repeated product URLs in Postgres, and delegates the
// actual browser/scraping work to an Apify Actor.

// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore - Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ProductInfo = {
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  description?: string;
  siteName?: string;
};

type ScrapeResponse = {
  success: boolean;
  manualEntryRequired: boolean;
  url: string;
  productInfo: ProductInfo;
  error?: string;
  source: string;
  cached: boolean;
  runId?: string;
};

type CacheRow = {
  product_info: ProductInfo;
  has_useful_data: boolean;
  source: string;
  expires_at: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MANUAL_HINT =
  "Could not load product details automatically. Please enter the title, price, and image manually.";

const SUCCESS_TTL_MS = 12 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 60 * 1000;

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "ref",
  "ref_",
  "spm",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const env = (name: string) => {
  // @ts-ignore - Deno global
  const value = Deno.env.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

function getSupabaseClient() {
  const supabaseUrl = env("SUPABASE_URL") ?? env("PROJECT_URL");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY") ?? env("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function isUseful(info: ProductInfo): boolean {
  if (!info.title || info.title.trim().length < 3) return false;
  return Boolean(
    info.imageUrl ||
      info.price !== undefined ||
      (info.description && info.description.trim().length > 20),
  );
}

function sanitizeSubmittedUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const firstHttp = trimmed.search(/https?:\/\//i);
  if (firstHttp < 0) return trimmed;

  let candidate = trimmed.slice(firstHttp).trim();

  const encodedIndex = candidate.search(/https?%3A%2F%2F/i);
  if (encodedIndex > 0) {
    candidate = candidate.slice(0, encodedIndex).trim();
  }

  const secondHttp = candidate.slice(8).search(/https?:\/\//i);
  if (secondHttp >= 0) {
    candidate = candidate.slice(0, secondHttp + 8).trim();
  }

  return candidate;
}

function canonicalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";

  for (const key of [...url.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (lower.startsWith("utm_") || TRACKING_PARAMS.has(lower)) {
      url.searchParams.delete(key);
    }
  }

  const amazonAsin =
    url.hostname.includes("amazon.") &&
    url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1];

  if (amazonAsin) {
    url.pathname = `/dp/${amazonAsin.toUpperCase()}`;
    url.search = "";
  } else {
    const sortedParams = [...url.searchParams.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    url.search = "";
    for (const [key, value] of sortedParams) {
      url.searchParams.append(key, value);
    }
  }

  return url.toString();
}

async function readCache(
  supabase: ReturnType<typeof createClient>,
  canonicalUrl: string,
): Promise<CacheRow | null> {
  const { data, error } = await supabase
    .from("scrape_cache")
    .select("product_info, has_useful_data, source, expires_at")
    .eq("canonical_url", canonicalUrl)
    .maybeSingle();

  if (error) {
    console.error("scrape cache read failed:", error);
    return null;
  }

  if (!data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) return null;

  return data as CacheRow;
}

async function writeCache(
  supabase: ReturnType<typeof createClient>,
  canonicalUrl: string,
  productInfo: ProductInfo,
  source: string,
) {
  const useful = isUseful(productInfo);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (useful ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
  );

  const { error } = await supabase.from("scrape_cache").upsert({
    canonical_url: canonicalUrl,
    product_info: productInfo,
    has_useful_data: useful,
    source,
    fetched_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("scrape cache write failed:", error);
  }
}

function normalizeActorId(actorId: string): string {
  return actorId.replace("/", "~");
}

function apifyProxyConfiguration() {
  if (env("APIFY_PROXY_ENABLED") !== "true") return undefined;

  const groups = (env("APIFY_PROXY_GROUPS") ?? "")
    .split(",")
    .map((group) => group.trim())
    .filter(Boolean);

  return {
    useApifyProxy: true,
    ...(groups.length ? { apifyProxyGroups: groups } : {}),
  };
}

function normalizeProductInfo(value: unknown): ProductInfo {
  const data =
    value && typeof value === "object" && "productInfo" in value
      ? (value as { productInfo?: unknown }).productInfo
      : value;

  if (!data || typeof data !== "object") return {};

  const record = data as Record<string, unknown>;
  const title =
    typeof record.title === "string"
      ? record.title
      : typeof record.name === "string"
        ? record.name
        : undefined;

  const imageUrl =
    typeof record.imageUrl === "string"
      ? record.imageUrl
      : typeof record.image === "string"
        ? record.image
        : undefined;

  let price: number | undefined;
  if (typeof record.price === "number" && Number.isFinite(record.price)) {
    price = record.price;
  } else if (typeof record.price === "string") {
    const parsed = Number(record.price.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (Number.isFinite(parsed)) price = parsed;
  }

  const currency =
    typeof record.currency === "string" ? record.currency.toUpperCase() : undefined;
  const description =
    typeof record.description === "string" ? record.description : undefined;
  const siteName =
    typeof record.siteName === "string"
      ? record.siteName
      : typeof record.retailer === "string"
        ? record.retailer
        : undefined;

  return { title, imageUrl, price, currency, description, siteName };
}

async function getActorOutput(
  apiBaseUrl: string,
  token: string,
  defaultKeyValueStoreId?: string,
): Promise<unknown | null> {
  if (!defaultKeyValueStoreId) return null;

  const outputRes = await fetch(
    `${apiBaseUrl}/key-value-stores/${defaultKeyValueStoreId}/records/OUTPUT`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!outputRes.ok) return null;
  return await outputRes.json();
}

async function getFirstDatasetItem(
  apiBaseUrl: string,
  token: string,
  defaultDatasetId?: string,
): Promise<unknown | null> {
  if (!defaultDatasetId) return null;

  const itemRes = await fetch(
    `${apiBaseUrl}/datasets/${defaultDatasetId}/items?clean=true&format=json&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!itemRes.ok) return null;
  const items = await itemRes.json();
  return Array.isArray(items) ? items[0] ?? null : null;
}

async function scrapeWithApify(
  targetUrl: string,
  canonicalUrl: string,
  acceptLanguage?: string,
): Promise<{ productInfo: ProductInfo; runId?: string; source: string; error?: string }> {
  const token = env("APIFY_TOKEN");
  const actorId = env("APIFY_ACTOR_ID");

  if (!token || !actorId) {
    return {
      productInfo: {},
      source: "none",
      error:
        "Apify is not configured. Set APIFY_TOKEN and APIFY_ACTOR_ID on the scrape-url Edge Function.",
    };
  }

  const apiBaseUrl = env("APIFY_API_BASE_URL") ?? "https://api.apify.com/v2";
  const waitSecs = Math.min(Number(env("APIFY_WAIT_SECS") ?? 75), 120);
  const normalizedActorId = encodeURIComponent(normalizeActorId(actorId));
  const runUrl =
    `${apiBaseUrl}/acts/${normalizedActorId}/runs` +
    `?waitForFinish=${waitSecs}`;

  const runRes = await fetch(runUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: targetUrl,
      urls: [targetUrl],
      canonicalUrl,
      acceptLanguage,
      proxyConfiguration: apifyProxyConfiguration(),
    }),
  });

  if (!runRes.ok) {
    const detail = await runRes.text();
    return {
      productInfo: {},
      source: "apify",
      error: `Apify returned HTTP ${runRes.status}: ${detail.slice(0, 180)}`,
    };
  }

  const runJson = await runRes.json();
  const run = (runJson?.data ?? runJson) as Record<string, unknown>;
  const status = typeof run.status === "string" ? run.status : "UNKNOWN";
  const runId = typeof run.id === "string" ? run.id : undefined;

  if (status !== "SUCCEEDED") {
    return {
      productInfo: {},
      runId,
      source: "apify",
      error: `Apify run did not finish successfully (${status}).`,
    };
  }

  const output = await getActorOutput(
    apiBaseUrl,
    token,
    typeof run.defaultKeyValueStoreId === "string"
      ? run.defaultKeyValueStoreId
      : undefined,
  );
  const datasetItem = await getFirstDatasetItem(
    apiBaseUrl,
    token,
    typeof run.defaultDatasetId === "string" ? run.defaultDatasetId : undefined,
  );

  const productInfo = normalizeProductInfo(output ?? datasetItem);
  return { productInfo, runId, source: "apify" };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body.url !== "string" || !body.url.trim()) {
    return json({ error: "URL is required" }, 400);
  }

  const submittedUrl = sanitizeSubmittedUrl(body.url);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(submittedUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Unsupported protocol");
    }
  } catch {
    return json({ error: "Invalid URL" }, 400);
  }

  const rawUrl = parsedUrl.toString();
  const canonicalUrl = canonicalizeUrl(rawUrl);
  const acceptLanguage = req.headers.get("Accept-Language") ?? undefined;

  try {
    const supabase = getSupabaseClient();
    const cached = await readCache(supabase, canonicalUrl);

    if (cached) {
      const useful = cached.has_useful_data && isUseful(cached.product_info);
      return json({
        success: useful,
        manualEntryRequired: !useful,
        url: rawUrl,
        productInfo: useful ? cached.product_info : {},
        error: useful ? undefined : MANUAL_HINT,
        source: cached.source,
        cached: true,
      } satisfies ScrapeResponse);
    }

    const scraped = await scrapeWithApify(rawUrl, canonicalUrl, acceptLanguage);
    const useful = isUseful(scraped.productInfo);
    await writeCache(supabase, canonicalUrl, scraped.productInfo, scraped.source);

    return json({
      success: useful,
      manualEntryRequired: !useful,
      url: rawUrl,
      productInfo: useful ? scraped.productInfo : {},
      error: useful ? undefined : scraped.error ?? MANUAL_HINT,
      source: scraped.source,
      cached: false,
      runId: scraped.runId,
    } satisfies ScrapeResponse);
  } catch (error) {
    console.error("scrape-url failed:", error);
    const message = error instanceof Error ? error.message : MANUAL_HINT;

    return json({
      success: false,
      manualEntryRequired: true,
      url: rawUrl,
      productInfo: {},
      error: `${MANUAL_HINT} (${message})`,
      source: "none",
      cached: false,
    } satisfies ScrapeResponse);
  }
});
