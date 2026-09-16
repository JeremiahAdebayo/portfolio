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
  // Doorways are three tiles wide. One tile read as too small to walk through,
  // and three is the width that lands centred on the room (the hub's midline is
  // the odd tile x=9) - which is also exactly what the door signs cap.
  map: [
    "########DDD########",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "D.................D",
    "D.................D",
    "D.................D",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "########DDD########",
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
    // Lintels: without a header the widened opening looks like missing wall
    // rather than a door. Sits behind the door sign, which is the visible cap.
    { type: "box", pos: [9, 2.5, 0], size: [3, 1, 0.7], color: "#3b465c" },
    { type: "box", pos: [9, 2.5, 14], size: [3, 1, 0.7], color: "#3b465c" },
    { type: "box", pos: [0, 2.5, 7], size: [0.7, 1, 3], color: "#3b465c" },
    { type: "box", pos: [18, 2.5, 7], size: [0.7, 1, 3], color: "#3b465c" },
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
      action: { type: "panel", panel: { kind: "about" } },
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
  doors: {
    // Every tile of an opening is a door: whichever one you step on, you leave.
    "8,0": { targetRoom: "nightfall", spawn: { x: 9, z: 11 }, facing: "n" },
    "9,0": { targetRoom: "nightfall", spawn: { x: 9, z: 11 }, facing: "n" },
    "10,0": { targetRoom: "nightfall", spawn: { x: 9, z: 11 }, facing: "n" },
    "18,6": { targetRoom: "noctis", spawn: { x: 1, z: 6 }, facing: "e" },
    "18,7": { targetRoom: "noctis", spawn: { x: 1, z: 6 }, facing: "e" },
    "18,8": { targetRoom: "noctis", spawn: { x: 1, z: 6 }, facing: "e" },
  },
};
