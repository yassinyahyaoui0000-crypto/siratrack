export type DayRating = "GOOD" | "AVERAGE" | "BAD";

export type PrayerKey =
  | "fajrDone"
  | "dhuhrDone"
  | "asrDone"
  | "maghribDone"
  | "ishaDone";

export type HabitKey =
  | "deepWork"
  | "coding"
  | "building"
  | "learning"
  | "workout"
  | "prayers";

export interface AppSettings {
  userId?: string;
  deepWorkTargetHours: number;
  codingTargetProblems: number;
  learningTargetMinutes: number;
  requireProjectWork: boolean;
  requireWorkout: boolean;
  requireAllPrayers: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettingsInput {
  deepWorkTargetHours: number;
  codingTargetProblems: number;
  learningTargetMinutes: number;
  requireProjectWork: boolean;
  requireWorkout: boolean;
  requireAllPrayers: boolean;
}

export interface DailyLogInput {
  deepWorkHours: number;
  codingProblemsSolved: number;
  projectWorkDone: boolean;
  projectNotes: string;
  learningMinutes: number;
  workoutDone: boolean;
  fajrDone: boolean;
  dhuhrDone: boolean;
  asrDone: boolean;
  maghribDone: boolean;
  ishaDone: boolean;
  reflection: string;
}

export interface DailyLog extends DailyLogInput {
  id?: string;
  userId?: string;
  logDate: string;
  focusSessionsCompleted: number;
  dailyScore: number;
  dayRating: DayRating;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectInput {
  name: string;
}

export interface ProjectUpdateInput {
  name?: string;
  progressPercent?: number;
  isActive?: boolean;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  progressPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyScoreResult {
  score: number;
  rating: DayRating;
  fullCompletion: boolean;
  partialCompletion: boolean;
  completedPrayers: number;
}

export interface HabitCompletion {
  key: HabitKey;
  label: string;
  completionPercent: number;
  completedUnits: number;
  totalUnits: number;
}

export interface WeeklyScoreEntry {
  date: string;
  dayLabel: string;
  shortDateLabel: string;
  score: number | null;
  dayRating: DayRating | null;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeeklyScoreboard {
  averageScore: number;
  bestDay: WeeklyScoreEntry | null;
  worstDay: WeeklyScoreEntry | null;
  entries: WeeklyScoreEntry[];
}

export interface StreakSummary {
  full: number;
  partial: number;
  missedYesterday: boolean;
}

export interface DashboardData {
  userEmail: string;
  settings: AppSettings;
  todayLog: DailyLog;
  hasTodayLog: boolean;
  weeklyScoreboard: WeeklyScoreboard;
  habitCompletions: HabitCompletion[];
  streaks: StreakSummary;
  feedbackMessage: string;
  activeProjects: Project[];
}
