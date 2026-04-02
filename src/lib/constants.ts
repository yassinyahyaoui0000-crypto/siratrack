import type { AppSettings, PrayerKey } from "@/lib/types";

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

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];
