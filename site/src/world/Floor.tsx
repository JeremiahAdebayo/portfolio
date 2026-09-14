"use client";

import { useEffect, useMemo } from "react";
import { makeFloorTexture } from "./textures";
import type { RoomDef } from "./types";

export function Floor({ room }: { room: RoomDef }) {
  const texture = useMemo(
    () => makeFloorTexture(room.palette.floor, room.palette.wall),
    [room.palette.floor, room.palette.wall],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  const width = room.map[0].length;
  const depth = room.map.length;
  texture.repeat.set(width, depth);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[(width - 1) / 2, 0, (depth - 1) / 2]}
    >
      <planeGeometry args={[width, depth]} />
      <meshLambertMaterial map={texture} />
    </mesh>
  );
}
