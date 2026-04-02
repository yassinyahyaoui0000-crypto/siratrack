import Link from "next/link";
import { redirect } from "next/navigation";

import { AppNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="space-y-1">
              <p className="section-label">SiraTrack</p>
              <p className="text-xl font-semibold tracking-tight text-white">
                Discipline Dashboard
              </p>
            </Link>

            <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55 lg:block">
              {user.email}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AppNav />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
