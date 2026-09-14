"use client";

import { useMemo } from "react";
import { makeSignTexture } from "./textures";
import type { PropDef, RoomDef } from "./types";

const FACING_ROT: Record<string, number> = {
  s: 0,
  n: Math.PI,
  e: Math.PI / 2,
  w: -Math.PI / 2,
};

export function Props({ room }: { room: RoomDef }) {
  return (
    <>
      {room.props.map((p, i) => (
        <Prop key={i} def={p} accent={room.palette.accent} />
      ))}
    </>
  );
}

function Prop({ def, accent }: { def: PropDef; accent: string }) {
  const signTexture = useMemo(
    () =>
      def.type === "sign" && def.text
        ? makeSignTexture(def.text, { accent })
        : null,
    [def.type, def.text, accent],
  );

  return (
    <mesh
      position={def.pos}
      rotation={[0, FACING_ROT[def.face ?? "s"], 0]}
    >
      <boxGeometry args={def.size} />
      {def.type === "sign" && signTexture ? (
        <meshBasicMaterial map={signTexture} />
      ) : (
        <meshLambertMaterial color={def.color ?? "#3b465c"} />
      )}
    </mesh>
  );
}
