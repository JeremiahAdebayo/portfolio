"use client";

import dynamic from "next/dynamic";

// The gate itself is trivial DOM code; the heavy three.js chunk is lazied one
// level down (src/world/WorldGate.tsx) so a fallback visit never downloads it.
const WorldGate = dynamic(() => import("@/world/WorldGate"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-facility-bg" />
  ),
});

export default function WorldPage() {
  return <WorldGate />;
}
