import { describe, expect, it } from "vitest";
import { nearestInteractable } from "./interaction";
import type { InteractableDef } from "./types";

const its: InteractableDef[] = [
  { id: "a", pos: [2, 2], radius: 1.5, prompt: "A" },
  { id: "b", pos: [6, 6], radius: 2, prompt: "B" },
];

describe("nearestInteractable", () => {
  it("returns the closest interactable within radius", () => {
    expect(nearestInteractable(its, { x: 2, z: 3 })?.id).toBe("a");
    expect(nearestInteractable(its, { x: 7, z: 6 })?.id).toBe("b");
  });

  it("returns null when nothing is in range", () => {
    expect(nearestInteractable(its, { x: 4, z: 4 })).toBeNull();
  });
});
