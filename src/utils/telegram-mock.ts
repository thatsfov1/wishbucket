const MOCK_TELEGRAM_USER = {
  id: 123456789,
  first_name: "Dev",
  last_name: "User",
  username: "devuser",
  photo_url: "",
  language_code: "en",
};

export function isTelegramEnvironment(): boolean {
  return !!(window as any).Telegram?.WebApp?.initDataUnsafe?.user;
}

export function getMockUser() {
  if (import.meta.env.DEV && !isTelegramEnvironment()) {
    return MOCK_TELEGRAM_USER;
  }
  return null;
}