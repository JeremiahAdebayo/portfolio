import { describe, expect, it } from "vitest";
import { getMoveDir } from "./input";

describe("getMoveDir", () => {
  it("maps single keys to unit directions", () => {
    expect(getMoveDir(new Set(["KeyW"]))).toEqual({ x: 0, z: -1 });
    expect(getMoveDir(new Set(["ArrowDown"]))).toEqual({ x: 0, z: 1 });
    expect(getMoveDir(new Set(["KeyA"]))).toEqual({ x: -1, z: 0 });
    expect(getMoveDir(new Set(["ArrowRight"]))).toEqual({ x: 1, z: 0 });
  });

  it("normalizes diagonals", () => {
    const d = getMoveDir(new Set(["KeyW", "KeyD"]));
    expect(d.x).toBeCloseTo(Math.SQRT1_2);
    expect(d.z).toBeCloseTo(-Math.SQRT1_2);
  });

  it("returns zero for no movement keys", () => {
    expect(getMoveDir(new Set(["KeyE", "ShiftLeft"]))).toEqual({ x: 0, z: 0 });
  });
});
