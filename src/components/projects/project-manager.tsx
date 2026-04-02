"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import type { Project } from "@/lib/types";

interface ProjectManagerProps {
  initialProjects: Project[];
}

interface ProjectDraft {
  name: string;
  progressPercent: number;
  isActive: boolean;
}

function createDraftMap(projects: Project[]) {
  return Object.fromEntries(
    projects.map((project) => [
      project.id,
      {
        name: project.name,
        progressPercent: project.progressPercent,
        isActive: project.isActive,
      },
    ]),
  ) as Record<string, ProjectDraft>;
}

export function ProjectManager({ initialProjects }: ProjectManagerProps) {
  const router = useRouter();
  const [newProjectName, setNewProjectName] = useState("");
  const [drafts, setDrafts] = useState<Record<string, ProjectDraft>>(
    createDraftMap(initialProjects),
  );
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(createDraftMap(initialProjects));
  }, [initialProjects]);

  function updateDraft(projectId: string, patch: Partial<ProjectDraft>) {
    setDrafts((current) => ({
      ...current,
      [projectId]: {
        ...current[projectId],
        ...patch,
      },
    }));
  }

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingCreate(true);
    setError(null);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newProjectName.trim(),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Unable to create the project.");
      setPendingCreate(false);
      return;
    }

    setNewProjectName("");
    startTransition(() => {
      router.refresh();
    });
    setPendingCreate(false);
  }

  async function handleSaveProject(projectId: string) {
    setPendingProjectId(projectId);
    setError(null);

    const draft = drafts[projectId];
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Unable to update the project.");
      setPendingProjectId(null);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    setPendingProjectId(null);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreateProject}
        className="surface flex flex-col gap-4 p-6 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <label className="section-label" htmlFor="project-name">
            New Project
          </label>
          <input
            id="project-name"
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
            className="field"
            placeholder="Operating systems revision app"
            minLength={2}
            maxLength={80}
            required
          />
        </div>

        <button type="submit" disabled={pendingCreate} className="action-button-primary">
          {pendingCreate ? "Adding..." : "Add Project"}
        </button>
      </form>

      {error ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">
        {initialProjects.length === 0 ? (
          <div className="surface p-6">
            <p className="text-sm text-white/55">
              No projects yet. Add the current thing that deserves steady work.
            </p>
          </div>
        ) : null}

        {initialProjects.map((project) => {
          const draft = drafts[project.id] ?? {
            name: project.name,
            progressPercent: project.progressPercent,
            isActive: project.isActive,
          };

          return (
            <div key={project.id} className="surface p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_220px_120px] lg:items-end">
                <div className="space-y-2">
                  <label className="section-label" htmlFor={`project-${project.id}`}>
                    Project Name
                  </label>
                  <input
                    id={`project-${project.id}`}
                    value={draft.name}
                    onChange={(event) =>
                      updateDraft(project.id, { name: event.target.value })
                    }
                    className="field"
                  />
                </div>

                <div className="space-y-2">
                  <label className="section-label" htmlFor={`progress-${project.id}`}>
                    Progress
                  </label>
                  <div className="space-y-3">
                    <input
                      id={`progress-${project.id}`}
                      type="range"
                      min="0"
                      max="100"
                      value={draft.progressPercent}
                      onChange={(event) =>
                        updateDraft(project.id, {
                          progressPercent: Number(event.target.value),
                        })
                      }
                      className="w-full accent-amber-400"
                    />
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-white">
                      {draft.progressPercent}%
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="checkbox-tile">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) =>
                        updateDraft(project.id, { isActive: event.target.checked })
                      }
                      className="size-4 rounded border-white/20 bg-transparent text-amber-400 focus:ring-amber-400/30"
                    />
                    Active
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSaveProject(project.id)}
                    disabled={pendingProjectId === project.id}
                    className="action-button-secondary w-full"
                  >
                    {pendingProjectId === project.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-amber-400 transition-[width]"
                  style={{ width: `${draft.progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
