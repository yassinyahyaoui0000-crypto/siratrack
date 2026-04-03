export type DayRating = "GOOD" | "AVERAGE" | "BAD";
export type WeeklyCommitmentStatus = "ON TRACK" | "OFF TRACK";
export type RankTitle =
  | "Recruit"
  | "Operator"
  | "Builder"
  | "Vanguard"
  | "Executor"
  | "Ironmind";
export type RecoveryPlanMissReason =
  | "planning"
  | "distraction"
  | "fatigue"
  | "avoidance"
  | "overcommitment"
  | "other";
export type RecoveryPlanStatus = "open" | "resolved";
export type AccountabilityDayStatus = DayRating | "MISSED";

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
export type DailyMissionKey =
  | HabitKey
  | "perfectStandard"
  | "focusChain";
export type AchievementKey =
  | "firstLog"
  | "cleanDay"
  | "threeDayChain"
  | "sevenDayChain"
  | "focusTen"
  | "weekCleared"
  | "noMissWeek"
  | "recoveryBounce";

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

export interface WeeklyCommitmentInput {
  deepWorkHoursGoal: number;
  codingProblemsGoal: number;
  learningMinutesGoal: number;
  workoutDaysGoal: number;
  fullPrayerDaysGoal: number;
  primaryProjectId: string | null;
  commitmentNote: string;
}

export interface WeeklyCommitment extends WeeklyCommitmentInput {
  id?: string;
  userId?: string;
  weekStart: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeeklyCommitmentMetricProgress {
  key:
    | "deepWorkHours"
    | "codingProblems"
    | "learningMinutes"
    | "workoutDays"
    | "fullPrayerDays";
  label: string;
  goal: number;
  actual: number;
  remaining: number;
  expectedSoFar: number;
  isOnTrack: boolean;
  unitLabel: string;
}

export interface WeeklyCommitmentProgress {
  weekStart: string;
  elapsedDays: number;
  status: WeeklyCommitmentStatus;
  metrics: WeeklyCommitmentMetricProgress[];
}

export interface DailyXpResult {
  totalXpEarned: number;
  baseXp: number;
  fullCompletionBonusXp: number;
  focusBonusXp: number;
  fullCompletion: boolean;
}

export interface RecoveryPlanInput {
  triggerDate: string;
  targetDate: string;
  missReason: RecoveryPlanMissReason;
  correctiveAction: string;
}

export interface RecoveryPlanUpdateInput {
  missReason?: RecoveryPlanMissReason;
  correctiveAction?: string;
}

export interface RecoveryPlan extends RecoveryPlanInput {
  id: string;
  userId: string;
  status: RecoveryPlanStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveRecoveryPlan {
  id?: string;
  triggerDate: string;
  targetDate: string;
  missReason: RecoveryPlanMissReason | null;
  correctiveAction: string;
  status: "open";
  isPersisted: boolean;
  needsInput: boolean;
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

export interface AccountabilityDay {
  date: string;
  shortDateLabel: string;
  dayLabel: string;
  status: AccountabilityDayStatus;
  score: number | null;
  dayRating: DayRating | null;
  isToday: boolean;
  log: DailyLog | null;
}

export interface AccountabilityHistorySummary {
  goodDays: number;
  badDays: number;
  missedDays: number;
  longestFullStreak: number;
  mostMissedCategory:
    | {
        key: HabitKey;
        label: string;
        missedCount: number;
      }
    | null;
}

export interface AccountabilityHistory {
  range: "30d";
  days: AccountabilityDay[];
  summary: AccountabilityHistorySummary;
}

export interface ProgressionSummary {
  totalXp: number;
  totalDailyXp: number;
  totalWeeklyBossXp: number;
  todayXp: number;
  level: number;
  rankTitle: RankTitle;
  xpIntoLevel: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  weeklyBossClears: number;
  unlockedAchievementCount: number;
}

export interface DailyMission {
  key: DailyMissionKey;
  label: string;
  description: string;
  statusLabel: string;
  isComplete: boolean;
  rewardXp: number;
}

export interface DailyMissionBoard {
  missions: DailyMission[];
  completedCount: number;
  totalCount: number;
}

export interface WeeklyBossBoard {
  hasCommitment: boolean;
  status: WeeklyCommitmentStatus | null;
  rewardXp: number;
  warning: boolean;
  weekStart: string;
  elapsedDays: number;
  primaryProjectName: string | null;
  note: string;
  metrics: WeeklyCommitmentMetricProgress[];
}

export interface Achievement {
  key: AchievementKey;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementGallery {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
}

export interface DashboardData {
  userEmail: string;
  settings: AppSettings;
  todayLog: DailyLog;
  hasTodayLog: boolean;
  weeklyScoreboard: WeeklyScoreboard;
  weeklyCommitment: WeeklyCommitment | null;
  weeklyCommitmentProgress: WeeklyCommitmentProgress | null;
  habitCompletions: HabitCompletion[];
  streaks: StreakSummary;
  feedbackMessage: string;
  activeRecoveryPlan: ActiveRecoveryPlan | null;
  accountabilityHistory: AccountabilityHistory;
  activeProjects: Project[];
  focusDerivedHours: number;
  progressionSummary: ProgressionSummary;
  dailyMissionBoard: DailyMissionBoard;
  weeklyBossBoard: WeeklyBossBoard;
  achievementGallery: AchievementGallery;
  recentUnlocks: Achievement[];
}
