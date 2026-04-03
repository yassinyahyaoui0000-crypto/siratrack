import type { SupabaseClient } from "@supabase/supabase-js";

import { HABIT_LABELS } from "@/lib/constants";
import {
  formatDayLabel,
  formatShortDateLabel,
  getCurrentWeekDates,
  getElapsedWeekDays,
  getRollingDateRange,
  getTodayDateString,
  getYesterdayDateString,
  isFutureDate,
  shiftDateString,
} from "@/lib/date";
import { listDailyLogsForUser } from "@/lib/data/daily-logs";
import { listActiveProjectsForUser } from "@/lib/data/projects";
import { listRecoveryPlansForUser } from "@/lib/data/recovery-plans";
import { getSettingsForUser } from "@/lib/data/settings";
import {
  getCurrentWeeklyCommitmentForUser,
  listWeeklyCommitmentsForUser,
} from "@/lib/data/weekly-commitments";
import { getAppTimeZone } from "@/lib/env";
import { getFeedbackMessage } from "@/lib/feedback";
import {
  createAchievementGallery,
  createDailyMissionBoard,
  createProgressionSummary,
  createWeeklyBossBoard,
  createWeeklyProgressionSummaries,
  getRecentUnlocks,
} from "@/lib/progression";
import {
  applyScoreToLog,
  createEmptyDailyLog,
  getFocusDerivedHours,
  getHabitCompletionState,
  shouldTriggerRecoveryPlan,
} from "@/lib/scoring";
import type {
  AccountabilityHistory,
  ActiveRecoveryPlan,
  AppSettings,
  DailyLog,
  DashboardData,
  HabitCompletion,
  RecoveryPlan,
  StreakSummary,
  WeeklyCommitment,
  WeeklyCommitmentProgress,
  WeeklyScoreEntry,
  WeeklyScoreboard,
} from "@/lib/types";

function createLogMap(logs: DailyLog[], settings: AppSettings) {
  return new Map(logs.map((log) => [log.logDate, applyScoreToLog(log, settings)]));
}

function getScoredLogs(logs: DailyLog[], settings: AppSettings) {
  return logs.map((log) => applyScoreToLog(log, settings));
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

export function computeWeeklyCommitmentProgress(
  logs: DailyLog[],
  settings: AppSettings,
  commitment: WeeklyCommitment | null,
  todayDate: string,
) {
  if (!commitment) {
    return null;
  }

  const weekDates = getCurrentWeekDates(todayDate).filter((date) => date <= todayDate);
  const logMap = createLogMap(logs, settings);
  const elapsedDays = getElapsedWeekDays(todayDate);
  const totals = {
    deepWorkHours: 0,
    codingProblems: 0,
    learningMinutes: 0,
    workoutDays: 0,
    fullPrayerDays: 0,
  };

  for (const date of weekDates) {
    const log = logMap.get(date);

    if (!log) {
      continue;
    }

    const habitState = getHabitCompletionState(log, settings);
    totals.deepWorkHours += log.deepWorkHours;
    totals.codingProblems += log.codingProblemsSolved;
    totals.learningMinutes += log.learningMinutes;
    totals.workoutDays += Number(log.workoutDone);
    totals.fullPrayerDays += Number(habitState.prayersComplete);
  }

  const metrics = [
    {
      key: "deepWorkHours" as const,
      label: "Deep Work",
      goal: commitment.deepWorkHoursGoal,
      actual: Number(totals.deepWorkHours.toFixed(1)),
      unitLabel: "hrs",
    },
    {
      key: "codingProblems" as const,
      label: "Coding",
      goal: commitment.codingProblemsGoal,
      actual: totals.codingProblems,
      unitLabel: "problems",
    },
    {
      key: "learningMinutes" as const,
      label: "Learning",
      goal: commitment.learningMinutesGoal,
      actual: totals.learningMinutes,
      unitLabel: "min",
    },
    {
      key: "workoutDays" as const,
      label: "Workout Days",
      goal: commitment.workoutDaysGoal,
      actual: totals.workoutDays,
      unitLabel: "days",
    },
    {
      key: "fullPrayerDays" as const,
      label: "Full Prayer Days",
      goal: commitment.fullPrayerDaysGoal,
      actual: totals.fullPrayerDays,
      unitLabel: "days",
    },
  ].map((metric) => {
    const expectedSoFar = Math.ceil((metric.goal * elapsedDays) / 7);

    return {
      ...metric,
      expectedSoFar,
      remaining: Math.max(metric.goal - metric.actual, 0),
      isOnTrack: metric.actual >= expectedSoFar,
    };
  }) satisfies WeeklyCommitmentProgress["metrics"];

  return {
    weekStart: commitment.weekStart,
    elapsedDays,
    status: metrics.every((metric) => metric.isOnTrack) ? "ON TRACK" : "OFF TRACK",
    metrics,
  } satisfies WeeklyCommitmentProgress;
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

    if (shouldTriggerRecoveryPlan(log, settings)) {
      break;
    }

    full += 1;
    fullCursor = shiftDateString(fullCursor, -1);
  }

  if (todayLog) {
    if (todayLog.dailyScore >= 60) {
      partial += 1;
    }

    if (!shouldTriggerRecoveryPlan(todayLog, settings)) {
      full += 1;
    }
  }

  return { full, partial, missedYesterday };
}

function createActiveRecoveryPlanFromRow(plan: RecoveryPlan): ActiveRecoveryPlan {
  return {
    id: plan.id,
    triggerDate: plan.triggerDate,
    targetDate: plan.targetDate,
    missReason: plan.missReason,
    correctiveAction: plan.correctiveAction,
    status: "open",
    isPersisted: true,
    needsInput: false,
  };
}

export function computeActiveRecoveryPlan(
  logs: DailyLog[],
  settings: AppSettings,
  recoveryPlans: RecoveryPlan[],
  todayDate: string,
) {
  const openPlan = recoveryPlans.find((plan) => plan.status === "open");

  if (openPlan) {
    return createActiveRecoveryPlanFromRow(openPlan);
  }

  const plansByTriggerDate = new Set(recoveryPlans.map((plan) => plan.triggerDate));
  const scoredLogs = getScoredLogs(logs, settings)
    .filter((log) => log.logDate < todayDate)
    .sort((left, right) => right.logDate.localeCompare(left.logDate));

  for (const log of scoredLogs) {
    const needsRecovery = shouldTriggerRecoveryPlan(log, settings);

    if (!needsRecovery || plansByTriggerDate.has(log.logDate)) {
      continue;
    }

    return {
      triggerDate: log.logDate,
      targetDate: shiftDateString(log.logDate, 1),
      missReason: null,
      correctiveAction: "",
      status: "open",
      isPersisted: false,
      needsInput: true,
    } satisfies ActiveRecoveryPlan;
  }

  return null;
}

export function computeAccountabilityHistory(
  logs: DailyLog[],
  settings: AppSettings,
  todayDate: string,
) {
  const dates = getRollingDateRange(todayDate, 30);
  const logMap = createLogMap(logs, settings);
  const missedCounts = {
    deepWork: 0,
    coding: 0,
    building: 0,
    learning: 0,
    workout: 0,
    prayers: 0,
  };
  let goodDays = 0;
  let badDays = 0;
  let missedDays = 0;
  let longestFullStreak = 0;
  let currentFullStreak = 0;

  const days = dates.map((date) => {
    const log = logMap.get(date) ?? null;

    if (!log) {
      currentFullStreak = 0;
      missedDays += 1;

      return {
        date,
        shortDateLabel: formatShortDateLabel(date),
        dayLabel: formatDayLabel(date),
        status: "MISSED" as const,
        score: null,
        dayRating: null,
        isToday: date === todayDate,
        log: null,
      };
    }

    const habitState = getHabitCompletionState(log, settings);

    if (!habitState.deepWork) {
      missedCounts.deepWork += 1;
    }

    if (!habitState.coding) {
      missedCounts.coding += 1;
    }

    if (!habitState.building) {
      missedCounts.building += 1;
    }

    if (!habitState.learning) {
      missedCounts.learning += 1;
    }

    if (!habitState.workout) {
      missedCounts.workout += 1;
    }

    if (!habitState.prayersComplete) {
      missedCounts.prayers += 1;
    }

    if (log.dayRating === "GOOD") {
      goodDays += 1;
    }

    if (log.dayRating === "BAD") {
      badDays += 1;
    }

    if (shouldTriggerRecoveryPlan(log, settings)) {
      currentFullStreak = 0;
    } else {
      currentFullStreak += 1;
      longestFullStreak = Math.max(longestFullStreak, currentFullStreak);
    }

    return {
      date,
      shortDateLabel: formatShortDateLabel(date),
      dayLabel: formatDayLabel(date),
      status: log.dayRating,
      score: log.dailyScore,
      dayRating: log.dayRating,
      isToday: date === todayDate,
      log,
    };
  });

  const mostMissedCategoryEntry = (
    [
      "deepWork",
      "coding",
      "building",
      "learning",
      "workout",
      "prayers",
    ] as const
  ).reduce<{
    key: keyof typeof missedCounts;
    missedCount: number;
  } | null>((current, key) => {
    const next = {
      key,
      missedCount: missedCounts[key],
    };

    if (!current || next.missedCount > current.missedCount) {
      return next;
    }

    return current;
  }, null);

  return {
    range: "30d",
    days,
    summary: {
      goodDays,
      badDays,
      missedDays,
      longestFullStreak,
      mostMissedCategory:
        mostMissedCategoryEntry && mostMissedCategoryEntry.missedCount > 0
          ? {
              key: mostMissedCategoryEntry.key,
              label: HABIT_LABELS[mostMissedCategoryEntry.key],
              missedCount: mostMissedCategoryEntry.missedCount,
            }
          : null,
    },
  } satisfies AccountabilityHistory;
}

export async function getDashboardData(
  client: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<DashboardData> {
  const todayDate = getTodayDateString(getAppTimeZone());
  const [settings, logs, activeProjects, weeklyCommitment, weeklyCommitments, recoveryPlans] =
    await Promise.all([
      getSettingsForUser(client, userId),
      listDailyLogsForUser(client, userId),
      listActiveProjectsForUser(client, userId),
      getCurrentWeeklyCommitmentForUser(client, userId, todayDate),
      listWeeklyCommitmentsForUser(client, userId),
      listRecoveryPlansForUser(client, userId),
    ]);

  const todayLog = logs.find((log) => log.logDate === todayDate) ?? null;
  const scoredTodayLog = todayLog
    ? applyScoreToLog(todayLog, settings)
    : createEmptyDailyLog(todayDate);
  const streaks = computeStreaks(logs, settings, todayDate);
  const activeRecoveryPlan = computeActiveRecoveryPlan(
    logs,
    settings,
    recoveryPlans,
    todayDate,
  );
  const weeklyCommitmentProgress = computeWeeklyCommitmentProgress(
    logs,
    settings,
    weeklyCommitment,
    todayDate,
  );
  const weeklyProgressionSummaries = createWeeklyProgressionSummaries(
    logs,
    settings,
    weeklyCommitments,
    weeklyCommitmentProgress,
    todayDate,
  );
  const achievementGallery = createAchievementGallery(
    logs,
    settings,
    recoveryPlans,
    weeklyProgressionSummaries,
  );
  const recentUnlocks = getRecentUnlocks(achievementGallery);
  const progressionSummary = createProgressionSummary(
    logs,
    settings,
    weeklyProgressionSummaries,
    todayDate,
    achievementGallery.unlockedCount,
  );
  const dailyMissionBoard = createDailyMissionBoard(scoredTodayLog, settings);
  const weeklyBossBoard = createWeeklyBossBoard(
    todayDate,
    weeklyCommitment,
    weeklyCommitmentProgress,
    activeProjects,
  );

  return {
    userEmail,
    settings,
    todayLog: scoredTodayLog,
    hasTodayLog: Boolean(todayLog),
    weeklyScoreboard: computeWeeklyScoreboard(logs, settings, todayDate),
    weeklyCommitment,
    weeklyCommitmentProgress,
    habitCompletions: computeHabitCompletions(logs, settings, todayDate),
    streaks,
    feedbackMessage: getFeedbackMessage(
      todayLog ? scoredTodayLog.dailyScore : null,
      streaks.missedYesterday,
      streaks.full,
      Boolean(activeRecoveryPlan),
    ),
    activeRecoveryPlan,
    accountabilityHistory: computeAccountabilityHistory(logs, settings, todayDate),
    activeProjects,
    focusDerivedHours: getFocusDerivedHours(scoredTodayLog.focusSessionsCompleted),
    progressionSummary,
    dailyMissionBoard,
    weeklyBossBoard,
    achievementGallery,
    recentUnlocks,
  };
}
