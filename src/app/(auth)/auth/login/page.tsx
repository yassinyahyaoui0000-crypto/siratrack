import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="section-label">Log In</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Enter the dashboard.
        </h2>
        <p className="text-sm leading-6 text-white/60">
          This app is private and single-user. Only the owner account gets in.
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
