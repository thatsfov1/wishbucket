// Resend Hint - sends the hint message back to user in Telegram chat

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("PROJECT_URL")!;
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

interface ResendRequest {
  hintId: string;
  userId: number;
}

// Send text message
async function sendMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

// Forward media by file_id
async function sendMedia(
  chatId: number,
  type: string,
  fileId: string,
  caption?: string
) {
  let method = "sendDocument";
  let bodyKey = "document";

  switch (type) {
    case "photo":
      method = "sendPhoto";
      bodyKey = "photo";
      break;
    case "voice":
      method = "sendVoice";
      bodyKey = "voice";
      break;
    case "video":
      method = "sendVideo";
      bodyKey = "video";
      break;
    case "video_note":
      method = "sendVideoNote";
      bodyKey = "video_note";
      break;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    [bodyKey]: fileId,
  };
  if (caption) {
    body.caption = caption;
  }

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { hintId, userId }: ResendRequest = await req.json();

    if (!hintId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing hintId or userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the hint from database
    const { data: hint, error: hintError } = await supabase
      .from("gift_hints")
      .select("*")
      .eq("id", hintId)
      .eq("user_id", userId)
      .single();

    if (hintError || !hint) {
      return new Response(JSON.stringify({ error: "Hint not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the message
    const header = `💡 <b>Gift Hint from ${
      hint.about_name || "Someone"
    }</b>\n\n`;

    if (hint.message_type === "text" || !hint.media_file_id) {
      // Text message
      await sendMessage(userId, header + (hint.hint_text || "[No text]"));
    } else {
      // Media message - send the media with caption
      const caption = header + (hint.hint_text || "");
      await sendMedia(userId, hint.message_type, hint.media_file_id, caption);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Resend hint error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
