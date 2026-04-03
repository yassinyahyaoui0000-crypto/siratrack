import type { ComponentType } from "react";

import {
  Award,
  BadgeCheck,
  Flame,
  Shield,
  Swords,
  Timer,
} from "lucide-react";

import type {
  Achievement,
  AchievementGallery as AchievementGalleryType,
  AchievementKey,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const ACHIEVEMENT_ICONS: Record<AchievementKey, ComponentType<{ className?: string }>> = {
  firstLog: Award,
  cleanDay: BadgeCheck,
  threeDayChain: Flame,
  sevenDayChain: Flame,
  focusTen: Timer,
  weekCleared: Swords,
  noMissWeek: Shield,
  recoveryBounce: BadgeCheck,
};

interface AchievementGalleryProps {
  gallery: AchievementGalleryType;
  recentUnlocks: Achievement[];
}

export function AchievementGallery({ gallery, recentUnlocks }: AchievementGalleryProps) {
  const recentUnlockKeys = new Set(recentUnlocks.map((achievement) => achievement.key));

  return (
    <section className="surface p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Achievement Gallery</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Proof that the system is being cleared.
          </h2>
        </div>
        <div className="tactical-chip">
          {gallery.unlockedCount}/{gallery.totalCount} unlocked
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {gallery.achievements.map((achievement) => {
          const Icon = ACHIEVEMENT_ICONS[achievement.key];
          const isRecent = recentUnlockKeys.has(achievement.key);

          return (
            <div
              key={achievement.key}
              className={cn(
                "achievement-card rounded-[26px] border p-4 transition",
                achievement.unlocked
                  ? "border-cyan-300/15 bg-cyan-300/[0.06]"
                  : "border-white/10 bg-black/20 opacity-65",
                isRecent && "achievement-card-recent",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <Icon
                  className={cn(
                    "size-5",
                    achievement.unlocked ? "text-cyan-200" : "text-white/30",
                  )}
                />
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                    achievement.unlocked
                      ? "border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100"
                      : "border border-white/10 bg-white/5 text-white/40",
                  )}
                >
                  {achievement.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              <p className="mt-5 text-lg font-semibold text-white">{achievement.title}</p>
              <p className="mt-2 text-sm leading-6 text-white/50">{achievement.description}</p>
              <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-white/35">
                {achievement.unlockedAt ? `Earned ${achievement.unlockedAt}` : "Not earned"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
