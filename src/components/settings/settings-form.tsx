"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import type { AppSettings } from "@/lib/types";

interface SettingsFormProps {
  initialSettings: AppSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    deepWorkTargetHours: initialSettings.deepWorkTargetHours,
    codingTargetProblems: initialSettings.codingTargetProblems,
    learningTargetMinutes: initialSettings.learningTargetMinutes,
    requireProjectWork: initialSettings.requireProjectWork,
    requireWorkout: initialSettings.requireWorkout,
    requireAllPrayers: initialSettings.requireAllPrayers,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/settings", {
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
      setError(payload?.error ?? "Unable to save settings.");
      setPending(false);
      return;
    }

    setSuccess("Settings updated. Scores were recalculated using the new targets.");
    startTransition(() => {
      router.refresh();
    });
    setPending(false);
  }

  return (
    <form className="surface p-6 sm:p-7" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <p className="section-label">Targets</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Adjust the standard.
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-white/55">
          Targets affect live scores and recalculate saved days. The stricter the
          target, the harder the score is to earn.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="section-label" htmlFor="target-deep-work">
            Deep Work Hours
          </label>
          <input
            id="target-deep-work"
            type="number"
            min="0.5"
            max="16"
            step="0.5"
            value={form.deepWorkTargetHours}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                deepWorkTargetHours: Number(event.target.value),
              }))
            }
            className="field"
          />
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="target-coding">
            Coding Problems
          </label>
          <input
            id="target-coding"
            type="number"
            min="0"
            max="100"
            value={form.codingTargetProblems}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                codingTargetProblems: Number(event.target.value),
              }))
            }
            className="field"
          />
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="target-learning">
            Learning Minutes
          </label>
          <input
            id="target-learning"
            type="number"
            min="0"
            max="600"
            value={form.learningTargetMinutes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                learningTargetMinutes: Number(event.target.value),
              }))
            }
            className="field"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <label className="checkbox-tile">
          <input
            type="checkbox"
            checked={form.requireProjectWork}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                requireProjectWork: event.target.checked,
              }))
            }
            className="size-4 rounded border-white/20 bg-transparent text-amber-400 focus:ring-amber-400/30"
          />
          Require project work for full streak
        </label>

        <label className="checkbox-tile">
          <input
            type="checkbox"
            checked={form.requireWorkout}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                requireWorkout: event.target.checked,
              }))
            }
            className="size-4 rounded border-white/20 bg-transparent text-amber-400 focus:ring-amber-400/30"
          />
          Require workout for full streak
        </label>

        <label className="checkbox-tile">
          <input
            type="checkbox"
            checked={form.requireAllPrayers}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                requireAllPrayers: event.target.checked,
              }))
            }
            className="size-4 rounded border-white/20 bg-transparent text-amber-400 focus:ring-amber-400/30"
          />
          Require all prayers for full streak
        </label>
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

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="action-button-primary">
          {pending ? "Saving..." : "Save Targets"}
        </button>
        <a href="/api/export/daily-logs" className="action-button-secondary">
          Export Daily Logs CSV
        </a>
        <a href="/api/export/projects" className="action-button-secondary">
          Export Projects CSV
        </a>
      </div>
    </form>
  );
}
