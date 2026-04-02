import { ProjectManager } from "@/components/projects/project-manager";
import { listProjectsForUser } from "@/lib/data/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  const projects = await listProjectsForUser(supabase, user.id);

  return (
    <div className="space-y-6">
      <section className="surface p-6 sm:p-7">
        <p className="section-label">Projects</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
          Track only the builds that matter.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
          Keep the list small. Update progress honestly. Inactive work leaves the dashboard.
        </p>
      </section>

      <ProjectManager initialProjects={projects} />
    </div>
  );
}
