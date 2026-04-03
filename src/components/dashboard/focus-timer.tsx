"use client";

import { Pause, Play, RotateCcw, SkipForward, TimerReset } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
} from "react";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const STORAGE_KEY = "siratrack-focus-timer-v1";

type TimerMode = "focus" | "break";

interface FocusTimerProps {
  initialCompletedSessions: number;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${mins}:${secs}`;
}

export function FocusTimer({ initialCompletedSessions }: FocusTimerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<TimerMode>("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState(
    initialCompletedSessions,
  );
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCompletedSessions(initialCompletedSessions);
  }, [initialCompletedSessions]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          mode?: TimerMode;
          remainingSeconds?: number;
          isRunning?: boolean;
          endAt?: number | null;
        };

        setMode(parsed.mode === "break" ? "break" : "focus");
        setRemainingSeconds(
          typeof parsed.remainingSeconds === "number"
            ? parsed.remainingSeconds
            : FOCUS_SECONDS,
        );
        setIsRunning(Boolean(parsed.isRunning));
        setEndAt(typeof parsed.endAt === "number" ? parsed.endAt : null);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode,
        remainingSeconds,
        isRunning,
        endAt,
      }),
    );
  }, [endAt, hydrated, isRunning, mode, remainingSeconds]);

  const handleTimerComplete = useEffectEvent(async (finishedMode: TimerMode) => {
    setError(null);

    if (finishedMode === "focus") {
      const response = await fetch("/api/focus-sessions", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; log?: { focusSessionsCompleted: number } }
        | null;

      if (response.ok) {
        setCompletedSessions(payload?.log?.focusSessionsCompleted ?? completedSessions + 1);
        startTransition(() => {
          router.refresh();
        });
      } else {
        setError(payload?.error ?? "Unable to record the completed focus session.");
      }

      setMode("break");
      setRemainingSeconds(BREAK_SECONDS);
      setIsRunning(false);
      setEndAt(null);
      return;
    }

    setMode("focus");
    setRemainingSeconds(FOCUS_SECONDS);
    setIsRunning(false);
    setEndAt(null);
  });

  useEffect(() => {
    if (!isRunning || !endAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

      if (secondsLeft <= 0) {
        setRemainingSeconds(0);
        setIsRunning(false);
        setEndAt(null);
        void handleTimerComplete(mode);
        return;
      }

      setRemainingSeconds(secondsLeft);
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [endAt, isRunning, mode]);

  function startTimer() {
    setError(null);
    setEndAt(Date.now() + remainingSeconds * 1000);
    setIsRunning(true);
  }

  function pauseTimer() {
    if (!endAt) {
      return;
    }

    const secondsLeft = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    setRemainingSeconds(secondsLeft);
    setEndAt(null);
    setIsRunning(false);
  }

  function resetTimer(nextMode: TimerMode = "focus") {
    setMode(nextMode);
    setRemainingSeconds(nextMode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
    setEndAt(null);
    setIsRunning(false);
    setError(null);
  }

  return (
    <div className="surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Focus Chain</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {mode === "focus" ? "25 Minute Focus Run" : "5 Minute Reset"}
          </h3>
          <p className="mt-2 text-sm text-white/55">
            Completed focus sessions today:{" "}
            <span className="font-mono text-white">{completedSessions}</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
            Each session adds +10 XP up to +60 per day
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/50">
          {isRunning ? "Running" : "Paused"}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="rounded-[28px] border border-white/10 bg-black/20 px-6 py-5">
          <p className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            {formatTime(remainingSeconds)}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/45">
            <TimerReset className="size-4" />
            Chain state survives refreshes on this device.
          </p>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={isRunning ? pauseTimer : startTimer}
            className="action-button-primary w-full"
          >
            {isRunning ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
            {isRunning ? "Pause" : "Start"}
          </button>

          <button
            type="button"
            onClick={() => resetTimer(mode)}
            className="action-button-secondary w-full"
          >
            <RotateCcw className="mr-2 size-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={() => resetTimer("focus")}
            className="action-button-secondary w-full"
          >
            <SkipForward className="mr-2 size-4" />
            Focus Mode
          </button>

          <button
            type="button"
            onClick={() => resetTimer("break")}
            className="action-button-secondary w-full"
          >
            <SkipForward className="mr-2 size-4" />
            Break Mode
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
