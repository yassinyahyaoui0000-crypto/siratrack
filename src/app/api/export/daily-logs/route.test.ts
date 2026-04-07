import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  listDailyLogsForUser: vi.fn(),
}));

vi.mock("@/lib/http", async () => {
  const actual = await vi.importActual<typeof import("@/lib/http")>("@/lib/http");

  return {
    ...actual,
    requireApiUser: mocks.requireApiUser,
  };
});

vi.mock("@/lib/data/daily-logs", () => ({
  listDailyLogsForUser: mocks.listDailyLogsForUser,
}));

import { GET } from "@/app/api/export/daily-logs/route";

describe("GET /api/export/daily-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiUser.mockResolvedValue({
      supabase: {},
      user: { id: "user-1" },
    });
    mocks.listDailyLogsForUser.mockResolvedValue([
      {
        logDate: "2026-04-03",
        deepWorkHours: 4,
        codingProblemsSolved: 3,
        projectWorkDone: true,
        projectNotes: "Notes",
        learningMinutes: 60,
        workoutDone: true,
        fajrDone: true,
        dhuhrDone: true,
        asrDone: true,
        maghribDone: true,
        ishaDone: true,
        focusSessionsCompleted: 2,
        reflection: "Stayed honest.",
        missReason: null,
        missNote: "",
        dailyScore: 100,
        dayRating: "GOOD",
      },
    ]);
  });

  it("returns csv with the expected headers", async () => {
    const response = await GET();
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(csv).toContain(
      "log_date,deep_work_hours,coding_problems_solved,project_work_done",
    );
    expect(csv).toContain("miss_reason,miss_note");
    expect(csv).toContain("2026-04-03");
  });
});
