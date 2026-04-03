import { NextResponse } from "next/server";

import { getTodayDateString } from "@/lib/date";
import { getDailyLogByDate } from "@/lib/data/daily-logs";
import {
  resolveOpenRecoveryPlansIfEligible,
  updateRecoveryPlanForUser,
} from "@/lib/data/recovery-plans";
import { getAppTimeZone } from "@/lib/env";
import { jsonError, parseJsonBody, requireApiUser } from "@/lib/http";
import { recoveryPlanUpdateSchema } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = await parseJsonBody(request, recoveryPlanUpdateSchema);

  if ("error" in parsed) {
    return jsonError(parsed.error);
  }

  try {
    const { id } = await context.params;
    const plan = await updateRecoveryPlanForUser(
      session.supabase,
      session.user.id,
      id,
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
      error instanceof Error ? error.message : "Unable to update the recovery plan.";

    return jsonError(message, 400);
  }
}
