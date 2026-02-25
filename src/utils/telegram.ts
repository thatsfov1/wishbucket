import { TelegramUser } from "../types";
import { getMockUser } from "./telegram-mock";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser & {
            photo_url?: string;
          };
          auth_date?: number;
          hash?: string;
          start_param?: string;
        };
        colorScheme: "light" | "dark";
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        HapticFeedback: {
          impactOccurred: (
            style: "light" | "medium" | "heavy" | "rigid" | "soft"
          ) => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        openLink: (
          url: string,
          options?: { try_instant_view?: boolean }
        ) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showPopup: (
          params: {
            title?: string;
            message: string;
            buttons?: Array<{
              id?: string;
              type?: "default" | "ok" | "close" | "cancel" | "destructive";
              text: string;
            }>;
          },
          callback?: (id: string) => void
        ) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (
          message: string,
          callback?: (confirmed: boolean) => void
        ) => void;
        showScanQrPopup: (
          params: {
            text?: string;
          },
          callback?: (data: string) => void
        ) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: (callback?: (text: string) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        requestContact: (callback?: (granted: boolean) => void) => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        version: string;
        platform: string;
      };
    };
  }
}

export const initTelegram = () => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    return window.Telegram.WebApp;
  }
  return null;
};

export const getTelegramUser = (): TelegramUser | null => {
  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser) return tgUser;

  return getMockUser();
};

export const getTelegramUserId = (): number | null => {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;
};

export const showTelegramAlert = (message: string) => {
  window.Telegram?.WebApp?.showAlert(message);
};

export const showTelegramConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    window.Telegram?.WebApp?.showConfirm(message, (confirmed) => {
      resolve(confirmed);
    });
  });
};

export const openTelegramLink = (url: string) => {
  window.Telegram?.WebApp?.openTelegramLink(url);
};

export const hapticFeedback = {
  impact: (
    style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium"
  ) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  },
  notification: (type: "error" | "success" | "warning") => {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
  },
  selection: () => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  },
};

/**
 * Gets the start_param from Telegram deep link
 * Checks multiple sources:
 * 1. initDataUnsafe.start_param (for startapp= links)
 * 2. URL hash params tgWebAppStartParam (Telegram sometimes passes it here)
 * 3. URL query params (fallback)
 */
export const getStartParam = (): string | null => {
  const webApp = window.Telegram?.WebApp;

  // Method 1: Check initDataUnsafe.start_param
  let startParam = webApp?.initDataUnsafe?.start_param || null;

  console.log("🔍 Telegram WebApp:", !!webApp);
  console.log("🔍 initDataUnsafe:", webApp?.initDataUnsafe);
  console.log("🔍 start_param from initDataUnsafe:", startParam);

  // Method 2: Check URL hash for tgWebAppStartParam
  if (!startParam && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    startParam = hashParams.get("tgWebAppStartParam");
    console.log("🔍 start_param from hash:", startParam);
  }

  // Method 3: Check URL query params
  if (!startParam) {
    const urlParams = new URLSearchParams(window.location.search);
    startParam = urlParams.get("tgWebAppStartParam") || urlParams.get("start");
    console.log("🔍 start_param from URL query:", startParam);
  }

  // Method 4: Check initData string (parse it ourselves)
  if (!startParam && webApp?.initData) {
    try {
      const initDataParams = new URLSearchParams(webApp.initData);
      startParam = initDataParams.get("start_param");
      console.log("🔍 start_param from initData string:", startParam);
    } catch (e) {
      console.log("🔍 Failed to parse initData:", e);
    }
  }

  console.log("🔍 Final start_param:", startParam);
  return startParam;
};

/**
 * Parses referral code from start_param
 * Link format: https://t.me/wishbucket_bot/app?startapp=ref_CODE
 * Returns null if not a referral link
 */
export const getReferralCodeFromStart = (): string | null => {
  const startParam = getStartParam();
  console.log("🎫 getReferralCodeFromStart - startParam:", startParam);

  if (!startParam) return null;

  // Format: ref_CODE
  if (startParam.startsWith("ref_")) {
    const code = startParam.substring(4); // Remove 'ref_' prefix
    console.log("🎫 Extracted referral code:", code);
    return code;
  }

  return null;
};

/**
 * Parses wishlist ID from start_param
 * Link format: https://t.me/wishbucket_bot/app?startapp=wishlist_ID
 * Returns null if not a wishlist link
 */
export const getWishlistIdFromStart = (): string | null => {
  const startParam = getStartParam();
  if (!startParam) return null;

  // Format: wishlist_ID
  if (startParam.startsWith("wishlist_")) {
    return startParam.substring(9); // Remove 'wishlist_' prefix
  }

  return null;
};
