import { SettingsForm } from "@/components/settings/settings-form";
import { getSettingsForUser } from "@/lib/data/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  const settings = await getSettingsForUser(supabase, user.id);

  return (
    <div className="space-y-6">
      <section className="surface p-6 sm:p-7">
        <p className="section-label">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
          Control the rules, not the excuses.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
          These settings define what counts as a serious day and what is required
          for a full streak.
        </p>
      </section>

      <SettingsForm
        key={settings.updatedAt ?? "settings"}
        initialSettings={settings}
      />
    </div>
  );
}
