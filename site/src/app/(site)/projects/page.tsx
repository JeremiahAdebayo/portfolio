import type { Metadata } from "next";
import { projects } from "@/content/projects";
import { ProjectCard } from "@/components/site/ProjectCard";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        {"// Projects"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Things I built</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </div>
  );
}
