import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-warn">
        {"// 404 — sector not found"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">
        This room does not exist
      </h1>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg"
      >
        [ RETURN TO LOBBY ]
      </Link>
    </div>
  );
}
