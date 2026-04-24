// Supabase Edge Function for sending Telegram notifications.
//
//   Accepts ONLY (userId, type, data). The function:
//     1. Looks up the user's language from `users.telegram_data.language`.
//     2. Builds a localized title + message + inline-keyboard from the
//        translation tables below.
//     3. Inserts the LOCALIZED title/message into `notifications`.
//     4. Sends the Telegram message with localized buttons.
//
//   This way every caller (mini-app + edge functions like check-birthdays)
//   stays free of any user-facing copy — text is generated from the user's
//   chosen language in one place.
//
// Deploy with: supabase functions deploy send-telegram-notification

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type LanguageCode = "en" | "uk" | "ru";
const DEFAULT_LANGUAGE: LanguageCode = "en";

type NotificationType =
  | "new_follower"
  | "friend_added_item"
  | "wishlist_shared"
  | "item_reserved"
  | "item_purchased"
  | "birthday_reminder"
  | "referral_signup"
  | "bonus_earned";

interface NotificationData {
  // Common context
  actorName?: string;       // Name of the person triggering the notification
  itemName?: string;        // Item title
  wishlistName?: string;    // Wishlist name
  // Deep-link context
  wishlistId?: string;      // For "open wishlist" button
  userId?: number;          // For "open profile" button (item-added with multiple wishlists)
  followerId?: number;      // For "view profile" (new follower)
  friendId?: number;        // For birthday_reminder (whose birthday it is)
  // Booleans / numbers
  isFollowBack?: boolean;
  bonusPoints?: number;
  reminderKind?: "week_before" | "birthday_day";
  [key: string]: unknown;
}

interface NotificationPayload {
  userId: number;
  type: NotificationType;
  data?: NotificationData | null;
  // If true, do NOT insert into the `notifications` table — useful when the
  // caller (e.g. dedupe-aware schedulers) already inserted the row.
  skipDbInsert?: boolean;
}

// ─── Telegram Mini App deep-link helper ─────────────────────────────────────

const BOT_USERNAME =
  Deno.env.get("TELEGRAM_BOT_USERNAME") ?? "wishbucket_bot";
const MINIAPP_SHORT_NAME =
  Deno.env.get("TELEGRAM_MINIAPP_SHORT_NAME") ?? "app";

const miniAppUrl = (startParam?: string): string => {
  const base = `https://t.me/${BOT_USERNAME}/${MINIAPP_SHORT_NAME}`;
  return startParam ? `${base}?startapp=${startParam}` : base;
};

// ─── i18n: notification title + body templates ──────────────────────────────

type TextBuilder = (d: NotificationData) => string;

interface Template {
  title: TextBuilder;
  message: TextBuilder;
}

const NAME = (d: NotificationData) => d.actorName || "Someone";

const TEMPLATES: Record<LanguageCode, Record<NotificationType, Template>> = {
  en: {
    new_follower: {
      title: (d) => (d.isFollowBack ? "🎉 New Follower!" : "👤 New Follower!"),
      message: (d) =>
        d.isFollowBack
          ? `${NAME(d)} followed you back!`
          : `${NAME(d)} started following you`,
    },
    friend_added_item: {
      title: () => "✨ New Item Added!",
      message: (d) =>
        d.wishlistName
          ? `${NAME(d)} added "${d.itemName ?? "a new item"}" to "${d.wishlistName}"`
          : `${NAME(d)} added "${d.itemName ?? "a new item"}" to their wishlists`,
    },
    wishlist_shared: {
      title: () => "📝 New Wishlist!",
      message: (d) =>
        `${NAME(d)} created a new wishlist: "${d.wishlistName ?? ""}"`,
    },
    item_reserved: {
      title: () => "🎁 Item Reserved",
      message: (d) =>
        d.itemName
          ? `Someone reserved "${d.itemName}" from your wishlist!`
          : "Someone reserved an item from your wishlist!",
    },
    item_purchased: {
      title: () => "🎉 Gift on the Way!",
      message: (d) =>
        d.itemName
          ? `Someone bought "${d.itemName}" for you!`
          : "Someone bought a gift for you!",
    },
    birthday_reminder: {
      title: (d) =>
        d.reminderKind === "week_before"
          ? `⏰ ${NAME(d)}'s birthday is in 1 week`
          : `🎉 It's ${NAME(d)}'s birthday today!`,
      message: (d) =>
        d.reminderKind === "week_before"
          ? `It's time to look at ${NAME(d)}'s wishlists and prepare a gift.`
          : `Celebrate ${NAME(d)} and check their wishlists for the perfect gift.`,
    },
    referral_signup: {
      title: () => "🎉 New Referral!",
      message: (d) =>
        `Someone joined using your referral code! You earned ${d.bonusPoints ?? 0} bonus points.`,
    },
    bonus_earned: {
      title: () => "✨ Bonus Earned!",
      message: (d) =>
        `You earned ${d.bonusPoints ?? 0} bonus points!`,
    },
  },

  uk: {
    new_follower: {
      title: (d) =>
        d.isFollowBack ? "🎉 Новий підписник!" : "👤 Новий підписник!",
      message: (d) =>
        d.isFollowBack
          ? `${NAME(d)} підписався у відповідь!`
          : `${NAME(d)} підписався на вас`,
    },
    friend_added_item: {
      title: () => "✨ Нова річ у вішлисті!",
      message: (d) =>
        d.wishlistName
          ? `${NAME(d)} додав «${d.itemName ?? "нову річ"}» до «${d.wishlistName}»`
          : `${NAME(d)} додав «${d.itemName ?? "нову річ"}» до своїх вішлистів`,
    },
    wishlist_shared: {
      title: () => "📝 Новий вішлист!",
      message: (d) =>
        `${NAME(d)} створив новий вішлист: «${d.wishlistName ?? ""}»`,
    },
    item_reserved: {
      title: () => "🎁 Річ зарезервовано",
      message: (d) =>
        d.itemName
          ? `Хтось зарезервував «${d.itemName}» з вашого вішлиста!`
          : "Хтось зарезервував річ з вашого вішлиста!",
    },
    item_purchased: {
      title: () => "🎉 Подарунок у дорозі!",
      message: (d) =>
        d.itemName
          ? `Хтось купив «${d.itemName}» для вас!`
          : "Хтось купив для вас подарунок!",
    },
    birthday_reminder: {
      title: (d) =>
        d.reminderKind === "week_before"
          ? `⏰ День народження ${NAME(d)} через 1 тиждень`
          : `🎉 Сьогодні день народження ${NAME(d)}!`,
      message: (d) =>
        d.reminderKind === "week_before"
          ? `Саме час зазирнути у вішлисти ${NAME(d)} і обрати подарунок.`
          : `Привітайте ${NAME(d)} і знайдіть ідеальний подарунок у їхніх вішлистах.`,
    },
    referral_signup: {
      title: () => "🎉 Новий реферал!",
      message: (d) =>
        `Хтось приєднався за вашим реферальним кодом! Ви отримали ${d.bonusPoints ?? 0} бонусних балів.`,
    },
    bonus_earned: {
      title: () => "✨ Бонус нараховано!",
      message: (d) => `Ви отримали ${d.bonusPoints ?? 0} бонусних балів!`,
    },
  },

  ru: {
    new_follower: {
      title: (d) =>
        d.isFollowBack ? "🎉 Новый подписчик!" : "👤 Новый подписчик!",
      message: (d) =>
        d.isFollowBack
          ? `${NAME(d)} подписался в ответ!`
          : `${NAME(d)} подписался на вас`,
    },
    friend_added_item: {
      title: () => "✨ Новая вещь в вишлисте!",
      message: (d) =>
        d.wishlistName
          ? `${NAME(d)} добавил «${d.itemName ?? "новую вещь"}» в «${d.wishlistName}»`
          : `${NAME(d)} добавил «${d.itemName ?? "новую вещь"}» в свои вишлисты`,
    },
    wishlist_shared: {
      title: () => "📝 Новый вишлист!",
      message: (d) =>
        `${NAME(d)} создал новый вишлист: «${d.wishlistName ?? ""}»`,
    },
    item_reserved: {
      title: () => "🎁 Вещь зарезервирована",
      message: (d) =>
        d.itemName
          ? `Кто-то зарезервировал «${d.itemName}» из вашего вишлиста!`
          : "Кто-то зарезервировал вещь из вашего вишлиста!",
    },
    item_purchased: {
      title: () => "🎉 Подарок в пути!",
      message: (d) =>
        d.itemName
          ? `Кто-то купил «${d.itemName}» для вас!`
          : "Кто-то купил для вас подарок!",
    },
    birthday_reminder: {
      title: (d) =>
        d.reminderKind === "week_before"
          ? `⏰ День рождения ${NAME(d)} через 1 неделю`
          : `🎉 Сегодня день рождения ${NAME(d)}!`,
      message: (d) =>
        d.reminderKind === "week_before"
          ? `Самое время заглянуть в вишлисты ${NAME(d)} и подготовить подарок.`
          : `Поздравьте ${NAME(d)} и найдите идеальный подарок в их вишлистах.`,
    },
    referral_signup: {
      title: () => "🎉 Новый реферал!",
      message: (d) =>
        `Кто-то присоединился по вашему реферальному коду! Вы получили ${d.bonusPoints ?? 0} бонусных баллов.`,
    },
    bonus_earned: {
      title: () => "✨ Бонус начислен!",
      message: (d) => `Вы получили ${d.bonusPoints ?? 0} бонусных баллов!`,
    },
  },
};

// ─── i18n: button labels ────────────────────────────────────────────────────

type ButtonKey =
  | "view_profile"
  | "open_wishlist_gift"   // 🎁 prefix
  | "open_wishlist_list"   // 📋 prefix
  | "view_wishlist_gift"
  | "view_friend_profile"
  | "open_app";

const BUTTONS: Record<LanguageCode, Record<ButtonKey, string>> = {
  en: {
    view_profile: "👤 View Profile",
    open_wishlist_gift: "🎁 Open Wishlist",
    open_wishlist_list: "📋 Open Wishlist",
    view_wishlist_gift: "🎁 View Wishlist",
    view_friend_profile: "🎂 View Friend's Profile",
    open_app: "📱 Open wishbucket",
  },
  uk: {
    view_profile: "👤 Відкрити профіль",
    open_wishlist_gift: "🎁 Відкрити вішлист",
    open_wishlist_list: "📋 Відкрити вішлист",
    view_wishlist_gift: "🎁 Переглянути вішлист",
    view_friend_profile: "🎂 Профіль друга",
    open_app: "📱 Відкрити wishbucket",
  },
  ru: {
    view_profile: "👤 Открыть профиль",
    open_wishlist_gift: "🎁 Открыть вишлист",
    open_wishlist_list: "📋 Открыть вишлист",
    view_wishlist_gift: "🎁 Перейти к вишлисту",
    view_friend_profile: "🎂 Профиль друга",
    open_app: "📱 Открыть wishbucket",
  },
};

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeLanguage(value: unknown): LanguageCode {
  if (typeof value !== "string") return DEFAULT_LANGUAGE;
  const lower = value.toLowerCase();
  // Telegram sends BCP-47 sometimes (e.g. "uk-UA")
  const base = lower.split("-")[0];
  if (base === "uk" || base === "ua") return "uk";
  if (base === "ru") return "ru";
  if (base === "en") return "en";
  return DEFAULT_LANGUAGE;
}

function parseTelegramData(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
}

async function getUserLanguage(
  supabase: ReturnType<typeof createClient>,
  userId: number,
): Promise<LanguageCode> {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("telegram_data")
      .eq("user_id", userId)
      .maybeSingle();
    const tg = parseTelegramData(user?.telegram_data);
    return normalizeLanguage(tg.language);
  } catch (e) {
    console.error("Failed to fetch user language", e);
    return DEFAULT_LANGUAGE;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function buildInlineKeyboard(
  supabase: ReturnType<typeof createClient>,
  type: NotificationType,
  data: NotificationData,
  lang: LanguageCode,
): Promise<Array<Array<{ text: string; url: string }>>> {
  const L = BUTTONS[lang];

  switch (type) {
    case "new_follower": {
      const followerId = data.followerId;
      if (!followerId) return [];
      return [[{ text: L.view_profile, url: miniAppUrl(`user_${followerId}`) }]];
    }

    case "friend_added_item": {
      const wishlistId = data.wishlistId;
      if (wishlistId) {
        return [[{
          text: L.open_wishlist_gift,
          url: miniAppUrl(`wishlist_${wishlistId}`),
        }]];
      }
      const authorId = data.userId;
      if (authorId) {
        return [[{
          text: L.view_profile,
          url: miniAppUrl(`user_${authorId}`),
        }]];
      }
      return [];
    }

    case "wishlist_shared": {
      const wishlistId = data.wishlistId;
      if (!wishlistId) return [];
      // Skip the button on empty wishlists.
      const { count, error } = await supabase
        .from("wishlist_items")
        .select("id", { count: "exact", head: true })
        .eq("wishlist_id", wishlistId);
      if (error || !count || count === 0) return [];
      return [[{
        text: L.open_wishlist_list,
        url: miniAppUrl(`wishlist_${wishlistId}`),
      }]];
    }

    case "item_reserved":
    case "item_purchased": {
      const wishlistId = data.wishlistId;
      if (!wishlistId) return [];
      return [[{
        text: L.view_wishlist_gift,
        url: miniAppUrl(`wishlist_${wishlistId}`),
      }]];
    }

    case "birthday_reminder": {
      const friendId = data.friendId;
      if (!friendId) return [];
      return [[{
        text: L.view_friend_profile,
        url: miniAppUrl(`user_${friendId}`),
      }]];
    }

    case "referral_signup":
    case "bonus_earned":
    default:
      return [[{ text: L.open_app, url: miniAppUrl() }]];
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN =
      Deno.env.get("TELEGRAM_BOT_TOKEN_MAIN") ??
      Deno.env.get("TELEGRAM_BOT_TOKEN") ??
      Deno.env.get("TELEGRAM_BOT_TOKEN_DEV");
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error(
        "Telegram bot token not configured (TELEGRAM_BOT_TOKEN_MAIN / TELEGRAM_BOT_TOKEN / TELEGRAM_BOT_TOKEN_DEV)",
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotificationPayload = await req.json();
    const { userId, type, skipDbInsert } = payload;
    const data: NotificationData = payload.data ?? {};

    if (!userId || !type) {
      return new Response(
        JSON.stringify({ error: "userId and type are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1. Resolve user's language
    const lang = await getUserLanguage(supabase, userId);

    // 2. Build localized title + message
    const tpl = TEMPLATES[lang][type] ?? TEMPLATES[DEFAULT_LANGUAGE][type];
    const title = tpl.title(data);
    const message = tpl.message(data);

    // 3. Persist to notifications table (unless caller already did)
    if (!skipDbInsert) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: payload.data ?? null,
          read: false,
        });
      if (insertError) {
        console.error("Failed to insert notification row:", insertError);
      }
    }

    // 4. Send Telegram message
    const inlineKeyboard = await buildInlineKeyboard(supabase, type, data, lang);
    const formattedMessage =
      `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`;

    const body: Record<string, unknown> = {
      chat_id: userId,
      text: formattedMessage,
      parse_mode: "HTML",
    };
    if (inlineKeyboard.length > 0) {
      body.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error("Telegram API error:", telegramResult);
    }

    return new Response(
      JSON.stringify({ success: true, language: lang, telegramResult }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
