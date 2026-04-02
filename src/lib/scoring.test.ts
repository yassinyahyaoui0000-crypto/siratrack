import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/lib/constants";
import { calculateDailyScore, createEmptyDailyLog } from "@/lib/scoring";

describe("calculateDailyScore", () => {
  it("scores an under-target day proportionally", () => {
    const log = {
      ...createEmptyDailyLog("2026-04-03"),
      deepWorkHours: 2,
      codingProblemsSolved: 1,
      learningMinutes: 30,
      projectWorkDone: false,
      workoutDone: false,
      fajrDone: true,
      dhuhrDone: false,
      asrDone: false,
      maghribDone: false,
      ishaDone: false,
    };

    const result = calculateDailyScore(log, DEFAULT_SETTINGS);

    expect(result.score).toBe(30);
    expect(result.rating).toBe("BAD");
  });

  it("awards a perfect score at target", () => {
    const log = {
      ...createEmptyDailyLog("2026-04-03"),
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
    };

    const result = calculateDailyScore(log, DEFAULT_SETTINGS);

    expect(result.score).toBe(100);
    expect(result.rating).toBe("GOOD");
    expect(result.fullCompletion).toBe(true);
  });

  it("caps score contributions above target", () => {
    const log = {
      ...createEmptyDailyLog("2026-04-03"),
      deepWorkHours: 10,
      codingProblemsSolved: 9,
      learningMinutes: 240,
      projectWorkDone: true,
      workoutDone: true,
      fajrDone: true,
      dhuhrDone: true,
      asrDone: true,
      maghribDone: true,
      ishaDone: true,
    };

    const result = calculateDailyScore(log, DEFAULT_SETTINGS);

    expect(result.score).toBe(100);
  });

  it("handles partial prayer completion", () => {
    const log = {
      ...createEmptyDailyLog("2026-04-03"),
      deepWorkHours: 4,
      codingProblemsSolved: 3,
      learningMinutes: 60,
      projectWorkDone: true,
      workoutDone: true,
      fajrDone: true,
      dhuhrDone: true,
      asrDone: true,
      maghribDone: false,
      ishaDone: false,
    };

    const result = calculateDailyScore(log, DEFAULT_SETTINGS);

    expect(result.score).toBe(94);
    expect(result.fullCompletion).toBe(false);
    expect(result.completedPrayers).toBe(3);
  });
});
