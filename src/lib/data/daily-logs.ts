import type { SupabaseClient } from "@supabase/supabase-js";

import { getTodayDateString } from "@/lib/date";
import { resolveOpenRecoveryPlansIfEligible } from "@/lib/data/recovery-plans";
import { getSettingsForUser } from "@/lib/data/settings";
import { getAppTimeZone } from "@/lib/env";
import {
  applyScoreToLog,
  createEmptyDailyLog,
  normalizeDailyLogInput,
} from "@/lib/scoring";
import type { AppSettings, DailyLog, DailyLogInput } from "@/lib/types";

function fromDailyLogRow(row: Record<string, unknown>): DailyLog {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    logDate: String(row.log_date),
    deepWorkHours: Number(row.deep_work_hours),
    codingProblemsSolved: Number(row.coding_problems_solved),
    projectWorkDone: Boolean(row.project_work_done),
    projectNotes: String(row.project_notes ?? ""),
    learningMinutes: Number(row.learning_minutes),
    workoutDone: Boolean(row.workout_done),
    fajrDone: Boolean(row.fajr_done),
    dhuhrDone: Boolean(row.dhuhr_done),
    asrDone: Boolean(row.asr_done),
    maghribDone: Boolean(row.maghrib_done),
    ishaDone: Boolean(row.isha_done),
    focusSessionsCompleted: Number(row.focus_sessions_completed),
    reflection: String(row.reflection ?? ""),
    dailyScore: Number(row.daily_score),
    dayRating: String(row.day_rating) as DailyLog["dayRating"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toDailyLogRow(userId: string, log: DailyLog) {
  return {
    user_id: userId,
    log_date: log.logDate,
    deep_work_hours: log.deepWorkHours,
    coding_problems_solved: log.codingProblemsSolved,
    project_work_done: log.projectWorkDone,
    project_notes: log.projectNotes || null,
    learning_minutes: log.learningMinutes,
    workout_done: log.workoutDone,
    fajr_done: log.fajrDone,
    dhuhr_done: log.dhuhrDone,
    asr_done: log.asrDone,
    maghrib_done: log.maghribDone,
    isha_done: log.ishaDone,
    focus_sessions_completed: log.focusSessionsCompleted,
    reflection: log.reflection || null,
    daily_score: log.dailyScore,
    day_rating: log.dayRating,
  };
}

export async function listDailyLogsForUser(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => fromDailyLogRow(row));
}

export async function getDailyLogByDate(
  client: SupabaseClient,
  userId: string,
  logDate: string,
) {
  const { data, error } = await client
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromDailyLogRow(data) : null;
}

function mergeTodayLog(
  existing: DailyLog | null,
  logDate: string,
  input: DailyLogInput,
) {
  return {
    ...(existing ?? createEmptyDailyLog(logDate)),
    ...input,
    logDate,
    projectNotes: input.projectWorkDone ? input.projectNotes : "",
    reflection: input.reflection,
  };
}

export async function saveDailyLogForToday(
  client: SupabaseClient,
  userId: string,
  input: DailyLogInput,
  mode: "create" | "upsert",
) {
  const today = getTodayDateString(getAppTimeZone());
  const settings = await getSettingsForUser(client, userId);
  const existing = await getDailyLogByDate(client, userId, today);

  if (mode === "create" && existing) {
    throw new Error("A check-in for today already exists.");
  }

  const mergedLog = applyScoreToLog(
    mergeTodayLog(existing, today, normalizeDailyLogInput(input)),
    settings,
  );
  const upsertPayload = toDailyLogRow(userId, mergedLog);

  const { data, error } = await client
    .from("daily_logs")
    .upsert(upsertPayload as never, { onConflict: "user_id,log_date" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const savedLog = fromDailyLogRow(data);
  await resolveOpenRecoveryPlansIfEligible(client, userId, savedLog);

  return savedLog;
}

export async function incrementFocusSessionsForToday(
  client: SupabaseClient,
  userId: string,
) {
  const today = getTodayDateString(getAppTimeZone());
  const settings = await getSettingsForUser(client, userId);
  const existing = await getDailyLogByDate(client, userId, today);
  const mergedLog = applyScoreToLog(
    {
      ...(existing ?? createEmptyDailyLog(today)),
      logDate: today,
      focusSessionsCompleted: (existing?.focusSessionsCompleted ?? 0) + 1,
    },
    settings,
  );
  const upsertPayload = toDailyLogRow(userId, mergedLog);

  const { data, error } = await client
    .from("daily_logs")
    .upsert(upsertPayload as never, { onConflict: "user_id,log_date" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const savedLog = fromDailyLogRow(data);
  await resolveOpenRecoveryPlansIfEligible(client, userId, savedLog);

  return savedLog;
}

export async function recomputeDailyLogScores(
  client: SupabaseClient,
  userId: string,
  settings: AppSettings,
) {
  const logs = await listDailyLogsForUser(client, userId);

  if (logs.length === 0) {
    return [];
  }

  const recalculatedRows = logs.map((log) =>
    toDailyLogRow(userId, applyScoreToLog(log, settings)),
  );

  const { data, error } = await client
    .from("daily_logs")
    .upsert(recalculatedRows as never, { onConflict: "user_id,log_date" })
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => fromDailyLogRow(row));
}
