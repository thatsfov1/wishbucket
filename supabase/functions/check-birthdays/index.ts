import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ReminderKind = "week_before" | "birthday_day";

function getMonthDay(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
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

function buildReminderMessage(
  name: string,
  kind: ReminderKind,
): { title: string; message: string } {
  if (kind === "week_before") {
    return {
      title: `⏰ ${name}'s birthday is in 1 week`,
      message: `It's time to look at ${name}'s wishlists and prepare a gift.`,
    };
  }

  return {
    title: `🎉 It's ${name}'s birthday today!`,
    message: `Celebrate ${name} and check their wishlists for a perfect gift.`,
  };
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  title: string,
  message: string,
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `<b>${title}</b>\n\n${message}`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎁 Open wishbucket",
                url: "https://t.me/wishbucket_bot/app",
              },
            ],
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to send Telegram message", { chatId, errorText });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!botToken) {
      throw new Error("Missing telegram bot token env variable");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date();
    const weekAhead = new Date(today);
    weekAhead.setUTCDate(today.getUTCDate() + 7);

    const todayKey = getMonthDay(today);
    const weekAheadKey = getMonthDay(weekAhead);
    const runDate = today.toISOString().slice(0, 10);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("user_id, telegram_data, birthday")
      .not("birthday", "is", null);

    if (usersError) {
      throw usersError;
    }

    let remindersInserted = 0;
    let telegramMessagesSent = 0;

    for (const user of users ?? []) {
      if (!user.birthday) continue;

      const birthdayDate = new Date(user.birthday);
      const birthdayKey = getMonthDay(birthdayDate);

      let kind: ReminderKind | null = null;
      if (birthdayKey === todayKey) {
        kind = "birthday_day";
      } else if (birthdayKey === weekAheadKey) {
        kind = "week_before";
      }

      if (!kind) continue;

      const telegramData = parseTelegramData(user.telegram_data);
      const firstName = (telegramData.first_name as string) || "Your friend";
      const reminder = buildReminderMessage(firstName, kind);

      const { data: followers, error: followersError } = await supabase
        .from("friends")
        .select("user_id")
        .eq("friend_id", user.user_id);

      if (followersError) {
        console.error("Failed loading followers", {
          targetUser: user.user_id,
          followersError,
        });
        continue;
      }

      for (const follower of followers ?? []) {
        const dedupeData = {
          friendUserId: user.user_id,
          reminderKind: kind,
          reminderDate: runDate,
        };

        const { data: existingNotification, error: existingError } =
          await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", follower.user_id)
            .eq("type", "birthday_reminder")
            .eq("data->>friendUserId", String(user.user_id))
            .eq("data->>reminderKind", kind)
            .eq("data->>reminderDate", runDate)
            .limit(1)
            .maybeSingle();

        if (existingError) {
          console.error("Failed dedupe check", {
            followerId: follower.user_id,
            existingError,
          });
          continue;
        }

        if (existingNotification) {
          continue;
        }

        const { error: insertError } = await supabase
          .from("notifications")
          .insert({
            user_id: follower.user_id,
            type: "birthday_reminder",
            title: reminder.title,
            message: reminder.message,
            data: dedupeData,
            read: false,
          });

        if (insertError) {
          console.error("Failed inserting notification", {
            followerId: follower.user_id,
            insertError,
          });
          continue;
        }

        remindersInserted += 1;

        await sendTelegramMessage(
          botToken,
          follower.user_id,
          reminder.title,
          reminder.message,
        );
        telegramMessagesSent += 1;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        runDate,
        remindersInserted,
        telegramMessagesSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("check-birthdays error", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
