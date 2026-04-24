// Supabase Edge Function for sending Telegram notifications
// Deploy with: supabase functions deploy send-telegram-notification

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any> | null;
}

// Telegram Mini App deep-link format:
//   https://t.me/<bot_username>/<miniapp_short_name>?startapp=<param>
// The Mini App reads the param from `initDataUnsafe.start_param`.
const BOT_USERNAME =
  Deno.env.get("TELEGRAM_BOT_USERNAME") ?? "wishbucket_bot";
const MINIAPP_SHORT_NAME =
  Deno.env.get("TELEGRAM_MINIAPP_SHORT_NAME") ?? "app";

const miniAppUrl = (startParam?: string): string => {
  const base = `https://t.me/${BOT_USERNAME}/${MINIAPP_SHORT_NAME}`;
  return startParam ? `${base}?startapp=${startParam}` : base;
};

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
    const { userId, title, message, type, data } = payload;

    const chatId = userId;
    const formattedMessage = `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`;

    const inlineKeyboard = await buildInlineKeyboard(supabase, type, data);

    const body: Record<string, unknown> = {
      chat_id: chatId,
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

    return new Response(JSON.stringify({ success: true, telegramResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function buildInlineKeyboard(
  supabase: ReturnType<typeof createClient>,
  type: string,
  data?: Record<string, any> | null,
): Promise<Array<Array<{ text: string; url: string }>>> {
  switch (type) {
    case "new_follower": {
      // Open the new follower's profile directly inside the Mini App.
      const followerId = data?.followerId;
      if (!followerId) return [];
      return [
        [
          {
            text: "👤 View Profile",
            url: miniAppUrl(`user_${followerId}`),
          },
        ],
      ];
    }

    case "friend_added_item": {
      // Prefer opening the specific wishlist the item was added to.
      const wishlistId = data?.wishlistId;
      if (wishlistId) {
        return [
          [
            {
              text: "🎁 Open Wishlist",
              url: miniAppUrl(`wishlist_${wishlistId}`),
            },
          ],
        ];
      }
      // If the item was added to multiple wishlists, open the author's profile.
      const authorId = data?.userId;
      if (authorId) {
        return [
          [
            {
              text: "👤 View Profile",
              url: miniAppUrl(`user_${authorId}`),
            },
          ],
        ];
      }
      return [];
    }

    case "wishlist_shared": {
      // Only show a button if the wishlist actually has items — no point
      // opening an empty wishlist.
      const wishlistId = data?.wishlistId;
      if (!wishlistId) return [];

      const { count, error } = await supabase
        .from("wishlist_items")
        .select("id", { count: "exact", head: true })
        .eq("wishlist_id", wishlistId);

      if (error || !count || count === 0) return [];

      return [
        [
          {
            text: "📋 Open Wishlist",
            url: miniAppUrl(`wishlist_${wishlistId}`),
          },
        ],
      ];
    }

    case "item_reserved":
    case "item_purchased": {
      const wishlistId = data?.wishlistId;
      if (!wishlistId) return [];
      return [
        [
          {
            text: "🎁 View Wishlist",
            url: miniAppUrl(`wishlist_${wishlistId}`),
          },
        ],
      ];
    }

    case "birthday_reminder": {
      const friendId = data?.friendId;
      if (!friendId) return [];
      return [
        [
          {
            text: "🎂 View Friend's Profile",
            url: miniAppUrl(`user_${friendId}`),
          },
        ],
      ];
    }

    case "referral_signup":
    case "bonus_earned":
    default:
      // Generic fallback — open the Mini App.
      return [
        [
          {
            text: "📱 Open wishbucket",
            url: miniAppUrl(),
          },
        ],
      ];
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
