import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        {"// About"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{site.owner.name}</h1>
      <p className="mt-1 text-facility-muted">{site.owner.title}</p>
      <p className="mt-6">{site.owner.tagline}</p>
      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-facility-muted">
        {"// Timeline"}
      </h2>
      <ul className="mt-4 space-y-4">
        {site.timeline.map((t) => (
          <li
            key={`${t.period}-${t.title}`}
            className="rounded-lg border border-facility-border bg-facility-surface p-4"
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
    </div>
  );
}
