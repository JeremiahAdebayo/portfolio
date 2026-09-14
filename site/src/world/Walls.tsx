"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RoomDef } from "./types";

const WALL_HEIGHT = 3;

export function Walls({ room }: { room: RoomDef }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const cells = useMemo(() => {
    const out: Array<[number, number]> = [];
    room.map.forEach((row, z) =>
      row.split("").forEach((ch, x) => {
        if (ch === "#") out.push([x, z]);
      }),
    );
    return out;
  }, [room]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    cells.forEach(([x, z], i) => {
      m.makeTranslation(x, WALL_HEIGHT / 2, z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cells]);

  return (
    <instancedMesh
      key={cells.length}
      ref={ref}
      args={[undefined, undefined, cells.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, WALL_HEIGHT, 1]} />
      <meshLambertMaterial color={room.palette.wall} />
    </instancedMesh>
  );
}
