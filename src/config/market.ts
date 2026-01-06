/**
 * Market Configuration
 *
 * This file contains all market items (gifts) that users can purchase with points.
 * Easy to modify and extend.
 *
 * To add a new gift:
 * 1. Add a new object to the MARKET_ITEMS array
 * 2. Provide: id, name, description, emoji/icon, pointsCost, category, and isLocked threshold
 */

export type MarketCategory = "telegram_gifts" | "app_perks" | "special";

export interface MarketItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  pointsCost: number;
  category: MarketCategory;
  /** Minimum points needed to unlock this item (0 = always unlocked) */
  unlockThreshold: number;
  /** If true, can be purchased multiple times */
  isRepeatable: boolean;
  /** Stock limit (null = unlimited) */
  stock: number | null;
  /** Is this item currently available? */
  isActive: boolean;
}

export interface MarketCategoryInfo {
  id: MarketCategory;
  name: string;
  emoji: string;
  description: string;
}

// ============================================
// MARKET CATEGORIES
// ============================================

export const MARKET_CATEGORIES: MarketCategoryInfo[] = [
  {
    id: "telegram_gifts",
    name: "Telegram Gifts",
    emoji: "🎁",
    description: "Exclusive Telegram-style gifts",
  },
  {
    id: "app_perks",
    name: "App Perks",
    emoji: "⭐",
    description: "Special features for your profile",
  },
  {
    id: "special",
    name: "Limited Edition",
    emoji: "💎",
    description: "Rare items available for a limited time",
  },
];

// ============================================
// MARKET ITEMS - EASY TO EDIT!
// ============================================

export const MARKET_ITEMS: MarketItem[] = [
  // Telegram Gifts - Low tier (easily accessible)
  {
    id: "gift_star",
    name: "Star Gift",
    description: "A shining star to brighten someone's day",
    emoji: "⭐",
    pointsCost: 50,
    category: "telegram_gifts",
    unlockThreshold: 0,
    isRepeatable: true,
    stock: null,
    isActive: true,
  },
  {
    id: "gift_heart",
    name: "Heart Gift",
    description: "Show someone you care with a beautiful heart",
    emoji: "❤️",
    pointsCost: 75,
    category: "telegram_gifts",
    unlockThreshold: 0,
    isRepeatable: true,
    stock: null,
    isActive: true,
  },
  {
    id: "gift_cake",
    name: "Birthday Cake",
    description: "Perfect for celebrating birthdays!",
    emoji: "🎂",
    pointsCost: 100,
    category: "telegram_gifts",
    unlockThreshold: 50,
    isRepeatable: true,
    stock: null,
    isActive: true,
  },

  // Telegram Gifts - Mid tier
  {
    id: "gift_rocket",
    name: "Rocket Gift",
    description: "Launch your wishes to the stars!",
    emoji: "🚀",
    pointsCost: 200,
    category: "telegram_gifts",
    unlockThreshold: 100,
    isRepeatable: true,
    stock: null,
    isActive: true,
  },
  {
    id: "gift_crown",
    name: "Crown Gift",
    description: "For the kings and queens among us",
    emoji: "👑",
    pointsCost: 300,
    category: "telegram_gifts",
    unlockThreshold: 150,
    isRepeatable: true,
    stock: null,
    isActive: true,
  },
  {
    id: "gift_crystal_ball",
    name: "Crystal Ball",
    description: "Mysterious and magical",
    emoji: "🔮",
    pointsCost: 400,
    category: "telegram_gifts",
    unlockThreshold: 200,
    isRepeatable: true,
    stock: null,
    isActive: true,
  },

  // Telegram Gifts - High tier
  {
    id: "gift_diamond",
    name: "Diamond Gift",
    description: "The most precious gift for someone special",
    emoji: "💎",
    pointsCost: 500,
    category: "telegram_gifts",
    unlockThreshold: 300,
    isRepeatable: true,
    stock: null,
    isActive: true,
  },
  {
    id: "gift_unicorn",
    name: "Unicorn Gift",
    description: "A rare and magical gift",
    emoji: "🦄",
    pointsCost: 750,
    category: "telegram_gifts",
    unlockThreshold: 400,
    isRepeatable: true,
    stock: null,
    isActive: true,
  },

  // App Perks
  {
    id: "perk_profile_badge",
    name: "Profile Badge",
    description: "Show off your supporter status",
    emoji: "🏅",
    pointsCost: 150,
    category: "app_perks",
    unlockThreshold: 0,
    isRepeatable: false,
    stock: null,
    isActive: true,
  },
  {
    id: "perk_custom_theme",
    name: "Custom Theme",
    description: "Unlock exclusive color themes",
    emoji: "🎨",
    pointsCost: 250,
    category: "app_perks",
    unlockThreshold: 100,
    isRepeatable: false,
    stock: null,
    isActive: true,
  },
  {
    id: "perk_priority_support",
    name: "Priority Support",
    description: "Get faster responses from our team",
    emoji: "⚡",
    pointsCost: 500,
    category: "app_perks",
    unlockThreshold: 250,
    isRepeatable: false,
    stock: null,
    isActive: true,
  },

  // Special / Limited Edition
  {
    id: "special_golden_star",
    name: "Golden Star",
    description: "Exclusive limited edition golden star",
    emoji: "🌟",
    pointsCost: 1000,
    category: "special",
    unlockThreshold: 500,
    isRepeatable: false,
    stock: 100,
    isActive: true,
  },
  {
    id: "special_dragon",
    name: "Dragon Gift",
    description: "The legendary dragon - only for true collectors",
    emoji: "🐉",
    pointsCost: 2000,
    category: "special",
    unlockThreshold: 1000,
    isRepeatable: false,
    stock: 50,
    isActive: true,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all active market items
 */
export const getActiveMarketItems = (): MarketItem[] => {
  return MARKET_ITEMS.filter((item) => item.isActive);
};

/**
 * Get items by category
 */
export const getItemsByCategory = (category: MarketCategory): MarketItem[] => {
  return MARKET_ITEMS.filter(
    (item) => item.category === category && item.isActive
  );
};

/**
 * Check if user can purchase an item
 */
export const canPurchaseItem = (
  item: MarketItem,
  userPoints: number
): {
  canPurchase: boolean;
  reason?: string;
} => {
  if (userPoints < item.unlockThreshold) {
    return {
      canPurchase: false,
      reason: `Requires ${item.unlockThreshold} points to unlock`,
    };
  }
  if (userPoints < item.pointsCost) {
    return {
      canPurchase: false,
      reason: `Not enough points (need ${item.pointsCost})`,
    };
  }
  if (item.stock !== null && item.stock <= 0) {
    return {
      canPurchase: false,
      reason: "Out of stock",
    };
  }
  return { canPurchase: true };
};

/**
 * Check if an item is locked for the user
 */
export const isItemLocked = (item: MarketItem, userPoints: number): boolean => {
  return userPoints < item.unlockThreshold;
};
