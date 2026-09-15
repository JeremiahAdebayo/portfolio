import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  // The display text is derived from the URL, never typed again beside it: the
  // old hardcoded "github.com/EDIT-ME" duplicated content outside src/content
  // (AD-01) and went stale the moment the real handle landed.
  const short = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  const channels = [
    { label: "Email", href: `mailto:${site.owner.email}`, value: site.owner.email },
    { label: "GitHub", href: site.owner.github, value: short(site.owner.github) },
    { label: "LinkedIn", href: site.owner.linkedin, value: short(site.owner.linkedin) },
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
        href={`mailto:${site.owner.email}`}
        className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
      >
        [ SEND EMAIL ]
      </a>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.label === "Email" ? undefined : "_blank"}
            rel="noreferrer"
            className="rounded-lg border border-facility-border bg-facility-surface p-4 hover:border-accent"
          >
            <p className="font-mono text-xs uppercase text-facility-muted">
              {c.label}
            </p>
            <p className="mt-1 truncate font-mono text-sm text-accent">
              {c.value}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
