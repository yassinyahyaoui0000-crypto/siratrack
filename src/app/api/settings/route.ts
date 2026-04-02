import { NextResponse } from "next/server";

import { recomputeDailyLogScores } from "@/lib/data/daily-logs";
import { updateSettingsForUser } from "@/lib/data/settings";
import { jsonError, parseJsonBody, requireApiUser } from "@/lib/http";
import { settingsSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = await parseJsonBody(request, settingsSchema);

  if ("error" in parsed) {
    return jsonError(parsed.error);
  }

  try {
    const settings = await updateSettingsForUser(
      session.supabase,
      session.user.id,
      parsed.data,
    );

    await recomputeDailyLogScores(session.supabase, session.user.id, settings);

    return NextResponse.json({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update settings.";

    return jsonError(message, 400);
  }
}
