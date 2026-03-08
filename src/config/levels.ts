/**
 * Levels Configuration
 *
 * This file defines the gamification levels in the app.
 *
 * Each level unlocks more wishlists and is earned by:
 * - Inviting friends (referrals)
 * - Following Telegram channels
 *
 * WISHLIST LIMITS BY LEVEL:
 *  Level 0 (Newcomer)  → 2 wishlists
 *  Level 1 (Explorer)  → 5 wishlists  (invite 3 friends + follow channel)
 *  Level 2 (Collector) → 10 wishlists (invite 10 friends + follow 2 channels)
 *  Level 3 (Legend)    → Unlimited    (invite 25 friends + follow all channels)
 */

export type RequirementType = "referrals" | "follow_channel";

export interface LevelRequirement {
  type: RequirementType;
  /** For referral type: number of friends required */
  count?: number;
  /** For follow_channel type: matches the task id from tasks.ts */
  channelId?: string;
  channelUsername?: string;
  channelName?: string;
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
  requirements: LevelRequirement[];
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
    requirements: [],
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
    requirements: [
      { type: "referrals", count: 3, label: "Invite 3 friends" },
      {
        type: "follow_channel",
        channelId: "channel_wishbucket",
        channelUsername: "wishbucket_channel",
        channelName: "WishBucket Channel",
        label: "Follow @wishbucket_channel",
      },
    ],
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
    requirements: [
      { type: "referrals", count: 10, label: "Invite 10 friends" },
      {
        type: "follow_channel",
        channelId: "channel_wishbucket",
        channelUsername: "wishbucket_channel",
        channelName: "WishBucket Channel",
        label: "Follow @wishbucket_channel",
      },
      {
        type: "follow_channel",
        channelId: "channel_wishbucket_news",
        channelUsername: "wishbucket_news",
        channelName: "WishBucket News",
        label: "Follow @wishbucket_news",
      },
    ],
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
    requirements: [
      { type: "referrals", count: 25, label: "Invite 25 friends" },
      {
        type: "follow_channel",
        channelId: "channel_wishbucket",
        channelUsername: "wishbucket_channel",
        channelName: "WishBucket Channel",
        label: "Follow @wishbucket_channel",
      },
      {
        type: "follow_channel",
        channelId: "channel_wishbucket_news",
        channelUsername: "wishbucket_news",
        channelName: "WishBucket News",
        label: "Follow @wishbucket_news",
      },
    ],
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
 * Compute the user's current level based on referrals and completed task ids.
 * completedTaskIds contains channel task ids that the user has completed.
 */
export const getUserLevel = (
  referrals: number,
  completedTaskIds: string[],
): Level => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i];
    if (level.requirements.length === 0) return level; // level 0 baseline

    const allMet = level.requirements.every((req) => {
      if (req.type === "referrals") {
        return referrals >= (req.count ?? 0);
      }
      if (req.type === "follow_channel") {
        return completedTaskIds.includes(req.channelId ?? "");
      }
      return false;
    });

    if (allMet) return level;
  }
  return LEVELS[0];
};

/**
 * Returns how many wishlists the user is allowed to create.
 * -1 means unlimited.
 */
export const getWishlistLimit = (
  referrals: number,
  completedTaskIds: string[],
): number => {
  return getUserLevel(referrals, completedTaskIds).wishlistLimit;
};

/**
 * Returns 0-100 progress towards the NEXT level.
 */
export const getLevelProgress = (
  referrals: number,
  completedTaskIds: string[],
  currentLevel: Level,
): number => {
  const nextLevelIdx = currentLevel.level + 1;
  if (nextLevelIdx >= LEVELS.length) return 100; // Already at max

  const nextLevel = LEVELS[nextLevelIdx];
  const total = nextLevel.requirements.length;
  if (total === 0) return 100;

  let met = 0;
  for (const req of nextLevel.requirements) {
    if (req.type === "referrals") {
      // fractional progress counts for referrals
      met += Math.min(referrals / (req.count ?? 1), 1);
    } else if (req.type === "follow_channel") {
      if (completedTaskIds.includes(req.channelId ?? "")) {
        met += 1;
      }
    }
  }

  return Math.round((met / total) * 100);
};
