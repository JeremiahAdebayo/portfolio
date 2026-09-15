import Link from "next/link";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { ProjectCard } from "@/components/site/ProjectCard";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-sm tracking-widest text-accent">
        {site.owner.name} {"// RESEARCH FACILITY"}
      </p>
      <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
        {site.owner.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-facility-muted">
        {site.owner.tagline}
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/world"
          className="rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
        >
          [ ENTER FACILITY ]
        </Link>
        <a
          href={site.owner.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          GitHub
        </a>
        <Link
          href="/resume"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          Resume
        </Link>
        <Link
          href="/contact"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          Contact
        </Link>
      </div>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-widest text-facility-muted">
          {"// Projects"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
