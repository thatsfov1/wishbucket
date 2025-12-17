import { AffiliateProgram } from "../types";

// Known affiliate programs with their referral parameters
const AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  {
    domain: "amazon.com",
    programName: "Amazon Associates",
    referralParam: "tag",
    referralId: "YOUR_AMAZON_TAG",
    isActive: true,
  },
  {
    domain: "amazon.co.uk",
    programName: "Amazon Associates UK",
    referralParam: "tag",
    referralId: "YOUR_AMAZON_TAG",
    isActive: true,
  },
  {
    domain: "ebay.com",
    programName: "eBay Partner Network",
    referralParam: "mkevt",
    referralId: "YOUR_EBAY_ID",
    isActive: true,
  },
  {
    domain: "etsy.com",
    programName: "Etsy Affiliate",
    referralParam: "ref",
    referralId: "YOUR_ETSY_ID",
    isActive: true,
  },
  {
    domain: "shopify.com",
    programName: "Shopify Affiliate",
    referralParam: "ref",
    referralId: "YOUR_SHOPIFY_ID",
    isActive: true,
  },
  {
    domain: "aliexpress.com",
    programName: "AliExpress Affiliate",
    referralParam: "aff_platform",
    referralId: "YOUR_ALIEXPRESS_ID",
    isActive: true,
  },
  {
    domain: "asos.com",
    programName: "ASOS Affiliate",
    referralParam: "ref",
    referralId: "YOUR_ASOS_ID",
    isActive: true,
  },
  {
    domain: "zara.com",
    programName: "Zara Affiliate",
    referralParam: "ref",
    referralId: "YOUR_ZARA_ID",
    isActive: true,
  },
];

// Extract domain from URL
export const extractDomain = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return null;
  }
};

// Find affiliate program for a domain
export const findAffiliateProgram = (
  domain: string
): AffiliateProgram | null => {
  return (
    AFFILIATE_PROGRAMS.find(
      (program) => domain.includes(program.domain) && program.isActive
    ) || null
  );
};

// Add affiliate parameters to URL
export const addAffiliateLink = (
  url: string,
  affiliateProgram: AffiliateProgram
): string => {
  try {
    const urlObj = new URL(url);
    const param = affiliateProgram.referralParam;
    const id = affiliateProgram.referralId;

    // Check if parameter already exists
    if (urlObj.searchParams.has(param)) {
      return url; // Already has affiliate link
    }

    urlObj.searchParams.set(param, id);
    return urlObj.toString();
  } catch {
    return url;
  }
};

// Process URL and add affiliate link if applicable
export const processAffiliateLink = (
  url: string
): { url: string; hasAffiliate: boolean; programName?: string } => {
  const domain = extractDomain(url);
  if (!domain) {
    return { url, hasAffiliate: false };
  }

  const program = findAffiliateProgram(domain);
  if (!program) {
    return { url, hasAffiliate: false };
  }

  const affiliateUrl = addAffiliateLink(url, program);
  return {
    url: affiliateUrl,
    hasAffiliate: true,
    programName: program.programName,
  };
};

// Parse product information from URL (basic implementation)
export const parseProductInfo = async (
  url: string
): Promise<{
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
}> => {
  // This would typically call a backend service to scrape the page
  // For now, return empty object - backend should handle this
  return {};
};
