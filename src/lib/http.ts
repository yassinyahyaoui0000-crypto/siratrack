import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { error: string }> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid request body.",
    };
  }

  return { data: parsed.data };
}

export async function requireApiUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { supabase, user };
}
