/* eslint @typescript-eslint/ban-ts-comment: 0 */
// @ts-nocheck - metascraper rule typings are intentionally loose.
import type { Check, CheckOptions, RuleSet } from "metascraper";
import pkg from "@metascraper/helpers";
import { getHostname, toPriceFormat } from "./helpers.js";

const { memoizeOne, $jsonld, toRule, title, $filter } = pkg;

interface ShoppingMetadata {
  brand: string;
  name: string;
  currency: string;
  sku: string;
  price: string;
  condition: string;
  mpn: string;
  availability: string;
  asin: string;
  hostname: string;
  retailer: string;
}

type ShoppingRuleSet = {
  [C in keyof ShoppingMetadata]?: Array<Check>;
} & RuleSet;

const parseJsonLd = (raw?: string | null) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const jsonLd = memoizeOne(($: CheckOptions["htmlDom"]) => {
  return parseJsonLd($('script[type="application/ld+json"]').first().html());
});

const jsonLdGraph = memoizeOne(($: CheckOptions["htmlDom"]) => {
  const data = jsonLd($);
  return data && Array.isArray(data["@graph"]) ? data["@graph"] : null;
});

const jsonLdGraphProduct = memoizeOne(($: CheckOptions["htmlDom"]) => {
  const graph = jsonLdGraph($);
  if (!graph) return null;
  return graph.find((item) => item?.["@type"] === "Product") ?? null;
});

const jsonLdLastBreadcrumb = memoizeOne(($: CheckOptions["htmlDom"]) => {
  const graph = jsonLdGraph($);
  if (!graph) return null;

  const breadcrumb = graph.find((item) => item?.["@type"] === "BreadcrumbList");
  const items = breadcrumb?.itemListElement;
  return Array.isArray(items) && items.length ? items[items.length - 1] : null;
});

const toTitle = toRule(title, { removeSeparator: false });

export default () => {
  const rules: ShoppingRuleSet = {
    brand: [
      ({ htmlDom: $ }) => {
        const data = jsonLd($);
        const brand = data?.brand;
        return typeof brand === "object" ? brand.name : brand;
      },
    ],
    name: [
      ({ htmlDom: $ }) => jsonLd($)?.name,
      ({ htmlDom: $ }) => jsonLdLastBreadcrumb($)?.name,
      ({ htmlDom: $ }) => jsonLdGraphProduct($)?.name,
      ({ htmlDom: $ }) => $('[property="og:title"]').attr("content"),
    ],
    title: [
      toTitle(($) => $filter($, $("#productTitle"))),
      toTitle(($) => $filter($, $("#btAsinTitle"))),
      toTitle(($) => $filter($, $("h1.a-size-large"))),
      toTitle(($) => $filter($, $("#item_name"))),
    ],
    url: [({ url }) => url],
    image: [
      ({ htmlDom: $ }) => $("div#imgTagWrapperId img").attr("src"),
      ({ htmlDom: $ }) => $('[property="og:image:secure_url"]').attr("content"),
      ({ htmlDom: $, url }) => {
        let content = $('[property="og:image"]').attr("content");
        if (content && url.includes("rh.com")) {
          content = content.replace("$GAL4$", "$np-fullwidth-lg$");
        }
        return content;
      },
      ({ htmlDom: $ }) => {
        let image = jsonLd($)?.image;
        if (image?.["@type"] === "ImageObject") image = image.image;
        if (Array.isArray(image)) image = image[0];
        return image;
      },
      ({ htmlDom: $ }) => $('meta.swiftype[name="image"]').attr("content"),
      ({ htmlDom: $, url }) => {
        const image = $('[property="og:image"]').attr("content");
        const protocol = new URL(url).protocol;
        if (!image) return undefined;

        try {
          new URL(image);
          return image;
        } catch {
          return `${protocol}${image}`;
        }
      },
    ],
    currency: [
      ({ htmlDom: $ }) => jsonLdGraphProduct($)?.offers?.priceCurrency,
      ({ htmlDom: $ }) => $('[property="og:price:currency"]').attr("content"),
      ({ htmlDom: $, url }) => $jsonld("offers.0.priceCurrency")($, url),
      ({ htmlDom: $, url }) => $jsonld("offers.priceCurrency")($, url),
      ({ htmlDom: $ }) => $("[data-asin-currency-code]").attr("data-asin-currency-code"),
      ({ htmlDom: $ }) => $('[property="product:price:currency"]').attr("content"),
      ({ htmlDom: $ }) => $("[itemprop=priceCurrency]").attr("content"),
    ],
    condition: [
      ({ htmlDom: $, url }) => $jsonld("itemCondition")($, url),
      ({ htmlDom: $, url }) => $jsonld("offers.itemCondition")($, url),
      ({ htmlDom: $, url }) => $jsonld("offers.0.itemCondition")($, url),
    ],
    sku: [
      ({ htmlDom: $ }) => jsonLdGraphProduct($)?.sku,
      ({ htmlDom: $, url }) => $jsonld("sku")($, url),
      ({ htmlDom: $, url }) => $jsonld("offers.sku")($, url),
      ({ htmlDom: $, url }) => $jsonld("offers.0.sku")($, url),
      ({ htmlDom: $ }) => $("[itemprop=sku]").html(),
    ],
    mpn: [
      ({ htmlDom: $, url }) => $jsonld("mpn")($, url),
      ({ htmlDom: $, url }) => $jsonld("offers.mpn")($, url),
      ({ htmlDom: $, url }) => $jsonld("offers.0.mpn")($, url),
    ],
    availability: [
      ({ htmlDom: $ }) => jsonLdGraphProduct($)?.offers?.availability,
      ({ htmlDom: $ }) => $('[property="og:availability"]').attr("content"),
      ({ htmlDom: $, url }) => $jsonld("offers.availability")($, url),
      ({ htmlDom: $, url }) => $jsonld("offers.0.availability")($, url),
      ({ htmlDom: $ }) => $("[itemprop=availability]").attr("href"),
    ],
    price: [
      ({ htmlDom: $ }) => toPriceFormat(jsonLdGraphProduct($)?.offers?.price),
      ({ htmlDom: $ }) => toPriceFormat($('[property="og:price:amount"]').attr("content")),
      ({ htmlDom: $ }) => toPriceFormat($("[itemprop=price]").attr("content")),
      ({ htmlDom: $ }) => toPriceFormat($('[property="product:price:amount"]').attr("content")),
      ({ htmlDom: $, url }) => toPriceFormat($jsonld("price")($, url)),
      ({ htmlDom: $, url }) => toPriceFormat($jsonld("offers.price")($, url)),
      ({ htmlDom: $, url }) => toPriceFormat($jsonld("offers.0.price")($, url)),
      ({ htmlDom: $, url }) => toPriceFormat($jsonld("0.offers.price")($, url)),
      ({ htmlDom: $, url }) => toPriceFormat($jsonld("offers.lowPrice")($, url)),
      ({ htmlDom: $, url }) => toPriceFormat($jsonld("offers.0.lowPrice")($, url)),
      ({ htmlDom: $, url }) => toPriceFormat($jsonld("offers.highPrice")($, url)),
      ({ htmlDom: $, url }) => toPriceFormat($jsonld("offers.0.highPrice")($, url)),
      ({ htmlDom: $ }) => toPriceFormat($("[data-asin-price]").attr("data-asin-price")),
      ({ htmlDom: $ }) => toPriceFormat($("[itemprop=price]").html()),
      ({ htmlDom: $ }) => toPriceFormat($("#attach-base-product-price").attr("value")),
      ({ htmlDom: $ }) => toPriceFormat($("span.a-offscreen", "span.a-price").html()),
      ({ htmlDom: $ }) => toPriceFormat($("span.price-amount").html()),
    ],
    asin: [({ htmlDom: $ }) => $("[data-asin]").attr("data-asin")],
    hostname: [({ url }) => getHostname(url)],
    retailer: [({ htmlDom: $ }) => $('[property="og:site_name"]').attr("content")],
  };

  rules.pkgName = "metascraper-shopping";
  return rules;
};
