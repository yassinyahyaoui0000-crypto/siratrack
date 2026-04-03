import { DEFAULT_APP_TIMEZONE } from "@/lib/constants";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  return null;
}

export function getSupabaseUrl() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  const value = getOptionalEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
  );

  if (!value) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    );
  }

  return value;
}

export function getSupabaseServiceRoleKey() {
  const value = getOptionalEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SECRET_API_KEY",
  );

  if (!value) {
    throw new Error(
      "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, or SUPABASE_SECRET_API_KEY",
    );
  }

  return value;
}

export function getOwnerEmail() {
  return requireEnv("OWNER_EMAIL").trim().toLowerCase();
}

export function getAppTimeZone() {
  const candidate = process.env.APP_TIMEZONE?.trim() || DEFAULT_APP_TIMEZONE;

  try {
    Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return DEFAULT_APP_TIMEZONE;
  }
}
