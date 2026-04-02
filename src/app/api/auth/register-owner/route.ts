import { NextResponse } from "next/server";

import { createDefaultSettings } from "@/lib/data/settings";
import { getOwnerEmail } from "@/lib/env";
import { jsonError, parseJsonBody } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { authSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, authSchema);

  if ("error" in parsed) {
    return jsonError(parsed.error);
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (email !== getOwnerEmail()) {
    return jsonError("That email is not allowed to create the owner account.", 403);
  }

  const admin = createSupabaseAdminClient();
  const { data: existingUsersData, error: listError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

  if (listError) {
    return jsonError(listError.message, 500);
  }

  if (existingUsersData.users.length > 0) {
    return jsonError("The owner account already exists.", 409);
  }

  const { data: createdUserData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
    });

  if (createError || !createdUserData.user) {
    return jsonError(createError?.message ?? "Unable to create the owner account.");
  }

  const defaults = createDefaultSettings(createdUserData.user.id);
  const settingsPayload = {
    user_id: createdUserData.user.id,
    deep_work_target_hours: defaults.deepWorkTargetHours,
    coding_target_problems: defaults.codingTargetProblems,
    learning_target_minutes: defaults.learningTargetMinutes,
    require_project_work: defaults.requireProjectWork,
    require_workout: defaults.requireWorkout,
    require_all_prayers: defaults.requireAllPrayers,
  };
  const { error: settingsError } = await admin.from("app_settings").upsert(
    settingsPayload as never,
    { onConflict: "user_id" },
  );

  if (settingsError) {
    return jsonError(settingsError.message, 500);
  }

  return NextResponse.json({
    success: true,
    userId: createdUserData.user.id,
  });
}
