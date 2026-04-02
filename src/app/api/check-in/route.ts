import { NextResponse } from "next/server";

import { saveDailyLogForToday } from "@/lib/data/daily-logs";
import { jsonError, parseJsonBody, requireApiUser } from "@/lib/http";
import { dailyLogSchema } from "@/lib/validation";

async function saveCheckIn(request: Request, mode: "create" | "upsert") {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = await parseJsonBody(request, dailyLogSchema);

  if ("error" in parsed) {
    return jsonError(parsed.error);
  }

  try {
    const log = await saveDailyLogForToday(
      session.supabase,
      session.user.id,
      parsed.data,
      mode,
    );

    return NextResponse.json({ log });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save the daily check-in.";
    const status = mode === "create" && message.includes("already exists") ? 409 : 400;

    return jsonError(message, status);
  }
}

export async function POST(request: Request) {
  return saveCheckIn(request, "create");
}

export async function PUT(request: Request) {
  return saveCheckIn(request, "upsert");
}
