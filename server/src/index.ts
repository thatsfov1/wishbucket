import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Impit } from "impit";
import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperImage from "metascraper-image";
import metascraperDescription from "metascraper-description";
import shopping from "./shopping.js";

type ProductInfo = {
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  siteName?: string;
};

const scraper = metascraper([
  shopping(),
  metascraperTitle(),
  metascraperImage(),
  metascraperDescription(),
]);

const MANUAL_HINT =
  "Could not load product details automatically. Please enter the title, price, and image manually.";

function determineProxy(url: URL): string | undefined {
  if (url.protocol === "http:") {
    return process.env.HTTP_PROXY || process.env.http_proxy;
  }
  return process.env.HTTPS_PROXY || process.env.https_proxy;
}

function parseAcceptLanguageHeader(header: string | undefined): string[] {
  if (!header?.trim()) return [];
  return header
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean);
}

function isCaptchaResponse(metadata: { image?: string | null }) {
  return (
    metadata.image &&
    metadata.image.toLowerCase().indexOf("captcha") >= 0
  );
}

function isUseful(info: ProductInfo): boolean {
  if (!info.title || info.title.length < 3) return false;
  return Boolean(
    info.imageUrl ||
      info.price !== undefined ||
      (info.description && info.description.length > 20),
  );
}

function metadataToProductInfo(
  m: Record<string, unknown>,
  fallbackUrl: string,
): ProductInfo {
  const name = typeof m.name === "string" ? m.name.trim() : "";
  const title =
    (name || (typeof m.title === "string" ? m.title.trim() : "")) || undefined;

  let imageUrl = typeof m.image === "string" ? m.image : undefined;
  const description =
    typeof m.description === "string" ? m.description.trim() : undefined;

  let price: number | undefined;
  if (typeof m.price === "number" && !Number.isNaN(m.price)) {
    price = m.price;
  } else if (typeof m.price === "string") {
    const n = parseFloat(m.price.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (!Number.isNaN(n)) price = n;
  }

  const currency =
    typeof m.currency === "string" ? m.currency.toUpperCase() : undefined;
  const siteName =
    typeof m.retailer === "string"
      ? m.retailer
      : typeof m.hostname === "string"
        ? m.hostname
        : undefined;

  let pageUrl = typeof m.url === "string" ? m.url : fallbackUrl;
  if (pageUrl === imageUrl) {
    pageUrl = fallbackUrl;
  }

  return {
    title,
    description: description || undefined,
    imageUrl,
    price,
    currency,
    siteName,
  };
}

async function goShopping(targetUrl: URL, locales: string[]) {
  const impitClient = new Impit({
    browser: "chrome",
    proxyUrl: determineProxy(targetUrl),
    ignoreTlsErrors: process.env.IMPIT_IGNORE_TLS_ERRORS === "true",
  });

  const headers: Record<string, string> = {};
  if (locales.length) {
    headers["Accept-Language"] = locales.join(", ");
  }

  const resp = await impitClient.fetch(targetUrl.toString(), {
    headers,
    redirect: "follow",
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }

  const html = await resp.text();
  const finalUrl = resp.url || targetUrl.toString();
  const metadata = await scraper({ html, url: finalUrl });
  return { metadata, finalUrl };
}

const app = new Hono();

app.use("/*", cors({ origin: "*" }));

app.get("/health", (c) => c.json({ ok: true }));

app.post("/scrape", async (c) => {
  let body: { url?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const rawUrl = body?.url;
  if (!rawUrl || typeof rawUrl !== "string") {
    return c.json({ error: "URL is required" }, 400);
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const acceptLanguage =
    c.req.header("Accept-Language") || undefined;
  const locales = parseAcceptLanguageHeader(acceptLanguage);

  try {
    let { metadata, finalUrl } = await goShopping(targetUrl, locales);
    let m = metadata as Record<string, unknown>;
    let resolvedPageUrl = finalUrl;

    if (isCaptchaResponse(metadata as { image?: string }) && m.url) {
      try {
        const retryUrl = new URL(String(m.url));
        const second = await goShopping(retryUrl, locales);
        metadata = second.metadata;
        resolvedPageUrl = second.finalUrl;
        m = metadata as Record<string, unknown>;
      } catch {
        /* keep first metadata */
      }
    }

    if (isCaptchaResponse(metadata as { image?: string })) {
      return c.json({
        success: false,
        manualEntryRequired: true,
        url: rawUrl,
        productInfo: {},
        error: MANUAL_HINT + " (blocked or captcha page).",
        source: "none",
        cached: false,
      });
    }

    const productInfo = metadataToProductInfo(m, resolvedPageUrl);

    if (!isUseful(productInfo)) {
      return c.json({
        success: false,
        manualEntryRequired: true,
        url: rawUrl,
        productInfo: {},
        error: MANUAL_HINT,
        source: "none",
        cached: false,
      });
    }

    return c.json({
      success: true,
      manualEntryRequired: false,
      url: rawUrl,
      productInfo,
      source: "impit",
      sourcesUsed: ["impit", "metascraper"],
      cached: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    console.error("scrape error:", e);
    return c.json({
      success: false,
      manualEntryRequired: true,
      url: rawUrl,
      productInfo: {},
      error: `${MANUAL_HINT} (${msg})`,
      source: "none",
      cached: false,
    });
  }
});

const port = Number(process.env.PORT) || 8787;
console.log(`wishbucket scrape server (impit) listening on http://127.0.0.1:${port}`);
serve({ fetch: app.fetch, port });
