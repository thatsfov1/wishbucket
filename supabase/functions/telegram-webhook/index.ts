// Telegram Webhook Handler for Gift Hints
// Handles forwarded messages to save gift hints

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL");
const supabaseServiceKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Telegram Bot Token
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
if (!BOT_TOKEN) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN env var.");
}

const WEBAPP_URL = Deno.env.get("WEBAPP_URL") || "https://your-app.com";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
  caption?: string;
  forward_from?: TelegramUser;
  forward_from_chat?: {
    id: number;
    title?: string;
    username?: string;
  };
  forward_sender_name?: string;
  forward_date?: number;
  photo?: Array<{ file_id: string; width: number; height: number }>;
  voice?: { file_id: string; duration: number };
  video?: { file_id: string; duration: number };
  video_note?: { file_id: string; duration: number };
  document?: { file_id: string; file_name?: string };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
}

// Send message to Telegram
async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: object,
) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Get or create user in database
async function ensureUser(telegramUser: TelegramUser) {
  const { data: existingUser } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id", telegramUser.id)
    .single();

  if (!existingUser) {
    await supabase.from("users").insert({
      user_id: telegramUser.id,
      telegram_data: telegramUser,
      referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
    });
  }

  return telegramUser.id;
}

// Find user by username
async function findUserByInfo(username?: string): Promise<number | null> {
  if (username) {
    // Search in telegram_data for matching username
    const { data: users } = await supabase
      .from("users")
      .select("user_id, telegram_data");
    if (users) {
      for (const user of users) {
        const tgData =
          typeof user.telegram_data === "string"
            ? JSON.parse(user.telegram_data)
            : user.telegram_data;
        if (tgData?.username?.toLowerCase() === username.toLowerCase()) {
          return user.user_id;
        }
      }
    }
  }
  return null;
}

// Extract hint text from message
function extractHintText(message: TelegramMessage): string {
  if (message.text) return message.text;
  if (message.caption) return message.caption;
  return "";
}

// Get message type
function getMessageType(message: TelegramMessage): string {
  if (message.voice) return "voice";
  if (message.video) return "video";
  if (message.video_note) return "video_note";
  if (message.photo) return "photo";
  if (message.document) return "document";
  return "text";
}

// Get media file ID
function getMediaFileId(message: TelegramMessage): string | null {
  if (message.voice) return message.voice.file_id;
  if (message.video) return message.video.file_id;
  if (message.video_note) return message.video_note.file_id;
  if (message.photo) {
    // Get largest photo
    const largest = message.photo.reduce((prev, curr) =>
      curr.width > prev.width ? curr : prev,
    );
    return largest.file_id;
  }
  if (message.document) return message.document.file_id;
  return null;
}

// Get name of the person who originally sent the message
function getForwardedFromName(message: TelegramMessage): {
  name: string;
  username?: string;
  userId?: number;
} {
  if (message.forward_from) {
    const name = [
      message.forward_from.first_name,
      message.forward_from.last_name,
    ]
      .filter(Boolean)
      .join(" ");
    return {
      name,
      username: message.forward_from.username,
      userId: message.forward_from.id,
    };
  }
  if (message.forward_sender_name) {
    return { name: message.forward_sender_name };
  }
  if (message.forward_from_chat) {
    return {
      name: message.forward_from_chat.title || "Channel",
      username: message.forward_from_chat.username,
    };
  }
  return { name: "Unknown" };
}

// Answer callback query (removes loading state)
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

// Edit an existing message
async function editTelegramMessage(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: object,
) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
  const body: any = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ============================================
// /start — Welcome Screen
// ============================================
async function handleStartCommand(message: TelegramMessage) {
  const userId = await ensureUser(message.from);
  const firstName = message.from.first_name || "there";

  const text =
    `👋 <b>Hey ${firstName}! Welcome to WishBucket</b>\n\n` +
    `🎁 <b>WishBucket</b> is your personal wishlist assistant inside Telegram.\n\n` +
    `Here's what you can do:\n` +
    `• Create and share wishlists with friends\n` +
    `• Forward messages to save gift hints\n` +
    `• Discover what your friends want\n` +
    `• Organize secret santa events\n\n` +
    `Choose an option below to get started 👇`;

  await sendTelegramMessage(message.chat.id, text, {
    inline_keyboard: [
      [
        {
          text: "🚀 Open WishBucket",
          web_app: {
            url: WEBAPP_URL,
          },
        },
      ],
      [
        { text: "📖 Instructions", callback_data: "instructions" },
        { text: "🌍 Language", callback_data: "choose_language" },
      ],
      [{ text: "💡 How Hints Work", callback_data: "hints_info" }],
    ],
  });
}

// ============================================
// Callback Query Handlers
// ============================================
async function handleCallbackQuery(
  callbackQueryId: string,
  data: string,
  chatId: number,
  messageId: number,
  from: TelegramUser,
) {
  switch (data) {
    case "instructions": {
      const text =
        `📖 <b>Instructions</b>\n\n` +
        `Read the full guide on how to use WishBucket:`;

      await editTelegramMessage(chatId, messageId, text, {
        inline_keyboard: [
          [
            {
              text: "📖 Open Instructions",
              url: "https://telegra.ph/wishbucket-quick-guide-03-18",
            },
          ],
          [{ text: "⬅️ Back", callback_data: "back_to_start" }],
        ],
      });
      await answerCallbackQuery(callbackQueryId);
      break;
    }

    case "choose_language": {
      const text =
        `🌍 <b>Choose your language</b>\n\n` +
        `Select your preferred language:`;

      await editTelegramMessage(chatId, messageId, text, {
        inline_keyboard: [
          [
            { text: "🇬🇧 English", callback_data: "lang_en" },
            { text: "🇵🇱 Polski", callback_data: "lang_pl" },
          ],
          [
            { text: "🇺🇦 Українська", callback_data: "lang_uk" },
            { text: "🇷🇺 Русский", callback_data: "lang_ru" },
          ],
          [{ text: "⬅️ Back", callback_data: "back_to_start" }],
        ],
      });
      await answerCallbackQuery(callbackQueryId);
      break;
    }

    case "lang_en":
    case "lang_pl":
    case "lang_uk":
    case "lang_ru": {
      const langNames: Record<string, string> = {
        lang_en: "English 🇬🇧",
        lang_pl: "Polski 🇵🇱",
        lang_uk: "Українська 🇺🇦",
        lang_ru: "Русский 🇷🇺",
      };
      // TODO: persist language preference to DB
      await answerCallbackQuery(
        callbackQueryId,
        `✅ ${langNames[data]} selected`,
      );

      const text =
        `✅ Language set to <b>${langNames[data]}</b>\n\n` +
        `You can change it anytime from this menu.`;

      await editTelegramMessage(chatId, messageId, text, {
        inline_keyboard: [
          [{ text: "⬅️ Back to menu", callback_data: "back_to_start" }],
        ],
      });
      break;
    }

    case "hints_info": {
      const text =
        `💡 <b>How Gift Hints Work</b>\n\n` +
        `When someone in a chat says they want something — forward that message to me!\n\n` +
        `<b>Steps:</b>\n` +
        `1️⃣ See someone mention a wish in a chat\n` +
        `2️⃣ Long-press the message → Forward → send to this bot\n` +
        `3️⃣ I'll save it as a gift hint with the sender's name\n\n` +
        `<b>Supported formats:</b> Text, photos, voice, video, documents\n\n` +
        `Open the app to browse all your saved hints anytime 📱`;

      await editTelegramMessage(chatId, messageId, text, {
        inline_keyboard: [
          [
            {
              text: "📱 Open WishBucket",
              web_app: {
                url: WEBAPP_URL,
              },
            },
          ],
          [{ text: "⬅️ Back", callback_data: "back_to_start" }],
        ],
      });
      await answerCallbackQuery(callbackQueryId);
      break;
    }

    case "back_to_start": {
      const firstName = from.first_name || "there";
      const text =
        `👋 <b>Hey ${firstName}! Welcome to WishBucket</b>\n\n` +
        `🎁 <b>WishBucket</b> is your personal wishlist assistant inside Telegram.\n\n` +
        `Here's what you can do:\n` +
        `• Create and share wishlists with friends\n` +
        `• Forward messages to save gift hints\n` +
        `• Discover what your friends want\n` +
        `• Organize secret santa events\n\n` +
        `Choose an option below to get started 👇`;

      await editTelegramMessage(chatId, messageId, text, {
        inline_keyboard: [
          [
            {
              text: "🚀 Open WishBucket",
              web_app: {
                url: WEBAPP_URL,
              },
            },
          ],
          [
            { text: "📖 Instructions", callback_data: "instructions" },
            { text: "🌍 Language", callback_data: "choose_language" },
          ],
          [{ text: "💡 How Hints Work", callback_data: "hints_info" }],
        ],
      });
      await answerCallbackQuery(callbackQueryId);
      break;
    }

    default:
      await answerCallbackQuery(callbackQueryId);
  }
}

// Handle /hints command - show recent hints
async function handleHintsCommand(message: TelegramMessage) {
  const userId = message.from.id;

  const { data: hints } = await supabase
    .from("gift_hints")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!hints || hints.length === 0) {
    await sendTelegramMessage(
      message.chat.id,
      `📭 You don't have any saved hints yet.\n\n` +
        `Forward a message from a chat to save a gift idea!`,
    );
    return;
  }

  let text = `🎁 <b>Your Recent Gift Hints:</b>\n\n`;
  for (const hint of hints) {
    const preview = hint.hint_text?.substring(0, 50) || "[Media]";
    text += `• <b>${hint.about_name || "Someone"}</b>: ${preview}${
      hint.hint_text?.length > 50 ? "..." : ""
    }\n`;
  }
  text += `\n📱 Open the app to see all hints and manage them.`;

  await sendTelegramMessage(message.chat.id, text, {
    inline_keyboard: [
      [
        {
          text: "📱 Open WishBucket",
          web_app: {
            url: WEBAPP_URL,
          },
        },
      ],
    ],
  });
}

// Handle forwarded message - save as gift hint
async function handleForwardedMessage(message: TelegramMessage) {
  const userId = await ensureUser(message.from);
  const forwardInfo = getForwardedFromName(message);

  // Try to find the user in our database
  let aboutUserId = forwardInfo.userId || null;
  if (!aboutUserId && forwardInfo.username) {
    aboutUserId = await findUserByInfo(forwardInfo.username);
  }

  const hintText = extractHintText(message);
  const messageType = getMessageType(message);
  const mediaFileId = getMediaFileId(message);

  // Save the hint
  const { data: hint, error } = await supabase
    .from("gift_hints")
    .insert({
      user_id: userId,
      about_user_id: aboutUserId,
      about_name: forwardInfo.name,
      about_username: forwardInfo.username,
      hint_text: hintText,
      message_type: messageType,
      media_file_id: mediaFileId,
      telegram_message_id: message.message_id,
      telegram_chat_id: message.chat.id,
      forward_date: message.forward_date
        ? new Date(message.forward_date * 1000).toISOString()
        : null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving hint:", error);
    await sendTelegramMessage(
      message.chat.id,
      `❌ Sorry, couldn't save this hint. Please try again.`,
    );
    return;
  }

  // Send confirmation
  const mediaLabel = messageType !== "text" ? ` (${messageType})` : "";
  await sendTelegramMessage(
    message.chat.id,
    `✅ <b>Gift hint saved!</b>\n\n` +
      `👤 <b>From:</b> ${forwardInfo.name}\n` +
      `💬 <b>Hint:</b> ${hintText?.substring(0, 100) || "[Media message]"}${
        hintText && hintText.length > 100 ? "..." : ""
      }${mediaLabel}\n\n` +
      `You can view all hints in the app.`,
    {
      inline_keyboard: [
        [
          {
            text: "📱 View Hints",
            web_app: {
              url: WEBAPP_URL,
            },
          },
        ],
      ],
    },
  );
}

// Handle /instructions and /help command
async function handleInstructionsCommand(message: TelegramMessage) {
  const text =
    `📖 <b>WishBucket Instructions</b>\n\n` +
    `Read the full guide on how to use WishBucket and gift hints:`;

  await sendTelegramMessage(message.chat.id, text, {
    inline_keyboard: [
      [{ text: "📖 Open Instructions", url: `${WEBAPP_URL}/docs` }],
      [
        {
          text: "📱 Open WishBucket",
          web_app: {
            url: WEBAPP_URL,
          },
        },
      ],
    ],
  });
}

// Handle regular (non-forwarded) message
async function handleRegularMessage(message: TelegramMessage) {
  await sendTelegramMessage(
    message.chat.id,
    `💡 <b>Tip:</b> To save a gift hint, <b>forward a message</b> from your chat!\n\n` +
      `When someone says they want something, just forward that message to me and I'll remember it for you.`,
    {
      inline_keyboard: [
        [
          {
            text: "📱 Open WishBucket",
            web_app: {
              url: WEBAPP_URL,
            },
          },
        ],
      ],
    },
  );
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    const message = update.message;
    const callbackQuery = update.callback_query;

    // Handle callback queries (button presses)
    if (callbackQuery && callbackQuery.data && callbackQuery.message) {
      await handleCallbackQuery(
        callbackQuery.id,
        callbackQuery.data,
        callbackQuery.message.chat.id,
        callbackQuery.message.message_id,
        callbackQuery.from,
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle commands
    if (message.text?.startsWith("/start")) {
      await handleStartCommand(message);
    } else if (message.text?.startsWith("/hints")) {
      await handleHintsCommand(message);
    } else if (
      message.text?.startsWith("/instructions") ||
      message.text?.startsWith("/help")
    ) {
      await handleInstructionsCommand(message);
    }
    // Handle forwarded messages
    else if (
      message.forward_from ||
      message.forward_sender_name ||
      message.forward_from_chat
    ) {
      await handleForwardedMessage(message);
    }
    // Handle regular messages
    else {
      await handleRegularMessage(message);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
