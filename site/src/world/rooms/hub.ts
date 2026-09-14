import type { RoomDef } from "../types";

export const hub: RoomDef = {
  id: "hub",
  name: "CORE MAIN HUB",
  subtitle: "Welcome to the facility",
  palette: {
    floor: "#2a3242",
    wall: "#3b465c",
    accent: "#4fd1c5",
    trim: "#8b94a7",
  },
  map: [
    "#########D#########",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "D.................D",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#########D#########",
  ],
  spawn: { x: 9, z: 8, facing: "n" },
  props: [
    // central terminal (blocked tile 9,5)
    { type: "box", pos: [9, 0.4, 5], size: [1.4, 0.8, 1], color: "#3b465c" },
    {
      type: "screen",
      pos: [9, 1.15, 5.1],
      size: [1.1, 0.6, 0.12],
      color: "#4fd1c5",
      face: "s",
    },
    // door signs — readable from inside the room
    {
      type: "sign",
      pos: [9, 2.4, 0.45],
      size: [3.2, 0.8, 0.12],
      text: "VISION LAB",
      face: "s",
    },
    {
      type: "sign",
      pos: [17.55, 2.4, 7],
      size: [3.2, 0.8, 0.12],
      text: "AGENT LAB",
      face: "w",
    },
    {
      type: "sign",
      pos: [1.45, 2.4, 7],
      size: [3.2, 0.8, 0.12],
      text: "RESEARCH",
      face: "e",
    },
    {
      type: "sign",
      pos: [9, 2.4, 14.55],
      size: [3.2, 0.8, 0.12],
      text: "ABOUT",
      face: "n",
    },
    // corner pillars (blocked)
    { type: "box", pos: [4, 1.2, 3], size: [1, 2.4, 1], color: "#3b465c" },
    { type: "box", pos: [14, 1.2, 3], size: [1, 2.4, 1], color: "#3b465c" },
    { type: "box", pos: [4, 1.2, 11], size: [1, 2.4, 1], color: "#3b465c" },
    { type: "box", pos: [14, 1.2, 11], size: [1, 2.4, 1], color: "#3b465c" },
  ],
  blocked: [
    { x: 9, z: 5, w: 1, d: 1 }, // terminal
    { x: 4, z: 3, w: 1, d: 1 },
    { x: 14, z: 3, w: 1, d: 1 },
    { x: 4, z: 11, w: 1, d: 1 },
    { x: 14, z: 11, w: 1, d: 1 },
  ],
  interactables: [
    {
      id: "hub-terminal",
      pos: [9, 6],
      radius: 1.6,
      prompt: "ACCESS TERMINAL",
    },
    {
      id: "door-n",
      pos: [9, 1],
      radius: 1.6,
      prompt: "VISION LAB — UNDER CONSTRUCTION",
    },
    {
      id: "door-e",
      pos: [17, 7],
      radius: 1.6,
      prompt: "AGENT LAB — UNDER CONSTRUCTION",
    },
    {
      id: "door-w",
      pos: [1, 7],
      radius: 1.6,
      prompt: "RESEARCH — UNDER CONSTRUCTION",
    },
    {
      id: "door-s",
      pos: [9, 13],
      radius: 1.6,
      prompt: "ABOUT — UNDER CONSTRUCTION",
    },
  ],
  doors: {}, // wired in Phase 2+
};
