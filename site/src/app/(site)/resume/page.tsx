import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Resume" };

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        {"// Resume"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Resume</h1>
      <p className="mt-4 text-facility-muted">
        Full CV with experience, education, and publications.
      </p>
      <a
        href={site.owner.resumeUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
      >
        [ DOWNLOAD PDF ]
      </a>
      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-facility-muted">
        {"// Quick history"}
      </h2>
      <ul className="mt-4 space-y-3">
        {site.timeline.map((t) => (
          <li key={`${t.period}-${t.title}`} className="font-mono text-sm">
            <span className="text-accent">{t.period}</span> — {t.title},{" "}
            {t.org}
          </li>
        ))}
      </ul>
    </div>
  );
}
