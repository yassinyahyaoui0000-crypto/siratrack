import { Activity, FolderKanban, Orbit, Swords, Zap } from "lucide-react";

import { AchievementGallery } from "@/components/dashboard/achievement-gallery";
import { AccountabilityBoard } from "@/components/dashboard/accountability-board";
import { DailyCheckInForm } from "@/components/dashboard/check-in-form";
import { FocusTimer } from "@/components/dashboard/focus-timer";
import { MissionBoard } from "@/components/dashboard/mission-board";
import { ProgressionHud } from "@/components/dashboard/progression-hud";
import { RecoveryPlanCard } from "@/components/dashboard/recovery-plan-card";
import { WeeklyCommitmentCard } from "@/components/dashboard/weekly-commitment-card";
import { WeeklyScoreChart } from "@/components/dashboard/weekly-score-chart";
import { getDashboardData } from "@/lib/data/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      <ProgressionHud
        progression={dashboard.progressionSummary}
        streaks={dashboard.streaks}
        todayScore={dashboard.todayLog.dailyScore}
        todayRating={dashboard.todayLog.dayRating}
        recentUnlocks={dashboard.recentUnlocks}
      />

      {dashboard.activeRecoveryPlan ? (
        <RecoveryPlanCard plan={dashboard.activeRecoveryPlan} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DailyCheckInForm
          key={`${dashboard.todayLog.logDate}-${dashboard.todayLog.updatedAt ?? "new"}-${dashboard.todayLog.focusSessionsCompleted}`}
          initialLog={dashboard.todayLog}
          hasTodayLog={dashboard.hasTodayLog}
          settings={dashboard.settings}
          focusDerivedHours={dashboard.focusDerivedHours}
        />

        <div className="space-y-6">
          <MissionBoard board={dashboard.dailyMissionBoard} />

          <WeeklyCommitmentCard
            key={dashboard.weeklyCommitment?.updatedAt ?? dashboard.weeklyCommitment?.weekStart ?? `boss-${dashboard.weeklyBossBoard.weekStart}`}
            initialCommitment={dashboard.weeklyCommitment}
            initialProgress={dashboard.weeklyCommitmentProgress}
            weeklyBossBoard={dashboard.weeklyBossBoard}
            settings={dashboard.settings}
            projects={dashboard.activeProjects}
          />

          <div className="surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-label">Field Scan</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Current week pressure map.
                </h2>
              </div>
              <div className="tactical-chip">Week average {weekly.averageScore}</div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Activity className="size-4 text-cyan-300" />
                  Average
                </div>
                <p className="mt-2 font-mono text-3xl text-white">{weekly.averageScore}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Zap className="size-4 text-emerald-300" />
                  Best Hit
                </div>
                <p className="mt-2 text-lg font-semibold text-white">
                  {weekly.bestDay
                    ? `${weekly.bestDay.dayLabel} - ${weekly.bestDay.score}`
                    : "No entry"}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Swords className="size-4 text-rose-300" />
                  Weakest Day
                </div>
                <p className="mt-2 text-lg font-semibold text-white">
                  {weekly.worstDay
                    ? `${weekly.worstDay.dayLabel} - ${weekly.worstDay.score}`
                    : "No entry"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <WeeklyScoreChart entries={weekly.entries} />
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
                Builds still inside the arena.
              </h2>
            </div>
            <a href="/projects" className="action-button-secondary">
              Manage Projects
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
              <FolderKanban className="size-5 text-amber-300" />
              <p className="mt-4 text-sm text-white/50">Active Builds</p>
              <p className="mt-2 font-mono text-4xl text-white">
                {dashboard.activeProjects.length}
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
              <Zap className="size-5 text-amber-300" />
              <p className="mt-4 text-sm text-white/50">Daily XP</p>
              <p className="mt-2 font-mono text-4xl text-white">
                {dashboard.progressionSummary.todayXp}
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
              <Orbit className="size-5 text-amber-300" />
              <p className="mt-4 text-sm text-white/50">Boss Reward</p>
              <p className="mt-2 font-mono text-4xl text-white">
                {dashboard.weeklyBossBoard.rewardXp}
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
                    <div>
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                        Tactical progress
                      </p>
                    </div>
                    <span className="font-mono text-sm text-white/55">
                      {project.progressPercent}%
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-300 to-emerald-400"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AchievementGallery
        gallery={dashboard.achievementGallery}
        recentUnlocks={dashboard.recentUnlocks}
      />

      <AccountabilityBoard
        key={dashboard.accountabilityHistory.days.at(-1)?.date ?? "accountability"}
        history={dashboard.accountabilityHistory}
      />
    </div>
  );
}
