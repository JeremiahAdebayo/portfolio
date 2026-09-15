import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        {"// Research"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Research stations</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {site.research.map((r) => (
          <div
            key={r.title}
            className="rounded-lg border border-facility-border bg-facility-surface p-5"
          >
            <h2 className="font-mono text-sm font-bold tracking-widest text-accent">
              {r.title.toUpperCase()}
            </h2>
            <p className="mt-2 text-sm text-facility-muted">{r.summary}</p>
            {r.links.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3 font-mono text-xs">
                {r.links.map((l) => (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
