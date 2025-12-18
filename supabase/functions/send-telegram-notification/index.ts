// Supabase Edge Function for sending Telegram notifications
// Deploy with: supabase functions deploy send-telegram-notification

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotificationPayload = await req.json();
    const { userId, title, message, type, data } = payload;

    // Get user's chat_id from the database (it's the same as userId for Telegram users)
    const chatId = userId;

    // Format the message
    let formattedMessage = `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`;

    // Add action button based on notification type
    let inlineKeyboard: any[][] = [];
    
    switch (type) {
      case "new_follower":
        inlineKeyboard = [[{ text: "👥 View Friends", callback_data: "view_friends" }]];
        break;
      case "item_reserved":
      case "item_purchased":
        if (data?.wishlistId) {
          inlineKeyboard = [[{ text: "🎁 View Wishlist", callback_data: `view_wishlist_${data.wishlistId}` }]];
        }
        break;
      case "wishlist_shared":
        if (data?.wishlistId) {
          inlineKeyboard = [[{ text: "📋 Open Wishlist", url: `https://t.me/wishbucket_bot?start=wishlist_${data.wishlistId}` }]];
        }
        break;
      case "birthday_reminder":
        inlineKeyboard = [[{ text: "🎂 View Friend's Wishlist", callback_data: `birthday_${data?.friendId}` }]];
        break;
      case "referral_signup":
        inlineKeyboard = [[{ text: "🎉 Invite More Friends", callback_data: "invite_friends" }]];
        break;
      default:
        inlineKeyboard = [[{ text: "📱 Open WishBucket", url: "https://t.me/wishbucket_bot" }]];
    }

    // Send the Telegram message
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedMessage,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
        }),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error("Telegram API error:", telegramResult);
      // Don't throw - notification was saved to DB, just log the error
    }

    return new Response(
      JSON.stringify({ success: true, telegramResult }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

