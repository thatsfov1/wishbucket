// Follow Deno Deploy / Supabase Edge Functions conventions
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

/**
 * Extract Open Graph and meta tags from HTML
 */
function extractMetaTags(html: string): ProductInfo {
  const result: ProductInfo = {};

  // Helper to extract meta content
  const getMeta = (property: string): string | undefined => {
    // Try property attribute
    const propMatch = html.match(
      new RegExp(
        `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
        "i"
      )
    );
    if (propMatch) return propMatch[1];

    // Try name attribute
    const nameMatch = html.match(
      new RegExp(
        `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
        "i"
      )
    );
    if (nameMatch) return nameMatch[1];

    // Try reverse order (content before property/name)
    const reverseMatch = html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
        "i"
      )
    );
    if (reverseMatch) return reverseMatch[1];

    return undefined;
  };

  // Open Graph tags (most reliable for products)
  result.title = getMeta("og:title") || getMeta("twitter:title");
  result.description =
    getMeta("og:description") ||
    getMeta("twitter:description") ||
    getMeta("description");
  result.imageUrl = getMeta("og:image") || getMeta("twitter:image");
  result.siteName = getMeta("og:site_name");

  // Try to get title from <title> tag if not found
  if (!result.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }
  }

  // Try to extract price using various patterns
  const pricePatterns = [
    // JSON-LD structured data
    /"price":\s*"?(\d+(?:[.,]\d{2})?)/,
    /"offers"[^}]*"price":\s*"?(\d+(?:[.,]\d{2})?)/,
    // Common price meta tags
    /property="product:price:amount"[^>]*content="(\d+(?:[.,]\d{2})?)"/i,
    /itemprop="price"[^>]*content="(\d+(?:[.,]\d{2})?)"/i,
    // Price in data attributes
    /data-price="(\d+(?:[.,]\d{2})?)"/i,
    // Common price class patterns
    /class="[^"]*price[^"]*"[^>]*>[\s$€£¥]*(\d+(?:[.,]\d{2})?)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const priceStr = match[1].replace(",", ".");
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        result.price = price;
        break;
      }
    }
  }

  // Try to extract currency
  const currencyPatterns = [
    /"priceCurrency":\s*"([A-Z]{3})"/,
    /property="product:price:currency"[^>]*content="([A-Z]{3})"/i,
    /itemprop="priceCurrency"[^>]*content="([A-Z]{3})"/i,
  ];

  for (const pattern of currencyPatterns) {
    const match = html.match(pattern);
    if (match) {
      result.currency = match[1];
      break;
    }
  }

  // Default currency symbols
  if (!result.currency) {
    if (html.includes("$")) result.currency = "USD";
    else if (html.includes("€")) result.currency = "EUR";
    else if (html.includes("£")) result.currency = "GBP";
    else if (html.includes("₴")) result.currency = "UAH";
  }

  // Clean up title (remove site name suffix)
  if (result.title && result.siteName) {
    result.title = result.title
      .replace(new RegExp(`\\s*[-|–—:]\\s*${result.siteName}\\s*$`, "i"), "")
      .replace(new RegExp(`^${result.siteName}\\s*[-|–—:]\\s*`, "i"), "")
      .trim();
  }

  // Decode HTML entities
  if (result.title) {
    result.title = decodeHtmlEntities(result.title);
  }
  if (result.description) {
    result.description = decodeHtmlEntities(result.description);
  }

  return result;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

serve(async (req: Request) => {
  // Handle CORS preflight
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

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the page with a browser-like user agent
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Failed to fetch URL: ${response.status}`,
          productInfo: { title: parsedUrl.hostname },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const html = await response.text();
    const productInfo = extractMetaTags(html);

    // If no title found, use domain name
    if (!productInfo.title) {
      productInfo.title = parsedUrl.hostname.replace("www.", "");
    }

    // Make image URL absolute if relative
    if (productInfo.imageUrl && !productInfo.imageUrl.startsWith("http")) {
      if (productInfo.imageUrl.startsWith("//")) {
        productInfo.imageUrl = `https:${productInfo.imageUrl}`;
      } else if (productInfo.imageUrl.startsWith("/")) {
        productInfo.imageUrl = `${parsedUrl.origin}${productInfo.imageUrl}`;
      } else {
        productInfo.imageUrl = `${parsedUrl.origin}/${productInfo.imageUrl}`;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: url,
        productInfo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing URL:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process URL";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        productInfo: {},
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
