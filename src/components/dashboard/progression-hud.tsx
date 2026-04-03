import {
  Award,
  Flame,
  ShieldCheck,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";

import type { Achievement, ProgressionSummary, StreakSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProgressionHudProps {
  progression: ProgressionSummary;
  streaks: StreakSummary;
  todayScore: number;
  todayRating: "GOOD" | "AVERAGE" | "BAD";
  recentUnlocks: Achievement[];
}

function ratingChipClass(rating: "GOOD" | "AVERAGE" | "BAD") {
  if (rating === "GOOD") {
    return "status-good";
  }

  if (rating === "AVERAGE") {
    return "status-average";
  }

  return "status-bad";
}

export function ProgressionHud({
  progression,
  streaks,
  todayScore,
  todayRating,
  recentUnlocks,
}: ProgressionHudProps) {
  return (
    <section className="hud-shell relative overflow-hidden p-6 sm:p-7">
      <div className="scan-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />

      <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rank-pill">{progression.rankTitle}</span>
            <span className="tactical-chip">Level {progression.level}</span>
            <span className="tactical-chip">Total XP {progression.totalXp}</span>
          </div>

          <div className="max-w-3xl">
            <p className="section-label text-amber-200/65">Command Center</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl xl:text-6xl">
              Discipline turns into visible progression.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Every clean day pushes your rank forward. Every weak day still shows up in the log.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 text-sm text-white/55">
              <span className="inline-flex items-center gap-2">
                <Zap className="size-4 text-amber-300" />
                XP to next level
              </span>
              <span className="font-mono text-white">
                {progression.xpIntoLevel}/{progression.xpForNextLevel - progression.xpForCurrentLevel}
              </span>
            </div>
            <div className="xp-track">
              <div
                className="xp-fill"
                style={{ width: `${progression.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="hud-stat">
              <div className="flex items-center gap-2 text-white/50">
                <Zap className="size-4 text-amber-300" />
                Today XP
              </div>
              <p className="mt-3 font-mono text-4xl text-white">{progression.todayXp}</p>
            </div>
            <div className="hud-stat">
              <div className="flex items-center gap-2 text-white/50">
                <ShieldCheck className="size-4 text-emerald-300" />
                Today Score
              </div>
              <p className="mt-3 font-mono text-4xl text-white">{todayScore}</p>
              <span
                className={cn(
                  "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]",
                  ratingChipClass(todayRating),
                )}
              >
                {todayRating}
              </span>
            </div>
            <div className="hud-stat">
              <div className="flex items-center gap-2 text-white/50">
                <Flame className="size-4 text-amber-300 motion-pulse-ember" />
                Full Chain
              </div>
              <p className="mt-3 font-mono text-4xl text-white">{streaks.full}</p>
            </div>
            <div className="hud-stat">
              <div className="flex items-center gap-2 text-white/50">
                <Award className="size-4 text-cyan-300" />
                Unlocks
              </div>
              <p className="mt-3 font-mono text-4xl text-white">
                {progression.unlockedAchievementCount}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Recent Unlocks</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Latest gains
                </h2>
              </div>
              <Sparkles className="size-5 text-amber-300" />
            </div>

            <div className="mt-5 space-y-3">
              {recentUnlocks.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
                  No unlocks yet. Clear missions and win the week boss.
                </div>
              ) : (
                recentUnlocks.map((achievement) => (
                  <div
                    key={achievement.key}
                    className="achievement-card achievement-card-recent rounded-[22px] border border-amber-300/15 bg-amber-300/[0.07] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{achievement.title}</p>
                        <p className="mt-1 text-sm text-white/55">{achievement.description}</p>
                      </div>
                      <span className="tactical-chip text-amber-200/80">
                        {achievement.unlockedAt}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
            <div className="flex items-center gap-2 text-white/50">
              <Swords className="size-4 text-amber-300" />
              Weekly Boss XP
            </div>
            <p className="mt-3 font-mono text-4xl text-white">
              {progression.totalWeeklyBossXp}
            </p>
            <p className="mt-2 text-sm text-white/50">
              Boss clears recorded: <span className="font-mono text-white">{progression.weeklyBossClears}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
