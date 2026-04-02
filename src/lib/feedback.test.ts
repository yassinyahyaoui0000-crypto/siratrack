import { describe, expect, it } from "vitest";

import { getFeedbackMessage } from "@/lib/feedback";

describe("getFeedbackMessage", () => {
  it("returns the strict line for missed standards", () => {
    expect(getFeedbackMessage(50, false, 0)).toBe(
      "You are falling behind. Fix it tomorrow.",
    );
    expect(getFeedbackMessage(90, true, 2)).toBe(
      "You are falling behind. Fix it tomorrow.",
    );
  });

  it("returns restrained feedback for average days", () => {
    expect(getFeedbackMessage(72, false, 0)).toBe(
      "Average is drift. Tighten the standard tomorrow.",
    );
  });

  it("returns controlled encouragement for strong days", () => {
    expect(getFeedbackMessage(92, false, 3)).toBe(
      "Good work. Repeat the standard tomorrow.",
    );
    expect(getFeedbackMessage(96, false, 7)).toBe(
      "Consistency is holding. Protect it tomorrow.",
    );
  });
});
