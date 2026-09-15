"use client";

import Link from "next/link";
import { useWorldStore } from "@/world/store";

export function PauseMenu() {
  const paused = useWorldStore((s) => s.paused);
  const setPaused = useWorldStore((s) => s.setPaused);
  if (!paused) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-facility-bg/80">
      <div className="w-80 rounded-lg border border-facility-border bg-facility-surface p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
          {"// Paused"}
        </p>
        <button
          onClick={() => setPaused(false)}
          className="mt-4 w-full rounded-md bg-accent px-4 py-2.5 font-mono text-sm font-bold text-facility-bg"
        >
          [ RESUME ]
        </button>
        <div className="mt-3 space-y-2 font-mono text-sm">
          <Link
            href="/"
            className="block rounded-md border border-facility-border px-4 py-2 hover:border-accent"
          >
            Standard portfolio
          </Link>
          <Link
            href="/projects"
            className="block rounded-md border border-facility-border px-4 py-2 hover:border-accent"
          >
            Projects
          </Link>
          <Link
            href="/contact"
            className="block rounded-md border border-facility-border px-4 py-2 hover:border-accent"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
