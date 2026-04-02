import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/lib/constants";
import { computeStreaks } from "@/lib/data/dashboard";
import { applyScoreToLog, createEmptyDailyLog } from "@/lib/scoring";
import type { DailyLog } from "@/lib/types";

function createFullLog(logDate: string): DailyLog {
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
    },
    DEFAULT_SETTINGS,
  );
}

function createPartialLog(logDate: string): DailyLog {
  return applyScoreToLog(
    {
      ...createEmptyDailyLog(logDate),
      deepWorkHours: 4,
      codingProblemsSolved: 2,
      learningMinutes: 30,
      projectWorkDone: true,
      workoutDone: false,
      fajrDone: true,
      dhuhrDone: true,
      asrDone: false,
      maghribDone: false,
      ishaDone: false,
    },
    DEFAULT_SETTINGS,
  );
}

describe("computeStreaks", () => {
  it("continues a full streak when each day meets the standard", () => {
    const streaks = computeStreaks(
      [
        createFullLog("2026-04-01"),
        createFullLog("2026-04-02"),
        createFullLog("2026-04-03"),
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
        createPartialLog("2026-04-01"),
        createPartialLog("2026-04-02"),
      ],
      DEFAULT_SETTINGS,
      "2026-04-03",
    );

    expect(streaks.full).toBe(0);
    expect(streaks.partial).toBe(2);
  });

  it("breaks streaks when yesterday is missing", () => {
    const streaks = computeStreaks(
      [createFullLog("2026-04-01")],
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
        createFullLog("2026-04-01"),
        createFullLog("2026-04-02"),
        createPartialLog("2026-04-03"),
      ],
      DEFAULT_SETTINGS,
      "2026-04-03",
    );

    expect(streaks.full).toBe(2);
    expect(streaks.partial).toBe(3);
  });
});
