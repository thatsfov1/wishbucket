import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const getCurrentUserId = (): number | null => {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    return user?.id || null;
  }
  return null;
};

export const setSupabaseUser = async (userId: number) => {};
