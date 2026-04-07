import type { Metadata } from "next";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";

import { WeeklyScoreChart } from "@/components/dashboard/weekly-score-chart";
import { getDashboardData } from "@/lib/data/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Weekly Review",
};

function getWeeklyReviewSummary(
  averageScore: number,
  hasRecoveryPlan: boolean,
  isWeeklyOffTrack: boolean,
  mostMissedCategory: { label: string; missedCount: number } | null,
) {
  if (hasRecoveryPlan) {
    return {
      title: "Close the loop on the open recovery plan.",
      body: "Resolve the current miss before it becomes the next weak week.",
      icon: AlertTriangle,
    };
  }

  if (isWeeklyOffTrack) {
    return {
      title: "The week is slipping off pace.",
      body: "Cut one commitment, protect the minimums, and recover momentum.",
      icon: Target,
    };
  }

  if (mostMissedCategory) {
    return {
      title: `Next week should pressure ${mostMissedCategory.label.toLowerCase()}.`,
      body: `${mostMissedCategory.missedCount} recent misses show where the standard is weakest.`,
      icon: Flame,
    };
  }

  return {
    title: averageScore >= 80 ? "This was a strong week." : "Keep the same standard and repeat it.",
    body: "The main job now is consistency. Protect the routine and keep the logs clean.",
    icon: CheckCircle2,
  };
}

export default async function WeeklyReviewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return null;
  }

  const dashboard = await getDashboardData(supabase, user.id, user.email);
  const weeklyEntries = dashboard.weeklyScoreboard.entries.filter((entry) => !entry.isFuture);
  const habitSignals = dashboard.habitCompletions
    .slice()
    .sort((left, right) => right.completionPercent - left.completionPercent);
  const latestSlipEntry = dashboard.accountabilityHistory.days
    .slice()
    .reverse()
    .find((day) => day.log && (day.log.missReason || day.log.missNote));
  const summary = getWeeklyReviewSummary(
    dashboard.weeklyScoreboard.averageScore,
    Boolean(dashboard.activeRecoveryPlan),
    dashboard.weeklyCommitmentProgress?.status === "OFF TRACK",
    dashboard.accountabilityHistory.summary.mostMissedCategory,
  );
  const SummaryIcon = summary.icon;

  return (
    <div className="space-y-6">
      <section className="surface p-6 sm:p-7">
        <p className="section-label">Weekly Review</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
          Review the week, then tighten the next one.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
          This page turns the last seven days into a decision surface: what held,
          what slipped, and where to focus next.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="surface p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-label">Week Trend</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Score pressure over the current week.
              </h2>
            </div>
            <div className="tactical-chip">Average {dashboard.weeklyScoreboard.averageScore}</div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <TrendingUp className="size-4 text-cyan-300" />
                Weekly Average
              </div>
              <p className="mt-2 font-mono text-3xl text-white">
                {dashboard.weeklyScoreboard.averageScore}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <CalendarDays className="size-4 text-emerald-300" />
                Best Day
              </div>
              <p className="mt-2 text-lg font-semibold text-white">
                {dashboard.weeklyScoreboard.bestDay
                  ? `${dashboard.weeklyScoreboard.bestDay.dayLabel} - ${dashboard.weeklyScoreboard.bestDay.score}`
                  : "No entry"}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Target className="size-4 text-rose-300" />
                Weakest Day
              </div>
              <p className="mt-2 text-lg font-semibold text-white">
                {dashboard.weeklyScoreboard.worstDay
                  ? `${dashboard.weeklyScoreboard.worstDay.dayLabel} - ${dashboard.weeklyScoreboard.worstDay.score}`
                  : "No entry"}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Flame className="size-4 text-amber-300" />
                Full Chain
              </div>
              <p className="mt-2 font-mono text-3xl text-white">{dashboard.streaks.full}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
            <WeeklyScoreChart entries={dashboard.weeklyScoreboard.entries} />
          </div>

          <div className="mt-6 grid gap-3">
            {weeklyEntries.map((entry) => (
              <div
                key={entry.date}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{entry.dayLabel}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
                    {entry.shortDateLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      entry.isToday
                        ? "status-average"
                        : entry.dayRating === "GOOD"
                          ? "status-good"
                          : entry.dayRating === "AVERAGE"
                            ? "status-average"
                            : "status-bad"
                    }`}
                  >
                    {entry.isToday ? "Today" : entry.dayRating}
                  </span>
                  <span className="font-mono text-lg text-white">
                    {entry.score ?? "--"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="surface p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-amber-300">
                <SummaryIcon className="size-5" />
              </div>
              <div>
                <p className="section-label">Review Verdict</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {summary.title}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/55">{summary.body}</p>

            <div className="mt-6 space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/45">Weekly commitment</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {dashboard.weeklyCommitmentProgress
                    ? dashboard.weeklyCommitmentProgress.status
                    : "No commitment set"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/45">Recovery status</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {dashboard.activeRecoveryPlan
                    ? "Open recovery plan"
                    : "No open recovery plan"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/45">30 day pressure</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {dashboard.accountabilityHistory.summary.missedDays} missed, {" "}
                  {dashboard.accountabilityHistory.summary.badDays} weak, {" "}
                  {dashboard.accountabilityHistory.summary.goodDays} strong
                </p>
              </div>
            </div>
          </section>

          <section className="surface p-6 sm:p-7">
            <p className="section-label">Habit Balance</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Where the week held and where it slipped.
            </h2>

            <div className="mt-5 space-y-4">
              {habitSignals.map((habit) => (
                <div key={habit.key}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-white/60">{habit.label}</span>
                    <span className="font-mono text-white">{habit.completionPercent}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-amber-400 via-cyan-300 to-emerald-400"
                      style={{ width: `${Math.max(0, Math.min(100, habit.completionPercent))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-6 sm:p-7">
            <p className="section-label">Next Move</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              One change for the next week.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/55">
              {dashboard.activeRecoveryPlan
                ? `Resolve the recovery plan triggered on ${dashboard.activeRecoveryPlan.triggerDate} and keep the next target day clean.`
                : dashboard.weeklyCommitmentProgress?.status === "OFF TRACK"
                  ? "Trim one commitment or lower the weekly target so the plan matches the actual capacity this week."
                  : dashboard.accountabilityHistory.summary.mostMissedCategory
                    ? `Push ${dashboard.accountabilityHistory.summary.mostMissedCategory.label.toLowerCase()} harder next week and remove one source of drift.`
                    : "Keep the same standards in place and repeat the week with less variance."}
            </p>
          </section>

          <section className="surface p-6 sm:p-7">
            <p className="section-label">Latest Slip Context</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              What was recorded when a day slipped.
            </h2>
            <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
              {latestSlipEntry?.log ? (
                <div className="space-y-2 text-sm leading-6 text-white/75">
                  <p className="font-semibold text-white">{latestSlipEntry.dayLabel}</p>
                  <p>
                    Reason: {latestSlipEntry.log.missReason ?? "No reason selected."}
                  </p>
                  <p>{latestSlipEntry.log.missNote || "No note recorded."}</p>
                </div>
              ) : (
                <p className="text-sm leading-6 text-white/55">
                  No slip context has been logged yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}