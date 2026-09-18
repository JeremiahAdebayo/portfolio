import { projects } from "@/content/projects";
import type { PipelineStep } from "@/content/types";

/**
 * One desk in Noctis's lab. These are read by the director, by rooms/noctis.ts
 * (which lays out the desks, the role signs and the interaction points) and by
 * rooms.test.ts, which proves every pipeline step names a station that exists.
 */
export interface StationDef {
  /** matches PipelineStep.agent in the content layer */
  id: string;
  /** the sign above the desk; agent/graph.py's own node names, in words */
  role: string;
  /** desk tile [x, z] */
  tile: [number, number];
  /**
   * the tile a visitor stands on to talk to this desk: the desk's own tile is
   * blocked by the desk, so the interaction point has to be beside it. Also the
   * tile the visitor's [E] prompt is anchored to (rooms/noctis.ts).
   */
  approach: [number, number];
  /** body colour */
  color: string;
  /** chest pack, which is what actually reads at this camera distance */
  pack: string;
}

/**
 * Every body colour is an existing design token except the indexer's blue
 * (facility-muted, a reserved blue, warn, anomaly, ok, the two room trims,
 * accent). Nothing here is #e6eaf2: that is the player's body, and an agent that
 * looks like the visitor is worse than a dull one. `facility-border` (#232b3e)
 * is deliberately absent - A17 measured it at 1.01:1 against a room floor.
 */
export const noctisStations: StationDef[] = [
  // North row, west to east: the order the graph runs in.
  { id: "reset", role: "REPO RESET", tile: [3, 3], approach: [3, 4], color: "#8b94a7", pack: "#e6eaf2" },
  { id: "indexer", role: "LOCALIZER", tile: [6, 3], approach: [6, 4], color: "#7f9cf5", pack: "#4fd1c5" },
  { id: "planner", role: "PLANNER", tile: [9, 3], approach: [9, 4], color: "#f6ad55", pack: "#4fd1c5" },
  { id: "test_generator", role: "TEST GEN", tile: [12, 3], approach: [12, 4], color: "#e5534b", pack: "#f6ad55" },
  { id: "engineer", role: "ENGINEER", tile: [15, 3], approach: [15, 4], color: "#48bb78", pack: "#e6eaf2" },
  // South row, east back to west: the graph returns the way it came, which is
  // also why the retry hop reads as a loop rather than a new lap.
  { id: "reassembler", role: "REASSEMBLER", tile: [15, 9], approach: [15, 8], color: "#6b9c8a", pack: "#48bb78" },
  { id: "executor", role: "EXECUTOR", tile: [12, 9], approach: [12, 8], color: "#b08968", pack: "#f6ad55" },
  { id: "critic", role: "CRITIC", tile: [9, 9], approach: [9, 8], color: "#4fd1c5", pack: "#e5534b" },
];

export const noctisStationMap: Record<string, StationDef> = Object.fromEntries(
  noctisStations.map((s) => [s.id, s]),
);

/**
 * The cycle is content (AD-01): rooms/noctis.ts places the desks these names
 * refer to, and the director only plays the list back. The failing verdict and
 * the hop back to the planner are agent/graph.py's critic-to-planner retry edge,
 * not decoration.
 */
export const noctisPipeline: PipelineStep[] =
  projects.find((p) => p.slug === "noctis")?.room.pipeline ?? [];

/** Which way a body is facing, and what its limbs are doing. */
export type Pose = "idle" | "walking" | "working" | "handing";

/**
 * One agent's mutable state. Deliberately NOT React state: the director writes
 * these every frame (AD-12's rule about the player applies to the cast too).
 * Each station owns exactly one, so two agents can be in motion at once - the
 * carrier and the one walking home behind it.
 */
export interface Actor {
  x: number;
  z: number;
  heading: number;
  pose: Pose;
}

export function homeActor(station: StationDef): Actor {
  return { x: station.tile[0], z: station.tile[1], heading: Math.PI, pose: "idle" };
}
