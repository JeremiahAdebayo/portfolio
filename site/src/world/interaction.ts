import type { InteractableDef } from "./types";

export function nearestInteractable(
  interactables: InteractableDef[],
  pos: { x: number; z: number },
): InteractableDef | null {
  let best: InteractableDef | null = null;
  let bestDist = Infinity;
  for (const it of interactables) {
    const d = Math.hypot(it.pos[0] - pos.x, it.pos[1] - pos.z);
    if (d <= it.radius && d < bestDist) {
      best = it;
      bestDist = d;
    }
  }
  return best;
}
