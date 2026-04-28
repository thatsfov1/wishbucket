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

const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const mapUserToProfile = (
  user: any,
  telegramUser: TelegramUser | null,
): UserProfile => {
  return {
    userId: user.user_id,
    telegramUser: telegramUser || JSON.parse(user.telegram_data),
    birthday: user.birthday || undefined,
    friends: [],
    referralCode: user.referral_code,
    referrals: user.referrals || 0,
    premiumStatus: user.premium_status || "free",
    premiumExpiresAt: user.premium_expires_at || undefined,
    bonusPoints: user.bonus_points || 0,
    createdAt: user.created_at,
  };
};

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

const mapItem = (item: any): WishlistItem => {
  return {
    id: item.id,
    wishlistId: item.wishlist_id,
    name: item.name,
    description: item.description || undefined,
    url: item.url,
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

export interface WishlistSummary {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  eventDate?: string;
  isPublic: boolean;
  isDefault: boolean;
  itemCount: number;
  createdAt: string;
}

export interface HomePageData {
  wishlists: WishlistSummary[];
  friendsCount: number;
  followersCount: number;
}

export const getHomePageData = async (): Promise<HomePageData> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [
    wishlistsResult,
    itemsResult,
    friendsCountResult,
    followersCountResult,
  ] = await Promise.all([
    supabase
      .from("wishlists")
      .select(
        `id, name, description, image_url, event_date, is_public, is_default, created_at`,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("wishlist_items")
      .select("wishlist_id, wishlists!inner(user_id)")
      .eq("wishlists.user_id", userId)
      .neq("status", "purchased"),
    supabase
      .from("friends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("friends")
      .select("*", { count: "exact", head: true })
      .eq("friend_id", userId),
  ]);

  if (wishlistsResult.error) {
    throw new Error(`Failed to fetch data: ${wishlistsResult.error.message}`);
  }

  const itemCountMap = new Map<string, number>();
  (itemsResult.data || []).forEach((item: any) => {
    itemCountMap.set(
      item.wishlist_id,
      (itemCountMap.get(item.wishlist_id) || 0) + 1,
    );
  });

  const wishlists: WishlistSummary[] = (wishlistsResult.data || []).map(
    (w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description || undefined,
      imageUrl: w.image_url || undefined,
      eventDate: w.event_date || undefined,
      isPublic: w.is_public,
      isDefault: w.is_default,
      itemCount: itemCountMap.get(w.id) || 0,
      createdAt: w.created_at,
    }),
  );

  return {
    wishlists,
    friendsCount: friendsCountResult.count || 0,
    followersCount: followersCountResult.count || 0,
  };
};


export const getWishlistsSummary = async (): Promise<WishlistSummary[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [wishlistsResult, itemsResult] = await Promise.all([
    supabase
      .from("wishlists")
      .select(
        `id, name, description, image_url, event_date, is_public, is_default, created_at`,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("wishlist_items")
      .select("wishlist_id, status, wishlists!inner(user_id)")
      .eq("wishlists.user_id", userId),
  ]);

  if (wishlistsResult.error) {
    throw new Error(
      `Failed to fetch wishlists: ${wishlistsResult.error.message}`,
    );
  }

  const itemCountMap = new Map<string, number>();
  (itemsResult.data || []).forEach((item: any) => {
    if (item.status !== "purchased") {
      itemCountMap.set(
        item.wishlist_id,
        (itemCountMap.get(item.wishlist_id) || 0) + 1,
      );
    }
  });

  return (wishlistsResult.data || []).map((w: any) => ({
    id: w.id,
    name: w.name,
    description: w.description || undefined,
    imageUrl: w.image_url || undefined,
    eventDate: w.event_date || undefined,
    isPublic: w.is_public,
    isDefault: w.is_default,
    itemCount: itemCountMap.get(w.id) || 0,
    createdAt: w.created_at,
  }));
};

export const getFriendsCount = async (): Promise<number> => {
  const userId = getCurrentUserId();
  if (!userId) return 0;

  const { count } = await supabase
    .from("friends")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return count || 0;
};

export const getFollowersCount = async (): Promise<number> => {
  const userId = getCurrentUserId();
  if (!userId) return 0;

  const { count } = await supabase
    .from("friends")
    .select("*", { count: "exact", head: true })
    .eq("friend_id", userId);

  return count || 0;
};

export interface ScrapedProductInfo {
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  description?: string;
  /** Set when automatic scraping failed; show to the user. */
  scrapeHint?: string;
}

export const scrapeProductUrl = async (
  url: string,
): Promise<ScrapedProductInfo> => {
  try {
    const { data, error } = await supabase.functions.invoke("scrape-url", {
      body: { url },
      headers: {
        "Accept-Language": navigator.languages?.length
          ? navigator.languages.join(",")
          : navigator.language || "en-US",
      },
    });

    const scrapeData = data as {
      success?: boolean;
      manualEntryRequired?: boolean;
      error?: string;
      productInfo?: ScrapedProductInfo;
    };

    console.log("📦 Scrape function response:", { data: scrapeData, error });

    if (error) {
      console.error("Supabase scrape function error:", error);
      return {
        scrapeHint:
          "Could not reach the scraper. Please fill in the form manually.",
      };
    }

    const manualEntry =
      scrapeData?.manualEntryRequired === true || scrapeData?.success === false;

    if (manualEntry || (scrapeData?.error && scrapeData?.success !== true)) {
      const hint =
        typeof scrapeData?.error === "string" && scrapeData.error.trim()
          ? scrapeData.error
          : "Could not load product details. Please fill in the form manually.";
      return { scrapeHint: hint };
    }

    const productInfo = scrapeData?.productInfo ?? {};
    console.log("📦 Extracted productInfo:", productInfo);

    return {
      title: productInfo?.title || undefined,
      imageUrl: productInfo?.imageUrl || undefined,
      price: productInfo?.price ? Number(productInfo.price) : undefined,
      currency: productInfo?.currency || undefined,
      description: productInfo?.description || undefined,
    };
  } catch (error) {
    console.error("Error scraping URL:", error);
    return {
      scrapeHint:
        "Could not reach the scraper. Please fill in the form manually.",
    };
  }
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error("User not authenticated");
  }

  const userId = telegramUser.id;

  const [userResult, friendsResult] = await Promise.all([
    supabase.from("users").select("*").eq("user_id", userId).single(),
    supabase.from("friends").select("friend_id").eq("user_id", userId),
  ]);

  if (userResult.error && userResult.error.code !== "PGRST116") {
    throw new Error(`Failed to fetch user: ${userResult.error.message}`);
  }

  if (!userResult.data) {
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

  const userProfile = mapUserToProfile(userResult.data, telegramUser);
  userProfile.friends = friendsResult.data?.map((f) => f.friend_id) || [];

  return userProfile;
};

export const getCompletedSocialTasks = async (): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_social_tasks")
    .select("task_id")
    .eq("user_id", userId);

  if (error) {
    console.warn("Failed to load completed social tasks:", error.message);
    return [];
  }

  return (data ?? []).map((row: { task_id: string }) => row.task_id);
};

export const markSocialTaskCompleted = async (
  taskId: string,
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("user_social_tasks").upsert(
    {
      user_id: userId,
      task_id: taskId,
      completed_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,task_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw new Error(`Failed to save social task completion: ${error.message}`);
  }
};


export const syncCompletedSocialTasks = async (
  taskIds: string[],
): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    return taskIds;
  }

  if (taskIds.length > 0) {
    const rows = taskIds.map((taskId) => ({
      user_id: userId,
      task_id: taskId,
      completed_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("user_social_tasks").upsert(rows, {
      onConflict: "user_id,task_id",
      ignoreDuplicates: true,
    });

    if (error) {
      console.warn("Failed to sync social tasks:", error.message);
    }
  }

  return getCompletedSocialTasks();
};


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


export const applyReferralCode = async (code: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

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

  const { data: referrerData } = await supabase
    .from("users")
    .select("referrals")
    .eq("user_id", referrer.user_id)
    .single();

  await supabase
    .from("users")
    .update({ referrals: (referrerData?.referrals || 0) + 1 })
    .eq("user_id", referrer.user_id);

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

export const addFriend = async (friendId: number): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  if (userId === friendId) {
    throw new Error("Cannot add yourself as a friend");
  }

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
      throw new Error("Friend already added");
    }
    throw new Error(`Failed to add friend: ${error.message}`);
  }

  const telegramUser = getTelegramUser();
  const userName = telegramUser?.first_name || "Someone";

  try {
    await createNotification(friendId, "new_follower", {
      actorName: userName,
      followerId: userId,
      isFollowBack,
    });
  } catch (e) {
    console.error("Failed to send follow notification:", e);
  }
};

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

export interface FriendsPageData {
  following: Friend[];
  followers: Friend[];
}

export const getFriendsPageData = async (): Promise<FriendsPageData> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [followingResult, followersResult] = await Promise.all([
    supabase
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
      .eq("user_id", userId),
    supabase
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
      .eq("friend_id", userId),
  ]);

  if (followingResult.error) {
    throw new Error(
      `Failed to fetch friends: ${followingResult.error.message}`,
    );
  }
  if (followersResult.error) {
    throw new Error(
      `Failed to fetch followers: ${followersResult.error.message}`,
    );
  }

  const followingIds = new Set(
    followingResult.data?.map((f) => f.friend_id) || [],
  );
  const followerIds = new Set(
    followersResult.data?.map((f) => f.user_id) || [],
  );

  const following: Friend[] = (followingResult.data || []).map((f) => {
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

  const followers: Friend[] = (followersResult.data || []).map((f) => {
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

  return { following, followers };
};

export const getFriends = async (): Promise<Friend[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [followingResult, followersResult] = await Promise.all([
    supabase
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
      .eq("user_id", userId),
    supabase.from("friends").select("user_id").eq("friend_id", userId),
  ]);

  if (followingResult.error) {
    throw new Error(
      `Failed to fetch friends: ${followingResult.error.message}`,
    );
  }

  const following = followingResult.data;
  const followerIds = new Set(
    followersResult.data?.map((f) => f.user_id) || [],
  );

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

export const getFollowers = async (): Promise<Friend[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [followersResult, followingResult] = await Promise.all([
    supabase
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
      .eq("friend_id", userId),
    supabase.from("friends").select("friend_id").eq("user_id", userId),
  ]);

  if (followersResult.error) {
    throw new Error(
      `Failed to fetch followers: ${followersResult.error.message}`,
    );
  }

  const followers = followersResult.data;
  const followingIds = new Set(
    followingResult.data?.map((f) => f.friend_id) || [],
  );

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

export const searchUsers = async (query: string): Promise<Friend[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  const { data: users, error } = await supabase
    .from("public_user_profiles")
    .select("user_id, telegram_data")
    .neq("user_id", userId)
    .or(
      `username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`,
    )
    .limit(20);

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  const { data: following } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  const followingIds = new Set(following?.map((f) => f.friend_id) || []);

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

  const { data: following } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  const followingIds = new Set(following?.map((f) => f.friend_id) || []);

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

export const getUserById = async (
  targetUserId: number,
): Promise<Friend | null> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [userResult, followingResult, followerResult] = await Promise.all([
    supabase
      .from("users")
      .select("user_id, telegram_data")
      .eq("user_id", targetUserId)
      .single(),
    supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", userId)
      .eq("friend_id", targetUserId)
      .maybeSingle(),
    supabase
      .from("friends")
      .select("user_id")
      .eq("user_id", targetUserId)
      .eq("friend_id", userId)
      .maybeSingle(),
  ]);

  if (userResult.error || !userResult.data) {
    return null;
  }

  const user = userResult.data;
  const telegramData =
    typeof user.telegram_data === "string"
      ? JSON.parse(user.telegram_data)
      : user.telegram_data;

  return {
    id: user.user_id,
    firstName: telegramData.first_name,
    lastName: telegramData.last_name,
    username: telegramData.username,
    photoUrl: telegramData.photo_url,
    isFollowing: !!followingResult.data,
    isFollowedBy: !!followerResult.data,
    addedAt: "",
  };
};

export interface FriendProfileData {
  user: Friend | null;
  wishlists: Wishlist[];
}

export const getFriendProfileData = async (
  targetUserId: number,
): Promise<FriendProfileData> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [userResult, followingResult, followerResult, wishlistsResult] =
    await Promise.all([
      supabase
        .from("users")
        .select("user_id, telegram_data, birthday")
        .eq("user_id", targetUserId)
        .single(),
      supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", userId)
        .eq("friend_id", targetUserId)
        .maybeSingle(),
      supabase
        .from("friends")
        .select("user_id")
        .eq("user_id", targetUserId)
        .eq("friend_id", userId)
        .maybeSingle(),
      supabase
        .from("wishlists")
        .select(`*, wishlist_items (*)`)
        .eq("user_id", targetUserId)
        .eq("is_public", true)
        .order("created_at", { ascending: false }),
    ]);

  let user: Friend | null = null;
  if (userResult.data) {
    const telegramData =
      typeof userResult.data.telegram_data === "string"
        ? JSON.parse(userResult.data.telegram_data)
        : userResult.data.telegram_data;

    user = {
      id: userResult.data.user_id,
      firstName: telegramData.first_name,
      lastName: telegramData.last_name,
      username: telegramData.username,
      photoUrl: telegramData.photo_url,
      birthday: userResult.data.birthday || undefined,
      isFollowing: !!followingResult.data,
      isFollowedBy: !!followerResult.data,
      addedAt: "",
    };
  }

  const wishlists = (wishlistsResult.data || []).map((wishlist: any) => {
    const items = (wishlist.wishlist_items || []).sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return mapWishlist(wishlist, items);
  });

  return { user, wishlists };
};

export const getUserPublicWishlists = async (
  targetUserId: number,
): Promise<Wishlist[]> => {
  const { data: wishlists, error } = await supabase
    .from("wishlists")
    .select(
      `
      *,
      wishlist_items (*)
    `,
    )
    .eq("user_id", targetUserId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch wishlists: ${error.message}`);
  }

  return (wishlists || []).map((wishlist) => {
    const items = (wishlist.wishlist_items || []).sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return mapWishlist(wishlist, items);
  });
};


export const getUserByUsername = async (
  username: string,
): Promise<Friend | null> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const cleanUsername = username.toLowerCase().replace("@", "");

  const { data: user, error } = await supabase
    .from("public_user_profiles")
    .select("user_id, telegram_data")
    .eq("username", cleanUsername)
    .neq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to find user: ${error.message}`);
  }

  if (!user) return null;

  const telegramData =
    typeof user.telegram_data === "string"
      ? JSON.parse(user.telegram_data)
      : user.telegram_data;

  const [followingResult, followerResult] = await Promise.all([
    supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", userId)
      .eq("friend_id", user.user_id)
      .maybeSingle(),
    supabase
      .from("friends")
      .select("user_id")
      .eq("user_id", user.user_id)
      .eq("friend_id", userId)
      .maybeSingle(),
  ]);

  return {
    id: user.user_id,
    firstName: telegramData.first_name,
    lastName: telegramData.last_name,
    username: telegramData.username,
    photoUrl: telegramData.photo_url,
    isFollowing: !!followingResult.data,
    isFollowedBy: !!followerResult.data,
    addedAt: "",
  };
};

export const getWishlists = async (): Promise<Wishlist[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data: wishlists, error } = await supabase
    .from("wishlists")
    .select(
      `
      *,
      wishlist_items (*)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch wishlists: ${error.message}`);
  }

  return (wishlists || []).map((wishlist) => {
        const items = (wishlist.wishlist_items || []).sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return mapWishlist(wishlist, items);
  });
};

export const getWishlist = async (wishlistId: string): Promise<Wishlist> => {
  const { data: wishlist, error } = await supabase
    .from("wishlists")
    .select(
      `
      *,
      wishlist_items (*)
    `,
    )
    .eq("id", wishlistId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch wishlist: ${error.message}`);
  }

  const items = (wishlist.wishlist_items || []).sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return mapWishlist(wishlist, items);
};

const notifyFollowers = async (
  type: NotificationType,
  data?: Record<string, any>,
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    const { data: followers } = await supabase
      .from("friends")
      .select("user_id")
      .eq("friend_id", userId);

    if (!followers || followers.length === 0) return;

    await Promise.all(
      followers.map((f) => createNotification(f.user_id, type, data)),
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
      image_url: wishlist.imageUrl || null,
      event_date: wishlist.eventDate || null,
      is_public: wishlist.isPublic,
      is_default: wishlist.isDefault,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create wishlist: ${error.message}`);
  }

  if (wishlist.isPublic && notifyFollowersFlag) {
    const telegramUser = getTelegramUser();
    const userName = telegramUser?.first_name || "Someone";

    notifyFollowers("wishlist_shared", {
      actorName: userName,
      wishlistName: wishlist.name,
      wishlistId: data.id,
      userId,
    });
  }

  return mapWishlist(data, []);
};

export const updateWishlist = async (
  wishlistId: string,
  updates: Partial<Wishlist>,
): Promise<Wishlist> => {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
  if (updates.eventDate !== undefined)
    updateData.event_date = updates.eventDate;
  if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
  if (updates.isDefault !== undefined) {
    updateData.is_default = updates.isDefault;

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

export const deleteWishlist = async (wishlistId: string): Promise<void> => {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", wishlistId);

  if (error) {
    throw new Error(`Failed to delete wishlist: ${error.message}`);
  }
};


export const getShareLink = async (wishlistId: string): Promise<string> => {
  const botUsername = "wishbucket_bot";
  return `https://t.me/${botUsername}?start=wishlist_${wishlistId}`;
};

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

        notifyFollowers("friend_added_item", {
          actorName: userName,
          itemName: item.name,
          wishlistName: wishlist.name,
          wishlistId,
          itemId: data.id,
          userId,
        });
      }
    } catch (e) {
      console.error("Failed to check wishlist publicity:", e);
    }
  }

  return mapItem(data);
};

export const addItemToMultipleWishlists = async (
  wishlistIds: string[],
  item: Omit<WishlistItem, "id" | "createdAt" | "updatedAt" | "wishlistId">,
  notifyFollowersFlag = true,
): Promise<WishlistItem[]> => {
  const userId = getCurrentUserId();
  const addedItems: WishlistItem[] = [];

  for (const wishlistId of wishlistIds) {
    const result = await addItem(
      wishlistId,
      { ...item, wishlistId },
      false,
    );
    addedItems.push(result);
  }

  if (notifyFollowersFlag && userId && wishlistIds.length > 0) {
    try {
      const { data: wishlists } = await supabase
        .from("wishlists")
        .select("id, name, is_public")
        .in("id", wishlistIds);

      const publicWishlists = wishlists?.filter((w) => w.is_public) || [];

      if (publicWishlists.length > 0) {
        const telegramUser = getTelegramUser();
        const userName = telegramUser?.first_name || "Someone";

       
        const single = publicWishlists.length === 1 ? publicWishlists[0] : null;

        notifyFollowers("friend_added_item", {
          actorName: userName,
          itemName: item.name,
          wishlistName: single?.name,
          wishlistId: single?.id,
          wishlistIds: publicWishlists.map((w) => w.id),
          userId,
        });
      }
    } catch (e) {
      console.error("Failed to notify followers:", e);
    }
  }

  return addedItems;
};

export const updateItem = async (
  itemId: string,
  updates: Partial<WishlistItem>,
): Promise<WishlistItem> => {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.url !== undefined) updateData.url = updates.url;
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

export const markItemAsReceivedAcrossWishlists = async (
  itemId: string,
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data: item, error: itemError } = await supabase
    .from("wishlist_items")
    .select("url, wishlist_id, name, price, image_url")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    throw new Error(`Failed to get item: ${itemError?.message}`);
  }

  await updateItem(itemId, { status: "purchased" });

  const { data: wishlists } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId);

  if (!wishlists || wishlists.length === 0) {
    return;
  }

  const otherWishlistIds = wishlists
    .map((w) => w.id)
    .filter((id) => id !== item.wishlist_id);

  if (otherWishlistIds.length === 0) {
    return;
  }

  if (item.url && item.url.trim() !== "") {
    const { error: deleteError } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("url", item.url)
      .in("wishlist_id", otherWishlistIds);

    if (deleteError) {
      console.error(
        "Failed to delete duplicate items by URL:",
        deleteError.message,
      );
    }
  } else {
    let query = supabase
      .from("wishlist_items")
      .delete()
      .eq("name", item.name)
      .in("wishlist_id", otherWishlistIds);

    if (item.price !== null) {
      query = query.eq("price", item.price);
    }

    if (item.image_url) {
      query = query.eq("image_url", item.image_url);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error(
        "Failed to delete duplicate items by name:",
        deleteError.message,
      );
    }
  }
};


export const deleteItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`);
  }
};

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

export const unreserveItem = async (itemId: string): Promise<WishlistItem> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .update({ status: "available", reserved_by: null })
    .eq("id", itemId)
    .eq("reserved_by", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to unreserve item: ${error.message}`);
  }

  return mapItem(data);
};


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
  const { processAffiliateLink } = await import("../utils/affiliate");
  const result = processAffiliateLink(url);

  return {
    url: result.url,
    affiliateUrl: result.url,
    hasAffiliate: result.hasAffiliate,
    programName: result.programName,
    productInfo: {},
  };
};

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

  return (data || []) as any;
};

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

  return data as any;
};

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

export const drawSecretSanta = async (
  santaId: string,
): Promise<SecretSanta> => {
  throw new Error("Not implemented yet");
};

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


export const contributeToCrowdfunding = async (
  itemId: string,
  amount: number,
): Promise<WishlistItem> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data: crowdfunding, error: findError } = await supabase
    .from("crowdfunding")
    .select("*")
    .eq("item_id", itemId)
    .single();

  if (findError || !crowdfunding) {
    throw new Error("Crowdfunding not found");
  }

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

  const { data: updatedCrowdfunding } = await supabase
    .from("crowdfunding")
    .select("*")
    .eq("id", crowdfunding.id)
    .single();

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

export const getBirthdayReminders = async (): Promise<BirthdayReminder[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data: friends } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  if (!friends || friends.length === 0) {
    return [];
  }

  const friendIds = friends.map((f) => f.friend_id);

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

export const createNotification = async (
  targetUserId: number,
  type: NotificationType,
  data?: Record<string, any>,
): Promise<void> => {
  try {
    await supabase.functions.invoke("send-telegram-notification", {
      body: {
        userId: targetUserId,
        type,
        data: data || null,
      },
    });
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
};

export const getReferralStats = async (): Promise<ReferralStats> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [userResult, referralsResult] = await Promise.all([
    supabase
      .from("users")
      .select("referral_code, referrals, bonus_points")
      .eq("user_id", userId)
      .single(),
    supabase.from("referrals").select("bonus_earned").eq("referrer_id", userId),
  ]);

  if (userResult.error) {
    throw new Error(
      `Failed to get referral stats: ${userResult.error.message}`,
    );
  }

  const user = userResult.data;
  const referrals = referralsResult.data || [];

  const totalBonusEarned = referrals.reduce(
    (sum, r) => sum + (r.bonus_earned || 0),
    0,
  );

  return {
    referralCode: user.referral_code,
    totalReferrals: user.referrals || 0,
    activeReferrals: referrals.length,
    totalBonusEarned,
    referralLink: `https://t.me/wishbucket_bot/app?startapp=ref_${user.referral_code}`,
  };
};

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

export const applyReferral = async (
  referralCode: string,
): Promise<{ success: boolean; bonus: number }> => {
  console.log("🔄 applyReferral called with code:", referralCode);

  const userId = getCurrentUserId();
  console.log("👤 Current user ID:", userId);

  if (!userId) {
    throw new Error("User not authenticated");
  }

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

  const { data: referrerData } = await supabase
    .from("users")
    .select("bonus_points")
    .eq("user_id", referrer.user_id)
    .single();

  await supabase
    .from("users")
    .update({
      referrals: (referrer.referrals || 0) + 1,
      bonus_points: (referrerData?.bonus_points || 0) + bonusForReferrer,
    })
    .eq("user_id", referrer.user_id);

  const { data: userData } = await supabase
    .from("users")
    .select("bonus_points")
    .eq("user_id", userId)
    .single();

  await supabase
    .from("users")
    .update({ bonus_points: (userData?.bonus_points || 0) + bonusForReferred })
    .eq("user_id", userId);

  await createNotification(referrer.user_id, "referral_signup", {
    bonusPoints: bonusForReferrer,
  });

  return {
    success: true,
    bonus: bonusForReferred,
  };
};
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
