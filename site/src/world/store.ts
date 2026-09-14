import { create } from "zustand";
import type { Action, PanelTarget } from "./types";

/**
 * AD-12: player position NEVER lives here. `playerPos` is a plain mutable
 * object the PlayerController writes each frame and the InteractionSystem
 * reads - no React re-renders at 60 Hz.
 */
export const playerPos = { x: 9, z: 8 };

interface WorldState {
  roomId: string;
  spawn: { x: number; z: number };
  prompt: string | null;
  action: Action | null;
  panel: PanelTarget | null;
  paused: boolean;
  /** 0 = clear, 1 = fully black (door transitions) */
  transition: number;
  enterRoom: (roomId: string, spawn: { x: number; z: number }) => void;
  setPrompt: (prompt: string | null, action: Action | null) => void;
  openPanel: (panel: PanelTarget) => void;
  closePanel: () => void;
  setPaused: (paused: boolean) => void;
  setTransition: (v: number) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  roomId: "hub",
  spawn: { x: 9, z: 8 }, // keep in sync with rooms/hub.ts spawn
  prompt: null,
  action: null,
  panel: null,
  paused: false,
  transition: 0,
  enterRoom: (roomId, spawn) =>
    set({ roomId, spawn, prompt: null, action: null }),
  setPrompt: (prompt, action) => set({ prompt, action }),
  openPanel: (panel) => set({ panel, paused: false }),
  closePanel: () => set({ panel: null }),
  setPaused: (paused) => set({ paused }),
  setTransition: (transition) => set({ transition }),
}));
