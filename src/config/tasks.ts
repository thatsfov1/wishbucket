/**
 * Tasks Configuration
 *
 * This file contains all tasks that users can complete to earn points.
 *
 * EASY TO MODIFY:
 * - To add a new channel to follow: add it to CHANNELS_TO_FOLLOW array
 * - To add a new task: add it to TASKS array
 * - To change rewards: modify the pointsReward value
 *
 * Task types:
 * - 'follow_channel': User needs to join a Telegram channel
 * - 'referral': User needs to invite friends
 * - 'social': Social actions like sharing
 * - 'app_action': In-app actions like creating wishlists
 */

export type TaskType = "follow_channel" | "referral" | "social" | "app_action";
export type TaskCategory = "social" | "referrals" | "engagement";

export interface TaskChannelInfo {
  /** Unique identifier */
  id: string;
  /** Channel name to display */
  name: string;
  /** Channel username (without @) */
  username: string;
  /** Channel description */
  description: string;
  /** Points reward for following */
  pointsReward: number;
  /** Is this channel task currently active? */
  isActive: boolean;
  /** Optional: Channel icon/emoji */
  emoji?: string;
}

export interface Task {
  id: string;
  type: TaskType;
  category: TaskCategory;
  title: string;
  description: string;
  emoji: string;
  pointsReward: number;
  /** For referral tasks, how many referrals needed */
  targetCount?: number;
  /** Link to open (for channels, external links) */
  actionUrl?: string;
  /** Is this task currently active? */
  isActive: boolean;
  /** Can this task be completed multiple times? */
  isRepeatable: boolean;
  /** For referral tasks, current progress comes from API */
  progressFromApi?: boolean;
}

export interface TaskCategoryInfo {
  id: TaskCategory;
  name: string;
  emoji: string;
  description: string;
}

// ============================================
// TASK CATEGORIES
// ============================================

export const TASK_CATEGORIES: TaskCategoryInfo[] = [
  {
    id: "social",
    name: "Social",
    emoji: "📱",
    description: "Follow channels and connect",
  },
  {
    id: "referrals",
    name: "Referrals",
    emoji: "👥",
    description: "Invite friends and earn",
  },
  {
    id: "engagement",
    name: "Engagement",
    emoji: "⭐",
    description: "Use the app and get rewards",
  },
];

// ============================================
// CHANNELS TO FOLLOW
//
// 🔧 EASY TO EDIT: Just add or remove channels here!
// When you want to change channels, modify this array.
// ============================================

export const CHANNELS_TO_FOLLOW: TaskChannelInfo[] = [
  {
    id: "channel_wishbucket",
    name: "WishBucket Channel",
    username: "wishbucket_channel",
    description: "Official WishBucket updates and news",
    pointsReward: 50,
    isActive: true,
    emoji: "🎁",
  },
  {
    id: "channel_wishbucket_news",
    name: "WishBucket News",
    username: "wishbucket_news",
    description: "Latest features and announcements",
    pointsReward: 30,
    isActive: true,
    emoji: "📰",
  },
  // Add more channels here as needed:
  // {
  //   id: 'channel_partner',
  //   name: 'Partner Channel',
  //   username: 'partner_channel',
  //   description: 'Our partner channel',
  //   pointsReward: 25,
  //   isActive: true,
  //   emoji: '🤝',
  // },
];

// ============================================
// REFERRAL TASKS
//
// 🔧 Modify target counts and rewards here
// ============================================

export const REFERRAL_MILESTONES = [
  { count: 1, reward: 100, label: "First Friend" },
  { count: 3, reward: 150, label: "3 Friends" },
  { count: 5, reward: 250, label: "5 Friends" },
  { count: 10, reward: 500, label: "10 Friends" },
  { count: 25, reward: 1000, label: "25 Friends" },
  { count: 50, reward: 2500, label: "50 Friends" },
  { count: 100, reward: 5000, label: "100 Friends" },
];

// ============================================
// ALL TASKS
// ============================================

export const TASKS: Task[] = [
  // Channel following tasks (generated from CHANNELS_TO_FOLLOW)
  ...CHANNELS_TO_FOLLOW.filter((ch) => ch.isActive).map((channel) => ({
    id: channel.id,
    type: "follow_channel" as TaskType,
    category: "social" as TaskCategory,
    title: `Follow ${channel.name}`,
    description: channel.description,
    emoji: channel.emoji || "📢",
    pointsReward: channel.pointsReward,
    actionUrl: `https://t.me/${channel.username}`,
    isActive: true,
    isRepeatable: false,
  })),

  // Referral tasks (generated from REFERRAL_MILESTONES)
  ...REFERRAL_MILESTONES.map((milestone, index) => ({
    id: `referral_${milestone.count}`,
    type: "referral" as TaskType,
    category: "referrals" as TaskCategory,
    title: `Invite ${milestone.label}`,
    description: `Invite ${milestone.count} friend${
      milestone.count > 1 ? "s" : ""
    } to earn ${milestone.reward} points`,
    emoji: index === 0 ? "👤" : index < 3 ? "👥" : "🎉",
    pointsReward: milestone.reward,
    targetCount: milestone.count,
    isActive: true,
    isRepeatable: false,
    progressFromApi: true,
  })),

  // App action tasks
  {
    id: "action_create_wishlist",
    type: "app_action",
    category: "engagement",
    title: "Create Your First Wishlist",
    description: "Start your wishlist journey",
    emoji: "📝",
    pointsReward: 25,
    isActive: true,
    isRepeatable: false,
  },
  {
    id: "action_add_5_items",
    type: "app_action",
    category: "engagement",
    title: "Add 5 Items",
    description: "Add 5 items to your wishlists",
    emoji: "🛍️",
    pointsReward: 50,
    targetCount: 5,
    isActive: true,
    isRepeatable: false,
  },
  {
    id: "action_share_wishlist",
    type: "app_action",
    category: "engagement",
    title: "Share a Wishlist",
    description: "Share your wishlist with friends",
    emoji: "📤",
    pointsReward: 30,
    isActive: true,
    isRepeatable: false,
  },

  // Social tasks
  {
    id: "social_share_app",
    type: "social",
    category: "social",
    title: "Share WishBucket",
    description: "Share the app with your contacts",
    emoji: "📲",
    pointsReward: 20,
    isActive: true,
    isRepeatable: true,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all active tasks
 */
export const getActiveTasks = (): Task[] => {
  return TASKS.filter((task) => task.isActive);
};

/**
 * Get tasks by category
 */
export const getTasksByCategory = (category: TaskCategory): Task[] => {
  return TASKS.filter((task) => task.category === category && task.isActive);
};

/**
 * Get channel follow tasks
 */
export const getChannelTasks = (): Task[] => {
  return TASKS.filter(
    (task) => task.type === "follow_channel" && task.isActive
  );
};

/**
 * Get referral tasks
 */
export const getReferralTasks = (): Task[] => {
  return TASKS.filter((task) => task.type === "referral" && task.isActive);
};

/**
 * Get next referral milestone
 */
export const getNextReferralMilestone = (
  currentReferrals: number
): (typeof REFERRAL_MILESTONES)[0] | null => {
  return REFERRAL_MILESTONES.find((m) => m.count > currentReferrals) || null;
};

/**
 * Get completed referral milestones
 */
export const getCompletedReferralMilestones = (
  currentReferrals: number
): typeof REFERRAL_MILESTONES => {
  return REFERRAL_MILESTONES.filter((m) => m.count <= currentReferrals);
};
