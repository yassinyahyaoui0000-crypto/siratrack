import { DEFAULT_APP_TIMEZONE } from "@/lib/constants";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseUrl() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
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
