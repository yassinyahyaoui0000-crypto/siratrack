import { NextResponse } from "next/server";

import { getTodayDateString } from "@/lib/date";
import { listDailyLogsForUser } from "@/lib/data/daily-logs";
import { computeAccountabilityHistory } from "@/lib/data/dashboard";
import { getSettingsForUser } from "@/lib/data/settings";
import { getAppTimeZone } from "@/lib/env";
import { jsonError, requireApiUser } from "@/lib/http";

export async function GET(request: Request) {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30d";

  if (range !== "30d") {
    return jsonError("Unsupported history range.", 400);
  }

  try {
    const todayDate = getTodayDateString(getAppTimeZone());
    const [settings, logs] = await Promise.all([
      getSettingsForUser(session.supabase, session.user.id),
      listDailyLogsForUser(session.supabase, session.user.id),
    ]);

    return NextResponse.json({
      history: computeAccountabilityHistory(logs, settings, todayDate),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load accountability history.";

    return jsonError(message, 400);
  }
}
