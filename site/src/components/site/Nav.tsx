import Link from "next/link";
import { site } from "@/content/site";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  return (
    <header className="border-b border-facility-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-widest text-facility-text"
        >
          {site.owner.name} <span className="text-accent">{"//"}</span> FACILITY
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm text-facility-muted">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-accent">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/world"
          className="ml-auto rounded-md border border-accent px-3 py-1.5 font-mono text-sm text-accent hover:bg-accent hover:text-facility-bg"
        >
          ENTER WORLD
        </Link>
      </div>
    </header>
  );
}
