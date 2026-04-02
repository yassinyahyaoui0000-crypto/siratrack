import { NextResponse } from "next/server";

import { createProjectForUser } from "@/lib/data/projects";
import { jsonError, parseJsonBody, requireApiUser } from "@/lib/http";
import { projectCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requireApiUser();

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = await parseJsonBody(request, projectCreateSchema);

  if ("error" in parsed) {
    return jsonError(parsed.error);
  }

  try {
    const project = await createProjectForUser(
      session.supabase,
      session.user.id,
      parsed.data,
    );

    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the project.";

    return jsonError(message, 400);
  }
}
