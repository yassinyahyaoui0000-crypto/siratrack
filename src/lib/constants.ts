import type {
  AppSettings,
  HabitKey,
  PrayerKey,
  RecoveryPlanMissReason,
} from "@/lib/types";

export const DEFAULT_APP_TIMEZONE = "Africa/Lagos";

export const SCORE_WEIGHTS = {
  deepWork: 25,
  coding: 20,
  project: 15,
  learning: 15,
  workout: 10,
  prayers: 15,
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  deepWorkTargetHours: 4,
  codingTargetProblems: 3,
  learningTargetMinutes: 60,
  requireProjectWork: true,
  requireWorkout: true,
  requireAllPrayers: true,
};

export const PRAYER_FIELDS: Array<{ key: PrayerKey; label: string }> = [
  { key: "fajrDone", label: "Fajr" },
  { key: "dhuhrDone", label: "Dhuhr" },
  { key: "asrDone", label: "Asr" },
  { key: "maghribDone", label: "Maghrib" },
  { key: "ishaDone", label: "Isha" },
];

export const HABIT_LABELS: Record<HabitKey, string> = {
  deepWork: "Deep Work",
  coding: "Coding",
  building: "Building",
  learning: "Learning",
  workout: "Workout",
  prayers: "Prayers",
};

export const RECOVERY_REASON_OPTIONS: Array<{
  value: RecoveryPlanMissReason;
  label: string;
}> = [
  { value: "planning", label: "Planning failure" },
  { value: "distraction", label: "Distraction" },
  { value: "fatigue", label: "Fatigue" },
  { value: "avoidance", label: "Avoidance" },
  { value: "overcommitment", label: "Overcommitment" },
  { value: "other", label: "Other" },
];

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];
