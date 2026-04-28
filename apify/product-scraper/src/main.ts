import { Actor, log } from "apify";
import { PlaywrightCrawler } from "crawlee";
import { Impit } from "impit";
import metascraper from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import shopping from "./shopping.js";

type ActorInput = {
  url?: string;
  urls?: string[];
  canonicalUrl?: string;
  acceptLanguage?: string;
  proxyConfiguration?: Record<string, unknown>;
};

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

function parseUrls(input: ActorInput): string[] {
  const urls = [
    ...(typeof input.url === "string" ? [input.url] : []),
    ...(Array.isArray(input.urls) ? input.urls : []),
  ];

  return [...new Set(urls)]
    .map((url) => sanitizeSubmittedUrl(url))
    .filter(Boolean)
    .filter((url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    });
}

function parseAcceptLanguageHeader(header: string | undefined): string[] {
  if (!header?.trim()) return [];
  return header
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean);
}

function isBlockedHtml(html: string): boolean {
  if (!html || html.length < 500) return true;
  const lower = html.slice(0, 6000).toLowerCase();
  return (
    lower.includes("captcha") ||
    lower.includes("are you a human") ||
    lower.includes("robot or human") ||
    lower.includes("access denied") ||
    lower.includes("access to this page has been denied") ||
    lower.includes("enable javascript") ||
    lower.includes("just a moment") ||
    lower.includes("/errors/validatecaptcha")
  );
}

function isUseful(info: ProductInfo): boolean {
  if (!info.title || info.title.trim().length < 3) return false;
  return Boolean(
    info.imageUrl ||
    info.price !== undefined ||
    (info.description && info.description.trim().length > 20),
  );
}

function metadataToProductInfo(metadata: Record<string, unknown>): ProductInfo {
  const name = typeof metadata.name === "string" ? metadata.name.trim() : "";
  const title =
    name ||
    (typeof metadata.title === "string" ? metadata.title.trim() : "") ||
    undefined;

  let price: number | undefined;
  if (typeof metadata.price === "number" && Number.isFinite(metadata.price)) {
    price = metadata.price;
  } else if (typeof metadata.price === "string") {
    const parsed = Number(
      metadata.price.replace(/[^\d.,-]/g, "").replace(",", "."),
    );
    if (Number.isFinite(parsed)) price = parsed;
  }

  const description =
    typeof metadata.description === "string"
      ? metadata.description.trim().slice(0, 500)
      : undefined;

  return {
    title,
    description,
    imageUrl:
      typeof metadata.image === "string" ? metadata.image.trim() : undefined,
    price,
    currency:
      typeof metadata.currency === "string"
        ? metadata.currency.toUpperCase()
        : undefined,
    siteName:
      typeof metadata.retailer === "string"
        ? metadata.retailer
        : typeof metadata.hostname === "string"
          ? metadata.hostname
          : undefined,
  };
}

async function extractFromHtml(
  html: string,
  url: string,
): Promise<ProductInfo> {
  const metadata = (await scraper({ html, url })) as Record<string, unknown>;
  return metadataToProductInfo(metadata);
}

async function scrapeFast(
  url: string,
  acceptLanguage: string | undefined,
  proxyUrl: string | undefined,
): Promise<{ productInfo: ProductInfo; finalUrl: string; blocked: boolean }> {
  const locales = parseAcceptLanguageHeader(acceptLanguage);
  const headers: Record<string, string> = {};
  if (locales.length) headers["Accept-Language"] = locales.join(", ");

  const impit = new Impit({
    browser: "chrome",
    proxyUrl,
    ignoreTlsErrors: process.env.IMPIT_IGNORE_TLS_ERRORS === "true",
  });

  const response = await impit.fetch(url, {
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const finalUrl = response.url || url;
  const blocked = isBlockedHtml(html);

  if (blocked) {
    return { productInfo: {}, finalUrl, blocked };
  }

  const productInfo = await extractFromHtml(html, finalUrl);
  return { productInfo, finalUrl, blocked: false };
}

async function scrapeWithPlaywright(
  url: string,
  acceptLanguage: string | undefined,
  proxyConfiguration: Awaited<
    ReturnType<typeof Actor.createProxyConfiguration>
  >,
): Promise<{ productInfo: ProductInfo; finalUrl: string }> {
  let html = "";
  let finalUrl = url;

  const crawler = new PlaywrightCrawler({
    maxRequestRetries: 1,
    proxyConfiguration,
    launchContext: {
      launchOptions: {
        headless: true,
      },
    },
    preNavigationHooks: [
      async ({ page }) => {
        if (acceptLanguage) {
          await page.setExtraHTTPHeaders({ "Accept-Language": acceptLanguage });
        }
      },
    ],
    requestHandler: async ({ page }) => {
      await page.waitForLoadState("domcontentloaded", { timeout: 20000 });
      await page.waitForTimeout(1500);
      html = await page.content();
      finalUrl = page.url();
    },
  });

  await crawler.run([url]);

  if (!html || isBlockedHtml(html)) {
    return { productInfo: {}, finalUrl };
  }

  const productInfo = await extractFromHtml(html, finalUrl);
  return { productInfo, finalUrl };
}

await Actor.init();

try {
  const input = ((await Actor.getInput()) ?? {}) as ActorInput;
  const urls = parseUrls(input);

  if (!urls.length) {
    throw new Error("No valid URL was provided.");
  }

  const proxyConfiguration = input.proxyConfiguration
    ? await Actor.createProxyConfiguration(input.proxyConfiguration)
    : undefined;

  const results = [];

  for (const url of urls) {
    const proxyUrl = proxyConfiguration
      ? await proxyConfiguration.newUrl()
      : undefined;

    let source = "impit";
    let finalUrl = url;
    let productInfo: ProductInfo = {};
    let error: string | undefined;

    try {
      const fast = await scrapeFast(url, input.acceptLanguage, proxyUrl);
      productInfo = fast.productInfo;
      finalUrl = fast.finalUrl;
      log.info(`Fast scrape finished for ${url}`, {
        useful: isUseful(productInfo),
        blocked: fast.blocked,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : "Fast scrape failed";
      log.warning(`Fast scrape failed for ${url}: ${error}`);
    }

    if (!isUseful(productInfo)) {
      source = "playwright";
      try {
        const rendered = await scrapeWithPlaywright(
          url,
          input.acceptLanguage,
          proxyConfiguration,
        );
        productInfo = rendered.productInfo;
        finalUrl = rendered.finalUrl;
      } catch (err) {
        error = err instanceof Error ? err.message : "Playwright scrape failed";
        log.warning(`Playwright scrape failed for ${url}: ${error}`);
      }
    }

    const result = {
      url,
      canonicalUrl: input.canonicalUrl,
      finalUrl,
      success: isUseful(productInfo),
      source,
      productInfo,
      error: isUseful(productInfo) ? undefined : error,
    };

    results.push(result);
    await Actor.pushData(result);
  }

  const output = results[0] ?? null;
  await Actor.setValue("OUTPUT", output);
} finally {
  await Actor.exit();
}
