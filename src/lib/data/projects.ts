import type { SupabaseClient } from "@supabase/supabase-js";

import type { Project, ProjectInput, ProjectUpdateInput } from "@/lib/types";

function fromProjectRow(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    progressPercent: Number(row.progress_percent),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listProjectsForUser(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => fromProjectRow(row));
}

export async function listActiveProjectsForUser(
  client: SupabaseClient,
  userId: string,
) {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => fromProjectRow(row));
}

export async function createProjectForUser(
  client: SupabaseClient,
  userId: string,
  input: ProjectInput,
) {
  const insertPayload = {
    user_id: userId,
    name: input.name.trim(),
    progress_percent: 0,
    is_active: true,
  };
  const { data, error } = await client
    .from("projects")
    .insert(insertPayload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return fromProjectRow(data);
}

export async function updateProjectForUser(
  client: SupabaseClient,
  userId: string,
  projectId: string,
  input: ProjectUpdateInput,
) {
  const payload: Record<string, unknown> = {};

  if (typeof input.name === "string") {
    payload.name = input.name.trim();
  }

  if (typeof input.progressPercent === "number") {
    payload.progress_percent = input.progressPercent;
  }

  if (typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  const { data, error } = await client
    .from("projects")
    .update(payload as never)
    .eq("id", projectId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return fromProjectRow(data);
}
