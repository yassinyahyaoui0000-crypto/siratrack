import { NextResponse } from "next/server";

import { getTodayDateString } from "@/lib/date";
import { listDailyLogsForUser } from "@/lib/data/daily-logs";
import { computeWeeklyCommitmentProgress } from "@/lib/data/dashboard";
import { getSettingsForUser } from "@/lib/data/settings";
import {
  getCurrentWeeklyCommitmentForUser,
  upsertCurrentWeeklyCommitmentForUser,
} from "@/lib/data/weekly-commitments";
import { getAppTimeZone } from "@/lib/env";
import { jsonError, parseJsonBody, requireApiUser } from "@/lib/http";
import { weeklyCommitmentSchema } from "@/lib/validation";

export async function GET() {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  try {
    const todayDate = getTodayDateString(getAppTimeZone());
    const [settings, logs, commitment] = await Promise.all([
      getSettingsForUser(session.supabase, session.user.id),
      listDailyLogsForUser(session.supabase, session.user.id),
      getCurrentWeeklyCommitmentForUser(session.supabase, session.user.id, todayDate),
    ]);

    return NextResponse.json({
      commitment,
      progress: computeWeeklyCommitmentProgress(logs, settings, commitment, todayDate),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load the weekly commitment.";

    return jsonError(message, 400);
  }
}

export async function PUT(request: Request) {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = await parseJsonBody(request, weeklyCommitmentSchema);

  if ("error" in parsed) {
    return jsonError(parsed.error);
  }

  try {
    const todayDate = getTodayDateString(getAppTimeZone());
    const commitment = await upsertCurrentWeeklyCommitmentForUser(
      session.supabase,
      session.user.id,
      todayDate,
      parsed.data,
    );
    const [settings, logs] = await Promise.all([
      getSettingsForUser(session.supabase, session.user.id),
      listDailyLogsForUser(session.supabase, session.user.id),
    ]);

    return NextResponse.json({
      commitment,
      progress: computeWeeklyCommitmentProgress(logs, settings, commitment, todayDate),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save the weekly commitment.";

    return jsonError(message, 400);
  }
}
