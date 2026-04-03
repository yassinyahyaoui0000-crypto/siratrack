"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import type {
  AppSettings,
  Project,
  WeeklyCommitment,
  WeeklyCommitmentInput,
  WeeklyCommitmentProgress,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeeklyCommitmentCardProps {
  initialCommitment: WeeklyCommitment | null;
  initialProgress: WeeklyCommitmentProgress | null;
  settings: AppSettings;
  projects: Project[];
}

function createDefaultWeeklyCommitment(settings: AppSettings): WeeklyCommitmentInput {
  return {
    deepWorkHoursGoal: Number((settings.deepWorkTargetHours * 7).toFixed(1)),
    codingProblemsGoal: settings.codingTargetProblems * 7,
    learningMinutesGoal: settings.learningTargetMinutes * 7,
    workoutDaysGoal: settings.requireWorkout ? 7 : 0,
    fullPrayerDaysGoal: settings.requireAllPrayers ? 7 : 0,
    primaryProjectId: null,
    commitmentNote: "",
  };
}

function extractFormValue(
  commitment: WeeklyCommitment | null,
  settings: AppSettings,
): WeeklyCommitmentInput {
  if (commitment) {
    return {
      deepWorkHoursGoal: commitment.deepWorkHoursGoal,
      codingProblemsGoal: commitment.codingProblemsGoal,
      learningMinutesGoal: commitment.learningMinutesGoal,
      workoutDaysGoal: commitment.workoutDaysGoal,
      fullPrayerDaysGoal: commitment.fullPrayerDaysGoal,
      primaryProjectId: commitment.primaryProjectId,
      commitmentNote: commitment.commitmentNote,
    };
  }

  return createDefaultWeeklyCommitment(settings);
}

export function WeeklyCommitmentCard({
  initialCommitment,
  initialProgress,
  settings,
  projects,
}: WeeklyCommitmentCardProps) {
  const router = useRouter();
  const [form, setForm] = useState<WeeklyCommitmentInput>(
    extractFormValue(initialCommitment, settings),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const defaultTargets = useMemo(
    () => createDefaultWeeklyCommitment(settings),
    [settings],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/weekly-commitment", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Unable to save the weekly standard.");
      setPending(false);
      return;
    }

    setSuccess("Weekly standard saved.");
    startTransition(() => {
      router.refresh();
    });
    setPending(false);
  }

  return (
    <form className="surface p-6" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">This Week&apos;s Standard</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Commit the numbers before the week drifts.
          </h3>
          <p className="mt-2 text-sm text-white/55">
            Every goal is paced Monday to Sunday. Falling behind turns the week off track.
          </p>
        </div>

        {initialProgress ? (
          <div
            className={cn(
              "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em]",
              initialProgress.status === "ON TRACK" ? "status-good" : "status-bad",
            )}
          >
            {initialProgress.status}
          </div>
        ) : (
          <div className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
            Not Set
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <label className="section-label" htmlFor="weekly-deep-work">
            Deep Work Hours
          </label>
          <input
            id="weekly-deep-work"
            type="number"
            min="0"
            max="168"
            step="0.5"
            value={form.deepWorkHoursGoal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                deepWorkHoursGoal: Number(event.target.value),
              }))
            }
            className="field"
          />
          <p className="text-xs text-white/40">Default: {defaultTargets.deepWorkHoursGoal} hrs</p>
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="weekly-coding">
            Coding Problems
          </label>
          <input
            id="weekly-coding"
            type="number"
            min="0"
            max="2000"
            value={form.codingProblemsGoal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                codingProblemsGoal: Number(event.target.value),
              }))
            }
            className="field"
          />
          <p className="text-xs text-white/40">Default: {defaultTargets.codingProblemsGoal}</p>
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="weekly-learning">
            Learning Minutes
          </label>
          <input
            id="weekly-learning"
            type="number"
            min="0"
            max="10080"
            value={form.learningMinutesGoal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                learningMinutesGoal: Number(event.target.value),
              }))
            }
            className="field"
          />
          <p className="text-xs text-white/40">Default: {defaultTargets.learningMinutesGoal} min</p>
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="weekly-workouts">
            Workout Days
          </label>
          <input
            id="weekly-workouts"
            type="number"
            min="0"
            max="7"
            value={form.workoutDaysGoal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                workoutDaysGoal: Number(event.target.value),
              }))
            }
            className="field"
          />
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="weekly-prayers">
            Full Prayer Days
          </label>
          <input
            id="weekly-prayers"
            type="number"
            min="0"
            max="7"
            value={form.fullPrayerDaysGoal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fullPrayerDaysGoal: Number(event.target.value),
              }))
            }
            className="field"
          />
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="weekly-project">
            Primary Project
          </label>
          <select
            id="weekly-project"
            value={form.primaryProjectId ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                primaryProjectId: event.target.value || null,
              }))
            }
            className="field"
          >
            <option value="">No project locked</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="section-label" htmlFor="weekly-note">
          Commitment Note
        </label>
        <textarea
          id="weekly-note"
          value={form.commitmentNote}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              commitmentNote: event.target.value,
            }))
          }
          rows={3}
          maxLength={200}
          className="field min-h-24 resize-none"
          placeholder="What matters most this week?"
        />
      </div>

      {initialProgress ? (
        <div className="mt-6 space-y-3">
          {initialProgress.metrics.map((metric) => (
            <div key={metric.key} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{metric.label}</p>
                <p className="font-mono text-sm text-white/50">
                  {metric.actual}/{metric.goal} {metric.unitLabel}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className={cn(
                    "h-full rounded-full",
                    metric.isOnTrack ? "bg-emerald-400" : "bg-rose-400",
                  )}
                  style={{
                    width: `${Math.min(
                      metric.goal > 0 ? (metric.actual / metric.goal) * 100 : 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
                <span>Expected so far: {metric.expectedSoFar}</span>
                <span>Remaining gap: {metric.remaining}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-end">
        <button type="submit" disabled={pending} className="action-button-primary">
          {pending ? "Saving..." : initialCommitment ? "Update Standard" : "Save Standard"}
        </button>
      </div>
    </form>
  );
}
