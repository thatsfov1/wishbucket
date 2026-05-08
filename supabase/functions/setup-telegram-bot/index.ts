// Hosted setup helper for Telegram bot configuration.
// It configures commands, menu button, and webhook for main or dev bot.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-setup-secret",
};

type BotTarget = "main" | "dev";

interface SetupPayload {
  target?: BotTarget;
  dropPendingUpdates?: boolean;
}

interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
}

function getBotConfig(target: BotTarget) {
  const token =
    target === "main"
      ? (Deno.env.get("TELEGRAM_BOT_TOKEN_MAIN") ??
        Deno.env.get("TELEGRAM_BOT_TOKEN"))
      : (Deno.env.get("TELEGRAM_BOT_TOKEN_DEV") ??
        Deno.env.get("TELEGRAM_BOT_TOKEN"));

  const webAppUrl =
    target === "main"
      ? (Deno.env.get("WEBAPP_URL_MAIN") ?? Deno.env.get("WEBAPP_URL"))
      : (Deno.env.get("WEBAPP_URL_DEV") ?? Deno.env.get("WEBAPP_URL"));

  return { token, webAppUrl };
}

async function telegramPost<T>(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<TelegramApiResponse<T>> {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const json = (await response.json()) as TelegramApiResponse<T>;
  if (!json.ok) {
    throw new Error(
      `Telegram ${method} failed: ${json.description || "Unknown error"}`,
    );
  }

  return json;
}

function resolveWebhookUrl() {
  const explicitWebhookUrl = Deno.env.get("TELEGRAM_WEBHOOK_URL");
  if (explicitWebhookUrl) {
    return explicitWebhookUrl;
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL");
  if (!supabaseUrl) {
    throw new Error(
      "Missing SUPABASE_URL (or PROJECT_URL) to build webhook URL.",
    );
  }

  return `${supabaseUrl}/functions/v1/telegram-webhook`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const expectedSetupSecret = Deno.env.get("TELEGRAM_SETUP_SECRET");
    if (expectedSetupSecret) {
      const providedSetupSecret = req.headers.get("x-setup-secret");
      if (providedSetupSecret !== expectedSetupSecret) {
        return new Response(
          JSON.stringify({ error: "Unauthorized setup request" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const payload = (await req.json().catch(() => ({}))) as SetupPayload;
    const target = payload.target ?? "main";
    const { token, webAppUrl } = getBotConfig(target);

    if (!token) {
      throw new Error(
        target === "main"
          ? "Missing TELEGRAM_BOT_TOKEN_MAIN (or TELEGRAM_BOT_TOKEN)."
          : "Missing TELEGRAM_BOT_TOKEN_DEV (or TELEGRAM_BOT_TOKEN).",
      );
    }

    if (!webAppUrl) {
      throw new Error(
        target === "main"
          ? "Missing WEBAPP_URL_MAIN (or WEBAPP_URL)."
          : "Missing WEBAPP_URL_DEV (or WEBAPP_URL).",
      );
    }

    const webhookUrl = resolveWebhookUrl();
    const webhookSecretToken = Deno.env.get("TELEGRAM_WEBHOOK_SECRET_TOKEN");

    const commands = [
      { command: "start", description: "Open wishbucket menu" },
      { command: "hints", description: "Show recent gift hints" },
      { command: "languages", description: "Choose bot language" },
      { command: "instructions", description: "How to use wishbucket" },
      { command: "help", description: "Show help and instructions" },
    ];

    const getMe = await telegramPost<{ id: number; username?: string }>(
      token,
      "getMe",
      {},
    );

    const setMyCommands = await telegramPost(token, "setMyCommands", {
      commands,
      scope: { type: "default" },
      language_code: "en",
    });

    const setChatMenuButton = await telegramPost(token, "setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "Open wishbucket",
        web_app: { url: webAppUrl },
      },
    });

    const setWebhookBody: Record<string, unknown> = {
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: payload.dropPendingUpdates ?? false,
    };

    if (webhookSecretToken) {
      setWebhookBody.secret_token = webhookSecretToken;
    }

    const setWebhook = await telegramPost(token, "setWebhook", setWebhookBody);

    return new Response(
      JSON.stringify({
        success: true,
        target,
        webhookUrl,
        webAppUrl,
        bot: getMe.result,
        operations: {
          setMyCommands: setMyCommands.ok,
          setChatMenuButton: setChatMenuButton.ok,
          setWebhook: setWebhook.ok,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("setup-telegram-bot error:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
