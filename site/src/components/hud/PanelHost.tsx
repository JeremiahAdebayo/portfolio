"use client";

import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { ProjectSections } from "@/components/project/ProjectSections";
import { ProjectPanel } from "@/components/project/ProjectPanel";
import { useWorldStore } from "@/world/store";

/**
 * One renderer for every in-world panel, all of it reading src/content.
 * The "demo" kind stays null here: Phase 3 replaces it with the inspection
 * station (and, per the plan's animated-demo decision, nothing here ever calls
 * a live backend).
 */
export function PanelHost() {
  const panel = useWorldStore((s) => s.panel);
  const closePanel = useWorldStore((s) => s.closePanel);
  if (!panel) return null;

  if (panel.kind === "project") {
    const project = projects.find((p) => p.slug === panel.slug);
    if (!project) return null;
    return (
      <ProjectPanel
        title={`${project.name} — ${project.room.title}`}
        onClose={closePanel}
      >
        <ProjectSections project={project} />
      </ProjectPanel>
    );
  }

  if (panel.kind === "about") {
    return (
      <ProjectPanel title="About" onClose={closePanel}>
        <h3 className="mt-4 text-2xl font-semibold">{site.owner.name}</h3>
        <p className="mt-1 text-facility-muted">{site.owner.title}</p>
        <p className="mt-4">{site.owner.tagline}</p>
        <h4 className="mt-8 font-mono text-xs uppercase tracking-widest text-facility-muted">
          {`// Timeline`}
        </h4>
        <ul className="mt-3 space-y-3">
          {site.timeline.map((t) => (
            <li
              key={`${t.period}-${t.title}`}
              className="rounded-lg border border-facility-border bg-facility-bg p-3"
            >
              <p className="font-mono text-xs text-accent">{t.period}</p>
              <p className="mt-1 font-semibold">
                {t.title} · {t.org}
              </p>
              {t.note && (
                <p className="mt-1 text-sm text-facility-muted">{t.note}</p>
              )}
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
          {[
            { label: site.owner.email, href: `mailto:${site.owner.email}` },
            { label: "GitHub", href: site.owner.github },
            { label: "LinkedIn", href: site.owner.linkedin },
            { label: "X", href: site.owner.x },
          ].map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                target={c.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </ProjectPanel>
    );
  }

  if (panel.kind === "research") {
    return (
      <ProjectPanel title="Research Stations" onClose={closePanel}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {site.research.map((r) => (
            <div
              key={r.title}
              className="rounded-lg border border-facility-border bg-facility-bg p-4"
            >
              <p className="font-mono text-xs font-bold tracking-widest text-accent">
                {r.title.toUpperCase()}
              </p>
              <p className="mt-2 text-sm text-facility-muted">{r.summary}</p>
            </div>
          ))}
        </div>
      </ProjectPanel>
    );
  }

  return null; // demo panels: Phase 3
}
