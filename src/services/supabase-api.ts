/**
 * Supabase API Service для Wish Bucket
 *
 * Цей файл містить всі функції для роботи з Supabase.
 * Код структурований та легко редагується.
 */

import { supabase, getCurrentUserId } from "../lib/supabase";
import {
  Wishlist,
  WishlistItem,
  UserProfile,
  SecretSanta,
  BirthdayReminder,
  TelegramUser,
  Friend,
  Notification,
  NotificationType,
  Referral,
  ReferralStats,
} from "../types";
import { getTelegramUser } from "../utils/telegram";

// ============================================
// Допоміжні функції
// ============================================

/**
 * Генерує унікальний referral code
 */
const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * Конвертує Supabase user в UserProfile
 */
const mapUserToProfile = (
  user: any,
  telegramUser: TelegramUser | null,
): UserProfile => {
  return {
    userId: user.user_id,
    telegramUser: telegramUser || JSON.parse(user.telegram_data),
    birthday: user.birthday || undefined,
    friends: [], // Буде завантажено окремо
    referralCode: user.referral_code,
    referrals: user.referrals || 0,
    premiumStatus: user.premium_status || "free",
    premiumExpiresAt: user.premium_expires_at || undefined,
    bonusPoints: user.bonus_points || 0,
    createdAt: user.created_at,
  };
};

/**
 * Конвертує Supabase wishlist в Wishlist
 */
const mapWishlist = (wishlist: any, items: any[] = []): Wishlist => {
  return {
    id: wishlist.id,
    userId: wishlist.user_id,
    name: wishlist.name,
    description: wishlist.description || undefined,
    imageUrl: wishlist.image_url || undefined,
    eventDate: wishlist.event_date || undefined,
    isPublic: wishlist.is_public,
    isDefault: wishlist.is_default,
    createdAt: wishlist.created_at,
    updatedAt: wishlist.updated_at,
    items: items.map(mapItem),
  };
};

/**
 * Конвертує Supabase item в WishlistItem
 */
const mapItem = (item: any): WishlistItem => {
  return {
    id: item.id,
    wishlistId: item.wishlist_id,
    name: item.name,
    description: item.description || undefined,
    url: item.url,
    originalUrl: item.original_url,
    affiliateUrl: item.affiliate_url || undefined,
    imageUrl: item.image_url || undefined,
    price: item.price ? parseFloat(item.price) : undefined,
    currency: item.currency || "USD",
    priority: item.priority || "medium",
    status: item.status || "available",
    reservedBy: item.reserved_by || undefined,
    purchasedBy: item.purchased_by || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    crowdfunding: item.crowdfunding || undefined,
  };
};

// ============================================
// URL Scraping API
// ============================================

export interface ScrapedProductInfo {
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  description?: string;
}

/**
 * Scrapes product information from a URL
 * Uses the Supabase Edge Function for server-side scraping
 */
export const scrapeProductUrl = async (
  url: string,
): Promise<ScrapedProductInfo> => {
  try {
    console.log("🔍 Calling scrape-url function for:", url);
    const { data, error } = await supabase.functions.invoke("scrape-url", {
      body: { url },
    });

    console.log("📦 Raw response:", { data, error });

    if (error) {
      console.error("Supabase function error:", error);
      // Fall back to client-side basic extraction
      return extractFromUrlPattern(url);
    }

    // Handle nested productInfo structure from Edge Function
    const productInfo = data?.productInfo || data;
    console.log("📦 Extracted productInfo:", productInfo);

    const result: ScrapedProductInfo = {
      title: productInfo?.title || undefined,
      imageUrl: productInfo?.imageUrl || undefined,
      price: productInfo?.price ? Number(productInfo.price) : undefined,
      currency: productInfo?.currency || undefined,
      description: productInfo?.description || undefined,
    };

    console.log("✅ Final scrape result:", result);
    return result;
  } catch (error) {
    console.error("Error scraping URL:", error);
    // Fall back to client-side pattern matching
    return extractFromUrlPattern(url);
  }
};

/**
 * Basic fallback: extract product info from URL patterns
 * Works when edge function is unavailable
 */
const extractFromUrlPattern = (url: string): ScrapedProductInfo => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const hostname = urlObj.hostname.toLowerCase();

    // Try to extract product name from URL path
    const segments = path.split("/").filter(Boolean);
    let productName = "";

    // Amazon-specific URL parsing
    // Amazon URLs: /dp/ASIN/product-name or /gp/product/ASIN or /product-name/dp/ASIN
    if (hostname.includes("amazon")) {
      // Find the segment after /dp/ or find the product slug before /dp/
      const dpIndex = segments.findIndex((s) => s === "dp" || s === "gp");
      if (dpIndex > 0) {
        // Product name is usually before the /dp/ segment
        const potentialName = segments[dpIndex - 1];
        if (potentialName && !/^[A-Z0-9]{10}$/.test(potentialName)) {
          productName = potentialName;
        }
      }
      // Also try the last segment if it looks like a product name
      if (!productName && segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        if (
          lastSegment &&
          !/^[A-Z0-9]{10}$/.test(lastSegment) &&
          lastSegment !== "dp" &&
          lastSegment !== "ref"
        ) {
          productName = lastSegment;
        }
      }
    } else {
      // Common patterns: /product/product-name, /p/product-name, /item/product-name
      const productPatterns = ["product", "p", "item", "dp", "pd", "goods"];
      for (let i = 0; i < segments.length; i++) {
        if (
          productPatterns.includes(segments[i].toLowerCase()) &&
          segments[i + 1]
        ) {
          productName = segments[i + 1];
          break;
        }
      }

      // If no pattern matched, use last meaningful segment
      if (!productName && segments.length > 0) {
        productName = segments[segments.length - 1];
      }
    }

    // Clean up product name: replace dashes/underscores with spaces, remove IDs
    if (productName) {
      productName = productName
        .replace(/[-_]/g, " ")
        .replace(/\.(html|php|aspx?)$/i, "")
        .replace(/\b[A-Z0-9]{10}\b/g, "") // Remove Amazon ASINs
        .replace(/\b[a-f0-9]{8,}\b/gi, "") // Remove hex IDs
        .replace(/\s+/g, " ")
        .trim();

      // Capitalize words
      if (productName) {
        productName = productName
          .split(" ")
          .filter(Boolean)
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");
      }
    }

    // Don't return the domain name as the product name
    const domainName = hostname.replace("www.", "").split(".")[0].toLowerCase();
    if (productName && productName.toLowerCase() === domainName) {
      productName = "";
    }

    return {
      title: productName || undefined,
    };
  } catch {
    return {};
  }
};

// ============================================
// User Profile API
// ============================================

/**
 * Отримує профіль користувача або створює новий
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error("User not authenticated");
  }

  const userId = telegramUser.id;

  // Перевіряємо чи існує користувач
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = not found
    throw new Error(`Failed to fetch user: ${fetchError.message}`);
  }

  // Якщо користувач не існує, створюємо нового
  if (!existingUser) {
    const referralCode = generateReferralCode();
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        user_id: userId,
        telegram_data: telegramUser,
        referral_code: referralCode,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    return mapUserToProfile(newUser, telegramUser);
  }

  // Завантажуємо друзів
  const { data: friends } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  const userProfile = mapUserToProfile(existingUser, telegramUser);
  userProfile.friends = friends?.map((f) => f.friend_id) || [];

  return userProfile;
};

/**
 * Оновлює профіль користувача
 */
export const updateUserProfile = async (
  updates: Partial<UserProfile>,
): Promise<UserProfile> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const updateData: any = {};

  if (updates.birthday !== undefined) {
    updateData.birthday = updates.birthday || null;
  }

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  const telegramUser = getTelegramUser();
  return mapUserToProfile(data, telegramUser);
};

/**
 * Отримує referral code користувача
 */
export const getReferralCode = async (): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("users")
    .select("referral_code")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to get referral code: ${error.message}`);
  }

  return data.referral_code;
};

/**
 * Застосовує referral code
 */
export const applyReferralCode = async (code: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Знаходимо користувача з цим кодом
  const { data: referrer, error: findError } = await supabase
    .from("users")
    .select("user_id")
    .eq("referral_code", code.toUpperCase())
    .single();

  if (findError || !referrer) {
    throw new Error("Invalid referral code");
  }

  if (referrer.user_id === userId) {
    throw new Error("Cannot use your own referral code");
  }

  // Перевіряємо чи вже використовувався код
  // (тут можна додати логіку перевірки)

  // Оновлюємо бонуси реферера
  const { data: referrerData } = await supabase
    .from("users")
    .select("referrals")
    .eq("user_id", referrer.user_id)
    .single();

  await supabase
    .from("users")
    .update({ referrals: (referrerData?.referrals || 0) + 1 })
    .eq("user_id", referrer.user_id);

  // Додаємо бонуси користувачу
  const { data: userData } = await supabase
    .from("users")
    .select("bonus_points")
    .eq("user_id", userId)
    .single();

  await supabase
    .from("users")
    .update({ bonus_points: (userData?.bonus_points || 0) + 100 })
    .eq("user_id", userId);
};

// ============================================
// Friends API
// ============================================

/**
 * Додає друга (follow)
 */
export const addFriend = async (friendId: number): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  if (userId === friendId) {
    throw new Error("Cannot add yourself as a friend");
  }

  // Check if they already follow us (for "follow back" notification)
  const { data: existingFollow } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", friendId)
    .eq("friend_id", userId)
    .single();

  const isFollowBack = !!existingFollow;

  const { error } = await supabase.from("friends").insert({
    user_id: userId,
    friend_id: friendId,
  });

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error("Friend already added");
    }
    throw new Error(`Failed to add friend: ${error.message}`);
  }

  // Get current user's data for notification
  const telegramUser = getTelegramUser();
  const userName = telegramUser?.first_name || "Someone";

  // Send notification to the person being followed
  try {
    await createNotification(
      friendId,
      isFollowBack ? "new_follower" : "new_follower",
      isFollowBack ? "🎉 New Follower!" : "👤 New Follower!",
      isFollowBack
        ? `${userName} followed you back!`
        : `${userName} started following you`,
      { followerId: userId, isFollowBack },
    );
  } catch (e) {
    console.error("Failed to send follow notification:", e);
  }
};

/**
 * Видаляє друга (unfollow)
 */
export const removeFriend = async (friendId: number): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("friends")
    .delete()
    .eq("user_id", userId)
    .eq("friend_id", friendId);

  if (error) {
    throw new Error(`Failed to remove friend: ${error.message}`);
  }
};

/**
 * Отримує список друзів (following)
 */
export const getFriends = async (): Promise<Friend[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get people I follow
  const { data: following, error: followingError } = await supabase
    .from("friends")
    .select(
      `
      friend_id,
      created_at,
      friend:users!friends_friend_id_fkey (
        user_id,
        telegram_data
      )
    `,
    )
    .eq("user_id", userId);

  if (followingError) {
    throw new Error(`Failed to fetch friends: ${followingError.message}`);
  }

  // Get people who follow me
  const { data: followers } = await supabase
    .from("friends")
    .select("user_id")
    .eq("friend_id", userId);

  const followerIds = new Set(followers?.map((f) => f.user_id) || []);

  return (following || []).map((f) => {
    const telegramData =
      typeof f.friend.telegram_data === "string"
        ? JSON.parse(f.friend.telegram_data)
        : f.friend.telegram_data;

    return {
      id: f.friend.user_id,
      firstName: telegramData.first_name,
      lastName: telegramData.last_name,
      username: telegramData.username,
      photoUrl: telegramData.photo_url,
      isFollowing: true,
      isFollowedBy: followerIds.has(f.friend.user_id),
      addedAt: f.created_at,
    };
  });
};

/**
 * Отримує список підписників (followers)
 */
export const getFollowers = async (): Promise<Friend[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get people who follow me
  const { data: followers, error: followersError } = await supabase
    .from("friends")
    .select(
      `
      user_id,
      created_at,
      user:users!friends_user_id_fkey (
        user_id,
        telegram_data
      )
    `,
    )
    .eq("friend_id", userId);

  if (followersError) {
    throw new Error(`Failed to fetch followers: ${followersError.message}`);
  }

  // Get people I follow
  const { data: following } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  const followingIds = new Set(following?.map((f) => f.friend_id) || []);

  return (followers || []).map((f) => {
    const telegramData =
      typeof f.user.telegram_data === "string"
        ? JSON.parse(f.user.telegram_data)
        : f.user.telegram_data;

    return {
      id: f.user.user_id,
      firstName: telegramData.first_name,
      lastName: telegramData.last_name,
      username: telegramData.username,
      photoUrl: telegramData.photo_url,
      isFollowing: followingIds.has(f.user.user_id),
      isFollowedBy: true,
      addedAt: f.created_at,
    };
  });
};

/**
 * Пошук користувачів за username або ім'ям
 */
export const searchUsers = async (query: string): Promise<Friend[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  // Search users by username in telegram_data
  const { data: users, error } = await supabase
    .from("users")
    .select("user_id, telegram_data")
    .neq("user_id", userId)
    .limit(20);

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  // Get current following
  const { data: following } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  const followingIds = new Set(following?.map((f) => f.friend_id) || []);

  // Get followers
  const { data: followers } = await supabase
    .from("friends")
    .select("user_id")
    .eq("friend_id", userId);

  const followerIds = new Set(followers?.map((f) => f.user_id) || []);

  // Filter and map users
  return (users || [])
    .map((u) => {
      const telegramData =
        typeof u.telegram_data === "string"
          ? JSON.parse(u.telegram_data)
          : u.telegram_data;

      return {
        id: u.user_id,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name,
        username: telegramData.username,
        photoUrl: telegramData.photo_url,
        isFollowing: followingIds.has(u.user_id),
        isFollowedBy: followerIds.has(u.user_id),
        addedAt: "",
      };
    })
    .filter((u) => {
      const fullName = `${u.firstName} ${u.lastName || ""}`.toLowerCase();
      const username = (u.username || "").toLowerCase();
      return fullName.includes(searchTerm) || username.includes(searchTerm);
    });
};

/**
 * Знаходить користувачів за Telegram user_ids (для контактів)
 */
export const findUsersByTelegramIds = async (
  telegramIds: number[],
): Promise<Friend[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  if (!telegramIds.length) {
    return [];
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("user_id, telegram_data")
    .in("user_id", telegramIds)
    .neq("user_id", userId);

  if (error) {
    throw new Error(`Failed to find users: ${error.message}`);
  }

  // Get current following
  const { data: following } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  const followingIds = new Set(following?.map((f) => f.friend_id) || []);

  // Get followers
  const { data: followers } = await supabase
    .from("friends")
    .select("user_id")
    .eq("friend_id", userId);

  const followerIds = new Set(followers?.map((f) => f.user_id) || []);

  return (users || []).map((u) => {
    const telegramData =
      typeof u.telegram_data === "string"
        ? JSON.parse(u.telegram_data)
        : u.telegram_data;

    return {
      id: u.user_id,
      firstName: telegramData.first_name,
      lastName: telegramData.last_name,
      username: telegramData.username,
      photoUrl: telegramData.photo_url,
      isFollowing: followingIds.has(u.user_id),
      isFollowedBy: followerIds.has(u.user_id),
      addedAt: "",
    };
  });
};

/**
 * Отримує профіль користувача за ID
 */
export const getUserById = async (
  targetUserId: number,
): Promise<Friend | null> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("user_id, telegram_data")
    .eq("user_id", targetUserId)
    .single();

  if (error || !user) {
    return null;
  }

  const telegramData =
    typeof user.telegram_data === "string"
      ? JSON.parse(user.telegram_data)
      : user.telegram_data;

  // Check following status
  const { data: following } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId)
    .eq("friend_id", targetUserId)
    .single();

  const { data: follower } = await supabase
    .from("friends")
    .select("user_id")
    .eq("user_id", targetUserId)
    .eq("friend_id", userId)
    .single();

  return {
    id: user.user_id,
    firstName: telegramData.first_name,
    lastName: telegramData.last_name,
    username: telegramData.username,
    photoUrl: telegramData.photo_url,
    isFollowing: !!following,
    isFollowedBy: !!follower,
    addedAt: "",
  };
};

/**
 * Отримує публічні wishlists користувача
 */
export const getUserPublicWishlists = async (
  targetUserId: number,
): Promise<Wishlist[]> => {
  const { data: wishlists, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("user_id", targetUserId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch wishlists: ${error.message}`);
  }

  // Load items for each wishlist
  const wishlistsWithItems = await Promise.all(
    (wishlists || []).map(async (wishlist) => {
      const { data: items } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("wishlist_id", wishlist.id)
        .order("created_at", { ascending: false });

      return mapWishlist(wishlist, items || []);
    }),
  );

  return wishlistsWithItems;
};

/**
 * Отримує профіль користувача за username
 */
export const getUserByUsername = async (
  username: string,
): Promise<Friend | null> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Search for user by username in telegram_data
  const { data: users, error } = await supabase
    .from("users")
    .select("user_id, telegram_data")
    .neq("user_id", userId);

  if (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }

  const user = users?.find((u) => {
    const telegramData =
      typeof u.telegram_data === "string"
        ? JSON.parse(u.telegram_data)
        : u.telegram_data;
    return (
      telegramData.username?.toLowerCase() ===
      username.toLowerCase().replace("@", "")
    );
  });

  if (!user) return null;

  const telegramData =
    typeof user.telegram_data === "string"
      ? JSON.parse(user.telegram_data)
      : user.telegram_data;

  // Check following status
  const { data: following } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId)
    .eq("friend_id", user.user_id)
    .single();

  const { data: follower } = await supabase
    .from("friends")
    .select("user_id")
    .eq("user_id", user.user_id)
    .eq("friend_id", userId)
    .single();

  return {
    id: user.user_id,
    firstName: telegramData.first_name,
    lastName: telegramData.last_name,
    username: telegramData.username,
    photoUrl: telegramData.photo_url,
    isFollowing: !!following,
    isFollowedBy: !!follower,
    addedAt: "",
  };
};

// ============================================
// Wishlists API
// ============================================

/**
 * Отримує всі wishlists користувача
 */
export const getWishlists = async (): Promise<Wishlist[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data: wishlists, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch wishlists: ${error.message}`);
  }

  // Завантажуємо items для кожного wishlist
  const wishlistsWithItems = await Promise.all(
    (wishlists || []).map(async (wishlist) => {
      const { data: items } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("wishlist_id", wishlist.id)
        .order("created_at", { ascending: false });

      return mapWishlist(wishlist, items || []);
    }),
  );

  return wishlistsWithItems;
};

/**
 * Отримує конкретний wishlist
 */
export const getWishlist = async (wishlistId: string): Promise<Wishlist> => {
  const { data: wishlist, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("id", wishlistId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch wishlist: ${error.message}`);
  }

  // Завантажуємо items
  const { data: items } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("wishlist_id", wishlistId)
    .order("created_at", { ascending: false });

  return mapWishlist(wishlist, items || []);
};

/**
 * Створює новий wishlist
 */
/**
 * Notifies all followers about an event
 */
const notifyFollowers = async (
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>,
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    // Get all followers
    const { data: followers } = await supabase
      .from("friends")
      .select("user_id")
      .eq("friend_id", userId);

    if (!followers || followers.length === 0) return;

    // Create notification for each follower
    await Promise.all(
      followers.map((f) =>
        createNotification(f.user_id, type, title, message, data),
      ),
    );
  } catch (e) {
    console.error("Failed to notify followers:", e);
  }
};

export const createWishlist = async (
  wishlist: Omit<Wishlist, "id" | "createdAt" | "updatedAt" | "items">,
  notifyFollowersFlag = true,
): Promise<Wishlist> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Якщо це default, знімаємо default з інших
  if (wishlist.isDefault) {
    await supabase
      .from("wishlists")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("wishlists")
    .insert({
      user_id: userId,
      name: wishlist.name,
      description: wishlist.description || null,
      is_public: wishlist.isPublic,
      is_default: wishlist.isDefault,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create wishlist: ${error.message}`);
  }

  // Notify followers about new public wishlist
  if (wishlist.isPublic && notifyFollowersFlag) {
    const telegramUser = getTelegramUser();
    const userName = telegramUser?.first_name || "Someone";

    notifyFollowers(
      "wishlist_shared",
      "📝 New Wishlist!",
      `${userName} created a new wishlist: "${wishlist.name}"`,
      { wishlistId: data.id, userId },
    );
  }

  return mapWishlist(data, []);
};

/**
 * Оновлює wishlist
 */
export const updateWishlist = async (
  wishlistId: string,
  updates: Partial<Wishlist>,
): Promise<Wishlist> => {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
  if (updates.isDefault !== undefined) {
    updateData.is_default = updates.isDefault;

    // Якщо робимо default, знімаємо default з інших
    if (updates.isDefault) {
      const userId = getCurrentUserId();
      await supabase
        .from("wishlists")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true)
        .neq("id", wishlistId);
    }
  }

  const { data, error } = await supabase
    .from("wishlists")
    .update(updateData)
    .eq("id", wishlistId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update wishlist: ${error.message}`);
  }

  return mapWishlist(data, []);
};

/**
 * Видаляє wishlist
 */
export const deleteWishlist = async (wishlistId: string): Promise<void> => {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", wishlistId);

  if (error) {
    throw new Error(`Failed to delete wishlist: ${error.message}`);
  }
};

/**
 * Отримує share link для wishlist
 */
export const getShareLink = async (wishlistId: string): Promise<string> => {
  // Генеруємо share link
  const botUsername = "wishbucket_bot"; // Замініть на ваш bot username
  return `https://t.me/${botUsername}?start=wishlist_${wishlistId}`;
};

// ============================================
// Items API
// ============================================

/**
 * Додає item до wishlist
 */
export const addItem = async (
  wishlistId: string,
  item: Omit<WishlistItem, "id" | "createdAt" | "updatedAt">,
  notifyFollowersFlag = true,
): Promise<WishlistItem> => {
  const userId = getCurrentUserId();

  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({
      wishlist_id: wishlistId,
      name: item.name,
      description: item.description || null,
      url: item.url,
      original_url: item.originalUrl,
      affiliate_url: item.affiliateUrl || null,
      image_url: item.imageUrl || null,
      price: item.price || null,
      currency: item.currency || "USD",
      priority: item.priority,
      status: item.status || "available",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add item: ${error.message}`);
  }

  // Check if wishlist is public and notify followers
  if (notifyFollowersFlag && userId) {
    try {
      const { data: wishlist } = await supabase
        .from("wishlists")
        .select("is_public, name")
        .eq("id", wishlistId)
        .single();

      if (wishlist?.is_public) {
        const telegramUser = getTelegramUser();
        const userName = telegramUser?.first_name || "Someone";

        notifyFollowers(
          "friend_added_item",
          "✨ New Item Added!",
          `${userName} added "${item.name}" to their wishlist "${wishlist.name}"`,
          { wishlistId, itemId: data.id, userId },
        );
      }
    } catch (e) {
      console.error("Failed to check wishlist publicity:", e);
    }
  }

  return mapItem(data);
};

/**
 * Оновлює item
 */
export const updateItem = async (
  itemId: string,
  updates: Partial<WishlistItem>,
): Promise<WishlistItem> => {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.url !== undefined) updateData.url = updates.url;
  if (updates.affiliateUrl !== undefined)
    updateData.affiliate_url = updates.affiliateUrl;
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.currency !== undefined) updateData.currency = updates.currency;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.reservedBy !== undefined)
    updateData.reserved_by = updates.reservedBy;
  if (updates.purchasedBy !== undefined)
    updateData.purchased_by = updates.purchasedBy;

  const { data, error } = await supabase
    .from("wishlist_items")
    .update(updateData)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update item: ${error.message}`);
  }

  return mapItem(data);
};

/**
 * Видаляє item
 */
export const deleteItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`);
  }
};

/**
 * Резервує item
 */
export const reserveItem = async (itemId: string): Promise<WishlistItem> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  return updateItem(itemId, {
    status: "reserved",
    reservedBy: userId,
  });
};

/**
 * Позначає item як куплений
 */
export const purchaseItem = async (itemId: string): Promise<WishlistItem> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  return updateItem(itemId, {
    status: "purchased",
    purchasedBy: userId,
  });
};

// ============================================
// URL Processing API
// ============================================

/**
 * Обробляє URL та додає affiliate link
 * Примітка: Це має бути реалізовано на бекенді або через Supabase Edge Function
 */
export const processUrl = async (
  url: string,
): Promise<{
  url: string;
  affiliateUrl: string;
  hasAffiliate: boolean;
  programName?: string;
  productInfo?: {
    title?: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
  };
}> => {
  // TODO: Реалізувати через Supabase Edge Function або окремий бекенд
  // Поки що використовуємо клієнтську логіку
  const { processAffiliateLink } = await import("../utils/affiliate");
  const result = processAffiliateLink(url);

  return {
    url: result.url,
    affiliateUrl: result.url,
    hasAffiliate: result.hasAffiliate,
    programName: result.programName,
    productInfo: {}, // Буде заповнено через Edge Function
  };
};

// ============================================
// Secret Santa API
// ============================================

/**
 * Отримує всі Secret Santa події
 */
export const getSecretSantas = async (): Promise<SecretSanta[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("secret_santa")
    .select(
      `
      *,
      secret_santa_participants (*)
    `,
    )
    .or(
      `organizer_id.eq.${userId},secret_santa_participants.user_id.eq.${userId}`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch secret santas: ${error.message}`);
  }

  // TODO: Map до SecretSanta типу
  return (data || []) as any;
};

/**
 * Створює Secret Santa подію
 */
export const createSecretSanta = async (
  santa: Omit<SecretSanta, "id" | "createdAt">,
): Promise<SecretSanta> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("secret_santa")
    .insert({
      organizer_id: userId,
      name: santa.name,
      description: santa.description || null,
      budget: santa.budget || null,
      exchange_date: santa.exchangeDate,
      is_active: santa.isActive,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create secret santa: ${error.message}`);
  }

  // TODO: Map до SecretSanta типу
  return data as any;
};

/**
 * Приєднується до Secret Santa
 */
export const joinSecretSanta = async (
  santaId: string,
): Promise<SecretSanta> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("secret_santa_participants").insert({
    secret_santa_id: santaId,
    user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to join secret santa: ${error.message}`);
  }

  return getSecretSantas().then(
    (santas) => santas.find((s) => s.id === santaId)!,
  );
};

/**
 * Розігрує імена для Secret Santa
 */
export const drawSecretSanta = async (
  santaId: string,
): Promise<SecretSanta> => {
  // TODO: Реалізувати логіку розіграшу
  // Це має бути зроблено через Supabase Edge Function для безпеки
  throw new Error("Not implemented yet");
};

// ============================================
// Crowdfunding API
// ============================================

/**
 * Створює crowdfunding для item
 */
export const createCrowdfunding = async (
  itemId: string,
  targetAmount: number,
): Promise<WishlistItem> => {
  const { data, error } = await supabase
    .from("crowdfunding")
    .insert({
      item_id: itemId,
      target_amount: targetAmount,
      current_amount: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create crowdfunding: ${error.message}`);
  }

  // Оновлюємо item
  return updateItem(itemId, {
    crowdfunding: {
      id: data.id,
      itemId: itemId,
      targetAmount: targetAmount,
      currentAmount: 0,
      contributors: [],
      isActive: true,
      createdAt: data.created_at,
    },
  });
};

/**
 * Вносить внесок до crowdfunding
 */
export const contributeToCrowdfunding = async (
  itemId: string,
  amount: number,
): Promise<WishlistItem> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Знаходимо crowdfunding
  const { data: crowdfunding, error: findError } = await supabase
    .from("crowdfunding")
    .select("*")
    .eq("item_id", itemId)
    .single();

  if (findError || !crowdfunding) {
    throw new Error("Crowdfunding not found");
  }

  // Додаємо внесок
  const { error: contributeError } = await supabase
    .from("crowdfunding_contributors")
    .insert({
      crowdfunding_id: crowdfunding.id,
      user_id: userId,
      amount: amount,
    });

  if (contributeError) {
    throw new Error(`Failed to contribute: ${contributeError.message}`);
  }

  // Оновлюємо item (current_amount оновлюється автоматично через тригер)
  const { data: updatedCrowdfunding } = await supabase
    .from("crowdfunding")
    .select("*")
    .eq("id", crowdfunding.id)
    .single();

  // Завантажуємо contributors
  const { data: contributors } = await supabase
    .from("crowdfunding_contributors")
    .select("*")
    .eq("crowdfunding_id", crowdfunding.id);

  return updateItem(itemId, {
    crowdfunding: {
      id: crowdfunding.id,
      itemId: itemId,
      targetAmount: crowdfunding.target_amount,
      currentAmount: updatedCrowdfunding?.current_amount || 0,
      contributors: (contributors || []).map((c) => ({
        userId: c.user_id,
        amount: parseFloat(c.amount),
        contributedAt: c.contributed_at,
      })),
      isActive: crowdfunding.is_active,
      createdAt: crowdfunding.created_at,
    },
  });
};

// ============================================
// Birthday Reminders API
// ============================================

/**
 * Отримує нагадування про дні народження
 */
export const getBirthdayReminders = async (): Promise<BirthdayReminder[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Отримуємо друзів
  const { data: friends } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  if (!friends || friends.length === 0) {
    return [];
  }

  const friendIds = friends.map((f) => f.friend_id);

  // Отримуємо дані друзів з днями народження
  const { data: friendsData } = await supabase
    .from("users")
    .select("user_id, telegram_data, birthday")
    .in("user_id", friendIds)
    .not("birthday", "is", null);

  if (!friendsData) {
    return [];
  }

  const now = new Date();
  const reminders: BirthdayReminder[] = [];

  friendsData.forEach((friend) => {
    if (!friend.birthday) return;

    const birthday = new Date(friend.birthday);
    const thisYearBirthday = new Date(
      now.getFullYear(),
      birthday.getMonth(),
      birthday.getDate(),
    );

    // Якщо день народження вже пройшов цього року, беремо наступний рік
    if (thisYearBirthday < now) {
      thisYearBirthday.setFullYear(now.getFullYear() + 1);
    }

    const daysUntil = Math.ceil(
      (thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil <= 7) {
      const telegramData = JSON.parse(friend.telegram_data);
      reminders.push({
        userId: userId,
        friendId: friend.user_id,
        friendName: `${telegramData.first_name} ${
          telegramData.last_name || ""
        }`.trim(),
        birthday: friend.birthday,
        daysUntil: daysUntil,
        notified: false,
      });
    }
  });

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
};

// ============================================
// Notifications API
// ============================================

/**
 * Отримує всі нотифікації користувача
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return (data || []).map((n) => ({
    id: n.id,
    userId: n.user_id,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    data: n.data,
    read: n.read,
    createdAt: n.created_at,
  }));
};

/**
 * Позначає нотифікацію як прочитану
 */
export const markNotificationRead = async (
  notificationId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

/**
 * Позначає всі нотифікації як прочитані
 */
export const markAllNotificationsRead = async (): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }
};

/**
 * Отримує кількість непрочитаних нотифікацій
 */
export const getUnreadNotificationsCount = async (): Promise<number> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    throw new Error(`Failed to count notifications: ${error.message}`);
  }

  return count || 0;
};

/**
 * Створює нотифікацію (викликається з бекенду)
 */
export const createNotification = async (
  targetUserId: number,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>,
): Promise<void> => {
  const { error } = await supabase.from("notifications").insert({
    user_id: targetUserId,
    type,
    title,
    message,
    data: data || null,
    read: false,
  });

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  // Trigger Telegram notification via Edge Function
  try {
    await supabase.functions.invoke("send-telegram-notification", {
      body: {
        userId: targetUserId,
        title,
        message,
        type,
      },
    });
  } catch (e) {
    console.error("Failed to send Telegram notification:", e);
    // Don't throw - notification was still saved
  }
};

// ============================================
// Referrals API
// ============================================

/**
 * Отримує статистику рефералів
 */
export const getReferralStats = async (): Promise<ReferralStats> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("referral_code, referrals, bonus_points")
    .eq("user_id", userId)
    .single();

  if (userError) {
    throw new Error(`Failed to get referral stats: ${userError.message}`);
  }

  // Get detailed referral list
  const { data: referrals, error: referralsError } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId);

  if (referralsError) {
    console.error("Failed to get referrals:", referralsError);
  }

  const totalBonusEarned = (referrals || []).reduce(
    (sum, r) => sum + (r.bonus_earned || 0),
    0,
  );

  return {
    referralCode: user.referral_code,
    totalReferrals: user.referrals || 0,
    activeReferrals: referrals?.length || 0,
    totalBonusEarned,
    // Use /app format with startapp - shows confirmation dialog for new users AND passes parameter
    referralLink: `https://t.me/wishbucket_bot/app?startapp=ref_${user.referral_code}`,
  };
};

/**
 * Debug: Check if referrals table exists and is accessible
 */
export const checkReferralsTable = async (): Promise<{
  tableExists: boolean;
  userExists: boolean;
  currentUserId: number | null;
  userReferralCode: string | null;
  referralsCount: number;
  error?: string;
}> => {
  const userId = getCurrentUserId();
  console.log("🔍 checkReferralsTable - Current user ID:", userId);

  const result: any = {
    tableExists: false,
    userExists: false,
    currentUserId: userId,
    userReferralCode: null,
    referralsCount: 0,
  };

  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, referral_code, referrals, bonus_points")
      .eq("user_id", userId)
      .single();

    console.log("📋 User lookup:", { user, error: userError?.message });

    if (user) {
      result.userExists = true;
      result.userReferralCode = user.referral_code;
      result.userReferrals = user.referrals;
      result.userBonusPoints = user.bonus_points;
    }

    if (userError) {
      result.userError = userError.message;
    }

    // Check if referrals table is accessible
    const { data: referrals, error: refError } = await supabase
      .from("referrals")
      .select("*")
      .limit(5);

    console.log("📋 Referrals table check:", {
      data: referrals,
      error: refError?.message,
    });

    if (!refError) {
      result.tableExists = true;
      result.referralsCount = referrals?.length || 0;
      result.sampleReferrals = referrals;
    } else {
      result.tableError = refError.message;
    }

    // Check all users with referral codes
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select("user_id, referral_code, referrals")
      .limit(10);

    console.log("📋 All users sample:", {
      data: allUsers,
      error: allUsersError?.message,
    });

    if (allUsers) {
      result.sampleUsers = allUsers;
    }
  } catch (e: any) {
    result.error = e?.message || String(e);
  }

  return result;
};

/**
 * Отримує список рефералів
 */
export const getReferrals = async (): Promise<Referral[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("referrals")
    .select(
      `
      id,
      referred_user_id,
      bonus_earned,
      created_at,
      referred_user:users!referrals_referred_user_id_fkey (
        telegram_data
      )
    `,
    )
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get referrals: ${error.message}`);
  }

  return (data || []).map((r) => {
    const telegramData =
      typeof r.referred_user.telegram_data === "string"
        ? JSON.parse(r.referred_user.telegram_data)
        : r.referred_user.telegram_data;

    return {
      id: r.id,
      referrerId: userId,
      referredUserId: r.referred_user_id,
      referredUser: {
        firstName: telegramData.first_name,
        lastName: telegramData.last_name,
        username: telegramData.username,
        photoUrl: telegramData.photo_url,
      },
      bonusEarned: r.bonus_earned || 0,
      createdAt: r.created_at,
    };
  });
};

/**
 * Застосовує реферальний код при реєстрації
 */
export const applyReferral = async (
  referralCode: string,
): Promise<{ success: boolean; bonus: number }> => {
  console.log("🔄 applyReferral called with code:", referralCode);

  const userId = getCurrentUserId();
  console.log("👤 Current user ID:", userId);

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Find referrer
  console.log("🔍 Looking for referrer with code:", referralCode.toUpperCase());
  const { data: referrer, error: findError } = await supabase
    .from("users")
    .select("user_id, referrals")
    .eq("referral_code", referralCode.toUpperCase())
    .single();

  console.log("📋 Referrer lookup result:", {
    referrer,
    error: findError?.message,
  });

  if (findError || !referrer) {
    throw new Error("Invalid referral code");
  }

  if (referrer.user_id === userId) {
    throw new Error("Cannot use your own referral code");
  }

  // Check if already referred
  console.log("🔍 Checking if user already used a referral...");
  const { data: existingReferral, error: existingError } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_user_id", userId)
    .single();

  console.log("📋 Existing referral check:", {
    existingReferral,
    error: existingError?.message,
  });

  if (existingReferral) {
    throw new Error("You have already used a referral code");
  }

  // Create referral record
  const bonusForReferrer = 100;
  const bonusForReferred = 50;

  console.log("📝 Creating referral record:", {
    referrer_id: referrer.user_id,
    referred_user_id: userId,
    bonus_earned: bonusForReferrer,
  });

  const { error: createError } = await supabase.from("referrals").insert({
    referrer_id: referrer.user_id,
    referred_user_id: userId,
    bonus_earned: bonusForReferrer,
  });

  console.log("📋 Referral insert result:", { error: createError?.message });

  if (createError) {
    throw new Error(`Failed to apply referral: ${createError.message}`);
  }

  // Get referrer's current bonus points
  const { data: referrerData } = await supabase
    .from("users")
    .select("bonus_points")
    .eq("user_id", referrer.user_id)
    .single();

  // Update referrer's stats
  await supabase
    .from("users")
    .update({
      referrals: (referrer.referrals || 0) + 1,
      bonus_points: (referrerData?.bonus_points || 0) + bonusForReferrer,
    })
    .eq("user_id", referrer.user_id);

  // Update referred user's bonus
  const { data: userData } = await supabase
    .from("users")
    .select("bonus_points")
    .eq("user_id", userId)
    .single();

  await supabase
    .from("users")
    .update({ bonus_points: (userData?.bonus_points || 0) + bonusForReferred })
    .eq("user_id", userId);

  // Notify referrer
  await createNotification(
    referrer.user_id,
    "referral_signup",
    "🎉 New Referral!",
    `Someone joined using your referral code! You earned ${bonusForReferrer} bonus points.`,
  );

  return {
    success: true,
    bonus: bonusForReferred,
  };
};

// ============================================
// Gift Hints API
// ============================================

export interface GiftHint {
  id: string;
  userId: number;
  aboutUserId?: number;
  aboutName: string;
  aboutUsername?: string;
  hintText?: string;
  messageType: "text" | "voice" | "video" | "photo" | "video_note" | "document";
  mediaFileId?: string;
  mediaThumbnailUrl?: string;
  telegramMessageId?: number;
  telegramChatId?: number;
  forwardDate?: string;
  status: "active" | "purchased" | "archived";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all gift hints for the current user
 */
export const getGiftHints = async (): Promise<GiftHint[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("gift_hints")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching gift hints:", error);
    return [];
  }

  return (data || []).map((h: any) => ({
    id: h.id,
    userId: h.user_id,
    aboutUserId: h.about_user_id,
    aboutName: h.about_name || "Someone",
    aboutUsername: h.about_username,
    hintText: h.hint_text,
    messageType: h.message_type,
    mediaFileId: h.media_file_id,
    mediaThumbnailUrl: h.media_thumbnail_url,
    telegramMessageId: h.telegram_message_id,
    telegramChatId: h.telegram_chat_id,
    forwardDate: h.forward_date,
    status: h.status,
    notes: h.notes,
    createdAt: h.created_at,
    updatedAt: h.updated_at,
  }));
};

/**
 * Get hints grouped by person
 */
export const getHintsGroupedByPerson = async (): Promise<
  Map<string, GiftHint[]>
> => {
  const hints = await getGiftHints();
  const grouped = new Map<string, GiftHint[]>();

  for (const hint of hints) {
    const key = hint.aboutName.toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(hint);
  }

  return grouped;
};

/**
 * Update hint status (mark as purchased, archive, etc.)
 */
export const updateHintStatus = async (
  hintId: string,
  status: "active" | "purchased" | "archived",
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("gift_hints")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", hintId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to update hint status");
  }
};

/**
 * Add notes to a hint
 */
export const updateHintNotes = async (
  hintId: string,
  notes: string,
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("gift_hints")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", hintId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to update hint notes");
  }
};

/**
 * Delete a hint
 */
export const deleteHint = async (hintId: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("gift_hints")
    .delete()
    .eq("id", hintId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to delete hint");
  }
};

/**
 * Get hint count by person
 */
export const getHintCountByPerson = async (): Promise<
  Array<{ name: string; count: number }>
> => {
  const hints = await getGiftHints();
  const counts = new Map<string, { name: string; count: number }>();

  for (const hint of hints) {
    if (hint.status !== "active") continue;
    const key = hint.aboutName.toLowerCase();
    if (!counts.has(key)) {
      counts.set(key, { name: hint.aboutName, count: 0 });
    }
    counts.get(key)!.count++;
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
};

/**
 * Resend hint message to user's Telegram chat
 */
export const resendHintToChat = async (hintId: string): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-hint`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hintId, userId }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to resend hint");
  }

  return true;
};
