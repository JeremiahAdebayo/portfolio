"use client";

import { useWorldStore } from "@/world/store";
import { PromptBar } from "./PromptBar";
import { PauseMenu } from "./PauseMenu";
import { TransitionOverlay } from "./TransitionOverlay";
import type { RoomDef } from "@/world/types";

export function Hud({ room }: { room: RoomDef }) {
  const prompt = useWorldStore((s) => s.prompt);
  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-4 font-mono">
      <div className="flex items-start justify-between">
        <div className="rounded border border-facility-border bg-facility-bg/80 px-3 py-2 text-xs tracking-widest">
          <span className="text-accent">AJ // RESEARCH FACILITY</span>
          <span className="mx-2 text-facility-muted">—</span>
          <span className="text-facility-text">{room.name}</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="rounded border border-facility-border bg-facility-bg/80 px-3 py-2 text-xs text-facility-muted">
          WASD MOVE · E INTERACT · ESC MENU
        </span>
      </div>
      {prompt && <PromptBar prompt={prompt} />}
      <PauseMenu />
      <TransitionOverlay />
    </div>
  );
}
