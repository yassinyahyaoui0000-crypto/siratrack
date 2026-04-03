import { DEFAULT_SETTINGS, PRAYER_FIELDS, SCORE_WEIGHTS } from "@/lib/constants";
import type {
  AppSettings,
  DailyLog,
  DailyLogInput,
  DailyScoreResult,
  DayRating,
} from "@/lib/types";

function ratioScore(actual: number, target: number, weight: number) {
  if (target <= 0) {
    return weight;
  }

  return Math.min(actual / target, 1) * weight;
}

export function createEmptyDailyLog(logDate: string): DailyLog {
  return {
    logDate,
    deepWorkHours: 0,
    codingProblemsSolved: 0,
    projectWorkDone: false,
    projectNotes: "",
    learningMinutes: 0,
    workoutDone: false,
    fajrDone: false,
    dhuhrDone: false,
    asrDone: false,
    maghribDone: false,
    ishaDone: false,
    focusSessionsCompleted: 0,
    reflection: "",
    dailyScore: 0,
    dayRating: "BAD",
  };
}

export function normalizeDailyLogInput(input: Partial<DailyLogInput>): DailyLogInput {
  return {
    deepWorkHours: input.deepWorkHours ?? 0,
    codingProblemsSolved: input.codingProblemsSolved ?? 0,
    projectWorkDone: input.projectWorkDone ?? false,
    projectNotes: input.projectNotes?.trim() ?? "",
    learningMinutes: input.learningMinutes ?? 0,
    workoutDone: input.workoutDone ?? false,
    fajrDone: input.fajrDone ?? false,
    dhuhrDone: input.dhuhrDone ?? false,
    asrDone: input.asrDone ?? false,
    maghribDone: input.maghribDone ?? false,
    ishaDone: input.ishaDone ?? false,
    reflection: input.reflection?.trim() ?? "",
  };
}

export function countCompletedPrayers(log: DailyLog | DailyLogInput) {
  return PRAYER_FIELDS.reduce(
    (total, prayer) => total + (log[prayer.key] ? 1 : 0),
    0,
  );
}

export function getDayRating(score: number): DayRating {
  if (score >= 85) {
    return "GOOD";
  }

  if (score >= 60) {
    return "AVERAGE";
  }

  return "BAD";
}

export function calculateDailyScore(
  log: DailyLog | DailyLogInput,
  settings: AppSettings = DEFAULT_SETTINGS,
): DailyScoreResult {
  const completedPrayers = countCompletedPrayers(log);

  const score = Math.round(
    ratioScore(log.deepWorkHours, settings.deepWorkTargetHours, SCORE_WEIGHTS.deepWork) +
      ratioScore(
        log.codingProblemsSolved,
        settings.codingTargetProblems,
        SCORE_WEIGHTS.coding,
      ) +
      (log.projectWorkDone ? SCORE_WEIGHTS.project : 0) +
      ratioScore(
        log.learningMinutes,
        settings.learningTargetMinutes,
        SCORE_WEIGHTS.learning,
      ) +
      (log.workoutDone ? SCORE_WEIGHTS.workout : 0) +
      (completedPrayers / 5) * SCORE_WEIGHTS.prayers,
  );

  const fullCompletion =
    log.deepWorkHours >= settings.deepWorkTargetHours &&
    log.codingProblemsSolved >= settings.codingTargetProblems &&
    log.learningMinutes >= settings.learningTargetMinutes &&
    (!settings.requireProjectWork || log.projectWorkDone) &&
    (!settings.requireWorkout || log.workoutDone) &&
    (!settings.requireAllPrayers || completedPrayers === 5);

  return {
    score,
    rating: getDayRating(score),
    fullCompletion,
    partialCompletion: score >= 60,
    completedPrayers,
  };
}

export function applyScoreToLog(log: DailyLog, settings: AppSettings = DEFAULT_SETTINGS) {
  const result = calculateDailyScore(log, settings);

  return {
    ...log,
    dailyScore: result.score,
    dayRating: result.rating,
  };
}

export function getHabitCompletionState(
  log: DailyLog,
  settings: AppSettings = DEFAULT_SETTINGS,
) {
  const completedPrayers = countCompletedPrayers(log);

  return {
    deepWork: log.deepWorkHours >= settings.deepWorkTargetHours,
    coding: log.codingProblemsSolved >= settings.codingTargetProblems,
    building: log.projectWorkDone,
    learning: log.learningMinutes >= settings.learningTargetMinutes,
    workout: log.workoutDone,
    prayersComplete: completedPrayers === 5,
    prayersCount: completedPrayers,
  };
}

export function doesLogMissRequiredStandard(
  log: DailyLog | DailyLogInput,
  settings: AppSettings = DEFAULT_SETTINGS,
) {
  return !calculateDailyScore(log, settings).fullCompletion;
}

export function shouldTriggerRecoveryPlan(
  log: DailyLog | DailyLogInput,
  settings: AppSettings = DEFAULT_SETTINGS,
) {
  const result = calculateDailyScore(log, settings);

  return result.score < 60 || !result.fullCompletion;
}

export function canResolveRecoveryPlan(log: DailyLog) {
  return log.dailyScore >= 60 && log.reflection.trim().length > 0;
}

export function getFocusDerivedHours(completedSessions: number) {
  return Number(((completedSessions * 25) / 60).toFixed(1));
}
