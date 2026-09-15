import Link from "next/link";
import type { Project } from "@/content/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group rounded-lg border border-facility-border bg-facility-surface p-5 transition-colors hover:border-accent"
    >
      <p
        className="font-mono text-xs tracking-widest"
        style={{ color: project.room.accent }}
      >
        {project.room.title}
      </p>
      <h3 className="mt-2 text-xl font-semibold group-hover:text-accent">
        {project.name}
      </h3>
      <p className="mt-1 text-sm text-facility-muted">{project.tagline}</p>
      {project.demo && (
        <p className="mt-3 inline-block rounded border border-facility-border px-2 py-0.5 font-mono text-xs text-accent">
          INTERACTIVE DEMO
        </p>
      )}
    </Link>
  );
}
