"use client";

import { Canvas } from "@react-three/fiber";
import { useWorldStore } from "./store";
import { rooms } from "./rooms";
import { Scene } from "./Scene";
import { Hud } from "@/components/hud/Hud";

export default function WorldCanvas() {
  const roomId = useWorldStore((s) => s.roomId);
  const room = rooms[roomId] ?? rooms.hub;

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
