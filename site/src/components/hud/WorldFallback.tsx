import Link from "next/link";

export function WorldFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-facility-bg px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-warn">
        // Facility requires WebGL and a precise pointer
      </p>
      <h1 className="text-3xl font-semibold">The standard facility is open</h1>
      <p className="max-w-md text-facility-muted">
        This device is set up for the classic interface. All projects,
        research, and contact channels are available there.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg"
        >
          [ STANDARD PORTFOLIO ]
        </Link>
        <Link
          href="/projects"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          Projects
        </Link>
        <Link
          href="/contact"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          Contact
        </Link>
      </div>
      <Link
        href="/world?force=1"
        className="font-mono text-xs text-facility-muted underline hover:text-accent"
      >
        try the 3D facility anyway
      </Link>
    </div>
  );
}
