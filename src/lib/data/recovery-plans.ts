import type { SupabaseClient } from "@supabase/supabase-js";

import { canResolveRecoveryPlan } from "@/lib/scoring";
import type {
  DailyLog,
  RecoveryPlan,
  RecoveryPlanInput,
  RecoveryPlanUpdateInput,
} from "@/lib/types";

function fromRecoveryPlanRow(row: Record<string, unknown>): RecoveryPlan {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    triggerDate: String(row.trigger_date),
    targetDate: String(row.target_date),
    missReason: String(row.miss_reason) as RecoveryPlan["missReason"],
    correctiveAction: String(row.corrective_action),
    status: String(row.status) as RecoveryPlan["status"],
    resolvedAt: row.resolved_at === null ? null : String(row.resolved_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRecoveryPlanRow(userId: string, input: RecoveryPlanInput) {
  return {
    user_id: userId,
    trigger_date: input.triggerDate,
    target_date: input.targetDate,
    miss_reason: input.missReason,
    corrective_action: input.correctiveAction.trim(),
    status: "open",
  };
}

export async function listRecoveryPlansForUser(
  client: SupabaseClient,
  userId: string,
) {
  const { data, error } = await client
    .from("recovery_plans")
    .select("*")
    .eq("user_id", userId)
    .order("trigger_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => fromRecoveryPlanRow(row));
}

export async function createRecoveryPlanForUser(
  client: SupabaseClient,
  userId: string,
  input: RecoveryPlanInput,
) {
  const { data, error } = await client
    .from("recovery_plans")
    .insert(toRecoveryPlanRow(userId, input) as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return fromRecoveryPlanRow(data);
}

export async function updateRecoveryPlanForUser(
  client: SupabaseClient,
  userId: string,
  planId: string,
  input: RecoveryPlanUpdateInput,
) {
  const payload: Record<string, unknown> = {};

  if (input.missReason) {
    payload.miss_reason = input.missReason;
  }

  if (typeof input.correctiveAction === "string") {
    payload.corrective_action = input.correctiveAction.trim();
  }

  const { data, error } = await client
    .from("recovery_plans")
    .update(payload as never)
    .eq("id", planId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return fromRecoveryPlanRow(data);
}

export async function resolveOpenRecoveryPlansIfEligible(
  client: SupabaseClient,
  userId: string,
  todayLog: DailyLog,
) {
  if (!canResolveRecoveryPlan(todayLog)) {
    return [];
  }

  const { data, error } = await client
    .from("recovery_plans")
    .update(
      {
        status: "resolved",
        resolved_at: new Date().toISOString(),
      } as never,
    )
    .eq("user_id", userId)
    .eq("status", "open")
    .lte("target_date", todayLog.logDate)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => fromRecoveryPlanRow(row));
}
