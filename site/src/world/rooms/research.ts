import { site } from "@/content/site";
import type { RoomDef } from "../types";

const stationTiles: Array<[number, number]> = [
  [4, 3],
  [10, 3],
  [4, 8],
];

export const research: RoomDef = {
  id: "research",
  name: "RESEARCH LAB",
  subtitle: "What I am reading, building and measuring",
  palette: { floor: "#171d32", wall: "#465a96", accent: "#8aa7ff", trim: "#f0f4ff", floorPattern: "crosshatch" },
  map: [
    "###############",
    "#.............#",
    "#.............#",
    "#.............#",
    "#.............#",
    "#.............D",
    "#.............#",
    "#.............#",
    "#.............#",
    "#.............#",
    "###############",
  ],
  spawn: { x: 13, z: 5, facing: "w" },
  props: [
    { type: "box", pos: [7, 1.8, 0.5], size: [5.2, 2.6, 0.14], color: "#0b0e14" },
    { type: "screen", pos: [7, 1.8, 0.6], size: [4.6, 2.1, 0.06], color: "#7f9cf5", face: "s" },
    { type: "sign", pos: [7, 3.1, 0.5], size: [3.6, 0.5, 0.12], text: "RESEARCH STATIONS", face: "s" },
    { type: "sign", pos: [0.45, 2.4, 5], size: [2.6, 0.6, 0.12], text: "← CORE HUB", face: "e" },
    ...stationTiles.flatMap(([x, z], index) => [
      { type: "box" as const, pos: [x, 0.45, z] as [number, number, number], size: [1.8, 0.9, 1.2] as [number, number, number], color: "#38414e" },
      { type: "screen" as const, pos: [x, 1.2, z - 0.4] as [number, number, number], size: [1.2, 0.7, 0.1] as [number, number, number], color: "#7f9cf5", face: "s" as const },
      { type: "sign" as const, pos: [x, 2.3, z] as [number, number, number], size: [2.8, 0.55, 0.12] as [number, number, number], text: site.research[index].title.toUpperCase(), face: "s" as const },
    ]),
    { type: "crate", pos: [1.6, 0.4, 9.4], size: [0.8, 0.8, 0.8], color: "#38414e" },
    { type: "crate", pos: [12.4, 0.4, 1.6], size: [0.8, 0.8, 0.8], color: "#38414e" },
  ],
  blocked: stationTiles.map(([x, z]) => ({ x, z, w: 1, d: 1 })),
  interactables: [
    ...stationTiles.map(([x, z], index) => ({
      id: `rs-${index}`,
      pos: [x, z + 1] as [number, number],
      radius: 1.5,
      prompt: `READ ${site.research[index].title.toUpperCase()}`,
      action: { type: "panel" as const, panel: { kind: "research" as const } },
    })),
    { id: "rs-board", pos: [7, 2], radius: 1.6, prompt: "RESEARCH OVERVIEW", action: { type: "panel", panel: { kind: "research" } } },
  ],
  doors: { "14,5": { targetRoom: "hub", spawn: { x: 1, z: 7 }, facing: "e" } },
};