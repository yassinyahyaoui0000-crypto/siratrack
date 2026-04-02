export function getFeedbackMessage(
  score: number | null,
  missedYesterday: boolean,
  fullStreak: number,
) {
  if (missedYesterday || (score !== null && score < 60)) {
    return "You are falling behind. Fix it tomorrow.";
  }

  if (score === null) {
    return "The log is still empty. Earn the day before it closes.";
  }

  if (score < 85) {
    return "Average is drift. Tighten the standard tomorrow.";
  }

  if (fullStreak >= 7) {
    return "Consistency is holding. Protect it tomorrow.";
  }

  return "Good work. Repeat the standard tomorrow.";
}
