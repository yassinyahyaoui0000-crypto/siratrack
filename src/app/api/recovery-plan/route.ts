import { NextResponse } from "next/server";

import { getTodayDateString } from "@/lib/date";
import { getDailyLogByDate } from "@/lib/data/daily-logs";
import {
  createRecoveryPlanForUser,
  resolveOpenRecoveryPlansIfEligible,
} from "@/lib/data/recovery-plans";
import { getAppTimeZone } from "@/lib/env";
import { jsonError, parseJsonBody, requireApiUser } from "@/lib/http";
import { recoveryPlanCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = await parseJsonBody(request, recoveryPlanCreateSchema);

  if ("error" in parsed) {
    return jsonError(parsed.error);
  }

  try {
    const plan = await createRecoveryPlanForUser(
      session.supabase,
      session.user.id,
      parsed.data,
    );
    const todayDate = getTodayDateString(getAppTimeZone());
    const todayLog = await getDailyLogByDate(
      session.supabase,
      session.user.id,
      todayDate,
    );

    if (todayLog) {
      await resolveOpenRecoveryPlansIfEligible(
        session.supabase,
        session.user.id,
        todayLog,
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save the recovery plan.";
    const status = message.includes("duplicate") || message.includes("unique") ? 409 : 400;

    return jsonError(message, status);
  }
}
