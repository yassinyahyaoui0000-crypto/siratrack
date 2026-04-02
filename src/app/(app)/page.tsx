import {
  BookOpen,
  Code2,
  Dumbbell,
  Flame,
  FolderKanban,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { DailyCheckInForm } from "@/components/dashboard/check-in-form";
import { FocusTimer } from "@/components/dashboard/focus-timer";
import { WeeklyScoreChart } from "@/components/dashboard/weekly-score-chart";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatLongDateLabel } from "@/lib/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function ratingClassName(rating: "GOOD" | "AVERAGE" | "BAD") {
  if (rating === "GOOD") {
    return "status-good";
  }

  if (rating === "AVERAGE") {
    return "status-average";
  }

  return "status-bad";
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return null;
  }

  const dashboard = await getDashboardData(supabase, user.id, user.email);
  const weekly = dashboard.weeklyScoreboard;

  return (
    <div className="space-y-6">
      <section className="surface overflow-hidden p-6 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <div>
              <p className="section-label">Daily Review</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {formatLongDateLabel(dashboard.todayLog.logDate)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                Measure the day, protect the streak, and remove excuses before tomorrow begins.
              </p>
            </div>

            <div
              className={cn(
                "rounded-[28px] border px-5 py-5",
                dashboard.todayLog.dailyScore >= 85
                  ? "border-emerald-400/20 bg-emerald-400/10"
                  : dashboard.todayLog.dailyScore >= 60
                    ? "border-amber-400/20 bg-amber-400/10"
                    : "border-rose-400/20 bg-rose-400/10",
              )}
            >
              <div className="flex items-start gap-4">
                {dashboard.todayLog.dailyScore >= 85 ? (
                  <ShieldCheck className="mt-1 size-5 text-emerald-300" />
                ) : (
                  <ShieldAlert className="mt-1 size-5 text-rose-300" />
                )}
                <div>
                  <p className="section-label !text-current/70">Honest Feedback</p>
                  <p className="mt-2 text-lg font-medium text-white">
                    {dashboard.feedbackMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="section-label">Today Score</p>
              <p className="mt-3 font-mono text-5xl font-semibold text-white">
                {dashboard.todayLog.dailyScore}
              </p>
              <div
                className={cn(
                  "mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]",
                  ratingClassName(dashboard.todayLog.dayRating),
                )}
              >
                {dashboard.todayLog.dayRating}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="section-label">Full Streak</p>
              <p className="mt-3 flex items-center gap-3 font-mono text-5xl font-semibold text-white">
                <Flame className="size-8 text-amber-300" />
                {dashboard.streaks.full}
              </p>
              <p className="mt-4 text-sm text-white/50">Days meeting the full standard.</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="section-label">Partial Streak</p>
              <p className="mt-3 font-mono text-5xl font-semibold text-white">
                {dashboard.streaks.partial}
              </p>
              <p className="mt-4 text-sm text-white/50">Days staying at 60 or higher.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <DailyCheckInForm
          initialLog={dashboard.todayLog}
          hasTodayLog={dashboard.hasTodayLog}
          settings={dashboard.settings}
        />

        <div className="space-y-6">
          <div className="surface p-6">
            <p className="section-label">Weekly Scoreboard</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">Average</p>
                <p className="mt-2 font-mono text-3xl text-white">
                  {weekly.averageScore}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">Best Day</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {weekly.bestDay
                    ? `${weekly.bestDay.dayLabel} • ${weekly.bestDay.score}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">Worst Day</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {weekly.worstDay
                    ? `${weekly.worstDay.dayLabel} • ${weekly.worstDay.score}`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <WeeklyScoreChart entries={weekly.entries} />
            </div>
          </div>

          <div className="surface p-6">
            <p className="section-label">Habit Completion</p>
            <div className="mt-5 space-y-4">
              {dashboard.habitCompletions.map((habit) => (
                <div key={habit.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">{habit.label}</p>
                    <p className="font-mono text-sm text-white/55">
                      {habit.completedUnits}/{habit.totalUnits}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-[width]"
                      style={{ width: `${habit.completionPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <FocusTimer initialCompletedSessions={dashboard.todayLog.focusSessionsCompleted} />

        <div className="surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-label">Active Projects</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Current builds that still need effort.
              </h2>
            </div>
            <a href="/projects" className="action-button-secondary">
              Manage Projects
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <FolderKanban className="size-5 text-amber-300" />
              <p className="mt-4 text-sm text-white/50">Active Projects</p>
              <p className="mt-2 font-mono text-4xl text-white">
                {dashboard.activeProjects.length}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <Code2 className="size-5 text-amber-300" />
              <p className="mt-4 text-sm text-white/50">Coding Target</p>
              <p className="mt-2 font-mono text-4xl text-white">
                {dashboard.settings.codingTargetProblems}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <BookOpen className="size-5 text-amber-300" />
              <p className="mt-4 text-sm text-white/50">Learning Target</p>
              <p className="mt-2 font-mono text-4xl text-white">
                {dashboard.settings.learningTargetMinutes}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.activeProjects.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-black/15 p-6">
                <p className="text-sm text-white/55">
                  No active project is being tracked right now.
                </p>
              </div>
            ) : (
              dashboard.activeProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-[28px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    <span className="font-mono text-sm text-white/55">
                      {project.progressPercent}%
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface p-5">
          <Code2 className="size-5 text-amber-300" />
          <p className="mt-4 text-sm text-white/50">Coding Logged</p>
          <p className="mt-2 font-mono text-4xl text-white">
            {dashboard.todayLog.codingProblemsSolved}
          </p>
        </div>
        <div className="surface p-5">
          <BookOpen className="size-5 text-amber-300" />
          <p className="mt-4 text-sm text-white/50">Learning Logged</p>
          <p className="mt-2 font-mono text-4xl text-white">
            {dashboard.todayLog.learningMinutes}
          </p>
        </div>
        <div className="surface p-5">
          <Dumbbell className="size-5 text-amber-300" />
          <p className="mt-4 text-sm text-white/50">Workout Status</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {dashboard.todayLog.workoutDone ? "Done" : "Missed"}
          </p>
        </div>
      </div>
    </div>
  );
}
