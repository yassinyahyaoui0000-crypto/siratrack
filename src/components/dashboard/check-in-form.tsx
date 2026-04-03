"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { PRAYER_FIELDS } from "@/lib/constants";
import { calculateDailyXp } from "@/lib/progression";
import { calculateDailyScore } from "@/lib/scoring";
import type { AppSettings, DailyLog, DailyLogInput, DayRating } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DailyCheckInFormProps {
  initialLog: DailyLog;
  hasTodayLog: boolean;
  settings: AppSettings;
  focusDerivedHours: number;
}

function extractInput(log: DailyLog): DailyLogInput {
  return {
    deepWorkHours: log.deepWorkHours,
    codingProblemsSolved: log.codingProblemsSolved,
    projectWorkDone: log.projectWorkDone,
    projectNotes: log.projectNotes,
    learningMinutes: log.learningMinutes,
    workoutDone: log.workoutDone,
    fajrDone: log.fajrDone,
    dhuhrDone: log.dhuhrDone,
    asrDone: log.asrDone,
    maghribDone: log.maghribDone,
    ishaDone: log.ishaDone,
    reflection: log.reflection,
  };
}

function ratingClassName(rating: DayRating) {
  if (rating === "GOOD") {
    return "status-good";
  }

  if (rating === "AVERAGE") {
    return "status-average";
  }

  return "status-bad";
}

export function DailyCheckInForm({
  initialLog,
  hasTodayLog,
  settings,
  focusDerivedHours,
}: DailyCheckInFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DailyLogInput>(extractInput(initialLog));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasAppliedFocusSuggestion, setHasAppliedFocusSuggestion] = useState(false);

  const preview = calculateDailyScore(form, settings);
  const xpPreview = calculateDailyXp(
    {
      ...form,
      focusSessionsCompleted: initialLog.focusSessionsCompleted,
    },
    settings,
  );
  const focusMinutes = initialLog.focusSessionsCompleted * 25;
  const focusHoursLabel = Math.floor(focusMinutes / 60);
  const focusMinutesLabel = focusMinutes % 60;

  function setNumberField(
    key: "deepWorkHours" | "codingProblemsSolved" | "learningMinutes",
    value: string,
  ) {
    const parsed = value === "" ? 0 : Number(value);

    setForm((current) => ({
      ...current,
      [key]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  }

  function setBooleanField(key: keyof DailyLogInput, value: boolean) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/check-in", {
      method: hasTodayLog ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Unable to save today's log.");
      setPending(false);
      return;
    }

    setSuccess(`+${xpPreview.totalXpEarned} XP locked for today.`);
    startTransition(() => {
      router.refresh();
    });
    setPending(false);
  }

  return (
    <form className="surface p-6 sm:p-7" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label">Today&apos;s Check-In</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Log the day honestly.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Only today is editable. Missed days stay missed.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4">
            <p className="section-label">Live Score</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-white">
              {preview.score}
              <span className="text-lg text-white/35">/100</span>
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4">
            <p className="section-label">Live XP</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-white">
              {xpPreview.totalXpEarned}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">
              {xpPreview.baseXp} base + {xpPreview.fullCompletionBonusXp} clean + {xpPreview.focusBonusXp} focus
            </p>
          </div>
          <div
            className={cn(
              "rounded-[24px] px-5 py-4",
              ratingClassName(preview.rating),
            )}
          >
            <p className="section-label !text-current/70">Verdict</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {preview.rating}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <label className="section-label" htmlFor="deep-work-hours">
            Deep Work Hours
          </label>
          <input
            id="deep-work-hours"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={form.deepWorkHours}
            onChange={(event) => setNumberField("deepWorkHours", event.target.value)}
            className="field"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
            <span>
              Focus timer recorded {focusHoursLabel}h {focusMinutesLabel}m today
            </span>
            <button
              type="button"
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  deepWorkHours: focusDerivedHours,
                }));
                setHasAppliedFocusSuggestion(true);
              }}
              disabled={focusMinutes === 0}
              className="action-button-secondary !rounded-full !px-3 !py-1.5 !text-xs"
            >
              {hasAppliedFocusSuggestion ? "Applied" : "Use focus time"}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="coding-problems">
            Coding Problems
          </label>
          <input
            id="coding-problems"
            type="number"
            min="0"
            max="500"
            value={form.codingProblemsSolved}
            onChange={(event) =>
              setNumberField("codingProblemsSolved", event.target.value)
            }
            className="field"
          />
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="learning-minutes">
            Learning Minutes
          </label>
          <input
            id="learning-minutes"
            type="number"
            min="0"
            max="1440"
            value={form.learningMinutes}
            onChange={(event) => setNumberField("learningMinutes", event.target.value)}
            className="field"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <label className="checkbox-tile">
          <input
            type="checkbox"
            checked={form.projectWorkDone}
            onChange={(event) =>
              setBooleanField("projectWorkDone", event.target.checked)
            }
            className="size-4 rounded border-white/20 bg-transparent text-amber-400 focus:ring-amber-400/30"
          />
          Project work completed
        </label>

        <label className="checkbox-tile">
          <input
            type="checkbox"
            checked={form.workoutDone}
            onChange={(event) => setBooleanField("workoutDone", event.target.checked)}
            className="size-4 rounded border-white/20 bg-transparent text-amber-400 focus:ring-amber-400/30"
          />
          Workout completed
        </label>
      </div>

      <div className="mt-6 space-y-3">
        <p className="section-label">Prayers</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {PRAYER_FIELDS.map((prayer) => (
            <label key={prayer.key} className="checkbox-tile">
              <input
                type="checkbox"
                checked={form[prayer.key]}
                onChange={(event) =>
                  setBooleanField(prayer.key, event.target.checked)
                }
                className="size-4 rounded border-white/20 bg-transparent text-amber-400 focus:ring-amber-400/30"
              />
              {prayer.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <label className="section-label" htmlFor="project-notes">
            Project Notes
          </label>
          <textarea
            id="project-notes"
            value={form.projectNotes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                projectNotes: event.target.value,
              }))
            }
            rows={3}
            className="field min-h-28 resize-none"
            placeholder="What moved forward?"
            disabled={!form.projectWorkDone}
          />
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="reflection">
            Reflection
          </label>
          <textarea
            id="reflection"
            value={form.reflection}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reflection: event.target.value,
              }))
            }
            rows={3}
            className="field min-h-28 resize-none"
            placeholder="One honest sentence about the day."
          />
        </div>
      </div>

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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/45">
          Focus sessions tracked separately:{" "}
          <span className="font-mono text-white">
            {initialLog.focusSessionsCompleted}
          </span>
        </p>

        <button type="submit" disabled={pending} className="action-button-primary">
          <Save className="mr-2 size-4" />
          {pending ? "Saving..." : hasTodayLog ? "Update Today" : "Save Today"}
        </button>
      </div>
    </form>
  );
}
