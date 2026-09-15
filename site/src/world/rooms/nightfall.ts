import type { RoomDef } from "../types";
import { projects } from "@/content/projects";

// The frame and the GitHub plaque are content, not world data (AD-01): the same
// strings the /projects/nightfall page renders.
const project = projects.find((p) => p.slug === "nightfall")!;

/**
 * Phase 2 shell. Task 3.1 replaces these props with the full inspection line;
 * the map, palette and door are final, so nothing outside the room has to move.
 */
export const nightfall: RoomDef = {
  id: "nightfall",
  name: "NIGHTFALL — VISION LAB",
  subtitle: "Visual anomaly detection, end to end",
  palette: {
    floor: "#2e2a26",
    wall: "#4a4038",
    accent: "#f6ad55",
    trim: "#b08968",
  },
  map: [
    "###################",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#########D#########",
  ],
  spawn: { x: 9, z: 11, facing: "n" },
  props: [
    {
      type: "sign",
      pos: [9, 2.4, 0.45],
      size: [3.2, 0.8, 0.12],
      text: "NIGHTFALL",
      face: "s",
    },
    {
      type: "screen",
      pos: [9, 1.6, 0.55],
      size: [2.6, 1.4, 0.12],
      color: "#f6ad55",
      face: "s",
    },
    {
      type: "sign",
      pos: [9, 0.75, 12.55],
      size: [2.8, 0.55, 0.12],
      text: "← CORE HUB",
      face: "n",
    },
    { type: "box", pos: [4, 0.5, 9], size: [1, 1, 1], color: "#4a4038" },
    { type: "box", pos: [14, 0.5, 9], size: [1, 1, 1], color: "#4a4038" },
    // Wall "painting" on the west wall, readable from the room. 3.6 x 2.25 is
    // the 1024x640 canvas aspect, so the text is never stretched.
    {
      type: "frame",
      pos: [0.58, 1.9, 7],
      size: [3.6, 2.25, 0.14],
      text: project.room.frame.title,
      body: project.room.frame.body,
      face: "e",
    },
    {
      type: "plaque",
      pos: [0.63, 0.72, 7],
      size: [1.7, 0.32, 0.1],
      text: "OPEN GITHUB",
      face: "e",
    },
  ],
  blocked: [
    { x: 4, z: 9, w: 1, d: 1 },
    { x: 14, z: 9, w: 1, d: 1 },
  ],
  interactables: [
    {
      id: "nf-monitor",
      pos: [9, 2],
      radius: 1.8,
      prompt: "VIEW SYSTEM STATUS",
      action: { type: "panel", panel: { kind: "project", slug: "nightfall" } },
    },
    {
      id: "nf-terminal-l",
      pos: [4, 8],
      radius: 1.4,
      prompt: "TECHNICAL DETAILS",
      action: { type: "panel", panel: { kind: "project", slug: "nightfall" } },
    },
    {
      id: "nf-terminal-r",
      pos: [14, 8],
      radius: 1.4,
      prompt: "TECHNICAL DETAILS",
      action: { type: "panel", panel: { kind: "project", slug: "nightfall" } },
    },
    {
      id: "nf-github",
      pos: [2, 7],
      radius: 1.6,
      prompt: "OPEN NIGHTFALL REPO",
      action: { type: "link", href: project.room.github.href },
    },
  ],
  doors: {
    "9,12": { targetRoom: "hub", spawn: { x: 9, z: 1 }, facing: "s" },
  },
};
