export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface Wishlist {
  id: string;
  userId: number;
  name: string;
  description?: string;
  isPublic: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  items: WishlistItem[];
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  name: string;
  description?: string;
  url: string;
  originalUrl: string;
  affiliateUrl?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  priority: "low" | "medium" | "high";
  status: "available" | "reserved" | "purchased";
  reservedBy?: number;
  purchasedBy?: number;
  createdAt: string;
  updatedAt: string;
  crowdfunding?: CrowdfundingInfo;
}

export interface CrowdfundingInfo {
  id: string;
  itemId: string;
  targetAmount: number;
  currentAmount: number;
  contributors: Contributor[];
  isActive: boolean;
  createdAt: string;
}

export interface Contributor {
  userId: number;
  amount: number;
  contributedAt: string;
}

export interface SecretSanta {
  id: string;
  organizerId: number;
  name: string;
  description?: string;
  participants: SecretSantaParticipant[];
  budget?: number;
  exchangeDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SecretSantaParticipant {
  userId: number;
  wishlistId?: string;
  assignedTo?: number;
  hasDrawn: boolean;
}

export interface UserProfile {
  userId: number;
  telegramUser: TelegramUser;
  birthday?: string;
  friends: number[];
  referralCode: string;
  referrals: number;
  premiumStatus: "free" | "premium";
  premiumExpiresAt?: string;
  bonusPoints: number;
  createdAt: string;
}

export interface AffiliateProgram {
  domain: string;
  programName: string;
  referralParam: string;
  referralId: string;
  isActive: boolean;
}

export interface BirthdayReminder {
  userId: number;
  friendId: number;
  friendName: string;
  birthday: string;
  daysUntil: number;
  notified: boolean;
}
