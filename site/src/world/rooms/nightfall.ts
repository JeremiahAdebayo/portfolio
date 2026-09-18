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
    floor: "#241b18",
    wall: "#76513d",
    accent: "#f28e2b",
    trim: "#f7d488",
    floorPattern: "stripes",
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
    "########DDD########",
  ],
  spawn: { x: 9, z: 11, facing: "n" },
  props: [
    {
      type: "sign",
      pos: [9, 2.58, 0.45],
      size: [3.2, 0.8, 0.12],
      text: "NIGHTFALL",
      face: "s",
    },
    {
      type: "frame",
      pos: [0.58, 1.9, 7],
      size: [3.6, 2.25, 0.14],
      text: project.room.frame.title,
      body: project.room.frame.body,
      face: "e",
    },
    {
      type: "sign",
      pos: [9, 2.4, 11.42],
      size: [2.8, 0.55, 0.12],
      text: "← CORE HUB",
      face: "n",
    },
    { type: "box", pos: [4, 0.5, 9], size: [1, 1, 1], color: "#4a4038" },
    { type: "box", pos: [14, 0.5, 9], size: [1, 1, 1], color: "#4a4038" },
    // The inspection line, east-west along z=4. The rails sit on the deck's
    // edges and the gantry straddles the belt, so the conveyor, the head and
    // the chute all agree about where the belt is. BeltDirector drives what
    // moves over it; this is the static half.
    { type: "box", pos: [9, 0.28, 4], size: [13, 0.1, 1.2], color: "#3a332c" },
    { type: "box", pos: [9, 0.34, 3.4], size: [13, 0.14, 0.12], color: "#b08968" },
    { type: "box", pos: [9, 0.34, 4.6], size: [13, 0.14, 0.12], color: "#b08968" },
    { type: "box", pos: [9, 1.2, 3.3], size: [0.2, 2.4, 0.2], color: "#4a4038" },
    { type: "box", pos: [9, 2.2, 4], size: [0.5, 0.4, 0.5], color: "#2e2a26" },
    {
      type: "screen",
      pos: [9, 2.2, 4.28],
      size: [0.2, 0.2, 0.06],
      color: "#f6ad55",
      face: "s",
    },
    { type: "box", pos: [16.2, 0.9, 4], size: [0.9, 1.8, 1.4], color: "#4a4038" },
    // The display mast at the head of the line: BeltDirector hangs each card on
    // it, in the blocked belt row so nobody can walk through the card.
    { type: "box", pos: [5, 1.5, 3.5], size: [0.16, 2.4, 0.16], color: "#b08968" },
    // lintel behind the "CORE HUB" sign, closing the wall over the widened door
    { type: "box", pos: [9, 2.5, 12], size: [3, 1, 0.7], color: "#4a4038" },
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
    // The line itself, plus the gantry post and the chute mouth. x=1..2 and
    // x=17 stay open at z=4, so the room is still walkable north to south on
    // either side of the belt.
    { x: 3, z: 4, w: 14, d: 1 },
    { x: 9, z: 3, w: 1, d: 1 },
    { x: 16, z: 4, w: 1, d: 1 },
  ],
  interactables: [
    {
      id: "nf-monitor",
      pos: [2, 7],
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
      pos: [9, 2],
      radius: 1.6,
      prompt: "OPEN NIGHTFALL REPO",
      action: { type: "link", href: project.room.github.href },
    },
  ],
  doors: {
    "8,12": { targetRoom: "hub", spawn: { x: 9, z: 1 }, facing: "s" },
    "9,12": { targetRoom: "hub", spawn: { x: 9, z: 1 }, facing: "s" },
    "10,12": { targetRoom: "hub", spawn: { x: 9, z: 1 }, facing: "s" },
  },
};
