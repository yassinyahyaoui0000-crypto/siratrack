import { buildCsv } from "@/lib/csv";
import { listDailyLogsForUser } from "@/lib/data/daily-logs";
import { jsonError, requireApiUser } from "@/lib/http";

export async function GET() {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  try {
    const logs = await listDailyLogsForUser(session.supabase, session.user.id);
    const csv = buildCsv(
      logs.map((log) => ({
        log_date: log.logDate,
        deep_work_hours: log.deepWorkHours,
        coding_problems_solved: log.codingProblemsSolved,
        project_work_done: log.projectWorkDone,
        project_notes: log.projectNotes,
        learning_minutes: log.learningMinutes,
        workout_done: log.workoutDone,
        fajr_done: log.fajrDone,
        dhuhr_done: log.dhuhrDone,
        asr_done: log.asrDone,
        maghrib_done: log.maghribDone,
        isha_done: log.ishaDone,
        focus_sessions_completed: log.focusSessionsCompleted,
        reflection: log.reflection,
        miss_reason: log.missReason,
        miss_note: log.missNote,
        daily_score: log.dailyScore,
        day_rating: log.dayRating,
      })),
      [
        "log_date",
        "deep_work_hours",
        "coding_problems_solved",
        "project_work_done",
        "project_notes",
        "learning_minutes",
        "workout_done",
        "fajr_done",
        "dhuhr_done",
        "asr_done",
        "maghrib_done",
        "isha_done",
        "focus_sessions_completed",
        "reflection",
        "miss_reason",
        "miss_note",
        "daily_score",
        "day_rating",
      ],
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="siratrack-daily-logs.csv"',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to export daily logs.";

    return jsonError(message, 400);
  }
}
