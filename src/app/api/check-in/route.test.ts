import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  saveDailyLogForToday: vi.fn(),
}));

vi.mock("@/lib/http", async () => {
  const actual = await vi.importActual<typeof import("@/lib/http")>("@/lib/http");

  return {
    ...actual,
    requireApiUser: mocks.requireApiUser,
  };
});

vi.mock("@/lib/data/daily-logs", () => ({
  saveDailyLogForToday: mocks.saveDailyLogForToday,
}));

import { POST, PUT } from "@/app/api/check-in/route";

const validBody = {
  deepWorkHours: 4,
  codingProblemsSolved: 3,
  projectWorkDone: true,
  projectNotes: "Shipped a feature.",
  learningMinutes: 60,
  workoutDone: true,
  fajrDone: true,
  dhuhrDone: true,
  asrDone: true,
  maghribDone: true,
  ishaDone: true,
  reflection: "Solid day.",
  missReason: null,
  missNote: "",
};

describe("check-in routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiUser.mockResolvedValue({
      supabase: {},
      user: { id: "user-1" },
    });
    mocks.saveDailyLogForToday.mockResolvedValue({
      logDate: "2026-04-03",
      dailyScore: 100,
      dayRating: "GOOD",
    });
  });

  it("rejects unauthenticated requests", async () => {
    mocks.requireApiUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("creates today’s log on POST", async () => {
    const response = await POST(
      new Request("http://localhost/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.saveDailyLogForToday).toHaveBeenCalledWith(
      {},
      "user-1",
      expect.any(Object),
      "create",
    );
  });

  it("upserts today’s log on PUT", async () => {
    const response = await PUT(
      new Request("http://localhost/api/check-in", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.saveDailyLogForToday).toHaveBeenCalledWith(
      {},
      "user-1",
      expect.any(Object),
      "upsert",
    );
  });
});
