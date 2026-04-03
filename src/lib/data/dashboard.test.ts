import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/lib/constants";
import {
  computeAccountabilityHistory,
  computeActiveRecoveryPlan,
  computeStreaks,
  computeWeeklyCommitmentProgress,
} from "@/lib/data/dashboard";
import {
  applyScoreToLog,
  canResolveRecoveryPlan,
  createEmptyDailyLog,
  shouldTriggerRecoveryPlan,
} from "@/lib/scoring";
import type { DailyLog, WeeklyCommitment } from "@/lib/types";

function createLog(
  logDate: string,
  overrides: Partial<DailyLog> = {},
): DailyLog {
  return applyScoreToLog(
    {
      ...createEmptyDailyLog(logDate),
      deepWorkHours: 4,
      codingProblemsSolved: 3,
      learningMinutes: 60,
      projectWorkDone: true,
      workoutDone: true,
      fajrDone: true,
      dhuhrDone: true,
      asrDone: true,
      maghribDone: true,
      ishaDone: true,
      ...overrides,
    },
    DEFAULT_SETTINGS,
  );
}

function createLowScoreLog(logDate: string) {
  return createLog(logDate, {
    deepWorkHours: 1,
    codingProblemsSolved: 0,
    learningMinutes: 0,
    projectWorkDone: false,
    workoutDone: false,
    fajrDone: true,
    dhuhrDone: false,
    asrDone: false,
    maghribDone: false,
    ishaDone: false,
  });
}

const weeklyCommitment: WeeklyCommitment = {
  weekStart: "2026-04-06",
  deepWorkHoursGoal: 28,
  codingProblemsGoal: 21,
  learningMinutesGoal: 420,
  workoutDaysGoal: 7,
  fullPrayerDaysGoal: 7,
  primaryProjectId: null,
  commitmentNote: "Lock the standard.",
};

describe("computeWeeklyCommitmentProgress", () => {
  it("keeps a Monday commitment on track when day-one pacing is met", () => {
    const progress = computeWeeklyCommitmentProgress(
      [createLog("2026-04-06")],
      DEFAULT_SETTINGS,
      weeklyCommitment,
      "2026-04-06",
    );

    expect(progress?.status).toBe("ON TRACK");
    expect(progress?.elapsedDays).toBe(1);
    expect(progress?.metrics[0]?.expectedSoFar).toBe(4);
    expect(progress?.metrics[0]?.remaining).toBe(24);
  });

  it("tracks midweek pace using Monday-to-today elapsed days", () => {
    const progress = computeWeeklyCommitmentProgress(
      [
        createLog("2026-04-06"),
        createLog("2026-04-07"),
        createLog("2026-04-08"),
      ],
      DEFAULT_SETTINGS,
      weeklyCommitment,
      "2026-04-08",
    );

    expect(progress?.status).toBe("ON TRACK");
    expect(progress?.elapsedDays).toBe(3);
    expect(progress?.metrics.find((metric) => metric.key === "codingProblems")?.expectedSoFar).toBe(9);
  });

  it("marks the week off track on Sunday when a committed metric is behind", () => {
    const progress = computeWeeklyCommitmentProgress(
      [
        createLog("2026-04-06"),
        createLog("2026-04-07"),
        createLog("2026-04-08"),
        createLog("2026-04-09"),
        createLog("2026-04-10"),
        createLog("2026-04-11"),
      ],
      DEFAULT_SETTINGS,
      weeklyCommitment,
      "2026-04-12",
    );

    expect(progress?.status).toBe("OFF TRACK");
    expect(progress?.metrics.find((metric) => metric.key === "workoutDays")?.remaining).toBe(1);
    expect(progress?.metrics.find((metric) => metric.key === "workoutDays")?.expectedSoFar).toBe(7);
  });
});

describe("recovery logic", () => {
  it("triggers recovery for a day with score below 60", () => {
    const log = createLowScoreLog("2026-04-02");

    expect(shouldTriggerRecoveryPlan(log, DEFAULT_SETTINGS)).toBe(true);
    expect(
      computeActiveRecoveryPlan([log], DEFAULT_SETTINGS, [], "2026-04-03")?.triggerDate,
    ).toBe("2026-04-02");
  });

  it("triggers recovery when yesterday scored above 60 but missed a required standard", () => {
    const log = createLog("2026-04-02", {
      learningMinutes: 0,
    });

    expect(log.dailyScore).toBeGreaterThanOrEqual(60);
    expect(shouldTriggerRecoveryPlan(log, DEFAULT_SETTINGS)).toBe(true);
    expect(
      computeActiveRecoveryPlan([log], DEFAULT_SETTINGS, [], "2026-04-03")?.triggerDate,
    ).toBe("2026-04-02");
  });

  it("does not trigger recovery when yesterday has no saved log", () => {
    const activePlan = computeActiveRecoveryPlan(
      [createLog("2026-04-01")],
      DEFAULT_SETTINGS,
      [],
      "2026-04-03",
    );

    expect(activePlan).toBeNull();
  });

  it("resolves a recovery plan only when today's score and reflection qualify", () => {
    expect(
      canResolveRecoveryPlan(
        createLog("2026-04-03", { reflection: "Corrected the failure." }),
      ),
    ).toBe(true);
    expect(
      canResolveRecoveryPlan(
        createLog("2026-04-03", {
          reflection: "",
        }),
      ),
    ).toBe(false);
    expect(
      canResolveRecoveryPlan(
        createLowScoreLog("2026-04-03"),
      ),
    ).toBe(false);
  });
});

describe("computeAccountabilityHistory", () => {
  it("detects missed days in the 30-day window", () => {
    const history = computeAccountabilityHistory(
      [createLog("2026-04-02")],
      DEFAULT_SETTINGS,
      "2026-04-03",
    );

    expect(history.days).toHaveLength(30);
    expect(history.summary.missedDays).toBe(29);
    expect(history.days.at(-1)?.status).toBe("MISSED");
  });

  it("tracks the longest full streak within the range", () => {
    const history = computeAccountabilityHistory(
      [
        createLog("2026-04-01"),
        createLog("2026-04-02"),
        createLog("2026-04-03"),
        createLog("2026-04-04", { learningMinutes: 0 }),
        createLog("2026-04-05"),
        createLog("2026-04-06"),
      ],
      DEFAULT_SETTINGS,
      "2026-04-30",
    );

    expect(history.summary.longestFullStreak).toBe(3);
  });

  it("finds the most-missed category from logged days", () => {
    const logs = Array.from({ length: 30 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return createLog(`2026-04-${day}`);
    }).map((log, index) => {
      if (index === 2 || index === 9 || index === 18 || index === 25) {
        return createLog(log.logDate, { learningMinutes: 0 });
      }

      if (index === 4 || index === 20) {
        return createLog(log.logDate, { workoutDone: false });
      }

      return log;
    });

    const history = computeAccountabilityHistory(
      logs,
      DEFAULT_SETTINGS,
      "2026-04-30",
    );

    expect(history.summary.mostMissedCategory?.key).toBe("learning");
    expect(history.summary.mostMissedCategory?.missedCount).toBe(4);
  });
});

describe("computeStreaks", () => {
  it("continues a full streak when each day meets the standard", () => {
    const streaks = computeStreaks(
      [
        createLog("2026-04-01"),
        createLog("2026-04-02"),
        createLog("2026-04-03"),
      ],
      DEFAULT_SETTINGS,
      "2026-04-03",
    );

    expect(streaks.full).toBe(3);
    expect(streaks.partial).toBe(3);
    expect(streaks.missedYesterday).toBe(false);
  });

  it("tracks a partial streak separately", () => {
    const streaks = computeStreaks(
      [
        createLog("2026-04-01", { learningMinutes: 0 }),
        createLog("2026-04-02", { learningMinutes: 0 }),
      ],
      DEFAULT_SETTINGS,
      "2026-04-03",
    );

    expect(streaks.full).toBe(0);
    expect(streaks.partial).toBe(2);
  });

  it("breaks streaks when yesterday is missing", () => {
    const streaks = computeStreaks(
      [createLog("2026-04-01")],
      DEFAULT_SETTINGS,
      "2026-04-03",
    );

    expect(streaks.full).toBe(0);
    expect(streaks.partial).toBe(0);
    expect(streaks.missedYesterday).toBe(true);
  });

  it("does not let an incomplete today break the prior streak", () => {
    const streaks = computeStreaks(
      [
        createLog("2026-04-01"),
        createLog("2026-04-02"),
        createLog("2026-04-03", { learningMinutes: 0 }),
      ],
      DEFAULT_SETTINGS,
      "2026-04-03",
    );

    expect(streaks.full).toBe(2);
    expect(streaks.partial).toBe(3);
  });
});
