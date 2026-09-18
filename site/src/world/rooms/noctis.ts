import type { RoomDef } from "../types";
import { projects } from "@/content/projects";
import { noctisStations } from "../noctis/agents";

// See nightfall.ts: the frame's text and the repo link are content.
const project = projects.find((p) => p.slug === "noctis")!;

/**
 * The lab PlayDirector animates: eight desks, one per node of agent/graph.py,
 * laid out as two rows with the retry hop running back along the south one.
 * Every desk, role sign and interaction point below is generated from
 * `noctisStations`, so the room cannot drift from the pipeline the content layer
 * describes - and rooms.test.ts proves each station's tile is floor, that the
 * desks block exactly their own tile, and that every interaction stays reachable
 * from the spawn.
 *
 * The old central pedestal is gone: the room's screen is the ops monitor on the
 * north wall, whose plane PlayDirector owns because it repaints the texture.
 */
/** each desk blocks its own tile and nothing else */
const deskBlocks = noctisStations.map((s) => ({
  x: s.tile[0],
  z: s.tile[1],
  w: 1,
  d: 1,
}));

export const noctis: RoomDef = {
  id: "noctis",
  name: "NOCTIS — AGENT LAB",
  subtitle: "Autonomous multi-agent software engineering",
  palette: {
    floor: "#10261f",
    wall: "#356b59",
    accent: "#55b878",
    trim: "#d9f2e6",
    floorPattern: "dots",
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
    "D.................#",
    "D.................#",
    "D.................#",
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
    // the ops monitor's frame; PlayDirector draws its 4.4 x 1.2 screen here
    { type: "box", pos: [9, 1.15, 0.5], size: [4.8, 1.5, 0.14], color: "#0b0e14" },
    {
      type: "sign",
      pos: [0.45, 2.4, 6],
      size: [2.8, 0.55, 0.12],
      text: "← CORE HUB",
      face: "e",
    },
    // lintel behind the "CORE HUB" sign, closing the wall over the widened door
    { type: "box", pos: [0, 2.5, 6], size: [0.7, 1, 3], color: "#31423a" },
    // the two lanes the agents walk, so the path is legible before anyone moves
    { type: "box", pos: [9, 0.02, 4], size: [15, 0.02, 0.08], color: "#6b9c8a" },
    { type: "box", pos: [9, 0.02, 8], size: [15, 0.02, 0.08], color: "#6b9c8a" },
    // one desk and one role sign per station, both from the roster
    ...noctisStations.flatMap((s) => [
      {
        type: "box" as const,
        pos: [s.tile[0], 0.45, s.tile[1]] as [number, number, number],
        size: [1.8, 0.9, 1.2] as [number, number, number],
        color: "#31423a",
      },
      {
        type: "sign" as const,
        pos: [s.tile[0], 3.15, s.tile[1]] as [number, number, number],
        size: [2, 0.5, 0.12] as [number, number, number],
        text: s.role,
        face: "s" as const,
      },
    ]),
    // Wall "painting" on the east wall, opposite the doorway so it is the first
    // thing you see on the way in.
    {
      type: "frame",
      pos: [17.44, 1.9, 10],
      size: [3.6, 2.25, 0.14],
      text: project.room.frame.title,
      body: project.room.frame.body,
      face: "w",
    },
    {
      type: "plaque",
      pos: [17.44, 0.72, 10],
      size: [1.7, 0.32, 0.1],
      text: "OPEN GITHUB",
      face: "w",
    },
  ],
  blocked: [...deskBlocks],
  interactables: [
    {
      id: "nx-display",
      // beside the ops monitor rather than in the middle of the floor: the
      // pedestal that used to carry this prompt is gone, and a prompt with
      // nothing under it is the kind of lie this room avoids.
      pos: [9, 2],
      radius: 1.8,
      prompt: "VIEW AGENT SYSTEM",
      action: { type: "panel", panel: { kind: "project", slug: "noctis" } },
    },
    // one per desk, anchored to the tile the visitor stands on to use it
    ...noctisStations.map((s) => ({
      id: `nx-agent-${s.id}`,
      pos: s.approach,
      radius: 1.5,
      prompt: `WHAT DOES ${s.role} DO`,
      action: {
        type: "panel" as const,
        panel: { kind: "project" as const, slug: "noctis" },
      },
    })),
    {
      id: "nx-github",
      pos: [16, 10],
      radius: 1.6,
      prompt: "OPEN NOCTIS REPO",
      action: { type: "link", href: project.room.github.href },
    },
  ],
  doors: {
    "0,5": { targetRoom: "hub", spawn: { x: 17, z: 7 }, facing: "w" },
    "0,6": { targetRoom: "hub", spawn: { x: 17, z: 7 }, facing: "w" },
    "0,7": { targetRoom: "hub", spawn: { x: 17, z: 7 }, facing: "w" },
  },
};
