import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/lib/constants";
import {
  calculateDailyXp,
  createAchievementGallery,
  createDailyMissionBoard,
  createProgressionSummary,
  createWeeklyProgressionSummaries,
  getLevelFromXp,
  getRecentUnlocks,
  getXpForLevel,
} from "@/lib/progression";
import { applyScoreToLog, createEmptyDailyLog } from "@/lib/scoring";
import type {
  DailyLog,
  RecoveryPlan,
  WeeklyCommitment,
  WeeklyCommitmentProgress,
} from "@/lib/types";

function createLog(logDate: string, overrides: Partial<DailyLog> = {}): DailyLog {
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
      reflection: "Stayed on standard.",
      ...overrides,
    },
    DEFAULT_SETTINGS,
  );
}

function createCommitment(weekStart: string): WeeklyCommitment {
  return {
    weekStart,
    deepWorkHoursGoal: 28,
    codingProblemsGoal: 21,
    learningMinutesGoal: 420,
    workoutDaysGoal: 7,
    fullPrayerDaysGoal: 7,
    primaryProjectId: null,
    commitmentNote: "Clear the full board.",
  };
}

describe("calculateDailyXp", () => {
  it("uses the daily score as the base XP when the standard is not fully met", () => {
    const xp = calculateDailyXp(
      {
        ...createEmptyDailyLog("2026-04-03"),
        deepWorkHours: 2,
        codingProblemsSolved: 1,
        learningMinutes: 30,
        projectWorkDone: false,
        workoutDone: false,
        fajrDone: true,
        focusSessionsCompleted: 0,
      },
      DEFAULT_SETTINGS,
    );

    expect(xp.baseXp).toBe(30);
    expect(xp.totalXpEarned).toBe(30);
    expect(xp.fullCompletionBonusXp).toBe(0);
  });

  it("adds the full-completion bonus when the full standard is cleared", () => {
    const xp = calculateDailyXp(createLog("2026-04-03"), DEFAULT_SETTINGS);

    expect(xp.baseXp).toBe(100);
    expect(xp.fullCompletionBonusXp).toBe(25);
    expect(xp.totalXpEarned).toBe(125);
  });

  it("caps focus bonus XP at sixty even when more sessions are logged", () => {
    const xp = calculateDailyXp(
      createLog("2026-04-03", { focusSessionsCompleted: 10 }),
      DEFAULT_SETTINGS,
    );

    expect(xp.focusBonusXp).toBe(60);
    expect(xp.totalXpEarned).toBe(185);
  });
});

describe("level progression", () => {
  it("steps levels every 250 XP", () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(249)).toBe(1);
    expect(getLevelFromXp(250)).toBe(2);
    expect(getLevelFromXp(500)).toBe(3);
    expect(getLevelFromXp(750)).toBe(4);
  });

  it("exposes the XP floor for each level", () => {
    expect(getXpForLevel(1)).toBe(0);
    expect(getXpForLevel(2)).toBe(250);
    expect(getXpForLevel(3)).toBe(500);
    expect(getXpForLevel(4)).toBe(750);
  });
});

describe("weekly boss rewards", () => {
  it("awards the weekly boss bonus for a closed on-track week", () => {
    const weekStart = "2026-03-23";
    const logs = Array.from({ length: 7 }, (_, index) =>
      createLog(`2026-03-${String(index + 23).padStart(2, "0")}`),
    );
    const summaries = createWeeklyProgressionSummaries(
      logs,
      DEFAULT_SETTINGS,
      [createCommitment(weekStart)],
      null,
      "2026-04-01",
    );

    expect(summaries[0]?.isClosed).toBe(true);
    expect(summaries[0]?.status).toBe("ON TRACK");
    expect(summaries[0]?.rewardXpEarned).toBe(100);
  });

  it("does not award the weekly boss bonus for the current week before Sunday", () => {
    const weekStart = "2026-03-30";
    const logs = [
      createLog("2026-03-30"),
      createLog("2026-03-31"),
      createLog("2026-04-01"),
    ];
    const currentWeekProgress: WeeklyCommitmentProgress = {
      weekStart,
      elapsedDays: 3,
      status: "ON TRACK",
      metrics: [],
    };
    const summaries = createWeeklyProgressionSummaries(
      logs,
      DEFAULT_SETTINGS,
      [createCommitment(weekStart)],
      currentWeekProgress,
      "2026-04-01",
    );

    expect(summaries[0]?.isClosed).toBe(false);
    expect(summaries[0]?.rewardXpEarned).toBe(0);
  });

  it("awards the weekly boss bonus for the current week once Sunday closes on track", () => {
    const weekStart = "2026-03-30";
    const logs = Array.from({ length: 7 }, (_, index) =>
      createLog(index < 2 ? `2026-03-${String(index + 30).padStart(2, "0")}` : `2026-04-0${index - 1}`),
    );
    const currentWeekProgress: WeeklyCommitmentProgress = {
      weekStart,
      elapsedDays: 7,
      status: "ON TRACK",
      metrics: [],
    };
    const summaries = createWeeklyProgressionSummaries(
      logs,
      DEFAULT_SETTINGS,
      [createCommitment(weekStart)],
      currentWeekProgress,
      "2026-04-05",
    );

    expect(summaries[0]?.isClosed).toBe(true);
    expect(summaries[0]?.rewardXpEarned).toBe(100);
  });
});

describe("daily mission board", () => {
  it("shows incomplete missions on a partial day", () => {
    const board = createDailyMissionBoard(
      createLog("2026-04-03", {
        learningMinutes: 0,
        workoutDone: false,
        focusSessionsCompleted: 2,
      }),
      DEFAULT_SETTINGS,
    );

    expect(board.completedCount).toBe(4);
    expect(board.missions.find((mission) => mission.key === "learning")?.isComplete).toBe(
      false,
    );
    expect(board.missions.find((mission) => mission.key === "focusChain")?.isComplete).toBe(
      false,
    );
    expect(
      board.missions.find((mission) => mission.key === "perfectStandard")?.isComplete,
    ).toBe(false);
  });

  it("marks the full board clear when the day hits full completion and three focus sessions", () => {
    const board = createDailyMissionBoard(
      createLog("2026-04-03", { focusSessionsCompleted: 3 }),
      DEFAULT_SETTINGS,
    );

    expect(board.completedCount).toBe(board.totalCount);
    expect(
      board.missions.find((mission) => mission.key === "perfectStandard")?.isComplete,
    ).toBe(true);
    expect(board.missions.find((mission) => mission.key === "focusChain")?.isComplete).toBe(
      true,
    );
  });
});

describe("achievement unlocking", () => {
  it("unlocks the first-log and clean-day achievements from the first strong day", () => {
    const gallery = createAchievementGallery(
      [createLog("2026-04-01")],
      DEFAULT_SETTINGS,
      [],
      [],
    );

    expect(gallery.achievements.find((achievement) => achievement.key === "firstLog"))
      .toMatchObject({
        unlocked: true,
        unlockedAt: "2026-04-01",
      });
    expect(gallery.achievements.find((achievement) => achievement.key === "cleanDay"))
      .toMatchObject({
        unlocked: true,
        unlockedAt: "2026-04-01",
      });
  });

  it("unlocks chain, focus, week-cleared, and no-miss-week achievements from derived history", () => {
    const logs = Array.from({ length: 7 }, (_, index) =>
      createLog(
        index < 2
          ? `2026-03-${String(index + 30).padStart(2, "0")}`
          : `2026-04-0${index - 1}`,
        { focusSessionsCompleted: index === 2 ? 10 : 0 },
      ),
    );
    const weeklySummaries = createWeeklyProgressionSummaries(
      logs,
      DEFAULT_SETTINGS,
      [createCommitment("2026-03-30")],
      {
        weekStart: "2026-03-30",
        elapsedDays: 7,
        status: "ON TRACK",
        metrics: [],
      },
      "2026-04-05",
    );
    const gallery = createAchievementGallery(
      logs,
      DEFAULT_SETTINGS,
      [],
      weeklySummaries,
    );

    expect(gallery.achievements.find((achievement) => achievement.key === "threeDayChain"))
      .toMatchObject({
        unlocked: true,
        unlockedAt: "2026-04-01",
      });
    expect(gallery.achievements.find((achievement) => achievement.key === "sevenDayChain"))
      .toMatchObject({
        unlocked: true,
        unlockedAt: "2026-04-05",
      });
    expect(gallery.achievements.find((achievement) => achievement.key === "focusTen"))
      .toMatchObject({
        unlocked: true,
        unlockedAt: "2026-04-01",
      });
    expect(gallery.achievements.find((achievement) => achievement.key === "weekCleared"))
      .toMatchObject({
        unlocked: true,
        unlockedAt: "2026-04-05",
      });
    expect(gallery.achievements.find((achievement) => achievement.key === "noMissWeek"))
      .toMatchObject({
        unlocked: true,
        unlockedAt: "2026-04-05",
      });
  });

  it("unlocks recovery bounce when an 85+ day follows a recovery-triggering day", () => {
    const logs = [
      createLog("2026-04-01", {
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
      }),
      createLog("2026-04-02"),
    ];
    const recoveryPlans: RecoveryPlan[] = [
      {
        id: "recovery-1",
        userId: "user-1",
        triggerDate: "2026-04-01",
        targetDate: "2026-04-02",
        missReason: "distraction",
        correctiveAction: "Remove the leak before the next block.",
        status: "resolved",
        resolvedAt: "2026-04-02T18:00:00.000Z",
        createdAt: "2026-04-01T23:00:00.000Z",
        updatedAt: "2026-04-02T18:00:00.000Z",
      },
    ];
    const gallery = createAchievementGallery(
      logs,
      DEFAULT_SETTINGS,
      recoveryPlans,
      [],
    );

    expect(gallery.achievements.find((achievement) => achievement.key === "recoveryBounce"))
      .toMatchObject({
        unlocked: true,
        unlockedAt: "2026-04-02",
      });
  });
});

describe("progression summary", () => {
  it("rolls total XP into level and rank details", () => {
    const logs = [
      createLog("2026-04-01", { focusSessionsCompleted: 1 }),
      createLog("2026-04-02", { focusSessionsCompleted: 2 }),
    ];
    const weeklySummaries = [
      {
        weekStart: "2026-03-23",
        weekEnd: "2026-03-29",
        hasCommitment: true,
        status: "ON TRACK" as const,
        isClosed: true,
        hasSevenLogs: true,
        rewardXpEarned: 100,
      },
    ];
    const gallery = createAchievementGallery(logs, DEFAULT_SETTINGS, [], weeklySummaries);
    const summary = createProgressionSummary(
      logs,
      DEFAULT_SETTINGS,
      weeklySummaries,
      "2026-04-02",
      gallery.unlockedCount,
    );

    expect(summary.totalXp).toBe(380);
    expect(summary.level).toBe(2);
    expect(summary.rankTitle).toBe("Recruit");
    expect(summary.xpIntoLevel).toBe(130);
    expect(summary.todayXp).toBe(145);
    expect(summary.totalWeeklyBossXp).toBe(100);
    expect(summary.weeklyBossClears).toBe(1);
  });

  it("returns the three most recent unlocks in descending date order", () => {
    const logs = Array.from({ length: 7 }, (_, index) =>
      createLog(
        index < 2
          ? `2026-03-${String(index + 30).padStart(2, "0")}`
          : `2026-04-0${index - 1}`,
        { focusSessionsCompleted: index === 2 ? 10 : 0 },
      ),
    );
    const weeklySummaries = createWeeklyProgressionSummaries(
      logs,
      DEFAULT_SETTINGS,
      [createCommitment("2026-03-30")],
      {
        weekStart: "2026-03-30",
        elapsedDays: 7,
        status: "ON TRACK",
        metrics: [],
      },
      "2026-04-05",
    );
    const gallery = createAchievementGallery(
      logs,
      DEFAULT_SETTINGS,
      [],
      weeklySummaries,
    );
    const recentUnlocks = getRecentUnlocks(gallery);

    expect(recentUnlocks).toHaveLength(3);
    expect(recentUnlocks[0]?.unlockedAt).toBe("2026-04-05");
    expect(recentUnlocks[1]?.unlockedAt).toBe("2026-04-05");
    expect(recentUnlocks[2]?.unlockedAt).toBe("2026-04-05");
  });
});
