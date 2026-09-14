"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { WorldFallback } from "@/components/hud/WorldFallback";

const WorldCanvas = dynamic(() => import("@/world/WorldCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-facility-bg font-mono text-sm text-facility-muted">
      LOADING FACILITY...
    </div>
  ),
});

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function WorldPage() {
  const [status, setStatus] = useState<"checking" | "ok" | "fallback">(
    "checking",
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("force") === "1";
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!hasWebGL()) setStatus("fallback");
    else if (coarse && !forced) setStatus("fallback");
    else setStatus("ok");
  }, []);

  if (status === "checking") {
    return <div className="fixed inset-0 bg-facility-bg" />;
  }
  if (status === "fallback") {
    return <WorldFallback />;
  }
  return <WorldCanvas />;
}
