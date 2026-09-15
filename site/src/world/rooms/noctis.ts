import type { RoomDef } from "../types";

/**
 * Phase 2 shell. Task 4.5 replaces the props with the eight agent stations
 * described by Noctis's real graph.py, and the pedestal becomes the ops display.
 */
export const noctis: RoomDef = {
  id: "noctis",
  name: "NOCTIS — AGENT LAB",
  subtitle: "Autonomous multi-agent software engineering",
  palette: {
    floor: "#1f2b26",
    wall: "#31423a",
    accent: "#48bb78",
    trim: "#6b9c8a",
  },
  map: [
    // Row 0 is solid: the master plan's Task 2.1 map left the north edge open, so
    // the room had no north wall and the visitor could stand in the void. Caught by
    // the Task 1 room validator on its first run. The door is on the west (row 6).
    "###################",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "D.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "###################",
  ],
  spawn: { x: 1, z: 6, facing: "e" },
  props: [
    {
      type: "sign",
      pos: [9, 2.4, 0.45],
      size: [3.2, 0.8, 0.12],
      text: "NOCTIS",
      face: "s",
    },
    {
      type: "screen",
      pos: [9, 1.6, 0.55],
      size: [2.6, 1.4, 0.12],
      color: "#48bb78",
      face: "s",
    },
    {
      type: "sign",
      pos: [0.45, 2.4, 6],
      size: [2.8, 0.55, 0.12],
      text: "← CORE HUB",
      face: "e",
    },
    { type: "box", pos: [9, 0.5, 6], size: [1.6, 1, 1.6], color: "#31423a" },
  ],
  blocked: [{ x: 8, z: 5, w: 2, d: 2 }],
  interactables: [
    {
      id: "nx-display",
      pos: [9, 7],
      radius: 1.8,
      prompt: "VIEW AGENT SYSTEM",
      action: { type: "panel", panel: { kind: "project", slug: "noctis" } },
    },
  ],
  doors: {
    "0,6": { targetRoom: "hub", spawn: { x: 17, z: 7 }, facing: "w" },
  },
};
