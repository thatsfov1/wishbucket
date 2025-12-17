/**
 * Supabase API Service для Wish Bucket
 * 
 * Цей файл містить всі функції для роботи з Supabase.
 * Код структурований та легко редагується.
 */

import { supabase, getCurrentUserId } from '../lib/supabase';
import { 
  Wishlist, 
  WishlistItem, 
  UserProfile, 
  SecretSanta, 
  BirthdayReminder,
  TelegramUser 
} from '../types';
import { getTelegramUser } from '../utils/telegram';

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
const mapUserToProfile = (user: any, telegramUser: TelegramUser | null): UserProfile => {
  return {
    userId: user.user_id,
    telegramUser: telegramUser || JSON.parse(user.telegram_data),
    birthday: user.birthday || undefined,
    friends: [], // Буде завантажено окремо
    referralCode: user.referral_code,
    referrals: user.referrals || 0,
    premiumStatus: user.premium_status || 'free',
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
    currency: item.currency || 'USD',
    priority: item.priority || 'medium',
    status: item.status || 'available',
    reservedBy: item.reserved_by || undefined,
    purchasedBy: item.purchased_by || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    crowdfunding: item.crowdfunding || undefined,
  };
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
    throw new Error('User not authenticated');
  }

  const userId = telegramUser.id;

  // Перевіряємо чи існує користувач
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Failed to fetch user: ${fetchError.message}`);
  }

  // Якщо користувач не існує, створюємо нового
  if (!existingUser) {
    const referralCode = generateReferralCode();
    const { data: newUser, error: createError } = await supabase
      .from('users')
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
    .from('friends')
    .select('friend_id')
    .eq('user_id', userId);

  const userProfile = mapUserToProfile(existingUser, telegramUser);
  userProfile.friends = friends?.map(f => f.friend_id) || [];

  return userProfile;
};

/**
 * Оновлює профіль користувача
 */
export const updateUserProfile = async (
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const updateData: any = {};
  
  if (updates.birthday !== undefined) {
    updateData.birthday = updates.birthday || null;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('user_id', userId)
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
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('users')
    .select('referral_code')
    .eq('user_id', userId)
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
    throw new Error('User not authenticated');
  }

  // Знаходимо користувача з цим кодом
  const { data: referrer, error: findError } = await supabase
    .from('users')
    .select('user_id')
    .eq('referral_code', code.toUpperCase())
    .single();

  if (findError || !referrer) {
    throw new Error('Invalid referral code');
  }

  if (referrer.user_id === userId) {
    throw new Error('Cannot use your own referral code');
  }

  // Перевіряємо чи вже використовувався код
  // (тут можна додати логіку перевірки)

  // Оновлюємо бонуси реферера
  const { data: referrerData } = await supabase
    .from('users')
    .select('referrals')
    .eq('user_id', referrer.user_id)
    .single();

  await supabase
    .from('users')
    .update({ referrals: (referrerData?.referrals || 0) + 1 })
    .eq('user_id', referrer.user_id);

  // Додаємо бонуси користувачу
  const { data: userData } = await supabase
    .from('users')
    .select('bonus_points')
    .eq('user_id', userId)
    .single();

  await supabase
    .from('users')
    .update({ bonus_points: (userData?.bonus_points || 0) + 100 })
    .eq('user_id', userId);
};

// ============================================
// Friends API
// ============================================

/**
 * Додає друга
 */
export const addFriend = async (friendId: number): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (userId === friendId) {
    throw new Error('Cannot add yourself as a friend');
  }

  const { error } = await supabase
    .from('friends')
    .insert({
      user_id: userId,
      friend_id: friendId,
    });

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Friend already added');
    }
    throw new Error(`Failed to add friend: ${error.message}`);
  }
};

/**
 * Видаляє друга
 */
export const removeFriend = async (friendId: number): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', userId)
    .eq('friend_id', friendId);

  if (error) {
    throw new Error(`Failed to remove friend: ${error.message}`);
  }
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
    throw new Error('User not authenticated');
  }

  const { data: wishlists, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch wishlists: ${error.message}`);
  }

  // Завантажуємо items для кожного wishlist
  const wishlistsWithItems = await Promise.all(
    (wishlists || []).map(async (wishlist) => {
      const { data: items } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('wishlist_id', wishlist.id)
        .order('created_at', { ascending: false });

      return mapWishlist(wishlist, items || []);
    })
  );

  return wishlistsWithItems;
};

/**
 * Отримує конкретний wishlist
 */
export const getWishlist = async (wishlistId: string): Promise<Wishlist> => {
  const { data: wishlist, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('id', wishlistId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch wishlist: ${error.message}`);
  }

  // Завантажуємо items
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', wishlistId)
    .order('created_at', { ascending: false });

  return mapWishlist(wishlist, items || []);
};

/**
 * Створює новий wishlist
 */
export const createWishlist = async (
  wishlist: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt' | 'items'>
): Promise<Wishlist> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Якщо це default, знімаємо default з інших
  if (wishlist.isDefault) {
    await supabase
      .from('wishlists')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('wishlists')
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

  return mapWishlist(data, []);
};

/**
 * Оновлює wishlist
 */
export const updateWishlist = async (
  wishlistId: string,
  updates: Partial<Wishlist>
): Promise<Wishlist> => {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
  if (updates.isDefault !== undefined) {
    updateData.is_default = updates.isDefault;
    
    // Якщо робимо default, знімаємо default з інших
    if (updates.isDefault) {
      const userId = getCurrentUserId();
      await supabase
        .from('wishlists')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
        .neq('id', wishlistId);
    }
  }

  const { data, error } = await supabase
    .from('wishlists')
    .update(updateData)
    .eq('id', wishlistId)
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
    .from('wishlists')
    .delete()
    .eq('id', wishlistId);

  if (error) {
    throw new Error(`Failed to delete wishlist: ${error.message}`);
  }
};

/**
 * Отримує share link для wishlist
 */
export const getShareLink = async (wishlistId: string): Promise<string> => {
  // Генеруємо share link
  const botUsername = 'wishbucket_bot'; // Замініть на ваш bot username
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
  item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WishlistItem> => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      wishlist_id: wishlistId,
      name: item.name,
      description: item.description || null,
      url: item.url,
      original_url: item.originalUrl,
      affiliate_url: item.affiliateUrl || null,
      image_url: item.imageUrl || null,
      price: item.price || null,
      currency: item.currency || 'USD',
      priority: item.priority,
      status: item.status || 'available',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add item: ${error.message}`);
  }

  return mapItem(data);
};

/**
 * Оновлює item
 */
export const updateItem = async (
  itemId: string,
  updates: Partial<WishlistItem>
): Promise<WishlistItem> => {
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.url !== undefined) updateData.url = updates.url;
  if (updates.affiliateUrl !== undefined) updateData.affiliate_url = updates.affiliateUrl;
  if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.currency !== undefined) updateData.currency = updates.currency;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.reservedBy !== undefined) updateData.reserved_by = updates.reservedBy;
  if (updates.purchasedBy !== undefined) updateData.purchased_by = updates.purchasedBy;

  const { data, error } = await supabase
    .from('wishlist_items')
    .update(updateData)
    .eq('id', itemId)
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
    .from('wishlist_items')
    .delete()
    .eq('id', itemId);

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
    throw new Error('User not authenticated');
  }

  return updateItem(itemId, { 
    status: 'reserved',
    reservedBy: userId,
  });
};

/**
 * Позначає item як куплений
 */
export const purchaseItem = async (itemId: string): Promise<WishlistItem> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  return updateItem(itemId, { 
    status: 'purchased',
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
export const processUrl = async (url: string): Promise<{
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
  const { processAffiliateLink } = await import('../utils/affiliate');
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
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('secret_santa')
    .select(`
      *,
      secret_santa_participants (*)
    `)
    .or(`organizer_id.eq.${userId},secret_santa_participants.user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

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
  santa: Omit<SecretSanta, 'id' | 'createdAt'>
): Promise<SecretSanta> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('secret_santa')
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
export const joinSecretSanta = async (santaId: string): Promise<SecretSanta> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('secret_santa_participants')
    .insert({
      secret_santa_id: santaId,
      user_id: userId,
    });

  if (error) {
    throw new Error(`Failed to join secret santa: ${error.message}`);
  }

  return getSecretSantas().then(santas => 
    santas.find(s => s.id === santaId)!
  );
};

/**
 * Розігрує імена для Secret Santa
 */
export const drawSecretSanta = async (santaId: string): Promise<SecretSanta> => {
  // TODO: Реалізувати логіку розіграшу
  // Це має бути зроблено через Supabase Edge Function для безпеки
  throw new Error('Not implemented yet');
};

// ============================================
// Crowdfunding API
// ============================================

/**
 * Створює crowdfunding для item
 */
export const createCrowdfunding = async (
  itemId: string,
  targetAmount: number
): Promise<WishlistItem> => {
  const { data, error } = await supabase
    .from('crowdfunding')
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
  amount: number
): Promise<WishlistItem> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Знаходимо crowdfunding
  const { data: crowdfunding, error: findError } = await supabase
    .from('crowdfunding')
    .select('*')
    .eq('item_id', itemId)
    .single();

  if (findError || !crowdfunding) {
    throw new Error('Crowdfunding not found');
  }

  // Додаємо внесок
  const { error: contributeError } = await supabase
    .from('crowdfunding_contributors')
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
    .from('crowdfunding')
    .select('*')
    .eq('id', crowdfunding.id)
    .single();

  // Завантажуємо contributors
  const { data: contributors } = await supabase
    .from('crowdfunding_contributors')
    .select('*')
    .eq('crowdfunding_id', crowdfunding.id);

  return updateItem(itemId, {
    crowdfunding: {
      id: crowdfunding.id,
      itemId: itemId,
      targetAmount: crowdfunding.target_amount,
      currentAmount: updatedCrowdfunding?.current_amount || 0,
      contributors: (contributors || []).map(c => ({
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
    throw new Error('User not authenticated');
  }

  // Отримуємо друзів
  const { data: friends } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', userId);

  if (!friends || friends.length === 0) {
    return [];
  }

  const friendIds = friends.map(f => f.friend_id);

  // Отримуємо дані друзів з днями народження
  const { data: friendsData } = await supabase
    .from('users')
    .select('user_id, telegram_data, birthday')
    .in('user_id', friendIds)
    .not('birthday', 'is', null);

  if (!friendsData) {
    return [];
  }

  const now = new Date();
  const reminders: BirthdayReminder[] = [];

  friendsData.forEach(friend => {
    if (!friend.birthday) return;

    const birthday = new Date(friend.birthday);
    const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
    
    // Якщо день народження вже пройшов цього року, беремо наступний рік
    if (thisYearBirthday < now) {
      thisYearBirthday.setFullYear(now.getFullYear() + 1);
    }

    const daysUntil = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 7) {
      const telegramData = JSON.parse(friend.telegram_data);
      reminders.push({
        userId: userId,
        friendId: friend.user_id,
        friendName: `${telegramData.first_name} ${telegramData.last_name || ''}`.trim(),
        birthday: friend.birthday,
        daysUntil: daysUntil,
        notified: false,
      });
    }
  });

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
};

