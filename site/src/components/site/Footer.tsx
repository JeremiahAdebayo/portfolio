import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-facility-border">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-4 px-6 py-8 font-mono text-sm text-facility-muted">
        <span>
          © {new Date().getFullYear()} {site.owner.name}
        </span>
        <a href={`mailto:${site.owner.email}`} className="hover:text-accent">
          {site.owner.email}
        </a>
        <a
          href={site.owner.github}
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent"
        >
          GitHub
        </a>
        <a
          href={site.owner.linkedin}
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent"
        >
          LinkedIn
        </a>
        <a
          href={site.owner.x}
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent"
        >
          X
        </a>
        <span className="ml-auto">Next.js · three.js · React Three Fiber</span>
      </div>
    </footer>
  );
}
