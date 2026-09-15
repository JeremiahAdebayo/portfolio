import { describe, expect, it } from "vitest";
import { rooms } from "./rooms";
import type { RoomDef } from "./types";

const LEGAL = new Set(["#", ".", "D"]);
const ids = Object.keys(rooms);

function charAt(room: RoomDef, x: number, z: number): string | undefined {
  return room.map[z]?.[x];
}

function walkable(room: RoomDef, x: number, z: number): boolean {
  const c = charAt(room, Math.floor(x), Math.floor(z));
  return c === "." || c === "D";
}

describe.each(ids)("room %s", (id) => {
  const room = rooms[id];
  const width = room.map[0].length;
  const depth = room.map.length;

  it("is registered under its own id", () => {
    expect(room.id).toBe(id);
  });

  it("has a rectangular map of legal tiles", () => {
    for (const row of room.map) {
      expect(row.length, `${id}: ragged row "${row}"`).toBe(width);
      for (const ch of row) {
        expect(LEGAL.has(ch), `${id}: illegal tile "${ch}"`).toBe(true);
      }
    }
  });

  it("is sealed: border is wall or door, interior is floor", () => {
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const border = x === 0 || z === 0 || x === width - 1 || z === depth - 1;
        const c = charAt(room, x, z)!;
        if (border) {
          expect(c === "#" || c === "D", `${id}: border tile ${x},${z} is "${c}"`).toBe(
            true,
          );
        } else {
          expect(c, `${id}: interior tile ${x},${z} must be "."`).toBe(".");
        }
      }
    }
  });

  it("spawns on a walkable tile", () => {
    expect(walkable(room, room.spawn.x, room.spawn.z), `${id}: spawn inside a wall`).toBe(
      true,
    );
  });

  it("points every door at a real room, onto a walkable tile", () => {
    for (const [key, door] of Object.entries(room.doors)) {
      const [x, z] = key.split(",").map(Number);
      expect(charAt(room, x, z), `${id}: door key ${key} is not a 'D' tile`).toBe("D");
      const target = rooms[door.targetRoom];
      expect(target, `${id}: door ${key} targets unknown room "${door.targetRoom}"`).toBeDefined();
      expect(
        walkable(target, door.spawn.x, door.spawn.z),
        `${id}: door ${key} lands in a wall in ${door.targetRoom}`,
      ).toBe(true);
    }
  });

  it("pairs each door with a return door beside the doorway it came from", () => {
    for (const [key, door] of Object.entries(room.doors)) {
      const [dx, dz] = key.split(",").map(Number);
      const target = rooms[door.targetRoom];
      const backs = Object.values(target.doors).filter((d) => d.targetRoom === id);
      expect(backs.length, `${id}: ${target.id} has no door back`).toBeGreaterThan(0);
      const min = Math.min(...backs.map((d) => Math.hypot(d.spawn.x - dx, d.spawn.z - dz)));
      expect(min, `${id}: return from ${target.id} drops you ${min} tiles away`).toBeLessThanOrEqual(
        2,
      );
    }
  });

  it("keeps interactables unique, on floor, and in range", () => {
    const seen = new Set<string>();
    for (const item of room.interactables) {
      expect(seen.has(item.id), `${id}: duplicate interactable "${item.id}"`).toBe(false);
      seen.add(item.id);
      expect(
        walkable(room, item.pos[0], item.pos[1]),
        `${id}: interactable "${item.id}" is not on floor`,
      ).toBe(true);
      expect(item.radius).toBeGreaterThan(0);
      expect(item.radius).toBeLessThanOrEqual(3);
      expect(item.prompt.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps blocked rects and props inside the room", () => {
    for (const b of room.blocked) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.z).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w - 1).toBeLessThan(width);
      expect(b.z + b.d - 1).toBeLessThan(depth);
    }
    for (const p of room.props) {
      expect(p.pos[0]).toBeGreaterThanOrEqual(0);
      expect(p.pos[0]).toBeLessThan(width);
      expect(p.pos[2]).toBeGreaterThanOrEqual(0);
      expect(p.pos[2]).toBeLessThan(depth);
      expect(
        p.size.every((s) => s > 0),
        `${id}: prop at ${p.pos.join(",")} has a non-positive size`,
      ).toBe(true);
    }
  });
});

describe("facility connectivity", () => {
  it("reaches every registered room from hub", () => {
    const seen = new Set(["hub"]);
    const queue = ["hub"];
    while (queue.length) {
      const room = rooms[queue.shift()!];
      for (const d of Object.values(room.doors)) {
        if (!seen.has(d.targetRoom)) {
          seen.add(d.targetRoom);
          queue.push(d.targetRoom);
        }
      }
    }
    expect([...seen].sort()).toEqual([...ids].sort());
  });
});
