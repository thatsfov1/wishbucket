import { create } from 'zustand';
import { Wishlist, WishlistItem, UserProfile, SecretSanta, BirthdayReminder } from '../types';
import { getTelegramUserId } from '../utils/telegram';

interface AppState {
  // User data
  userProfile: UserProfile | null;
  currentUserId: number | null;
  
  // Wishlists
  wishlists: Wishlist[];
  currentWishlist: Wishlist | null;
  
  // Items
  items: WishlistItem[];
  
  // Secret Santa
  secretSantas: SecretSanta[];
  
  // Birthday reminders
  birthdayReminders: BirthdayReminder[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUserProfile: (profile: UserProfile) => void;
  setWishlists: (wishlists: Wishlist[]) => void;
  addWishlist: (wishlist: Wishlist) => void;
  updateWishlist: (wishlist: Wishlist) => void;
  deleteWishlist: (wishlistId: string) => void;
  setCurrentWishlist: (wishlist: Wishlist | null) => void;
  addItem: (item: WishlistItem) => void;
  updateItem: (item: WishlistItem) => void;
  deleteItem: (itemId: string) => void;
  setSecretSantas: (santas: SecretSanta[]) => void;
  addSecretSanta: (santa: SecretSanta) => void;
  setBirthdayReminders: (reminders: BirthdayReminder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  userProfile: null,
  currentUserId: getTelegramUserId(),
  wishlists: [],
  currentWishlist: null,
  items: [],
  secretSantas: [],
  birthdayReminders: [],
  isLoading: false,
  error: null,
  
  setUserProfile: (profile) => set({ userProfile: profile }),
  setWishlists: (wishlists) => set({ wishlists }),
  addWishlist: (wishlist) => set((state) => ({ wishlists: [...state.wishlists, wishlist] })),
  updateWishlist: (wishlist) => set((state) => ({
    wishlists: state.wishlists.map(w => w.id === wishlist.id ? wishlist : w)
  })),
  deleteWishlist: (wishlistId) => set((state) => ({
    wishlists: state.wishlists.filter(w => w.id !== wishlistId),
    currentWishlist: state.currentWishlist?.id === wishlistId ? null : state.currentWishlist
  })),
  setCurrentWishlist: (wishlist) => set({ currentWishlist: wishlist }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (item) => set((state) => ({
    items: state.items.map(i => i.id === item.id ? item : i)
  })),
  deleteItem: (itemId) => set((state) => ({
    items: state.items.filter(i => i.id !== itemId)
  })),
  setSecretSantas: (santas) => set({ secretSantas: santas }),
  addSecretSanta: (santa) => set((state) => ({ secretSantas: [...state.secretSantas, santa] })),
  setBirthdayReminders: (reminders) => set({ birthdayReminders: reminders }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

