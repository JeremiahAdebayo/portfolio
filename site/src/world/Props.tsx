"use client";

import { useEffect, useMemo } from "react";
import {
  makeFrameTexture,
  makePlaqueTexture,
  makeSignTexture,
} from "./textures";
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
  // One canvas texture per text prop, and it is released when the prop leaves
  // the room. Room switches unmount these, so not disposing leaks a GPU texture
  // per sign per visit.
  const texture = useMemo(() => {
    if (!def.text) return null;
    if (def.type === "sign") return makeSignTexture(def.text, { accent });
    if (def.type === "frame" && def.body) {
      return makeFrameTexture(def.text, def.body, { accent });
    }
    if (def.type === "plaque") return makePlaqueTexture(def.text, { accent });
    return null;
  }, [def.type, def.text, def.body, accent]);

  useEffect(() => () => texture?.dispose(), [texture]);

  if (def.type === "frame" && !texture) {
    // A frame with no copy is a blank picture; show the plain panel instead of
    // a stretched canvas of nothing.
    return (
      <mesh position={def.pos} rotation={[0, FACING_ROT[def.face ?? "s"], 0]}>
        <boxGeometry args={def.size} />
        <meshLambertMaterial color={def.color ?? "#3b465c"} />
      </mesh>
    );
  }

  return (
    <mesh position={def.pos} rotation={[0, FACING_ROT[def.face ?? "s"], 0]}>
      <boxGeometry args={def.size} />
      {texture ? (
        <meshBasicMaterial map={texture} />
      ) : (
        <meshLambertMaterial color={def.color ?? "#3b465c"} />
      )}
    </mesh>
  );
}
