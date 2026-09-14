"use client";

import { useWorldStore } from "@/world/store";

export function TransitionOverlay() {
  const transition = useWorldStore((s) => s.transition);
  return (
    <div
      className="absolute inset-0 bg-facility-bg transition-opacity duration-200"
      style={{ opacity: transition }}
    />
  );
}
