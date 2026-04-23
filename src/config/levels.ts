/**
 * Levels Configuration
 *
 * Each level unlocks more wishlists and is earned by inviting friends.
 *
 * WISHLIST LIMITS BY LEVEL:
 *  Level 0 (Newcomer)  → 2 wishlists
 *  Level 1 (Explorer)  → 5 wishlists  (invite 3 friends)
 *  Level 2 (Collector) → 10 wishlists (invite 10 friends)
 *  Level 3 (Legend)    → Unlimited    (invite 25 friends)
 */

export interface LevelRequirement {
  /** Number of referrals required */
  count: number;
  label: string;
}

export interface Level {
  level: number;
  name: string;
  emoji: string;
  /** Primary color for this level */
  color: string;
  gradientStart: string;
  gradientEnd: string;
  /** -1 means unlimited */
  wishlistLimit: number;
  /** null for level 0 (no requirement) */
  requirement: LevelRequirement | null;
  description: string;
  /** Feature perks unlocked at this level (shown in the Level Board) */
  perks: string[];
}

// ============================================
// LEVEL DEFINITIONS
// Edit these to change requirements / limits
// ============================================

export const LEVELS: Level[] = [
  {
    level: 0,
    name: "Newcomer",
    emoji: "🌱",
    color: "#AEAEB2",
    gradientStart: "#AEAEB2",
    gradientEnd: "#C7C7CC",
    wishlistLimit: 2,
    requirement: null,
    description: "Just getting started",
    perks: ["2 wishlists", "Emoji covers"],
  },
  {
    level: 1,
    name: "Explorer",
    emoji: "🌟",
    color: "#FA7070",
    gradientStart: "#FA7070",
    gradientEnd: "#FF9B9B",
    wishlistLimit: 5,
    requirement: { count: 3, label: "Invite 3 friends" },
    description: "Growing your circle",
    perks: ["5 wishlists", "Custom cover images"],
  },
  {
    level: 2,
    name: "Collector",
    emoji: "💎",
    color: "#74B9FF",
    gradientStart: "#74B9FF",
    gradientEnd: "#A8D8FF",
    wishlistLimit: 10,
    requirement: { count: 10, label: "Invite 10 friends" },
    description: "A true wishlist enthusiast",
    perks: ["10 wishlists", "Custom cover images", "Priority support"],
  },
  {
    level: 3,
    name: "Legend",
    emoji: "👑",
    color: "#FFB347",
    gradientStart: "#FFB347",
    gradientEnd: "#FFCB7A",
    wishlistLimit: -1,
    requirement: { count: 25, label: "Invite 25 friends" },
    description: "The ultimate wishlist master",
    perks: [
      "Unlimited wishlists",
      "Custom cover images",
      "Priority support",
      "Legend badge",
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Compute the user's current level based on referral count.
 */
export const getUserLevel = (referrals: number): Level => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i];
    if (level.requirement === null) return level; // level 0 baseline
    if (referrals >= level.requirement.count) return level;
  }
  return LEVELS[0];
};

/**
 * Returns how many wishlists the user is allowed to create.
 * -1 means unlimited.
 */
export const getWishlistLimit = (referrals: number): number => {
  return getUserLevel(referrals).wishlistLimit;
};

/**
 * Returns 0-100 progress towards the NEXT level.
 */
export const getLevelProgress = (
  referrals: number,
  currentLevel: Level,
): number => {
  const nextLevelIdx = currentLevel.level + 1;
  if (nextLevelIdx >= LEVELS.length) return 100; // Already at max

  const nextLevel = LEVELS[nextLevelIdx];
  if (nextLevel.requirement === null) return 100;

  return Math.round(
    Math.min(referrals / nextLevel.requirement.count, 1) * 100,
  );
};
