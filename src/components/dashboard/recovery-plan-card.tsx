"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { RECOVERY_REASON_OPTIONS } from "@/lib/constants";
import type { ActiveRecoveryPlan, RecoveryPlanMissReason } from "@/lib/types";

interface RecoveryPlanCardProps {
  plan: ActiveRecoveryPlan;
}

export function RecoveryPlanCard({ plan }: RecoveryPlanCardProps) {
  const router = useRouter();
  const [missReason, setMissReason] = useState<RecoveryPlanMissReason | "">(
    plan.missReason ?? "",
  );
  const [correctiveAction, setCorrectiveAction] = useState(plan.correctiveAction);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(
      plan.id ? `/api/recovery-plan/${plan.id}` : "/api/recovery-plan",
      {
        method: plan.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          plan.id
            ? {
                missReason,
                correctiveAction,
              }
            : {
                triggerDate: plan.triggerDate,
                targetDate: plan.targetDate,
                missReason,
                correctiveAction,
              },
        ),
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Unable to save the recovery plan.");
      setPending(false);
      return;
    }

    setSuccess("Recovery response recorded.");
    startTransition(() => {
      router.refresh();
    });
    setPending(false);
  }

  return (
    <form
      className="rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-6"
      onSubmit={handleSubmit}
    >
      <p className="section-label !text-rose-200/70">Recovery Protocol</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
        You broke the standard on {plan.triggerDate}.
      </h3>
      <p className="mt-2 text-sm leading-6 text-rose-100/80">
        Name the reason. Define the correction. Do not move on without a response.
      </p>

      <div className="mt-5 grid gap-4">
        <div className="space-y-2">
          <label className="section-label" htmlFor="recovery-reason">
            Miss Reason
          </label>
          <select
            id="recovery-reason"
            value={missReason}
            onChange={(event) => setMissReason(event.target.value as RecoveryPlanMissReason)}
            className="field"
          >
            <option value="">Choose the failure mode</option>
            {RECOVERY_REASON_OPTIONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="section-label" htmlFor="recovery-action">
            Corrective Action
          </label>
          <textarea
            id="recovery-action"
            value={correctiveAction}
            onChange={(event) => setCorrectiveAction(event.target.value)}
            rows={3}
            maxLength={200}
            className="field min-h-24 resize-none"
            placeholder="What changes tomorrow so this failure does not repeat?"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl border border-rose-300/20 bg-black/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-rose-100/55">
          Target day: {plan.targetDate}
        </p>
        <button
          type="submit"
          disabled={pending || !missReason || correctiveAction.trim().length < 3}
          className="action-button-primary"
        >
          {pending ? "Saving..." : plan.id ? "Update Response" : "Save Corrective Action"}
        </button>
      </div>
    </form>
  );
}
