import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/content/projects";
import { ProjectSections } from "@/components/project/ProjectSections";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  return {
    title: project ? project.name : "Project",
    description: project?.tagline,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: project.room.accent }}
      >
        {project.room.title} — {project.room.subtitle}
      </p>
      <h1 className="mt-2 text-4xl font-semibold">{project.name}</h1>
      <p className="mt-2 text-lg text-facility-muted">{project.tagline}</p>
      {project.demo && (
        <Link
          href={`/world?room=${project.slug}`}
          className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
        >
          [ ENTER THE LAB ]
        </Link>
      )}
      <div className="mt-6">
        <ProjectSections project={project} />
      </div>
    </article>
  );
}
