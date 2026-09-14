import type { BlockedRect } from "./types";

export interface GridMap {
  width: number;
  depth: number;
  solid: Uint8Array; // index = z * width + x; 1 = blocked
}

export interface Vec2 {
  x: number;
  z: number;
}

const PLAYER_RADIUS = 0.3;

export function makeGridMap(
  rows: string[],
  blocked: BlockedRect[] = [],
): GridMap {
  const depth = rows.length;
  const width = rows[0]?.length ?? 0;
  if (rows.some((r) => r.length !== width)) {
    throw new Error(
      `map rows must be equal length (got ${rows.map((r) => r.length).join(", ")})`,
    );
  }
  const solid = new Uint8Array(width * depth);
  rows.forEach((row, z) => {
    row.split("").forEach((ch, x) => {
      if (ch === "#") solid[z * width + x] = 1;
    });
  });
  for (const b of blocked) {
    for (let z = b.z; z < b.z + b.d; z++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        if (x >= 0 && x < width && z >= 0 && z < depth) {
          solid[z * width + x] = 1;
        }
      }
    }
  }
  return { width, depth, solid };
}

export function tileCharAt(rows: string[], x: number, z: number): string {
  const row = rows[Math.round(z)];
  return row?.[Math.round(x)] ?? "#";
}

function isSolid(map: GridMap, x: number, z: number): boolean {
  const ix = Math.round(x);
  const iz = Math.round(z);
  if (ix < 0 || iz < 0 || ix >= map.width || iz >= map.depth) return true;
  return map.solid[iz * map.width + ix] === 1;
}

export function canStand(map: GridMap, x: number, z: number): boolean {
  const r = PLAYER_RADIUS;
  return (
    !isSolid(map, x - r, z - r) &&
    !isSolid(map, x + r, z - r) &&
    !isSolid(map, x - r, z + r) &&
    !isSolid(map, x + r, z + r)
  );
}

/** Per-axis movement — blocked axes are dropped, free axes slide (wall-slide). */
export function moveWithCollision(
  map: GridMap,
  from: Vec2,
  delta: Vec2,
): Vec2 {
  let { x, z } = from;
  if (delta.x !== 0 && canStand(map, x + delta.x, z)) x += delta.x;
  if (delta.z !== 0 && canStand(map, x, z + delta.z)) z += delta.z;
  return { x, z };
}
