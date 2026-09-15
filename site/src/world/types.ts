export type Facing = "n" | "s" | "e" | "w";

export interface RoomPalette {
  floor: string;
  wall: string;
  accent: string;
  trim: string;
}

export type PropType =
  | "box"
  | "sign"
  | "screen"
  | "terminal"
  | "crate"
  | "conveyor"
  | "cameraGantry"
  /** wall "painting": a framed explanation, rendered from content */
  | "frame"
  /** the small plate under a frame that you press [E] on */
  | "plaque";

export interface PropDef {
  type: PropType;
  /** [x, y, z] in tile units; tile (x, z) has its center at world (x, 0, z) */
  pos: [number, number, number];
  /** [width, height, depth] in tile units */
  size: [number, number, number];
  color?: string;
  text?: string;
  /** wrapped body text, read only by the "frame" prop */
  body?: string;
  /** direction the prop is readable from (sign/screen normal) */
  face?: Facing;
}

export type PanelTarget =
  | { kind: "project"; slug: string }
  | { kind: "about" }
  | { kind: "research" }
  | { kind: "demo"; slug: string };

export type Action =
  | { type: "panel"; panel: PanelTarget }
  | { type: "link"; href: string };

export interface InteractableDef {
  id: string;
  /** tile [x, z] the visitor stands near */
  pos: [number, number];
  /** interaction radius in tiles */
  radius: number;
  /** shown in HUD as "[E] {prompt}" */
  prompt: string;
  /** optional; prompt-only interactables (e.g. "under construction") omit it */
  action?: Action;
}

export interface DoorTarget {
  targetRoom: string;
  spawn: { x: number; z: number };
  facing: Facing;
}

export interface BlockedRect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface RoomDef {
  id: string;
  name: string;
  subtitle: string;
  palette: RoomPalette;
  /**
   * Equal-length rows. '#' = wall, '.' = floor, 'D' = door (walkable, may teleport).
   * Row index = z (south positive), column index = x (east positive).
   */
  map: string[];
  spawn: { x: number; z: number; facing: Facing };
  props: PropDef[];
  blocked: BlockedRect[];
  interactables: InteractableDef[];
  /** key is `${x},${z}` of the 'D' tile */
  doors: Record<string, DoorTarget>;
}
