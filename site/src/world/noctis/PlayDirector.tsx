"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ScreenTexture } from "../textures";
import {
  homeActor,
  noctisPipeline,
  noctisStations,
  type Actor,
} from "./agents";
import { AgentFigure } from "./AgentFigure";
import type { RoomDef } from "../types";

/**
 * Noctis's lab, one lap: the agent holding the work package walks to the next
 * agent's desk, hands it over, and walks home while the receiver starts its
 * step. The cycle is content (PipelineStep[]) and this only plays it back, so
 * the room cannot drift from the graph the page describes - including the
 * failing critic step and the hop back to the planner, which is agent/graph.py's
 * real retry edge.
 *
 * Nothing here runs anything: the monitor says so on every frame of the cycle.
 *
 * Timing. The lab is slower than the belt on purpose: a step is a walk, a
 * hand-off and a piece of work, and the caption has to be readable while it
 * moves. 13 steps at 4.9s is about a minute a lap, so a visitor who walks in
 * sees several hand-offs and, on any full lap, the retry.
 */
const WALK_S = 1.9; // desk to desk
const HAND_S = 0.7; // standing together, the package changes hands
const WORK_S = 2.3; // the receiver works; the one who walked home is already back
/** the returning agent covers its own leg inside WORK_S, not after it */
const RETURN_S = Math.min(WORK_S, 1.7);

/**
 * The one clean stop is the tile 1 short of the receiver's desk, not a stand
 * tile of its own: a fixed stand row would make every leg zig-zag a tile in z
 * (desks are on z=3 and z=9), and two agents must not share a tile anyway.
 */
const STAND_BACK = 1.0;

type Phase = "walk" | "hand" | "work";

const stations = noctisStations;
const stationIndex: Record<string, number> = Object.fromEntries(
  stations.map((s, i) => [s.id, i]),
);

export function PlayDirector({ room }: { room: RoomDef }) {
  const [step, setStep] = useState(0);
  const phase = useRef<Phase>("walk");
  const clock = useRef(0);
  const returner = useRef<number | null>(null);
  const monitor = useMemo(() => new ScreenTexture(), []);
  const statusKey = useRef("");
  const accent = room.palette.accent;

  /**
   * One Actor per station, created once and mutated in place. This is why two
   * agents can be in motion at the same moment (the carrier, and the one
   * walking home behind it) without either of them being React state.
   */
  const actors = useRef<Actor[]>(stations.map(homeActor));

  useEffect(() => () => monitor.dispose(), [monitor]);

  const total = noctisPipeline.length;
  const cur = total ? noctisPipeline[step % total] : undefined;
  const next = total ? noctisPipeline[(step + 1) % total] : undefined;
  const curIdx = cur ? stationIndex[cur.agent] : -1;

  useEffect(() => {
    if (!cur) return;
    // Repaint only when the line actually says something else: a 512x256 canvas
    // per frame for text that changes once per step is waste (as on the belt).
    const key = `${step}:${cur.agent}`;
    if (statusKey.current === key) return;
    statusKey.current = key;
    monitor.update(
      [
        "NOCTIS AGENT OPS",
        `STEP ${(step % total) + 1}/${total}: ${cur.agent}`,
        cur.caption.toUpperCase(),
        cur.ok ? "STATUS: OK" : "STATUS: FAILED - LOOPING",
        `CARRYING: ${cur.artifact}`,
        "SIMULATED - NOT A LIVE RUN",
      ],
      accent,
    );
  }, [cur, step, total, monitor, accent]);

  useFrame((_, dtRaw) => {
    if (!total || !cur || !next) return;
    const dt = Math.min(dtRaw, 0.05); // the same clamp the player has (A27/A34)
    clock.current += dt;
    const t = clock.current;

    const fromIdx = stationIndex[cur.agent];
    const toIdx = stationIndex[next.agent];
    const a = actors.current[fromIdx];
    const b = actors.current[toIdx];
    if (!a || !b) return;

    // Both ends of the leg come from the *stations*, not from where the bodies
    // happen to be: deriving them from live positions would let the stopping
    // point drift as the carrier approaches it.
    const start = stations[fromIdx].tile;
    const home = stations[toIdx].tile;
    const dx = start[0] - home[0];
    const dz = start[1] - home[1];
    const len = Math.hypot(dx, dz) || 1;
    const stop = {
      x: home[0] + (dx / len) * STAND_BACK,
      z: home[1] + (dz / len) * STAND_BACK,
    };

    if (phase.current === "walk") {
      const k = Math.min(1, t / WALK_S);
      a.x = start[0] + (stop.x - start[0]) * k;
      a.z = start[1] + (stop.z - start[1]) * k;
      a.heading = Math.atan2(stop.x - start[0], stop.z - start[1]);
      a.pose = "walking";
      if (k >= 1) {
        a.pose = "handing";
        phase.current = "hand";
        clock.current = 0;
      }
      return;
    }

    if (phase.current === "hand") {
      // both face each other; the package is still in the carrier's hands until
      // the step advances, which is what makes the transfer visible
      a.x = stop.x;
      a.z = stop.z;
      a.heading = Math.atan2(home[0] - stop.x, home[1] - stop.z);
      a.pose = "handing";
      b.heading = Math.atan2(stop.x - home[0], stop.z - home[1]);
      b.pose = "handing";
      if (t >= HAND_S) {
        // The receiver is now the holder, and the current step becomes its own:
        // the caption, the package and the walker all move to it in one beat.
        returner.current = fromIdx;
        phase.current = "work";
        clock.current = 0;
        setStep((s) => s + 1);
      }
      return;
    }

    // work: the receiver works at its own desk while the previous carrier walks
    // home. Reading `phase.current` during render would be a frame stale, so the
    // caption is derived from the step alone (see below).
    b.pose = "working";
    const r = returner.current;
    if (r !== null) {
      const back = actors.current[r];
      const homeTile = stations[r].tile;
      const k = Math.min(1, t / RETURN_S);
      back.x += (homeTile[0] - back.x) * (1 - Math.exp(-8 * dt));
      back.z += (homeTile[1] - back.z) * (1 - Math.exp(-8 * dt));
      back.heading = Math.atan2(homeTile[0] - back.x, homeTile[1] - back.z);
      back.pose = k < 1 ? "walking" : "idle";
      if (k >= 1) {
        back.x = homeTile[0];
        back.z = homeTile[1];
        back.pose = "idle";
      }
    }
    if (t >= WORK_S) {
      returner.current = null;
      phase.current = "walk";
      clock.current = 0;
    }
  });

  if (!total) return null;

  return (
    <group>
      {/*
        The ops monitor is the director's, like the belt's status screen: the
        room owns the dark frame around it (rooms/noctis.ts) and this owns the
        512x256 texture, so the plane is a child of the same component that
        repaints it.
      */}
      <mesh position={[9, 1.15, 0.58]}>
        <planeGeometry args={[4.4, 1.2]} />
        <meshBasicMaterial map={monitor.texture} />
      </mesh>

      {stations.map((s, i) => (
        <AgentFigure
          key={s.id}
          station={s}
          actors={actors}
          actorIndex={i}
          accent={accent}
          carrying={i === curIdx}
          // The plan gated this on the "work" phase, which needs a second piece
          // of React state to hide it again (a ref read during render is stale).
          // Keyed to the step instead, the plate travels with the package and
          // reads as "this is the step now happening".
          caption={i === curIdx ? (cur?.caption ?? null) : null}
        />
      ))}
    </group>
  );
}
