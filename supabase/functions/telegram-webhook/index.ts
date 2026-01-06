// Telegram Webhook Handler for Gift Hints
// Handles forwarded messages to save gift hints

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("PROJECT_URL")!;
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Telegram Bot Token
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

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
}

// Send message to Telegram
async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: object
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

// Find user by username or name
async function findUserByInfo(
  username?: string,
  name?: string
): Promise<number | null> {
  if (username) {
    const { data } = await supabase
      .from("users")
      .select("user_id, telegram_data")
      .single();

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
      curr.width > prev.width ? curr : prev
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

// Handle /start command
async function handleStartCommand(message: TelegramMessage) {
  const userId = await ensureUser(message.from);

  await sendTelegramMessage(
    message.chat.id,
    `👋 <b>Welcome to WishBucket!</b>\n\n` +
      `I help you remember gift ideas from your chats.\n\n` +
      `<b>How to use:</b>\n` +
      `1️⃣ When someone mentions they want something, <b>forward that message to me</b>\n` +
      `2️⃣ I'll save it as a gift hint for that person\n` +
      `3️⃣ Open the app to see all your saved hints\n\n` +
      `💡 <b>Supported:</b> Text, photos, voice messages, videos\n\n` +
      `Forward a message now to get started!`,
    {
      inline_keyboard: [
        [
          {
            text: "📱 Open WishBucket",
            web_app: {
              url: Deno.env.get("WEBAPP_URL") || "https://your-app.com",
            },
          },
        ],
      ],
    }
  );
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
        `Forward a message from a chat to save a gift idea!`
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
            url: Deno.env.get("WEBAPP_URL") || "https://your-app.com",
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
      `❌ Sorry, couldn't save this hint. Please try again.`
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
              url: Deno.env.get("WEBAPP_URL") || "https://your-app.com",
            },
          },
        ],
      ],
    }
  );
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
              url: Deno.env.get("WEBAPP_URL") || "https://your-app.com",
            },
          },
        ],
      ],
    }
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
