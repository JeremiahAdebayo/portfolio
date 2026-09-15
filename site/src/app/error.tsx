"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-anomaly">
        {"// System fault"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Something went offline</h1>
      <p className="mt-2 text-facility-muted">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg"
      >
        [ RETRY ]
      </button>
    </div>
  );
}
