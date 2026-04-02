"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();

    startTransition(() => {
      router.replace("/auth/login");
      router.refresh();
    });

    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="action-button-secondary"
    >
      <LogOut className="mr-2 size-4" />
      {pending ? "Leaving..." : "Sign Out"}
    </button>
  );
}
