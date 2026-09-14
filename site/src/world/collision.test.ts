import { describe, expect, it } from "vitest";
import { canStand, makeGridMap, moveWithCollision } from "./collision";

const ROWS = ["#####", "#...#", "#...#", "#####"];

describe("collision", () => {
  it("builds a map and blocks wall tiles", () => {
    const map = makeGridMap(ROWS);
    expect(canStand(map, 2, 2)).toBe(true);
    expect(canStand(map, 0, 2)).toBe(false);
    expect(canStand(map, 2, 0)).toBe(false);
  });

  it("rejects ragged maps", () => {
    expect(() => makeGridMap(["###", "##"])).toThrow(/equal length/);
  });

  it("merges blocked rects (props) into the grid", () => {
    const map = makeGridMap(ROWS, [{ x: 1, z: 1, w: 1, d: 2 }]);
    expect(canStand(map, 1, 1)).toBe(false);
    expect(canStand(map, 1, 2)).toBe(false);
    expect(canStand(map, 2, 2)).toBe(true);
  });

  it("slides along a wall when only one axis is blocked", () => {
    const map = makeGridMap(ROWS);
    // x=0.8 is the standable edge (radius 0.3 + tile-centred rounding), so the -x
    // half of this delta is blocked and +z still moves: that is the wall-slide.
    const next = moveWithCollision(map, { x: 0.8, z: 1 }, { x: -0.5, z: 0.5 });
    expect(next.x).toBeCloseTo(0.8);
    expect(next.z).toBeCloseTo(1.5);
  });

  it("stops the player from squeezing into a wall corner", () => {
    const map = makeGridMap(["####", "#..#", "#..#", "####"]);
    let pos = { x: 1.6, z: 1.6 };
    for (let i = 0; i < 10; i++) {
      pos = moveWithCollision(map, pos, { x: -0.4, z: -0.4 });
    }
    expect(pos.x).toBeGreaterThanOrEqual(0.5);
    expect(pos.z).toBeGreaterThanOrEqual(0.5);
  });
});