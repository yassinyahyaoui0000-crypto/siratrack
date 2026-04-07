"use client";

import { useState } from "react";

import { RECOVERY_REASON_OPTIONS } from "@/lib/constants";
import type { AccountabilityHistory, AccountabilityDay } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AccountabilityBoardProps {
  history: AccountabilityHistory;
}

function getCellClassName(day: AccountabilityDay, selectedDate: string | null) {
  if (selectedDate === day.date) {
    return "border-white/25 ring-2 ring-amber-400/50";
  }

  if (day.status === "GOOD") {
    return "border-emerald-400/20 bg-emerald-400/10 hover:border-emerald-300/40";
  }

  if (day.status === "AVERAGE") {
    return "border-amber-400/20 bg-amber-400/10 hover:border-amber-300/40";
  }

  if (day.status === "BAD") {
    return "border-rose-400/20 bg-rose-400/10 hover:border-rose-300/40";
  }

  return "border-white/10 bg-black/20 hover:border-white/20";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 py-2 text-sm last:border-b-0">
      <span className="text-white/45">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

function getMissReasonLabel(value: string | null) {
  if (!value) {
    return "";
  }

  return RECOVERY_REASON_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function AccountabilityBoard({ history }: AccountabilityBoardProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    history.days.at(-1)?.date ?? null,
  );

  const selectedDay =
    history.days.find((day) => day.date === selectedDate) ?? history.days.at(-1) ?? null;

  return (
    <div className="surface p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Battle Log</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Review the last thirty days without escape.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Strong days, weak days, and missed logs all remain visible. Past days stay read-only.
          </p>
        </div>
        <div className="tactical-chip">
          30 day record
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-white/50">Strong Days</p>
          <p className="mt-2 font-mono text-3xl text-white">{history.summary.goodDays}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-white/50">Failed Days</p>
          <p className="mt-2 font-mono text-3xl text-white">{history.summary.badDays}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-white/50">Silent Days</p>
          <p className="mt-2 font-mono text-3xl text-white">{history.summary.missedDays}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-white/50">Best Chain</p>
          <p className="mt-2 font-mono text-3xl text-white">
            {history.summary.longestFullStreak}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-white/50">Weakest Area</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {history.summary.mostMissedCategory
              ? history.summary.mostMissedCategory.label
              : "None"}
          </p>
          {history.summary.mostMissedCategory ? (
            <p className="mt-1 text-xs text-white/45">
              {history.summary.mostMissedCategory.missedCount} misses
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">
          {history.days.map((day) => (
            <button
              key={day.date}
              type="button"
              title={
                day.status === "MISSED"
                  ? `${day.date}: missed`
                  : `${day.date}: ${day.score}/100`
              }
              onClick={() => setSelectedDate(day.date)}
              className={cn(
                "rounded-[22px] border p-3 text-left transition",
                getCellClassName(day, selectedDate),
              )}
            >
              <p className="section-label text-current/70!">{day.dayLabel}</p>
              <p className="mt-2 text-sm font-semibold text-white">{day.shortDateLabel}</p>
              <p className="mt-3 font-mono text-lg text-white">
                {day.score ?? "--"}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
          {selectedDay ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="section-label">Selected Entry</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {selectedDay.date}
                  </h3>
                </div>
                <div
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em]",
                    selectedDay.status === "GOOD"
                      ? "status-good"
                      : selectedDay.status === "AVERAGE"
                        ? "status-average"
                        : selectedDay.status === "BAD"
                          ? "status-bad"
                          : "border border-white/10 bg-white/5 text-white/60",
                  )}
                >
                  {selectedDay.status}
                </div>
              </div>

              {selectedDay.log ? (
                <div className="mt-5">
                  <DetailRow label="Deep Work" value={`${selectedDay.log.deepWorkHours} hrs`} />
                  <DetailRow label="Coding" value={selectedDay.log.codingProblemsSolved} />
                  <DetailRow label="Learning" value={`${selectedDay.log.learningMinutes} min`} />
                  <DetailRow
                    label="Project Work"
                    value={selectedDay.log.projectWorkDone ? "Done" : "Missed"}
                  />
                  <DetailRow
                    label="Workout"
                    value={selectedDay.log.workoutDone ? "Done" : "Missed"}
                  />
                  <DetailRow
                    label="Prayers"
                    value={
                      [
                        selectedDay.log.fajrDone,
                        selectedDay.log.dhuhrDone,
                        selectedDay.log.asrDone,
                        selectedDay.log.maghribDone,
                        selectedDay.log.ishaDone,
                      ].filter(Boolean).length
                    }
                  />
                  <DetailRow
                    label="Focus Sessions"
                    value={selectedDay.log.focusSessionsCompleted}
                  />
                  <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="section-label">Reflection</p>
                    <p className="mt-2 text-sm leading-6 text-white/75">
                      {selectedDay.log.reflection || "No reflection recorded."}
                    </p>
                  </div>
                  <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="section-label">Slip Context</p>
                    {selectedDay.log.missReason || selectedDay.log.missNote ? (
                      <div className="mt-2 space-y-2 text-sm leading-6 text-white/75">
                        <p>
                          {selectedDay.log.missReason
                            ? getMissReasonLabel(selectedDay.log.missReason)
                            : "No slip reason selected."}
                        </p>
                        <p>{selectedDay.log.missNote || "No slip note recorded."}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        No slip context recorded for this day.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-black/15 p-4 text-sm text-white/60">
                  No log was saved on this day. The gap stays on the record.
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
