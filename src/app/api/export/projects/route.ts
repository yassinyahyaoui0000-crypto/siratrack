import { buildCsv } from "@/lib/csv";
import { listProjectsForUser } from "@/lib/data/projects";
import { jsonError, requireApiUser } from "@/lib/http";

export async function GET() {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  try {
    const projects = await listProjectsForUser(session.supabase, session.user.id);
    const csv = buildCsv(
      projects.map((project) => ({
        id: project.id,
        name: project.name,
        progress_percent: project.progressPercent,
        is_active: project.isActive,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      })),
      ["id", "name", "progress_percent", "is_active", "created_at", "updated_at"],
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="siratrack-projects.csv"',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to export projects.";

    return jsonError(message, 400);
  }
}
