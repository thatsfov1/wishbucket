import axios from 'axios';
import { Wishlist, WishlistItem, UserProfile, SecretSanta, BirthdayReminder } from '../types';
import { getTelegramUserId } from '../utils/telegram';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const userId = getTelegramUserId();
  if (userId) {
    config.headers['X-User-Id'] = userId.toString();
  }
  return config;
});

// User Profile
export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.put('/user/profile', profile);
  return response.data;
};

export const addFriend = async (friendId: number): Promise<void> => {
  await api.post('/user/friends', { friendId });
};

export const removeFriend = async (friendId: number): Promise<void> => {
  await api.delete(`/user/friends/${friendId}`);
};

// Wishlists
export const getWishlists = async (): Promise<Wishlist[]> => {
  const response = await api.get('/wishlists');
  return response.data;
};

export const getWishlist = async (wishlistId: string): Promise<Wishlist> => {
  const response = await api.get(`/wishlists/${wishlistId}`);
  return response.data;
};

export const createWishlist = async (wishlist: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt' | 'items'>): Promise<Wishlist> => {
  const response = await api.post('/wishlists', wishlist);
  return response.data;
};

export const updateWishlist = async (wishlistId: string, wishlist: Partial<Wishlist>): Promise<Wishlist> => {
  const response = await api.put(`/wishlists/${wishlistId}`, wishlist);
  return response.data;
};

export const deleteWishlist = async (wishlistId: string): Promise<void> => {
  await api.delete(`/wishlists/${wishlistId}`);
};

// Wishlist Items
export const addItem = async (wishlistId: string, item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WishlistItem> => {
  const response = await api.post(`/wishlists/${wishlistId}/items`, item);
  return response.data;
};

export const updateItem = async (itemId: string, item: Partial<WishlistItem>): Promise<WishlistItem> => {
  const response = await api.put(`/items/${itemId}`, item);
  return response.data;
};

export const deleteItem = async (itemId: string): Promise<void> => {
  await api.delete(`/items/${itemId}`);
};

export const reserveItem = async (itemId: string): Promise<WishlistItem> => {
  const response = await api.post(`/items/${itemId}/reserve`);
  return response.data;
};

export const purchaseItem = async (itemId: string): Promise<WishlistItem> => {
  const response = await api.post(`/items/${itemId}/purchase`);
  return response.data;
};

// Affiliate & URL Processing
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
  const response = await api.post('/url/process', { url });
  return response.data;
};

// Secret Santa
export const getSecretSantas = async (): Promise<SecretSanta[]> => {
  const response = await api.get('/secret-santa');
  return response.data;
};

export const createSecretSanta = async (santa: Omit<SecretSanta, 'id' | 'createdAt'>): Promise<SecretSanta> => {
  const response = await api.post('/secret-santa', santa);
  return response.data;
};

export const joinSecretSanta = async (santaId: string): Promise<SecretSanta> => {
  const response = await api.post(`/secret-santa/${santaId}/join`);
  return response.data;
};

export const drawSecretSanta = async (santaId: string): Promise<SecretSanta> => {
  const response = await api.post(`/secret-santa/${santaId}/draw`);
  return response.data;
};

// Birthday Reminders
export const getBirthdayReminders = async (): Promise<BirthdayReminder[]> => {
  const response = await api.get('/birthdays/reminders');
  return response.data;
};

// Crowdfunding
export const createCrowdfunding = async (itemId: string, targetAmount: number): Promise<WishlistItem> => {
  const response = await api.post(`/items/${itemId}/crowdfunding`, { targetAmount });
  return response.data;
};

export const contributeToCrowdfunding = async (itemId: string, amount: number): Promise<WishlistItem> => {
  const response = await api.post(`/items/${itemId}/crowdfunding/contribute`, { amount });
  return response.data;
};

// Referrals
export const getReferralCode = async (): Promise<string> => {
  const response = await api.get('/user/referral-code');
  return response.data;
};

export const applyReferralCode = async (code: string): Promise<void> => {
  await api.post('/user/apply-referral', { code });
};

// Sharing
export const getShareLink = async (wishlistId: string): Promise<string> => {
  const response = await api.get(`/wishlists/${wishlistId}/share`);
  return response.data;
};

export default api;

