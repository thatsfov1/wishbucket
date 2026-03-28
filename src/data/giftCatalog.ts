/**
 * 🎁 GIFT CATALOG
 *
 * To add a new gift, just add an object to the `giftCatalog` array below.
 *
 * Fields:
 *   id         – unique string (e.g. "airpods-pro")
 *   name       – display name
 *   emoji      – single emoji for fallback image
 *   description– one-line description shown in cards
 *   price      – approximate price in USD (number)
 *   priceRange – "low" (<$50) | "medium" ($50–150) | "high" ($150–300) | "luxury" ($300+)
 *   categories – any of: tech | fashion | home | beauty | sports | books | food | gaming | outdoors | creative | wellness | pets
 *   recipients – any of: partner | friend | family | colleague | parent | sibling | teen | child
 *   occasions  – any of: birthday | holiday | anniversary | graduation | just-because | wedding | babyshower | valentines
 *   vibes      – any of: practical | cozy | adventurous | creative | minimalist | luxury | unique | romantic | fun
 *   url        – optional product/search link
 *   imageUrl   – optional image URL (leave blank to use emoji)
 */

export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  priceRange: "low" | "medium" | "high" | "luxury";
  categories: string[];
  recipients: string[];
  occasions: string[];
  vibes: string[];
  url?: string;
  imageUrl?: string;
}

export const giftCatalog: GiftItem[] = [
  // ─── TECH ───────────────────────────────────────────────────────────────────
  {
    id: "airpods-pro",
    name: "Apple AirPods Pro 2",
    emoji: "🎧",
    description: "Premium noise-cancelling wireless earbuds",
    price: 249,
    priceRange: "high",
    categories: ["tech"],
    recipients: ["partner", "friend", "sibling", "teen"],
    occasions: ["birthday", "holiday", "graduation", "just-because"],
    vibes: ["minimalist", "practical", "luxury"],
    url: "https://www.amazon.com/s?k=airpods+pro+2",
    imageUrl: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=800&hei=800&fmt=jpeg&qlt=90",
  },
  {
    id: "kindle-paperwhite",
    name: "Kindle Paperwhite",
    emoji: "📖",
    description: "Waterproof e-reader with 6.8\" display",
    price: 149,
    priceRange: "medium",
    categories: ["tech", "books"],
    recipients: ["partner", "friend", "family", "parent"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["cozy", "practical", "minimalist"],
    url: "https://www.amazon.com/s?k=kindle+paperwhite",
    imageUrl: "https://m.media-amazon.com/images/I/61Ww4abGclL._AC_SL1000_.jpg",
  },
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    emoji: "🎧",
    description: "Industry-leading noise-cancelling headphones",
    price: 349,
    priceRange: "luxury",
    categories: ["tech"],
    recipients: ["partner", "friend", "colleague", "sibling"],
    occasions: ["birthday", "holiday", "anniversary"],
    vibes: ["luxury", "practical"],
    url: "https://www.amazon.com/s?k=sony+wh1000xm5",
  },
  {
    id: "apple-watch-se",
    name: "Apple Watch SE",
    emoji: "⌚",
    description: "Smart health & fitness tracking watch",
    price: 249,
    priceRange: "high",
    categories: ["tech", "sports", "wellness"],
    recipients: ["partner", "friend", "parent", "sibling", "teen"],
    occasions: ["birthday", "holiday", "graduation"],
    vibes: ["practical", "minimalist"],
    url: "https://www.amazon.com/s?k=apple+watch+se",
  },
  {
    id: "polaroid-now",
    name: "Polaroid Now Camera",
    emoji: "📷",
    description: "Instant camera for capturing memories",
    price: 119,
    priceRange: "medium",
    categories: ["tech", "creative"],
    recipients: ["partner", "friend", "sibling", "teen"],
    occasions: ["birthday", "holiday", "just-because", "graduation"],
    vibes: ["fun", "creative", "unique"],
    url: "https://www.amazon.com/s?k=polaroid+now+camera",
    imageUrl: "https://m.media-amazon.com/images/I/61yrYXrsCvL._AC_SL1500_.jpg",
  },
  {
    id: "mini-projector",
    name: "Mini Portable Projector",
    emoji: "📽️",
    description: "Movie nights anywhere, compact & wireless",
    price: 89,
    priceRange: "medium",
    categories: ["tech"],
    recipients: ["partner", "friend", "sibling", "teen"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["fun", "cozy", "adventurous"],
    url: "https://www.amazon.com/s?k=mini+portable+projector",
  },
  {
    id: "smart-speaker",
    name: "Amazon Echo Dot",
    emoji: "🔊",
    description: "Compact smart speaker with Alexa",
    price: 49,
    priceRange: "low",
    categories: ["tech", "home"],
    recipients: ["partner", "friend", "parent", "colleague"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["practical", "minimalist"],
    url: "https://www.amazon.com/s?k=echo+dot",
  },

  // ─── HOME & COZY ────────────────────────────────────────────────────────────
  {
    id: "ember-mug",
    name: "Ember Smart Mug",
    emoji: "☕",
    description: "Keeps your drink at the perfect temperature",
    price: 129,
    priceRange: "medium",
    categories: ["home", "food"],
    recipients: ["partner", "friend", "colleague", "parent"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["cozy", "practical", "luxury"],
    url: "https://www.amazon.com/s?k=ember+smart+mug",
    imageUrl: "https://m.media-amazon.com/images/I/61G1m4VZwmL._AC_SL1500_.jpg",
  },
  {
    id: "diffuser-set",
    name: "Essential Oil Diffuser Set",
    emoji: "🌿",
    description: "Aromatherapy diffuser with oils collection",
    price: 39,
    priceRange: "low",
    categories: ["home", "wellness", "beauty"],
    recipients: ["partner", "friend", "parent", "family"],
    occasions: ["birthday", "holiday", "just-because", "valentines"],
    vibes: ["cozy", "wellness", "romantic"],
    url: "https://www.amazon.com/s?k=essential+oil+diffuser+set",
  },
  {
    id: "weighted-blanket",
    name: "Weighted Blanket",
    emoji: "🛏️",
    description: "Cozy anxiety-relieving weighted blanket",
    price: 59,
    priceRange: "medium",
    categories: ["home", "wellness"],
    recipients: ["partner", "friend", "family", "sibling"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["cozy", "practical", "wellness"],
    url: "https://www.amazon.com/s?k=weighted+blanket",
  },
  {
    id: "candle-set",
    name: "Luxury Candle Set",
    emoji: "🕯️",
    description: "Premium scented soy candles gift set",
    price: 42,
    priceRange: "low",
    categories: ["home", "beauty"],
    recipients: ["partner", "friend", "parent", "colleague", "family"],
    occasions: ["birthday", "holiday", "valentines", "just-because"],
    vibes: ["cozy", "romantic", "luxury"],
    url: "https://www.amazon.com/s?k=luxury+candle+set",
  },
  {
    id: "coffee-station",
    name: "Coffee Pour-Over Kit",
    emoji: "☕",
    description: "Artisan pour-over coffee set for coffee lovers",
    price: 55,
    priceRange: "medium",
    categories: ["home", "food"],
    recipients: ["partner", "friend", "colleague", "parent"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["cozy", "practical", "unique"],
    url: "https://www.amazon.com/s?k=pour+over+coffee+kit",
  },
  {
    id: "plant-kit",
    name: "Succulent Garden Kit",
    emoji: "🌵",
    description: "Mini succulent set with pots & soil",
    price: 28,
    priceRange: "low",
    categories: ["home", "creative"],
    recipients: ["friend", "colleague", "parent", "partner"],
    occasions: ["birthday", "just-because", "holiday"],
    vibes: ["cozy", "unique", "creative"],
    url: "https://www.amazon.com/s?k=succulent+garden+kit",
  },

  // ─── BEAUTY & WELLNESS ───────────────────────────────────────────────────────
  {
    id: "skincare-set",
    name: "K-Beauty Skincare Set",
    emoji: "✨",
    description: "Korean skincare essentials glow kit",
    price: 49,
    priceRange: "low",
    categories: ["beauty", "wellness"],
    recipients: ["partner", "friend", "sibling", "family"],
    occasions: ["birthday", "holiday", "valentines", "just-because"],
    vibes: ["wellness", "cozy", "luxury"],
    url: "https://www.amazon.com/s?k=korean+skincare+set",
  },
  {
    id: "hair-tools",
    name: "Dyson Airwrap",
    emoji: "💇",
    description: "Multi-styler for all hair types",
    price: 499,
    priceRange: "luxury",
    categories: ["beauty", "fashion"],
    recipients: ["partner", "friend", "sibling", "family"],
    occasions: ["birthday", "holiday", "anniversary"],
    vibes: ["luxury", "unique"],
    url: "https://www.amazon.com/s?k=dyson+airwrap",
  },
  {
    id: "massage-gun",
    name: "Percussion Massage Gun",
    emoji: "💆",
    description: "Deep tissue massage for muscle recovery",
    price: 89,
    priceRange: "medium",
    categories: ["wellness", "sports"],
    recipients: ["partner", "friend", "parent", "sibling", "colleague"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["practical", "wellness"],
    url: "https://www.amazon.com/s?k=percussion+massage+gun",
  },
  {
    id: "bath-set",
    name: "Spa Bath Gift Set",
    emoji: "🛁",
    description: "Luxurious bath bombs, salts & scrubs",
    price: 35,
    priceRange: "low",
    categories: ["beauty", "wellness"],
    recipients: ["partner", "friend", "parent", "family"],
    occasions: ["birthday", "holiday", "valentines", "just-because"],
    vibes: ["cozy", "romantic", "wellness"],
    url: "https://www.amazon.com/s?k=spa+bath+gift+set",
  },
  {
    id: "yoga-mat",
    name: "Premium Yoga Mat",
    emoji: "🧘",
    description: "Thick non-slip yoga mat with carry strap",
    price: 68,
    priceRange: "medium",
    categories: ["sports", "wellness"],
    recipients: ["partner", "friend", "sibling", "parent"],
    occasions: ["birthday", "holiday", "just-because", "graduation"],
    vibes: ["wellness", "practical", "adventurous"],
    url: "https://www.amazon.com/s?k=premium+yoga+mat",
  },

  // ─── FASHION & ACCESSORIES ────────────────────────────────────────────────────
  {
    id: "silk-scarf",
    name: "Silk Scarf",
    emoji: "🧣",
    description: "Elegant hand-painted silk scarf",
    price: 45,
    priceRange: "low",
    categories: ["fashion"],
    recipients: ["partner", "parent", "family", "colleague"],
    occasions: ["birthday", "holiday", "anniversary", "valentines"],
    vibes: ["luxury", "unique", "romantic"],
    url: "https://www.amazon.com/s?k=women+silk+scarf",
  },
  {
    id: "leather-wallet",
    name: "Slim Leather Wallet",
    emoji: "👛",
    description: "Minimalist genuine leather bifold wallet",
    price: 39,
    priceRange: "low",
    categories: ["fashion"],
    recipients: ["partner", "friend", "sibling", "colleague", "parent"],
    occasions: ["birthday", "holiday", "graduation", "just-because"],
    vibes: ["minimalist", "practical"],
    url: "https://www.amazon.com/s?k=slim+leather+wallet",
  },
  {
    id: "sunglasses",
    name: "Retro Sunglasses",
    emoji: "😎",
    description: "Stylish UV400 sunglasses",
    price: 29,
    priceRange: "low",
    categories: ["fashion", "outdoors"],
    recipients: ["partner", "friend", "sibling", "teen"],
    occasions: ["birthday", "just-because", "graduation"],
    vibes: ["fun", "adventurous", "unique"],
    url: "https://www.amazon.com/s?k=retro+fashion+sunglasses",
  },
  {
    id: "custom-jewelry",
    name: "Personalized Name Necklace",
    emoji: "📿",
    description: "Custom engraved gold/silver necklace",
    price: 65,
    priceRange: "medium",
    categories: ["fashion"],
    recipients: ["partner", "friend", "family", "sibling"],
    occasions: ["birthday", "anniversary", "valentines", "graduation"],
    vibes: ["romantic", "unique", "luxury"],
    url: "https://www.etsy.com/search?q=custom+name+necklace",
  },

  // ─── OUTDOORS & ADVENTURE ────────────────────────────────────────────────────
  {
    id: "hydro-flask",
    name: "Hydro Flask Water Bottle",
    emoji: "💧",
    description: "Insulated stainless steel water bottle",
    price: 44,
    priceRange: "low",
    categories: ["outdoors", "sports", "wellness"],
    recipients: ["friend", "partner", "sibling", "colleague", "teen"],
    occasions: ["birthday", "just-because", "graduation"],
    vibes: ["practical", "adventurous", "minimalist"],
    url: "https://www.amazon.com/s?k=hydro+flask+water+bottle",
  },
  {
    id: "hiking-backpack",
    name: "Hiking Daypack 30L",
    emoji: "🎒",
    description: "Lightweight waterproof hiking backpack",
    price: 79,
    priceRange: "medium",
    categories: ["outdoors", "sports"],
    recipients: ["partner", "friend", "sibling", "teen"],
    occasions: ["birthday", "holiday", "graduation", "just-because"],
    vibes: ["adventurous", "practical"],
    url: "https://www.amazon.com/s?k=hiking+backpack+30l",
  },
  {
    id: "star-map",
    name: "Custom Star Map Print",
    emoji: "⭐",
    description: "Personalized map of the night sky on a special date",
    price: 35,
    priceRange: "low",
    categories: ["creative", "home"],
    recipients: ["partner", "friend", "family"],
    occasions: ["anniversary", "birthday", "valentines", "wedding"],
    vibes: ["romantic", "unique", "creative"],
    url: "https://www.etsy.com/search?q=custom+star+map",
  },
  {
    id: "camping-hammock",
    name: "Portable Camping Hammock",
    emoji: "🏕️",
    description: "Ultra-light packable nylon hammock",
    price: 34,
    priceRange: "low",
    categories: ["outdoors", "sports"],
    recipients: ["partner", "friend", "sibling", "teen"],
    occasions: ["birthday", "holiday", "graduation"],
    vibes: ["adventurous", "fun", "practical"],
    url: "https://www.amazon.com/s?k=camping+hammock",
  },

  // ─── CREATIVE ────────────────────────────────────────────────────────────────
  {
    id: "art-set",
    name: "Professional Art Supply Set",
    emoji: "🎨",
    description: "Complete watercolor & sketching kit",
    price: 45,
    priceRange: "low",
    categories: ["creative"],
    recipients: ["friend", "sibling", "teen", "child", "partner"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["creative", "fun", "unique"],
    url: "https://www.amazon.com/s?k=watercolor+art+set",
  },
  {
    id: "embroidery-kit",
    name: "Beginner Embroidery Kit",
    emoji: "🧵",
    description: "Complete kit with patterns, hoop & threads",
    price: 22,
    priceRange: "low",
    categories: ["creative"],
    recipients: ["friend", "sibling", "partner", "parent"],
    occasions: ["birthday", "just-because", "holiday"],
    vibes: ["creative", "cozy", "unique"],
    url: "https://www.amazon.com/s?k=embroidery+starter+kit",
  },
  {
    id: "lego-set",
    name: "LEGO Botanical Set",
    emoji: "🧱",
    description: "Beautiful flower bouquet or bonsai LEGO set",
    price: 59,
    priceRange: "medium",
    categories: ["creative", "home"],
    recipients: ["partner", "friend", "sibling", "teen", "child"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["creative", "fun", "unique", "cozy"],
    url: "https://www.amazon.com/s?k=lego+botanical",
  },

  // ─── FOOD & DRINK ────────────────────────────────────────────────────────────
  {
    id: "cocktail-kit",
    name: "Home Cocktail Making Kit",
    emoji: "🍹",
    description: "Bartender tools, recipes & premium spirits",
    price: 55,
    priceRange: "medium",
    categories: ["food"],
    recipients: ["partner", "friend", "sibling", "colleague"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["fun", "adventurous", "unique"],
    url: "https://www.amazon.com/s?k=cocktail+making+kit",
  },
  {
    id: "chocolate-box",
    name: "Artisan Chocolate Box",
    emoji: "🍫",
    description: "Handcrafted premium chocolate assortment",
    price: 29,
    priceRange: "low",
    categories: ["food"],
    recipients: ["partner", "friend", "colleague", "family", "parent"],
    occasions: ["birthday", "holiday", "valentines", "just-because"],
    vibes: ["romantic", "cozy", "luxury"],
    url: "https://www.amazon.com/s?k=artisan+chocolate+gift+box",
  },
  {
    id: "tea-set",
    name: "Loose Leaf Tea Collection",
    emoji: "🍵",
    description: "Premium world teas with infuser set",
    price: 32,
    priceRange: "low",
    categories: ["food", "wellness"],
    recipients: ["partner", "friend", "parent", "colleague"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["cozy", "wellness", "practical"],
    url: "https://www.amazon.com/s?k=loose+leaf+tea+gift+set",
  },
  {
    id: "hot-sauce-set",
    name: "Hot Sauce Collection",
    emoji: "🌶️",
    description: "Curated set of artisan hot sauces",
    price: 35,
    priceRange: "low",
    categories: ["food"],
    recipients: ["friend", "sibling", "colleague", "partner"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["fun", "unique", "adventurous"],
    url: "https://www.amazon.com/s?k=hot+sauce+collection+gift",
  },

  // ─── GAMING ──────────────────────────────────────────────────────────────────
  {
    id: "nintendo-switch-game",
    name: "Nintendo Switch Game",
    emoji: "🎮",
    description: "Popular Switch title (Zelda, Mario, etc.)",
    price: 59,
    priceRange: "medium",
    categories: ["gaming", "tech"],
    recipients: ["partner", "friend", "sibling", "teen", "child"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["fun", "practical"],
    url: "https://www.amazon.com/s?k=nintendo+switch+games+2024",
  },
  {
    id: "gaming-headset",
    name: "Gaming Headset",
    emoji: "🎧",
    description: "Surround sound headset with mic",
    price: 79,
    priceRange: "medium",
    categories: ["gaming", "tech"],
    recipients: ["partner", "friend", "sibling", "teen"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["practical", "fun"],
    url: "https://www.amazon.com/s?k=gaming+headset",
  },
  {
    id: "card-game",
    name: "Party Card Game",
    emoji: "🃏",
    description: "Fun group party game (e.g. What Do You Meme)",
    price: 28,
    priceRange: "low",
    categories: ["gaming"],
    recipients: ["friend", "family", "colleague", "sibling"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["fun", "unique"],
    url: "https://www.amazon.com/s?k=party+card+game",
  },

  // ─── EXPERIENCES / UNIQUE ─────────────────────────────────────────────────────
  {
    id: "photo-book",
    name: "Custom Photo Book",
    emoji: "📸",
    description: "Personalized hardcover photo album",
    price: 35,
    priceRange: "low",
    categories: ["creative"],
    recipients: ["partner", "friend", "parent", "family"],
    occasions: ["anniversary", "birthday", "holiday", "wedding"],
    vibes: ["romantic", "unique", "creative"],
    url: "https://www.shutterfly.com",
  },
  {
    id: "monogram-bag",
    name: "Personalized Tote Bag",
    emoji: "👜",
    description: "Canvas tote with custom monogram",
    price: 24,
    priceRange: "low",
    categories: ["fashion", "creative"],
    recipients: ["partner", "friend", "colleague", "sibling"],
    occasions: ["birthday", "just-because", "graduation"],
    vibes: ["practical", "unique", "minimalist"],
    url: "https://www.etsy.com/search?q=personalized+tote+bag",
  },
  {
    id: "subscription-box",
    name: "Monthly Subscription Box",
    emoji: "📦",
    description: "Curated discovery box (books, snacks, beauty...)",
    price: 45,
    priceRange: "low",
    categories: ["food", "beauty", "books"],
    recipients: ["partner", "friend", "sibling", "parent"],
    occasions: ["birthday", "holiday", "just-because"],
    vibes: ["fun", "unique", "cozy"],
    url: "https://www.cratejoy.com",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Score a gift item against a set of filter answers (0–100) */
export function scoreGift(
  item: GiftItem,
  answers: Record<string, string>,
): number {
  let score = 0;
  let checks = 0;

  if (answers.recipient) {
    checks++;
    if (item.recipients.includes(answers.recipient)) score += 30;
  }
  if (answers.occasion) {
    checks++;
    if (item.occasions.includes(answers.occasion)) score += 25;
  }
  if (answers.category) {
    checks++;
    if (item.categories.includes(answers.category)) score += 25;
  }
  if (answers.budget) {
    checks++;
    if (item.priceRange === answers.budget) score += 20;
    // Adjacent budget also scores partial
    else if (
      (answers.budget === "medium" && item.priceRange === "low") ||
      (answers.budget === "high" && item.priceRange === "medium")
    )
      score += 10;
  }
  if (answers.vibe) {
    checks++;
    if (item.vibes.includes(answers.vibe)) score += 15;
  }

  // Normalize to 0-100
  if (checks === 0) return 50;
  const maxPossible = 30 + 25 + 25 + 20 + 15;
  return Math.round((score / maxPossible) * 100);
}

/** Filter + sort gifts by score, return top N results */
export function getRecommendations(
  answers: Record<string, string>,
  limit = 6,
): Array<GiftItem & { score: number }> {
  return giftCatalog
    .map((item) => ({ ...item, score: scoreGift(item, answers) }))
    .filter((item) => item.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Get items by category */
export function getByCategory(categoryId: string): GiftItem[] {
  if (!categoryId) return giftCatalog;
  return giftCatalog.filter((item) => item.categories.includes(categoryId));
}
