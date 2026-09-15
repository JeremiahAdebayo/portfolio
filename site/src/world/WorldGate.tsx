"use client";

import dynamic from "next/dynamic";
import { WorldFallback } from "@/components/hud/WorldFallback";

// Loaded through dynamic(..., { ssr: false }) from app/world/page.tsx, so this
// module ONLY ever evaluates in a browser. That is what makes reading window and
// creating a probe canvas during render safe: no server render, no hydration
// comparison, and no setState-in-effect dance to work around it.
const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function canUseFacility(): boolean {
  if (!hasWebGL()) return false;
  const forced = new URLSearchParams(window.location.search).get("force") === "1";
  // AD-04: coarse pointers get the standard pages unless they opt in.
  return forced || !window.matchMedia("(pointer: coarse)").matches;
}

export default function WorldGate() {
  return canUseFacility() ? <WorldCanvas /> : <WorldFallback />;
}
