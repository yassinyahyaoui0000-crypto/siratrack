import { NextResponse } from "next/server";

import {
  computeHabitCompletions,
  computeWeeklyScoreboard,
} from "@/lib/data/dashboard";
import { listDailyLogsForUser } from "@/lib/data/daily-logs";
import { getSettingsForUser } from "@/lib/data/settings";
import { getTodayDateString } from "@/lib/date";
import { getAppTimeZone } from "@/lib/env";
import { jsonError, requireApiUser } from "@/lib/http";

export async function GET() {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  try {
    const [settings, logs] = await Promise.all([
      getSettingsForUser(session.supabase, session.user.id),
      listDailyLogsForUser(session.supabase, session.user.id),
    ]);
    const today = getTodayDateString(getAppTimeZone());

    return NextResponse.json({
      weeklyScoreboard: computeWeeklyScoreboard(logs, settings, today),
      habitCompletions: computeHabitCompletions(logs, settings, today),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load the weekly scoreboard.";

    return jsonError(message, 400);
  }
}
