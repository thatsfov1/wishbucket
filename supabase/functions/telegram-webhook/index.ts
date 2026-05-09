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

// Telegram Bot config (supports legacy + main/dev env naming)
const BOT_TOKEN = (
  Deno.env.get("TELEGRAM_BOT_TOKEN_MAIN") ??
  Deno.env.get("TELEGRAM_BOT_TOKEN") ??
  Deno.env.get("TELEGRAM_BOT_TOKEN_DEV")
)?.trim();
if (!BOT_TOKEN) {
  throw new Error(
    "Missing bot token. Set TELEGRAM_BOT_TOKEN_MAIN, TELEGRAM_BOT_TOKEN, or TELEGRAM_BOT_TOKEN_DEV.",
  );
}

const WEBAPP_URL = (
  Deno.env.get("WEBAPP_URL_MAIN") ??
  Deno.env.get("WEBAPP_URL") ??
  Deno.env.get("WEBAPP_URL_DEV")
)?.trim();
const BOT_USERNAME = Deno.env.get("TELEGRAM_BOT_USERNAME") ?? "wishbucket_bot";
const BOT_FALLBACK_URL = `https://t.me/${BOT_USERNAME}`;
const DOCS_URL_EN = "https://telegra.ph/wishbucket-quick-guide-03-18";
const DOCS_URL_UK = "https://telegra.ph/wishbucket-shvidkij-gajd-03-18";
const DOCS_URL_RU = "https://telegra.ph/wishbucket-bystryj-gajd-03-18";

type LanguageCode = "en" | "uk" | "ru";
const DEFAULT_LANGUAGE: LanguageCode = "en";

const I18N = {
  en: {
    languageName: "English",
    greeting: (firstName: string) =>
      `👋 <b>Hey ${firstName}!</b>\n\nChoose your language to continue:`,
    chooseLanguageTitle: `🌍 <b>Choose your language</b>`,
    chooseLanguageBody: `Pick one language for bot messages:`,
    languageSet: (name: string) =>
      `✅ Language set to ${name}. You can change it anytime.`,
    welcomeMenu: (firstName: string) =>
      `👋 <b>Hey ${firstName}! Welcome to wishbucket</b>\n\n` +
      `🎁 <b>wishbucket</b> is your personal wishlist assistant inside Telegram.\n\n` +
      `Here's what you can do:\n` +
      `• Create and edit wishlists\n` +
      `• Add items manually or by pasting product links\n` +
      `• Forward messages to save gift hints\n` +
      `• Discover what your friends want\n\n` +
      `Choose an option below 👇`,
    instructionsTitle: `📖 <b>Instructions</b>\n\nRead the full guide here:`,
    hintsTitle:
      `💡 <b>How Gift Hints Work</b>\n\n` +
      `When someone in a chat says they want something, forward that message to me.\n\n` +
      `<b>Steps:</b>\n` +
      `1️⃣ See someone mention a wish in chat\n` +
      `2️⃣ Long-press the message -> Forward -> send to this bot\n` +
      `3️⃣ I save it as a gift hint with sender details\n\n` +
      `<b>Supported formats:</b> text, photos, voice, video, documents\n\n` +
      `Open the app to browse all saved hints 📱`,
    noHints: `📭 You don't have any saved hints yet.\n\nForward a message from a chat to save a gift idea!`,
    hintsHeader: `🎁 <b>Your Recent Gift Hints:</b>\n\n`,
    hintsFooter: `\n📱 Open the app to see all hints and manage them.`,
    hintSaved: (
      forwardName: string,
      previewText: string,
      isLong: boolean,
      mediaLabel: string,
    ) =>
      `✅ <b>Gift hint saved!</b>\n\n` +
      `👤 <b>From:</b> ${forwardName}\n` +
      `💬 <b>Hint:</b> ${previewText}${isLong ? "..." : ""}${mediaLabel}\n\n` +
      `You can view all hints in the app.`,
    regularTip:
      `💡 <b>Tip:</b> To save a gift hint, <b>forward a message</b> from your chat!\n\n` +
      `When someone says they want something, just forward that message to me and I'll remember it for you.`,
    buttons: {
      openApp: "🚀 Open wishbucket",
      instructions: "📖 Instructions",
      language: "Language",
      hintsInfo: "💡 How Hints Work",
      openInstructions: "📖 Open Instructions",
      back: "⬅️ Back",
      viewHints: "📱 View Hints",
      openWishbucket: "📱 Open wishbucket",
    },
  },
  uk: {
    languageName: "Українська",
    greeting: (firstName: string) =>
      `👋 <b>Привіт, ${firstName}!</b>\n\nОберіть мову для продовження:`,
    chooseLanguageTitle: `🌍 <b>Оберіть мову</b>`,
    chooseLanguageBody: `Виберіть мову повідомлень бота:`,
    languageSet: (name: string) =>
      `✅ Мову змінено на ${name}. Її можна змінити будь-коли.`,
    welcomeMenu: (firstName: string) =>
      `👋 <b>Привіт, ${firstName}! Ласкаво просимо у wishbucket</b>\n\n` +
      `🎁 <b>wishbucket</b> — ваш помічник для вішлістів у Telegram.\n\n` +
      `Що тут можна робити:\n` +
      `• Створювати та редагувати вішлісти\n` +
      `• Додавати товари вручну або вставляти посилання\n` +
      `• Пересилати повідомлення і зберігати gift hints\n` +
      `• Дивитися, що хочуть друзі\n\n` +
      `Оберіть дію нижче 👇`,
    instructionsTitle: `📖 <b>Інструкція</b>\n\nПовний гайд тут:`,
    hintsTitle:
      `💡 <b>Як працюють gift hints</b>\n\n` +
      `Коли хтось у чаті пише, що хоче отримати, перешліть це повідомлення мені.\n\n` +
      `<b>Кроки:</b>\n` +
      `1️⃣ Побачили бажання у чаті\n` +
      `2️⃣ Затисніть повідомлення -> Переслати -> надішліть цьому боту\n` +
      `3️⃣ Я збережу це як hint з даними відправника\n\n` +
      `<b>Формати:</b> текст, фото, голосові, відео, документи\n\n` +
      `Відкрийте застосунок, щоб переглянути всі hints 📱`,
    noHints: `📭 У вас поки немає збережених hints.\n\nПерешліть повідомлення з чату, щоб зберегти ідею подарунка!`,
    hintsHeader: `🎁 <b>Ваші останні gift hints:</b>\n\n`,
    hintsFooter: `\n📱 Відкрийте застосунок, щоб переглянути й керувати hints.`,
    hintSaved: (
      forwardName: string,
      previewText: string,
      isLong: boolean,
      mediaLabel: string,
    ) =>
      `✅ <b>Gift hint збережено!</b>\n\n` +
      `👤 <b>Від:</b> ${forwardName}\n` +
      `💬 <b>Hint:</b> ${previewText}${isLong ? "..." : ""}${mediaLabel}\n\n` +
      `Ви можете переглянути всі hints у застосунку.`,
    regularTip:
      `💡 <b>Порада:</b> щоб зберегти gift hint, <b>перешліть повідомлення</b> з чату!\n\n` +
      `Коли хтось каже, чого хоче, просто перешліть це повідомлення мені.`,
    buttons: {
      openApp: "🚀 Відкрити wishbucket",
      instructions: "📖 Інструкція",
      language: "Мова",
      hintsInfo: "💡 Як працюють hints",
      openInstructions: "📖 Відкрити інструкцію",
      back: "⬅️ Назад",
      viewHints: "📱 Переглянути hints",
      openWishbucket: "📱 Відкрити wishbucket",
    },
  },
  ru: {
    languageName: "Русский",
    greeting: (firstName: string) =>
      `👋 <b>Привет, ${firstName}!</b>\n\nВыберите язык для продолжения:`,
    chooseLanguageTitle: `🌍 <b>Выберите язык</b>`,
    chooseLanguageBody: `Выберите язык сообщений бота:`,
    languageSet: (name: string) =>
      `✅ Язык изменен на ${name}. Его можно поменять в любой момент.`,
    welcomeMenu: (firstName: string) =>
      `👋 <b>Привет, ${firstName}! Добро пожаловать в wishbucket</b>\n\n` +
      `🎁 <b>wishbucket</b> — ваш помощник по вишлистам в Telegram.\n\n` +
      `Что можно делать:\n` +
      `• Создавать и редактировать вишлисты\n` +
      `• Добавлять товары вручную или вставкой ссылки\n` +
      `• Пересылать сообщения и сохранять gift hints\n` +
      `• Смотреть, что хотят друзья\n\n` +
      `Выберите действие ниже 👇`,
    instructionsTitle: `📖 <b>Инструкция</b>\n\nПолный гайд тут:`,
    hintsTitle:
      `💡 <b>Как работают gift hints</b>\n\n` +
      `Когда кто-то в чате пишет, что хочет получить, просто перешлите это сообщение мне.\n\n` +
      `<b>Шаги:</b>\n` +
      `1️⃣ Увидели желание в чате\n` +
      `2️⃣ Зажмите сообщение -> Переслать -> отправьте этому боту\n` +
      `3️⃣ Я сохраню это как hint с данными отправителя\n\n` +
      `<b>Поддерживаются:</b> текст, фото, голос, видео, документы\n\n` +
      `Откройте приложение, чтобы смотреть все hints 📱`,
    noHints: `📭 У вас пока нет сохраненных hints.\n\nПерешлите сообщение из чата, чтобы сохранить идею подарка!`,
    hintsHeader: `🎁 <b>Ваши последние gift hints:</b>\n\n`,
    hintsFooter: `\n📱 Откройте приложение, чтобы смотреть и управлять hints.`,
    hintSaved: (
      forwardName: string,
      previewText: string,
      isLong: boolean,
      mediaLabel: string,
    ) =>
      `✅ <b>Gift hint сохранен!</b>\n\n` +
      `👤 <b>От:</b> ${forwardName}\n` +
      `💬 <b>Hint:</b> ${previewText}${isLong ? "..." : ""}${mediaLabel}\n\n` +
      `Все hints можно посмотреть в приложении.`,
    regularTip:
      `💡 <b>Совет:</b> чтобы сохранить gift hint, <b>перешлите сообщение</b> из чата!\n\n` +
      `Когда кто-то говорит, что хочет, просто перешлите сообщение этому боту.`,
    buttons: {
      openApp: "🚀 Открыть wishbucket",
      instructions: "📖 Инструкция",
      language: "Язык",
      hintsInfo: "💡 Как работают hints",
      openInstructions: "📖 Открыть инструкцию",
      back: "⬅️ Назад",
      viewHints: "📱 Посмотреть hints",
      openWishbucket: "📱 Открыть wishbucket",
    },
  },
} as const;

function normalizeLanguage(value?: string): LanguageCode {
  if (value === "uk" || value === "ru" || value === "en") {
    return value;
  }
  return DEFAULT_LANGUAGE;
}

function parseTelegramData(value: unknown): Record<string, unknown> {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

function getDocsUrl(language: LanguageCode): string {
  if (language === "uk") return DOCS_URL_UK;
  if (language === "ru") return DOCS_URL_RU;
  return DOCS_URL_EN;
}

function getOpenAppButton(language: LanguageCode) {
  const text = I18N[language].buttons.openWishbucket;
  if (WEBAPP_URL) {
    return {
      text,
      web_app: {
        url: WEBAPP_URL,
      },
    };
  }

  // Fallback keeps bot responses working even if WEBAPP_URL is not configured.
  return {
    text,
    url: BOT_FALLBACK_URL,
  };
}

function getMainMenuMarkup(language: LanguageCode) {
  const t = I18N[language].buttons;
  return {
    inline_keyboard: [
      [getOpenAppButton(language)],
      [
        { text: t.instructions, callback_data: "instructions" },
        { text: t.language, callback_data: "choose_language" },
      ],
      [{ text: t.hintsInfo, callback_data: "hints_info" }],
    ],
  };
}

function getLanguageButtons(
  withBack = false,
  language: LanguageCode = DEFAULT_LANGUAGE,
) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [
    [
      { text: "English", callback_data: "lang_en" },
      { text: "Українська", callback_data: "lang_uk" },
      { text: "Русский", callback_data: "lang_ru" },
    ],
  ];

  if (withBack) {
    rows.push([
      { text: I18N[language].buttons.back, callback_data: "back_to_start" },
    ]);
  }

  return { inline_keyboard: rows };
}

async function getUserLanguage(userId: number): Promise<LanguageCode> {
  const { data: user } = await supabase
    .from("users")
    .select("telegram_data")
    .eq("user_id", userId)
    .maybeSingle();

  if (!user) return DEFAULT_LANGUAGE;

  const tgData = parseTelegramData(user.telegram_data);
  const language =
    typeof tgData.language === "string" ? tgData.language : undefined;

  return normalizeLanguage(language);
}

async function setUserLanguage(
  userId: number,
  language: LanguageCode,
): Promise<void> {
  const { data: user } = await supabase
    .from("users")
    .select("telegram_data")
    .eq("user_id", userId)
    .maybeSingle();

  const currentData = parseTelegramData(user?.telegram_data);

  await supabase
    .from("users")
    .update({ telegram_data: { ...currentData, language } })
    .eq("user_id", userId);
}

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
  forward_origin?: {
    type: "user" | "hidden_user" | "chat" | "channel";
    sender_user?: TelegramUser;
    sender_user_name?: string;
    sender_chat?: {
      id: number;
      title?: string;
      username?: string;
    };
  };
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
  edited_message?: TelegramMessage;
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

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    console.error("sendMessage failed:", {
      chatId,
      status: response.status,
      result,
    });
  }
}

// Get or create user in database
async function ensureUser(telegramUser: TelegramUser) {
  const { data: existingUser } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id", telegramUser.id)
    .maybeSingle();

  if (!existingUser) {
    const { error } = await supabase.from("users").insert({
      user_id: telegramUser.id,
      telegram_data: { ...telegramUser, language: DEFAULT_LANGUAGE },
      referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
    });
    if (error) console.error("Could not insert user:", error);
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
        const tgData = parseTelegramData(user.telegram_data);
        const tgUsername =
          typeof tgData.username === "string" ? tgData.username : undefined;
        if (tgUsername?.toLowerCase() === username.toLowerCase()) {
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Get name of the person who originally sent the message
function getForwardedFromName(message: TelegramMessage): {
  name: string;
  username?: string;
  userId?: number;
} {
  if (message.forward_origin) {
    if (
      message.forward_origin.type === "user" &&
      message.forward_origin.sender_user
    ) {
      const sender = message.forward_origin.sender_user;
      const name = [sender.first_name, sender.last_name]
        .filter(Boolean)
        .join(" ");
      return {
        name,
        username: sender.username,
        userId: sender.id,
      };
    }

    if (
      message.forward_origin.type === "hidden_user" &&
      message.forward_origin.sender_user_name
    ) {
      return { name: message.forward_origin.sender_user_name };
    }

    if (
      (message.forward_origin.type === "chat" ||
        message.forward_origin.type === "channel") &&
      message.forward_origin.sender_chat
    ) {
      return {
        name: message.forward_origin.sender_chat.title || "Channel",
        username: message.forward_origin.sender_chat.username,
      };
    }
  }

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
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    console.error("answerCallbackQuery failed:", {
      callbackQueryId,
      status: response.status,
      result,
    });
  }
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
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    console.error("editMessageText failed:", {
      chatId,
      messageId,
      status: response.status,
      result,
    });
  }
}

// ============================================
// /start — Welcome Screen
// ============================================
async function handleStartCommand(message: TelegramMessage) {
  const userId = await ensureUser(message.from);
  const language = await getUserLanguage(userId);
  const t = I18N[language];
  const firstName = escapeHtml(message.from.first_name || "there");

  await sendTelegramMessage(
    message.chat.id,
    t.greeting(firstName),
    getLanguageButtons(false, language),
  );
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
  await ensureUser(from);
  const currentLanguage = await getUserLanguage(from.id);
  const currentT = I18N[currentLanguage];

  switch (data) {
    case "instructions": {
      await editTelegramMessage(chatId, messageId, currentT.instructionsTitle, {
        inline_keyboard: [
          [
            {
              text: currentT.buttons.openInstructions,
              url: getDocsUrl(currentLanguage),
            },
          ],
          [{ text: currentT.buttons.back, callback_data: "back_to_start" }],
        ],
      });
      await answerCallbackQuery(callbackQueryId);
      break;
    }

    case "choose_language": {
      const text = `${currentT.chooseLanguageTitle}\n\n${currentT.chooseLanguageBody}`;
      await editTelegramMessage(
        chatId,
        messageId,
        text,
        getLanguageButtons(true, currentLanguage),
      );
      await answerCallbackQuery(callbackQueryId);
      break;
    }

    case "lang_en":
    case "lang_uk":
    case "lang_ru": {
      const selectedLanguage: LanguageCode =
        data === "lang_ru" ? "ru" : data === "lang_uk" ? "uk" : "en";
      await setUserLanguage(from.id, selectedLanguage);

      const selectedT = I18N[selectedLanguage];
      await answerCallbackQuery(
        callbackQueryId,
        selectedT.languageSet(selectedT.languageName),
      );

      await editTelegramMessage(
        chatId,
        messageId,
        selectedT.welcomeMenu(from.first_name || "there"),
        getMainMenuMarkup(selectedLanguage),
      );
      break;
    }

    case "hints_info": {
      await editTelegramMessage(chatId, messageId, currentT.hintsTitle, {
        inline_keyboard: [
          [getOpenAppButton(currentLanguage)],
          [{ text: currentT.buttons.back, callback_data: "back_to_start" }],
        ],
      });
      await answerCallbackQuery(callbackQueryId);
      break;
    }

    case "back_to_start": {
      await editTelegramMessage(
        chatId,
        messageId,
        currentT.welcomeMenu(from.first_name || "there"),
        getMainMenuMarkup(currentLanguage),
      );
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
  const language = await getUserLanguage(userId);
  const t = I18N[language];

  const { data: hints } = await supabase
    .from("gift_hints")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!hints || hints.length === 0) {
    await sendTelegramMessage(message.chat.id, t.noHints);
    return;
  }

  let text = t.hintsHeader;
  for (const hint of hints) {
    const preview = escapeHtml(hint.hint_text?.substring(0, 50) || "[Media]");
    const aboutName = escapeHtml(hint.about_name || "Someone");
    text += `• <b>${aboutName}</b>: ${preview}${
      hint.hint_text?.length > 50 ? "..." : ""
    }\n`;
  }
  text += t.hintsFooter;

  await sendTelegramMessage(message.chat.id, text, {
    inline_keyboard: [[getOpenAppButton(language)]],
  });
}

async function handleForwardedMessage(message: TelegramMessage) {
  const userId = await ensureUser(message.from);
  const language = await getUserLanguage(userId);
  const t = I18N[language];
  const forwardInfo = getForwardedFromName(message);

  // Try to find the user in our database
  let aboutUserId = forwardInfo.userId || null;
  if (!aboutUserId && forwardInfo.username) {
    aboutUserId = await findUserByInfo(forwardInfo.username);
  }

  const hintText = extractHintText(message);
  const messageType = getMessageType(message);
  const mediaFileId = getMediaFileId(message);

  const { error } = await supabase.from("gift_hints").insert({
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
  });

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
  const previewText = escapeHtml(
    hintText?.substring(0, 100) || "[Media message]",
  );
  const isLong = !!hintText && hintText.length > 100;
  await sendTelegramMessage(
    message.chat.id,
    t.hintSaved(escapeHtml(forwardInfo.name), previewText, isLong, mediaLabel),
    {
      inline_keyboard: [[getOpenAppButton(language)]],
    },
  );
}

// Handle /instructions and /help command
async function handleInstructionsCommand(message: TelegramMessage) {
  const language = await getUserLanguage(message.from.id);
  const t = I18N[language];

  await sendTelegramMessage(message.chat.id, t.instructionsTitle, {
    inline_keyboard: [
      [{ text: t.buttons.openInstructions, url: getDocsUrl(language) }],
      [getOpenAppButton(language)],
    ],
  });
}

// Handle /languages command
async function handleLanguagesCommand(message: TelegramMessage) {
  const language = await getUserLanguage(message.from.id);
  const t = I18N[language];
  const text = `${t.chooseLanguageTitle}\n\n${t.chooseLanguageBody}`;

  await sendTelegramMessage(
    message.chat.id,
    text,
    getLanguageButtons(true, language),
  );
}

// Handle regular (non-forwarded) message
async function handleRegularMessage(message: TelegramMessage) {
  const language = await getUserLanguage(message.from.id);
  const t = I18N[language];

  await sendTelegramMessage(message.chat.id, t.regularTip, {
    inline_keyboard: [[getOpenAppButton(language)]],
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    const message = update.message ?? update.edited_message;
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

    const msgText = (message.text || "").trim().toLowerCase();

    // Handle commands
    if (msgText.startsWith("/start")) {
      await handleStartCommand(message);
    } else if (msgText.startsWith("/hints")) {
      await handleHintsCommand(message);
    } else if (
      msgText.startsWith("/instructions") ||
      msgText.startsWith("/help")
    ) {
      await handleInstructionsCommand(message);
    } else if (
      msgText.startsWith("/languages") ||
      msgText.startsWith("/language")
    ) {
      await handleLanguagesCommand(message);
    }
    // Handle forwarded messages
    else if (
      message.forward_origin ||
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
