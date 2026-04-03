import type { SupabaseClient } from "@supabase/supabase-js";

import { getWeekStartDateString } from "@/lib/date";
import type {
  WeeklyCommitment,
  WeeklyCommitmentInput,
} from "@/lib/types";

function fromWeeklyCommitmentRow(row: Record<string, unknown>): WeeklyCommitment {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    weekStart: String(row.week_start),
    deepWorkHoursGoal: Number(row.deep_work_hours_goal),
    codingProblemsGoal: Number(row.coding_problems_goal),
    learningMinutesGoal: Number(row.learning_minutes_goal),
    workoutDaysGoal: Number(row.workout_days_goal),
    fullPrayerDaysGoal: Number(row.full_prayer_days_goal),
    primaryProjectId:
      row.primary_project_id === null ? null : String(row.primary_project_id),
    commitmentNote: String(row.commitment_note ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toWeeklyCommitmentRow(
  userId: string,
  weekStart: string,
  input: WeeklyCommitmentInput,
) {
  return {
    user_id: userId,
    week_start: weekStart,
    deep_work_hours_goal: input.deepWorkHoursGoal,
    coding_problems_goal: input.codingProblemsGoal,
    learning_minutes_goal: input.learningMinutesGoal,
    workout_days_goal: input.workoutDaysGoal,
    full_prayer_days_goal: input.fullPrayerDaysGoal,
    primary_project_id: input.primaryProjectId,
    commitment_note: input.commitmentNote || null,
  };
}

export async function getWeeklyCommitmentForWeek(
  client: SupabaseClient,
  userId: string,
  weekStart: string,
) {
  const { data, error } = await client
    .from("weekly_commitments")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromWeeklyCommitmentRow(data) : null;
}

export async function getCurrentWeeklyCommitmentForUser(
  client: SupabaseClient,
  userId: string,
  todayDate: string,
) {
  return getWeeklyCommitmentForWeek(
    client,
    userId,
    getWeekStartDateString(todayDate),
  );
}

export async function upsertCurrentWeeklyCommitmentForUser(
  client: SupabaseClient,
  userId: string,
  todayDate: string,
  input: WeeklyCommitmentInput,
) {
  const weekStart = getWeekStartDateString(todayDate);
  const payload = toWeeklyCommitmentRow(userId, weekStart, input);
  const { data, error } = await client
    .from("weekly_commitments")
    .upsert(payload as never, { onConflict: "user_id,week_start" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return fromWeeklyCommitmentRow(data);
}
