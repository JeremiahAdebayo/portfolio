import type { Project } from "@/content/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        {`// ${title}`}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ProjectSections({ project }: { project: Project }) {
  return (
    <>
      <Section title="Overview">
        <p>{project.summary}</p>
      </Section>
      <Section title="Problem">
        <p>{project.problem}</p>
      </Section>
      <Section title="Approach">
        <p>{project.approach}</p>
      </Section>
      <Section title="Technologies">
        <ul className="flex flex-wrap gap-2">
          {project.technologies.map((t) => (
            <li
              key={t}
              className="rounded border border-facility-border px-2 py-1 font-mono text-xs"
            >
              {t}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Metrics">
        <dl className="grid gap-3 sm:grid-cols-3">
          {project.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-facility-border bg-facility-surface p-4"
            >
              <dt className="font-mono text-xs uppercase text-facility-muted">
                {m.label}
              </dt>
              <dd className="mt-1 font-mono text-lg text-accent">{m.value}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section title="Limitations">
        <p>{project.limitations}</p>
      </Section>
      <Section title="Links">
        <ul className="flex flex-wrap gap-3 font-mono text-sm">
          {project.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
