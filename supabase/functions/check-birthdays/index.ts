// Birthday reminder scheduler.
//
// For every user with a birthday today or in 7 days, this function notifies
// each of their followers — exactly once per (follower, friend, kind, date)
// triple. The actual notification copy + Telegram delivery is handled by the
// `send-telegram-notification` edge function so the message is rendered in
// each follower's chosen language (en/uk/ru).

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
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

    let notificationsTriggered = 0;

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
        // Dedupe: skip if we already inserted this exact reminder today.
        const { data: existing, error: existingError } = await supabase
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

        if (existing) continue;

        // Delegate localization, DB insert, and Telegram delivery to the
        // shared notification function.
        const { error: invokeError } = await supabase.functions.invoke(
          "send-telegram-notification",
          {
            body: {
              userId: follower.user_id,
              type: "birthday_reminder",
              data: {
                actorName: firstName,
                friendId: user.user_id,
                reminderKind: kind,
                // Kept for the dedupe lookup above on subsequent runs.
                friendUserId: user.user_id,
                reminderDate: runDate,
              },
            },
          },
        );

        if (invokeError) {
          console.error("Failed to trigger notification", {
            followerId: follower.user_id,
            invokeError,
          });
          continue;
        }

        notificationsTriggered += 1;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        runDate,
        notificationsTriggered,
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
