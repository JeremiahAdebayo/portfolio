"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { playerPos, useWorldStore } from "./store";
import { nearestInteractable } from "./interaction";
import type { RoomDef } from "./types";

const CHECK_INTERVAL = 0.1; // seconds

export function InteractionSystem({ room }: { room: RoomDef }) {
  const acc = useRef(0);

  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < CHECK_INTERVAL) return;
    acc.current = 0;

    const store = useWorldStore.getState();
    if (store.paused || store.panel) {
      if (store.prompt !== null) store.setPrompt(null, null);
      return;
    }

    const nearest = nearestInteractable(room.interactables, playerPos);
    const prompt = nearest?.prompt ?? null;
    if (prompt !== store.prompt) {
      store.setPrompt(prompt, nearest?.action ?? null);
    }
  });

  return null;
}
