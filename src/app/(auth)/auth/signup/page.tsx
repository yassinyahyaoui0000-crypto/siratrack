import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function SignupPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="section-label">Owner Setup</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Create the only account.
        </h2>
        <p className="text-sm leading-6 text-white/60">
          Signup is locked to the configured owner email and works once.
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
