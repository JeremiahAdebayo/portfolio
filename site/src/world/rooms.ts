import type { RoomDef } from "./types";
import { hub } from "./rooms/hub";

// ponytail: one import per room; switch to lazy loading if rooms exceed ~10
export const rooms: Record<string, RoomDef> = {
  hub,
};
