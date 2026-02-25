import { AffiliateProgram } from "../types";

// ============================================
// AFFILIATE PROGRAMS CONFIGURATION
// ============================================
//
// To earn commissions:
// 1. Sign up for each affiliate program
// 2. Replace "YOUR_XXX_ID" with your actual affiliate ID
// 3. Set isActive: true for programs you've joined
//
// TODO: Implement creator notification system
// - When a user adds a link from a domain NOT in this list
// - Check if that domain has an affiliate program (via API or manual list)
// - Send notification to app creator: "New domain detected: {domain} - check for affiliate program"
// - This helps discover new monetization opportunities
// ============================================

// Known affiliate programs with their referral parameters
// Focused on: Worldwide platforms + Telegram-popular regions (Ukraine, India, Russia, CIS, Middle East)
const AFFILIATE_PROGRAMS: AffiliateProgram[] = [

  {
    domain: "amazon.com",
    programName: "Amazon Associates",
    referralParam: "tag",
    referralId: "kulikovskyi-20",
    isActive: true,
  },
  {
    domain: "amazon.co.uk",
    programName: "Amazon Associates UK",
    referralParam: "tag",
    referralId: "YOUR_AMAZON_UK_TAG",
    isActive: true,
  },
  {
    domain: "amazon.de",
    programName: "Amazon Associates DE",
    referralParam: "tag",
    referralId: "YOUR_AMAZON_DE_TAG",
    isActive: true,
  },
  {
    domain: "amazon.in",
    programName: "Amazon Associates India",
    referralParam: "tag",
    referralId: "YOUR_AMAZON_IN_TAG",
    isActive: true,
  },
  {
    domain: "aliexpress.com",
    programName: "AliExpress Portals",
    referralParam: "aff_id",
    referralId: "YOUR_ALIEXPRESS_ID",
    isActive: true,
  },
  {
    domain: "ebay.com",
    programName: "eBay Partner Network",
    referralParam: "campid",
    referralId: "YOUR_EBAY_ID",
    isActive: true,
  },
  {
    domain: "etsy.com",
    programName: "Etsy Affiliate (Awin)",
    referralParam: "ref",
    referralId: "YOUR_ETSY_ID",
    isActive: true,
  },

  // ============================================
  // CHINA / ASIA MARKETPLACES
  // ============================================
  {
    domain: "banggood.com",
    programName: "Banggood Affiliate",
    referralParam: "p",
    referralId: "YOUR_BANGGOOD_ID",
    isActive: true,
  },
  {
    domain: "gearbest.com",
    programName: "GearBest Affiliate",
    referralParam: "ref",
    referralId: "YOUR_GEARBEST_ID",
    isActive: true,
  },
  {
    domain: "dhgate.com",
    programName: "DHgate Affiliate",
    referralParam: "f",
    referralId: "YOUR_DHGATE_ID",
    isActive: true,
  },
  {
    domain: "lightinthebox.com",
    programName: "LightInTheBox Affiliate",
    referralParam: "litb_from",
    referralId: "YOUR_LITB_ID",
    isActive: true,
  },
  {
    domain: "shein.com",
    programName: "SHEIN Affiliate",
    referralParam: "ref",
    referralId: "YOUR_SHEIN_ID",
    isActive: true,
  },
  {
    domain: "temu.com",
    programName: "Temu Affiliate",
    referralParam: "refer_code",
    referralId: "YOUR_TEMU_ID",
    isActive: true,
  },

  // ============================================
  // INDIA POPULAR
  // ============================================
  {
    domain: "flipkart.com",
    programName: "Flipkart Affiliate",
    referralParam: "affid",
    referralId: "YOUR_FLIPKART_ID",
    isActive: true,
  },
  {
    domain: "myntra.com",
    programName: "Myntra Affiliate",
    referralParam: "ref",
    referralId: "YOUR_MYNTRA_ID",
    isActive: true,
  },
  {
    domain: "ajio.com",
    programName: "AJIO Affiliate",
    referralParam: "ref",
    referralId: "YOUR_AJIO_ID",
    isActive: true,
  },

  // ============================================
  // UKRAINE / CIS POPULAR
  // ============================================
  {
    domain: "rozetka.com.ua",
    programName: "Rozetka Affiliate",
    referralParam: "ref",
    referralId: "YOUR_ROZETKA_ID",
    isActive: true,
  },
  {
    domain: "prom.ua",
    programName: "Prom.ua Affiliate",
    referralParam: "ref",
    referralId: "YOUR_PROM_ID",
    isActive: true,
  },
  {
    domain: "wildberries.ru",
    programName: "Wildberries Affiliate",
    referralParam: "ref",
    referralId: "YOUR_WILDBERRIES_ID",
    isActive: true,
  },
  {
    domain: "ozon.ru",
    programName: "Ozon Affiliate",
    referralParam: "partner",
    referralId: "YOUR_OZON_ID",
    isActive: true,
  },
  {
    domain: "lamoda.ru",
    programName: "Lamoda Affiliate",
    referralParam: "ref",
    referralId: "YOUR_LAMODA_ID",
    isActive: true,
  },

  // ============================================
  // FASHION / LIFESTYLE (WORLDWIDE)
  // ============================================
  {
    domain: "asos.com",
    programName: "ASOS Affiliate",
    referralParam: "affid",
    referralId: "YOUR_ASOS_ID",
    isActive: true,
  },
  {
    domain: "zara.com",
    programName: "Zara Affiliate (Awin)",
    referralParam: "ref",
    referralId: "YOUR_ZARA_ID",
    isActive: true,
  },
  {
    domain: "hm.com",
    programName: "H&M Affiliate",
    referralParam: "ref",
    referralId: "YOUR_HM_ID",
    isActive: true,
  },
  {
    domain: "nike.com",
    programName: "Nike Affiliate",
    referralParam: "ref",
    referralId: "YOUR_NIKE_ID",
    isActive: true,
  },
  {
    domain: "adidas.com",
    programName: "Adidas Affiliate",
    referralParam: "ref",
    referralId: "YOUR_ADIDAS_ID",
    isActive: true,
  },

  // ============================================
  // ELECTRONICS / TECH
  // ============================================
  {
    domain: "geekbuying.com",
    programName: "GeekBuying Affiliate",
    referralParam: "ref",
    referralId: "YOUR_GEEKBUYING_ID",
    isActive: true,
  },
  {
    domain: "tomtop.com",
    programName: "TomTop Affiliate",
    referralParam: "aid",
    referralId: "YOUR_TOMTOP_ID",
    isActive: true,
  },

  // ============================================
  // BEAUTY / COSMETICS
  // ============================================
  {
    domain: "iherb.com",
    programName: "iHerb Affiliate",
    referralParam: "rcode",
    referralId: "YOUR_IHERB_ID",
    isActive: true,
  },
  {
    domain: "lookfantastic.com",
    programName: "LookFantastic Affiliate",
    referralParam: "ref",
    referralId: "YOUR_LOOKFANTASTIC_ID",
    isActive: true,
  },

  // ============================================
  // BOOKING / TRAVEL
  // ============================================
  {
    domain: "booking.com",
    programName: "Booking.com Affiliate",
    referralParam: "aid",
    referralId: "YOUR_BOOKING_ID",
    isActive: true,
  },
];

// ============================================
// Helper to get all supported domains (for reference)
// ============================================
export const getSupportedDomains = (): string[] => {
  return AFFILIATE_PROGRAMS.map((p) => p.domain);
};

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

export const generateAffiliateLink = (
  url: string
): { affiliateUrl: string; hasAffiliate: boolean; programName?: string } => {
  const result = processAffiliateLink(url);

  console.log("🔗 Affiliate check:", {
      originalUrl: url,
      affiliateUrl: result.url,
      hasAffiliate: result.hasAffiliate,
      programName: result.programName,
    });
  return {
    affiliateUrl: result.url,
    hasAffiliate: result.hasAffiliate,
    programName: result.programName,
  };
};

export const parseProductInfo = async (
  _url: string
): Promise<{
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
}> => {
  return {};
};
