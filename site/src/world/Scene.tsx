"use client";

import { Floor } from "./Floor";
import { Walls } from "./Walls";
import { Props } from "./Props";
import { PlayerController } from "./PlayerController";
import { InteractionSystem } from "./InteractionSystem";
import type { RoomDef } from "./types";

export function Scene({ room }: { room: RoomDef }) {
  const width = room.map[0].length;
  const depth = room.map.length;
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={0.9}
        color={room.palette.trim}
      />
      <pointLight
        position={[(width - 1) / 2, 3, (depth - 1) / 2]}
        intensity={0.6}
        color={room.palette.accent}
        distance={20}
      />
      <Floor room={room} />
      <Walls room={room} />
      <Props room={room} />
      <PlayerController />
      <InteractionSystem room={room} />
    </>
  );
}
