"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useWorldStore } from "./store";
import { rooms } from "./rooms";
import { Scene } from "./Scene";
import { Hud } from "@/components/hud/Hud";

export default function WorldCanvas() {
  const roomId = useWorldStore((s) => s.roomId);
  const room = rooms[roomId] ?? rooms.hub;

  // Deep links: /world?room=nightfall starts in that lab. Mount-only on purpose
  // (a re-read per render would fight the door system), and a hub flash before
  // the swap is acceptable - no loading state for a one-frame swap.
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("room");
    if (!target || target === "hub") return;
    const deepLinked = rooms[target];
    if (!deepLinked) return;
    useWorldStore.getState().enterRoom(target, deepLinked.spawn);
  }, []);

  return (
    <div className="fixed inset-0 bg-facility-bg">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 45, near: 0.1, far: 100, position: [9, 10, 16] }}
      >
        <Scene key={roomId} room={room} />
      </Canvas>
      <Hud room={room} />
    </div>
  );
}
