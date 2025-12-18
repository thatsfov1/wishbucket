import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// Отримуємо URL та ключ з змінних оточення
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

// Створюємо клієнт Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Не зберігаємо сесію в localStorage для Telegram WebApp
    autoRefreshToken: false,
  },
});

// Допоміжна функція для отримання поточного користувача з Telegram
export const getCurrentUserId = (): number | null => {
  // Отримуємо user_id з Telegram WebApp initData
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    return user?.id || null;
  }
  return null;
};

// Допоміжна функція для встановлення користувача в Supabase
// Використовується для RLS (Row Level Security)
export const setSupabaseUser = async (userId: number) => {
  // Для Telegram WebApp ми використовуємо custom auth
  // Встановлюємо user через service role або через custom JWT
  // Це потрібно налаштувати в Supabase Auth settings
};
