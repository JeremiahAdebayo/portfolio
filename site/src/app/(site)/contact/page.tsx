import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Contact" };

const emailHref =
  "mailto:jrmhadebayo@gmail.com?subject=Portfolio%20contact&body=Hi%20AJ%2C%0A%0A";

export default function ContactPage() {
  // Cards carry the channel NAME only, never the URL (AJ, 2026-09-15): the href
  // is the link, repeating it as visible text is noise. Nothing here is typed
  // again from content either way - the old hardcoded "github.com/EDIT-ME" was a
  // second source of truth and went stale the moment the real handle landed.
  const channels = [
    { label: "Email", href: emailHref },
    { label: "GitHub", href: site.owner.github },
    { label: "LinkedIn", href: site.owner.linkedin },
    { label: "X", href: site.owner.x },
  ];
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        {"// Contact"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Open a channel</h1>
      <p className="mt-4 text-facility-muted">
        Email is fastest. No forms, no friction.
      </p>
      <a
        href={emailHref}
        aria-label="Send email to AJ"
        className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
      >
        [ SEND EMAIL ]
      </a>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            className="group rounded-lg border border-facility-border bg-facility-surface p-4 hover:border-accent"
          >
            <p className="font-mono text-sm font-bold tracking-widest text-facility-text group-hover:text-accent">
              {c.label.toUpperCase()}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
