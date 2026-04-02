import type { SupabaseClient } from "@supabase/supabase-js";

import {
  formatDayLabel,
  formatShortDateLabel,
  getCurrentWeekDates,
  getTodayDateString,
  getYesterdayDateString,
  isFutureDate,
  shiftDateString,
} from "@/lib/date";
import { listDailyLogsForUser } from "@/lib/data/daily-logs";
import { listActiveProjectsForUser } from "@/lib/data/projects";
import { getSettingsForUser } from "@/lib/data/settings";
import { getAppTimeZone } from "@/lib/env";
import { getFeedbackMessage } from "@/lib/feedback";
import { applyScoreToLog, createEmptyDailyLog, getHabitCompletionState } from "@/lib/scoring";
import type {
  AppSettings,
  DailyLog,
  DashboardData,
  HabitCompletion,
  StreakSummary,
  WeeklyScoreEntry,
  WeeklyScoreboard,
} from "@/lib/types";

function createLogMap(logs: DailyLog[], settings: AppSettings) {
  return new Map(logs.map((log) => [log.logDate, applyScoreToLog(log, settings)]));
}

export function computeWeeklyScoreboard(
  logs: DailyLog[],
  settings: AppSettings,
  todayDate: string,
): WeeklyScoreboard {
  const logMap = createLogMap(logs, settings);
  const entries = getCurrentWeekDates(todayDate).map((date) => {
    const log = logMap.get(date);
    const future = isFutureDate(date, todayDate);

    return {
      date,
      dayLabel: formatDayLabel(date),
      shortDateLabel: formatShortDateLabel(date),
      score: log ? log.dailyScore : future ? null : 0,
      dayRating: log ? log.dayRating : future ? null : "BAD",
      isToday: date === todayDate,
      isFuture: future,
    } satisfies WeeklyScoreEntry;
  });

  const elapsedEntries = entries.filter((entry) => !entry.isFuture);
  const totalScore = elapsedEntries.reduce(
    (sum, entry) => sum + (entry.score ?? 0),
    0,
  );

  let bestDay: WeeklyScoreEntry | null = null;
  let worstDay: WeeklyScoreEntry | null = null;

  for (const entry of elapsedEntries) {
    if (!bestDay || (entry.score ?? 0) >= (bestDay.score ?? 0)) {
      bestDay = entry;
    }

    if (!worstDay || (entry.score ?? 0) <= (worstDay.score ?? 0)) {
      worstDay = entry;
    }
  }

  return {
    averageScore: elapsedEntries.length
      ? Math.round(totalScore / elapsedEntries.length)
      : 0,
    bestDay,
    worstDay,
    entries,
  };
}

export function computeHabitCompletions(
  logs: DailyLog[],
  settings: AppSettings,
  todayDate: string,
) {
  const weekToDate = getCurrentWeekDates(todayDate).filter(
    (date) => !isFutureDate(date, todayDate),
  );
  const logMap = createLogMap(logs, settings);
  const totals = {
    deepWork: 0,
    coding: 0,
    building: 0,
    learning: 0,
    workout: 0,
    prayers: 0,
  };

  for (const date of weekToDate) {
    const log = logMap.get(date);

    if (!log) {
      continue;
    }

    const status = getHabitCompletionState(log, settings);

    totals.deepWork += Number(status.deepWork);
    totals.coding += Number(status.coding);
    totals.building += Number(status.building);
    totals.learning += Number(status.learning);
    totals.workout += Number(status.workout);
    totals.prayers += status.prayersCount;
  }

  const dayDenominator = Math.max(weekToDate.length, 1);
  const prayerDenominator = dayDenominator * 5;

  return [
    {
      key: "deepWork",
      label: "Deep Work",
      completionPercent: Math.round((totals.deepWork / dayDenominator) * 100),
      completedUnits: totals.deepWork,
      totalUnits: dayDenominator,
    },
    {
      key: "coding",
      label: "Coding",
      completionPercent: Math.round((totals.coding / dayDenominator) * 100),
      completedUnits: totals.coding,
      totalUnits: dayDenominator,
    },
    {
      key: "building",
      label: "Building",
      completionPercent: Math.round((totals.building / dayDenominator) * 100),
      completedUnits: totals.building,
      totalUnits: dayDenominator,
    },
    {
      key: "learning",
      label: "Learning",
      completionPercent: Math.round((totals.learning / dayDenominator) * 100),
      completedUnits: totals.learning,
      totalUnits: dayDenominator,
    },
    {
      key: "workout",
      label: "Workout",
      completionPercent: Math.round((totals.workout / dayDenominator) * 100),
      completedUnits: totals.workout,
      totalUnits: dayDenominator,
    },
    {
      key: "prayers",
      label: "Prayers",
      completionPercent: Math.round((totals.prayers / prayerDenominator) * 100),
      completedUnits: totals.prayers,
      totalUnits: prayerDenominator,
    },
  ] satisfies HabitCompletion[];
}

export function computeStreaks(
  logs: DailyLog[],
  settings: AppSettings,
  todayDate: string,
): StreakSummary {
  const logMap = createLogMap(logs, settings);
  const yesterdayDate = getYesterdayDateString(todayDate);
  const yesterdayLog = logMap.get(yesterdayDate);
  const missedYesterday = !yesterdayLog || yesterdayLog.dailyScore < 60;
  const todayLog = logMap.get(todayDate);

  let full = 0;
  let partial = 0;
  let partialCursor = yesterdayDate;
  let fullCursor = yesterdayDate;

  while (true) {
    const log = logMap.get(partialCursor);

    if (!log || log.dailyScore < 60) {
      break;
    }

    partial += 1;
    partialCursor = shiftDateString(partialCursor, -1);
  }

  while (true) {
    const log = logMap.get(fullCursor);

    if (!log) {
      break;
    }

    const status = getHabitCompletionState(log, settings);
    const fullForDay =
      status.deepWork &&
      status.coding &&
      status.learning &&
      (!settings.requireProjectWork || log.projectWorkDone) &&
      (!settings.requireWorkout || log.workoutDone) &&
      (!settings.requireAllPrayers || status.prayersComplete);

    if (!fullForDay) {
      break;
    }

    full += 1;
    fullCursor = shiftDateString(fullCursor, -1);
  }

  if (todayLog) {
    if (todayLog.dailyScore >= 60) {
      partial += 1;
    }

    const todayStatus = getHabitCompletionState(todayLog, settings);
    const todayFull =
      todayStatus.deepWork &&
      todayStatus.coding &&
      todayStatus.learning &&
      (!settings.requireProjectWork || todayLog.projectWorkDone) &&
      (!settings.requireWorkout || todayLog.workoutDone) &&
      (!settings.requireAllPrayers || todayStatus.prayersComplete);

    if (todayFull) {
      full += 1;
    }
  }

  return { full, partial, missedYesterday };
}

export async function getDashboardData(
  client: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<DashboardData> {
  const settings = await getSettingsForUser(client, userId);
  const [logs, activeProjects] = await Promise.all([
    listDailyLogsForUser(client, userId),
    listActiveProjectsForUser(client, userId),
  ]);

  const todayDate = getTodayDateString(getAppTimeZone());
  const todayLog = logs.find((log) => log.logDate === todayDate) ?? null;
  const scoredTodayLog = todayLog
    ? applyScoreToLog(todayLog, settings)
    : createEmptyDailyLog(todayDate);
  const streaks = computeStreaks(logs, settings, todayDate);

  return {
    userEmail,
    settings,
    todayLog: scoredTodayLog,
    hasTodayLog: Boolean(todayLog),
    weeklyScoreboard: computeWeeklyScoreboard(logs, settings, todayDate),
    habitCompletions: computeHabitCompletions(logs, settings, todayDate),
    streaks,
    feedbackMessage: getFeedbackMessage(
      todayLog ? scoredTodayLog.dailyScore : null,
      streaks.missedYesterday,
      streaks.full,
    ),
    activeProjects,
  };
}
