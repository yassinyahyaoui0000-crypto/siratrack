import { getWeekStartDateString, getCurrentWeekDates, shiftDateString } from "@/lib/date";
import { calculateDailyScore, getHabitCompletionState, shouldTriggerRecoveryPlan } from "@/lib/scoring";
import type {
  Achievement,
  AchievementGallery,
  AchievementKey,
  AppSettings,
  DailyLog,
  DailyMission,
  DailyMissionBoard,
  DailyXpResult,
  ProgressionSummary,
  Project,
  RankTitle,
  RecoveryPlan,
  WeeklyBossBoard,
  WeeklyCommitment,
  WeeklyCommitmentProgress,
} from "@/lib/types";

const LEVEL_XP_STEP = 250;
const FULL_COMPLETION_BONUS_XP = 25;
const FOCUS_SESSION_XP = 10;
const FOCUS_SESSION_XP_CAP = 60;
const WEEKLY_BOSS_XP = 100;

const ACHIEVEMENT_DEFINITIONS: Array<{
  key: AchievementKey;
  title: string;
  description: string;
}> = [
  {
    key: "firstLog",
    title: "First Log",
    description: "Save the first recorded day.",
  },
  {
    key: "cleanDay",
    title: "Clean Day",
    description: "Clear the full standard for the first time.",
  },
  {
    key: "threeDayChain",
    title: "3-Day Chain",
    description: "Reach a three-day full-completion chain.",
  },
  {
    key: "sevenDayChain",
    title: "7-Day Chain",
    description: "Reach a seven-day full-completion chain.",
  },
  {
    key: "focusTen",
    title: "Focus Ten",
    description: "Accumulate ten completed focus sessions.",
  },
  {
    key: "weekCleared",
    title: "Week Cleared",
    description: "Defeat the Week Boss on track for the first time.",
  },
  {
    key: "noMissWeek",
    title: "No Miss Week",
    description: "Log every day in a Monday-Sunday week.",
  },
  {
    key: "recoveryBounce",
    title: "Recovery Bounce",
    description: "Follow a failed day with an 85+ comeback the next day.",
  },
];

function createLogMap(logs: DailyLog[], settings: AppSettings) {
  return new Map(
    logs.map((log) => {
      const score = calculateDailyScore(log, settings);
      return [
        log.logDate,
        {
          ...log,
          dailyScore: score.score,
          dayRating: score.rating,
        },
      ];
    }),
  );
}

function getScoredLogs(logs: DailyLog[], settings: AppSettings) {
  return logs
    .map((log) => ({
      ...log,
      ...calculateDailyScore(log, settings),
    }))
    .map((log) => ({
      ...log,
      dailyScore: log.score,
      dayRating: log.rating,
    }))
    .sort((left, right) => left.logDate.localeCompare(right.logDate));
}

function getFocusBonusXp(focusSessionsCompleted: number) {
  return Math.min(focusSessionsCompleted * FOCUS_SESSION_XP, FOCUS_SESSION_XP_CAP);
}

export function calculateDailyXp(
  log: Pick<
    DailyLog,
    | "deepWorkHours"
    | "codingProblemsSolved"
    | "projectWorkDone"
    | "projectNotes"
    | "learningMinutes"
    | "workoutDone"
    | "fajrDone"
    | "dhuhrDone"
    | "asrDone"
    | "maghribDone"
    | "ishaDone"
    | "focusSessionsCompleted"
    | "reflection"
  >,
  settings: AppSettings,
): DailyXpResult {
  const score = calculateDailyScore(log, settings);
  const fullCompletionBonusXp = score.fullCompletion ? FULL_COMPLETION_BONUS_XP : 0;
  const focusBonusXp = getFocusBonusXp(log.focusSessionsCompleted);

  return {
    totalXpEarned: score.score + fullCompletionBonusXp + focusBonusXp,
    baseXp: score.score,
    fullCompletionBonusXp,
    focusBonusXp,
    fullCompletion: score.fullCompletion,
  };
}

export function getLevelFromXp(totalXp: number) {
  return Math.floor(totalXp / LEVEL_XP_STEP) + 1;
}

export function getXpForLevel(level: number) {
  return Math.max(level - 1, 0) * LEVEL_XP_STEP;
}

export function getRankTitle(level: number): RankTitle {
  if (level >= 30) {
    return "Ironmind";
  }

  if (level >= 20) {
    return "Executor";
  }

  if (level >= 15) {
    return "Vanguard";
  }

  if (level >= 10) {
    return "Builder";
  }

  if (level >= 5) {
    return "Operator";
  }

  return "Recruit";
}

export function createDailyMissionBoard(
  todayLog: DailyLog,
  settings: AppSettings,
): DailyMissionBoard {
  const habitState = getHabitCompletionState(todayLog, settings);
  const score = calculateDailyScore(todayLog, settings);

  const missions: DailyMission[] = [
    {
      key: "deepWork",
      label: "Deep Work",
      description: `${settings.deepWorkTargetHours}h target`,
      statusLabel: `${todayLog.deepWorkHours}/${settings.deepWorkTargetHours}h`,
      isComplete: habitState.deepWork,
      rewardXp: 25,
    },
    {
      key: "coding",
      label: "Coding",
      description: `${settings.codingTargetProblems} problem target`,
      statusLabel: `${todayLog.codingProblemsSolved}/${settings.codingTargetProblems}`,
      isComplete: habitState.coding,
      rewardXp: 20,
    },
    {
      key: "building",
      label: "Building",
      description: "Project work logged",
      statusLabel: todayLog.projectWorkDone ? "Logged" : "Missing",
      isComplete: habitState.building,
      rewardXp: 15,
    },
    {
      key: "learning",
      label: "Learning",
      description: `${settings.learningTargetMinutes} minute target`,
      statusLabel: `${todayLog.learningMinutes}/${settings.learningTargetMinutes} min`,
      isComplete: habitState.learning,
      rewardXp: 15,
    },
    {
      key: "workout",
      label: "Workout",
      description: "Physical training check",
      statusLabel: todayLog.workoutDone ? "Complete" : "Pending",
      isComplete: habitState.workout,
      rewardXp: 10,
    },
    {
      key: "prayers",
      label: "Prayers",
      description: "Daily prayer line held",
      statusLabel: `${habitState.prayersCount}/5`,
      isComplete: habitState.prayersComplete,
      rewardXp: 15,
    },
    {
      key: "perfectStandard",
      label: "Perfect Standard",
      description: "Full standard cleared today",
      statusLabel: score.fullCompletion ? "Cleared" : "Not cleared",
      isComplete: score.fullCompletion,
      rewardXp: FULL_COMPLETION_BONUS_XP,
    },
    {
      key: "focusChain",
      label: "Focus Chain",
      description: "Three completed focus sessions",
      statusLabel: `${todayLog.focusSessionsCompleted}/3 sessions`,
      isComplete: todayLog.focusSessionsCompleted >= 3,
      rewardXp: 30,
    },
  ];

  return {
    missions,
    completedCount: missions.filter((mission) => mission.isComplete).length,
    totalCount: missions.length,
  };
}

function computeWeekProgressForCommitment(
  logs: DailyLog[],
  settings: AppSettings,
  commitment: WeeklyCommitment,
) {
  const weekDates = getCurrentWeekDates(commitment.weekStart);
  const logMap = createLogMap(logs, settings);
  const elapsedDays = weekDates.length;
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
      goal: commitment.deepWorkHoursGoal,
      actual: Number(totals.deepWorkHours.toFixed(1)),
    },
    {
      key: "codingProblems" as const,
      goal: commitment.codingProblemsGoal,
      actual: totals.codingProblems,
    },
    {
      key: "learningMinutes" as const,
      goal: commitment.learningMinutesGoal,
      actual: totals.learningMinutes,
    },
    {
      key: "workoutDays" as const,
      goal: commitment.workoutDaysGoal,
      actual: totals.workoutDays,
    },
    {
      key: "fullPrayerDays" as const,
      goal: commitment.fullPrayerDaysGoal,
      actual: totals.fullPrayerDays,
    },
  ].map((metric) => ({
    ...metric,
    expectedSoFar: Math.ceil((metric.goal * elapsedDays) / 7),
    isOnTrack: metric.actual >= Math.ceil((metric.goal * elapsedDays) / 7),
  }));

  return {
    status: metrics.every((metric) => metric.isOnTrack) ? "ON TRACK" : "OFF TRACK",
  } as const;
}

interface WeeklyProgressionSummary {
  weekStart: string;
  weekEnd: string;
  hasCommitment: boolean;
  status: "ON TRACK" | "OFF TRACK" | null;
  isClosed: boolean;
  hasSevenLogs: boolean;
  rewardXpEarned: number;
}

export function createWeeklyProgressionSummaries(
  logs: DailyLog[],
  settings: AppSettings,
  commitments: WeeklyCommitment[],
  weeklyCommitmentProgress: WeeklyCommitmentProgress | null,
  todayDate: string,
) {
  const logsByWeek = new Map<string, DailyLog[]>();

  for (const log of logs) {
    const weekStart = getWeekStartDateString(log.logDate);
    const currentWeekLogs = logsByWeek.get(weekStart) ?? [];
    currentWeekLogs.push(log);
    logsByWeek.set(weekStart, currentWeekLogs);
  }

  const weekStarts = Array.from(
    new Set([
      ...Array.from(logsByWeek.keys()),
      ...commitments.map((commitment) => commitment.weekStart),
    ]),
  ).sort();

  const currentWeekStart = getWeekStartDateString(todayDate);
  const isCurrentWeekSunday = getCurrentWeekDates(todayDate).at(-1) === todayDate;

  return weekStarts.map((weekStart) => {
    const weekEnd = shiftDateString(weekStart, 6);
    const commitment = commitments.find((entry) => entry.weekStart === weekStart) ?? null;
    const hasCommitment = Boolean(commitment);
    const weekLogs = (logsByWeek.get(weekStart) ?? []).sort((left, right) =>
      left.logDate.localeCompare(right.logDate),
    );
    const isClosed = weekStart < currentWeekStart || (weekStart === currentWeekStart && isCurrentWeekSunday);
    const hasSevenLogs =
      new Set(weekLogs.map((log) => log.logDate)).size === 7;
    const status =
      weekStart === currentWeekStart
        ? weeklyCommitmentProgress?.status ?? null
        : commitment
          ? computeWeekProgressForCommitment(weekLogs, settings, commitment).status
          : null;

    return {
      weekStart,
      weekEnd,
      hasCommitment,
      status,
      isClosed,
      hasSevenLogs,
      rewardXpEarned:
        hasCommitment && isClosed && status === "ON TRACK" ? WEEKLY_BOSS_XP : 0,
    } satisfies WeeklyProgressionSummary;
  });
}

export function createProgressionSummary(
  logs: DailyLog[],
  settings: AppSettings,
  weeklySummaries: WeeklyProgressionSummary[],
  todayDate: string,
  unlockedAchievementCount: number,
) {
  const scoredLogs = getScoredLogs(logs, settings);
  const totalDailyXp = scoredLogs.reduce((sum, log) => {
    const dailyXp = calculateDailyXp(log, settings);
    return sum + dailyXp.totalXpEarned;
  }, 0);
  const totalWeeklyBossXp = weeklySummaries.reduce(
    (sum, summary) => sum + summary.rewardXpEarned,
    0,
  );
  const totalXp = totalDailyXp + totalWeeklyBossXp;
  const level = getLevelFromXp(totalXp);
  const xpForCurrentLevel = getXpForLevel(level);
  const xpForNextLevel = getXpForLevel(level + 1);
  const todayLog = scoredLogs.find((log) => log.logDate === todayDate);
  const todayXp = todayLog ? calculateDailyXp(todayLog, settings).totalXpEarned : 0;

  return {
    totalXp,
    totalDailyXp,
    totalWeeklyBossXp,
    todayXp,
    level,
    rankTitle: getRankTitle(level),
    xpIntoLevel: totalXp - xpForCurrentLevel,
    xpForCurrentLevel,
    xpForNextLevel,
    progressPercent:
      xpForNextLevel > xpForCurrentLevel
        ? Math.round(
            ((totalXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) *
              100,
          )
        : 100,
    weeklyBossClears: weeklySummaries.filter(
      (summary) => summary.rewardXpEarned > 0,
    ).length,
    unlockedAchievementCount,
  } satisfies ProgressionSummary;
}

export function createWeeklyBossBoard(
  todayDate: string,
  weeklyCommitment: WeeklyCommitment | null,
  weeklyCommitmentProgress: WeeklyCommitmentProgress | null,
  activeProjects: Project[],
) {
  const weekStart = getWeekStartDateString(todayDate);
  const primaryProjectName =
    activeProjects.find((project) => project.id === weeklyCommitment?.primaryProjectId)?.name ??
    null;

  return {
    hasCommitment: Boolean(weeklyCommitment),
    status: weeklyCommitmentProgress?.status ?? null,
    rewardXp: WEEKLY_BOSS_XP,
    warning: todayDate === weekStart && !weeklyCommitment,
    weekStart,
    elapsedDays: weeklyCommitmentProgress?.elapsedDays ?? getCurrentWeekDates(todayDate).filter((date) => date <= todayDate).length,
    primaryProjectName,
    note: weeklyCommitment?.commitmentNote ?? "",
    metrics: weeklyCommitmentProgress?.metrics ?? [],
  } satisfies WeeklyBossBoard;
}

function buildAchievementMap() {
  return new Map<AchievementKey, string | null>(
    ACHIEVEMENT_DEFINITIONS.map((definition) => [definition.key, null]),
  );
}

export function createAchievementGallery(
  logs: DailyLog[],
  settings: AppSettings,
  recoveryPlans: RecoveryPlan[],
  weeklySummaries: WeeklyProgressionSummary[],
) {
  const scoredLogs = getScoredLogs(logs, settings);
  const unlocks = buildAchievementMap();

  if (scoredLogs.length > 0) {
    unlocks.set("firstLog", scoredLogs[0].logDate);
  }

  for (const log of scoredLogs) {
    if (!unlocks.get("cleanDay") && calculateDailyScore(log, settings).fullCompletion) {
      unlocks.set("cleanDay", log.logDate);
    }
  }

  let runningFocusSessions = 0;
  let runningFullChain = 0;
  let previousFullDate: string | null = null;

  for (const log of scoredLogs) {
    runningFocusSessions += log.focusSessionsCompleted;
    if (!unlocks.get("focusTen") && runningFocusSessions >= 10) {
      unlocks.set("focusTen", log.logDate);
    }

    const isFull = calculateDailyScore(log, settings).fullCompletion;

    if (
      isFull &&
      previousFullDate &&
      shiftDateString(previousFullDate, 1) === log.logDate
    ) {
      runningFullChain += 1;
    } else if (isFull) {
      runningFullChain = 1;
    } else {
      runningFullChain = 0;
    }

    if (isFull) {
      previousFullDate = log.logDate;
    } else {
      previousFullDate = null;
    }

    if (!unlocks.get("threeDayChain") && runningFullChain >= 3) {
      unlocks.set("threeDayChain", log.logDate);
    }

    if (!unlocks.get("sevenDayChain") && runningFullChain >= 7) {
      unlocks.set("sevenDayChain", log.logDate);
    }
  }

  for (const summary of weeklySummaries) {
    if (!unlocks.get("weekCleared") && summary.rewardXpEarned > 0) {
      unlocks.set("weekCleared", summary.weekEnd);
    }

    if (!unlocks.get("noMissWeek") && summary.hasSevenLogs) {
      unlocks.set("noMissWeek", summary.weekEnd);
    }
  }

  const recoveryTriggerDates = new Set(recoveryPlans.map((plan) => plan.triggerDate));

  for (const log of scoredLogs) {
    const nextDate = shiftDateString(log.logDate, 1);
    const nextLog = scoredLogs.find((entry) => entry.logDate === nextDate);
    const isRecoveryDay =
      recoveryTriggerDates.has(log.logDate) || shouldTriggerRecoveryPlan(log, settings);

    if (
      !unlocks.get("recoveryBounce") &&
      isRecoveryDay &&
      nextLog &&
      nextLog.dailyScore >= 85
    ) {
      unlocks.set("recoveryBounce", nextLog.logDate);
    }
  }

  const achievements = ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const unlockedAt = unlocks.get(definition.key) ?? null;

    return {
      key: definition.key,
      title: definition.title,
      description: definition.description,
      unlocked: Boolean(unlockedAt),
      unlockedAt,
    } satisfies Achievement;
  });

  return {
    achievements,
    unlockedCount: achievements.filter((achievement) => achievement.unlocked).length,
    totalCount: achievements.length,
  } satisfies AchievementGallery;
}

export function getRecentUnlocks(achievementGallery: AchievementGallery) {
  return achievementGallery.achievements
    .filter((achievement) => achievement.unlocked && achievement.unlockedAt)
    .sort((left, right) =>
      (right.unlockedAt ?? "").localeCompare(left.unlockedAt ?? ""),
    )
    .slice(0, 3);
}
