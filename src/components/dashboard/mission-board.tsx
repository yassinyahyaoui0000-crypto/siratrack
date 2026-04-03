import type { ComponentType } from "react";

import {
  BookOpen,
  CheckCircle2,
  Code2,
  Dumbbell,
  Flame,
  FolderKanban,
  MoonStar,
  Timer,
} from "lucide-react";

import type { DailyMissionBoard, DailyMissionKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const MISSION_ICONS: Record<DailyMissionKey, ComponentType<{ className?: string }>> = {
  deepWork: Timer,
  coding: Code2,
  building: FolderKanban,
  learning: BookOpen,
  workout: Dumbbell,
  prayers: MoonStar,
  perfectStandard: CheckCircle2,
  focusChain: Flame,
};

interface MissionBoardProps {
  board: DailyMissionBoard;
}

export function MissionBoard({ board }: MissionBoardProps) {
  return (
    <section className="surface p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Mission Board</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Clear the day with visible objectives.
          </h2>
        </div>
        <div className="tactical-chip">
          {board.completedCount}/{board.totalCount} cleared
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {board.missions.map((mission) => {
          const Icon = MISSION_ICONS[mission.key];

          return (
            <div
              key={mission.key}
              className={cn(
                "mission-tile rounded-[26px] border p-4 transition",
                mission.isComplete
                  ? "mission-tile-complete border-emerald-300/20 bg-emerald-300/[0.08]"
                  : "border-white/10 bg-black/20",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <Icon
                  className={cn(
                    "size-5",
                    mission.isComplete ? "text-emerald-300" : "text-amber-300",
                  )}
                />
                <span className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                  +{mission.rewardXp} xp
                </span>
              </div>
              <p className="mt-5 text-lg font-semibold text-white">{mission.label}</p>
              <p className="mt-2 text-sm text-white/50">{mission.description}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="font-mono text-sm text-white">{mission.statusLabel}</span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                    mission.isComplete
                      ? "status-good"
                      : "border border-white/10 bg-white/5 text-white/55",
                  )}
                >
                  {mission.isComplete ? "Clear" : "Pending"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
