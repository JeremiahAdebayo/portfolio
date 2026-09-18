import { describe, expect, it } from "vitest";
import { rooms } from "./rooms";
import { canStand, makeGridMap } from "./collision";
import { noctisStations } from "./noctis/agents";
import { projects } from "@/content/projects";
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

  /**
   * "On floor" is not the same as "reachable". A prop that seals off a corner
   * of a room passes every other check here and still makes an interaction
   * impossible to trigger - which is what the Nightfall belt would have done if
   * its blocked rect had reached the walls on both sides. Flood fills the tiles
   * the player can actually stand on and asks whether each interaction is
   * within reach of one of them.
   */
  it("can reach every interactable on foot from the spawn", () => {
    const grid = makeGridMap(room.map, room.blocked);
    const start = { x: Math.round(room.spawn.x), z: Math.round(room.spawn.z) };
    const seen = new Set([`${start.x},${start.z}`]);
    const queue = [start];
    while (queue.length) {
      const { x, z } = queue.shift()!;
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const key = `${x + dx},${z + dz}`;
        if (seen.has(key) || !canStand(grid, x + dx, z + dz)) continue;
        seen.add(key);
        queue.push({ x: x + dx, z: z + dz });
      }
    }
    expect(seen.size, `${id}: spawn cannot reach any other tile`).toBeGreaterThan(1);
    for (const item of room.interactables) {
      const reachable = [...seen].some((key) => {
        const [x, z] = key.split(",").map(Number);
        return Math.hypot(x - item.pos[0], z - item.pos[1]) <= item.radius + 0.5;
      });
      expect(
        reachable,
        `${id}: "${item.id}" at ${item.pos.join(",")} is walled off from the spawn`,
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

/**
 * The animated rooms. Task 1 deliberately did not land these against an empty
 * roster (a suite with nothing in it proves nothing); they land here, with
 * Task 5, when there is a cast to assert on.
 */
describe("the noctis pipeline", () => {
  const noctis = rooms.noctis;
  const pipeline = projects.find((p) => p.slug === "noctis")!.room.pipeline ?? [];
  const grid = makeGridMap(noctis.map, noctis.blocked);

  it("names a real station for every step", () => {
    const roster = new Set(noctisStations.map((s) => s.id));
    expect(pipeline.length, "the pipeline is empty, so this proves nothing").toBeGreaterThan(0);
    for (const [i, step] of pipeline.entries()) {
      expect(roster.has(step.agent), `pipeline[${i}] names unknown agent "${step.agent}"`).toBe(
        true,
      );
    }
  });

  it("keeps the loop honest: the cycle contains a failing verdict", () => {
    // The retry edge is the point of a multi-agent system, so a cycle where
    // every step succeeds would be a sales video (see the plan's decision).
    expect(pipeline.some((s) => s.ok === false)).toBe(true);
  });

  it("gives every station its own desk tile on floor, blocked by that desk", () => {
    const seen = new Set<string>();
    for (const s of noctisStations) {
      const key = `${s.tile[0]},${s.tile[1]}`;
      expect(seen.has(key), `two stations share tile ${key}`).toBe(false);
      seen.add(key);
      expect(walkable(noctis, s.tile[0], s.tile[1]), `station ${s.id} is not on floor`).toBe(true);
      // the desk is what makes the tile unreachable: if this stops being true,
      // the visitor can walk through the furniture and the agent walks through it
      expect(canStand(grid, s.tile[0], s.tile[1]), `station ${s.id} desk does not block its tile`).toBe(
        false,
      );
    }
  });

  it("leaves a standable tile in front of every desk, and does not share it", () => {
    const seen = new Set<string>();
    for (const s of noctisStations) {
      const key = `${s.approach[0]},${s.approach[1]}`;
      expect(seen.has(key), `two stations share the approach tile ${key}`).toBe(false);
      seen.add(key);
      expect(
        canStand(grid, s.approach[0], s.approach[1]),
        `station ${s.id}'s approach tile ${key} is not standable`,
      ).toBe(true);
    }
  });

  it("anchors one interaction to each desk's own approach tile", () => {
    for (const s of noctisStations) {
      const item = noctis.interactables.find((i) => i.id === `nx-agent-${s.id}`);
      expect(item, `no interaction point for station ${s.id}`).toBeDefined();
      expect(item!.pos).toEqual(s.approach);
    }
  });
});
