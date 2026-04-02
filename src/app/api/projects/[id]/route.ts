import { NextResponse } from "next/server";

import { updateProjectForUser } from "@/lib/data/projects";
import { jsonError, parseJsonBody, requireApiUser } from "@/lib/http";
import { projectUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = await parseJsonBody(request, projectUpdateSchema);

  if ("error" in parsed) {
    return jsonError(parsed.error);
  }

  try {
    const { id } = await context.params;
    const project = await updateProjectForUser(
      session.supabase,
      session.user.id,
      id,
      parsed.data,
    );

    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the project.";

    return jsonError(message, 400);
  }
}
