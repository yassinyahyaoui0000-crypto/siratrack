import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { AppSettings, AppSettingsInput } from "@/lib/types";

function fromSettingsRow(row: Record<string, unknown>): AppSettings {
  return {
    userId: String(row.user_id),
    deepWorkTargetHours: Number(row.deep_work_target_hours),
    codingTargetProblems: Number(row.coding_target_problems),
    learningTargetMinutes: Number(row.learning_target_minutes),
    requireProjectWork: Boolean(row.require_project_work),
    requireWorkout: Boolean(row.require_workout),
    requireAllPrayers: Boolean(row.require_all_prayers),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toSettingsRow(userId: string, settings: AppSettingsInput) {
  return {
    user_id: userId,
    deep_work_target_hours: settings.deepWorkTargetHours,
    coding_target_problems: settings.codingTargetProblems,
    learning_target_minutes: settings.learningTargetMinutes,
    require_project_work: settings.requireProjectWork,
    require_workout: settings.requireWorkout,
    require_all_prayers: settings.requireAllPrayers,
  };
}

export function createDefaultSettings(userId?: string): AppSettings {
  return { ...DEFAULT_SETTINGS, userId };
}

export async function getSettingsForUser(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("app_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return fromSettingsRow(data);
  }

  const defaults = createDefaultSettings(userId);
  const insertPayload = toSettingsRow(userId, defaults);
  const { data: inserted, error: insertError } = await client
    .from("app_settings")
    .insert(insertPayload as never)
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return fromSettingsRow(inserted);
}

export async function updateSettingsForUser(
  client: SupabaseClient,
  userId: string,
  input: AppSettingsInput,
) {
  const upsertPayload = toSettingsRow(userId, input);
  const { data, error } = await client
    .from("app_settings")
    .upsert(upsertPayload as never, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return fromSettingsRow(data);
}
