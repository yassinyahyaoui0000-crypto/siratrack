import { NextResponse } from "next/server";

import { incrementFocusSessionsForToday } from "@/lib/data/daily-logs";
import { jsonError, requireApiUser } from "@/lib/http";

export async function POST() {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  try {
    const log = await incrementFocusSessionsForToday(
      session.supabase,
      session.user.id,
    );

    return NextResponse.json({ log });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to record the focus session.";

    return jsonError(message, 400);
  }
}
