"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeCaptionTexture } from "../textures";
import type { Actor, StationDef } from "./agents";

/**
 * One voxel agent, structurally the same humanoid as Character.tsx (same
 * proportions, same trick of a dark visor on a light head) and recoloured per
 * station. Two differences: the visor is the station's own pack colour rather
 * than the player's cyan, so an agent never reads as the visitor; and it can
 * carry the work package.
 *
 * The caption plate is a prop, not state: it changes when the director's step
 * changes (a texture swap), never per frame.
 */
export function AgentFigure({
  station,
  actors,
  actorIndex,
  caption,
  accent,
  carrying,
}: {
  station: StationDef;
  /**
  * This actor is written every frame by PlayDirector. It is a ref, not state
  * (AD-12), and is read only inside useFrame.
   */
  actors: React.RefObject<Actor[]>;
  actorIndex: number;
  /** the working caption, or null when this agent is not the one working */
  caption: string | null;
  /** the room's accent, which is what the carried package is made of */
  accent: string;
  /** true while this agent holds the package */
  carrying: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const bubble = useRef<THREE.Group>(null);
  const t = useRef(0);

  const tex = useMemo(
    () => (caption ? makeCaptionTexture(caption, { accent: station.pack }) : null),
    [caption, station.pack],
  );
  // The caption texture is built per step, not once per visit: without this every
  // station would leak a texture per step for as long as the visitor stands in
  // the room (the same reason Props.tsx disposes on unmount).
  useEffect(() => () => tex?.dispose(), [tex]);

  useFrame((_, dt) => {
    t.current += dt;
    const g = group.current;
    const a = actors.current[actorIndex];
    if (!g || !a) return;
    g.position.set(a.x, 0, a.z);
    g.rotation.y = a.heading;

    const swing = a.pose === "walking" ? Math.sin(t.current * 9) * 0.55 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    // working: a small typing bob, so a stationary agent is not a cadaver
    const work = a.pose === "working" ? Math.sin(t.current * 12) * 0.12 : 0;
    // handing: both arms forward, holding the package out
    const reach = a.pose === "handing" ? -0.9 : 0;
    if (armL.current) armL.current.rotation.x = -swing * 0.6 + work + reach;
    if (armR.current) armR.current.rotation.x = swing * 0.6 - work + reach;

    if (bubble.current) bubble.current.visible = Boolean(tex);
    // walking body bob, matching Character.tsx's
    g.position.y = a.pose === "walking" ? Math.abs(Math.sin(t.current * 9)) * 0.04 : 0;
  });

  return (
    <group ref={group}>
      <mesh ref={legL} position={[-0.13, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.75, 0.24]} />
        <meshLambertMaterial color={station.color} />
      </mesh>
      <mesh ref={legR} position={[0.13, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.75, 0.24]} />
        <meshLambertMaterial color={station.color} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.52, 0.6, 0.3]} />
        <meshLambertMaterial color={station.color} />
      </mesh>
      {/* the pack: the only part of an agent that is legible from the doorway */}
      <mesh position={[0, 1.1, -0.22]}>
        <boxGeometry args={[0.34, 0.4, 0.14]} />
        <meshLambertMaterial color={station.pack} />
      </mesh>
      <mesh ref={armL} position={[-0.36, 1.08, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.22]} />
        <meshLambertMaterial color={station.color} />
      </mesh>
      <mesh ref={armR} position={[0.36, 1.08, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.22]} />
        <meshLambertMaterial color={station.color} />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshLambertMaterial color={station.color} />
      </mesh>
      <mesh position={[0, 1.6, 0.22]}>
        <boxGeometry args={[0.34, 0.12, 0.03]} />
        <meshBasicMaterial color={station.pack} />
      </mesh>
      <mesh position={[0.14, 1.9, 0]}>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshBasicMaterial color={station.pack} />
      </mesh>

      {/*
       * The work package. A box, because the monitor names what is inside it
       * (PipelineStep.artifact) - a box with a texture per artifact would be
       * eight more canvases for text that is already on the screen above.
       * `ponytail:` the upgrade is a label on the box itself.
       */}
      {carrying && (
        <mesh position={[0, 0.95, 0.34]}>
          <boxGeometry args={[0.3, 0.24, 0.3]} />
          <meshLambertMaterial color={accent} />
        </mesh>
      )}

      {/* fake blob shadow, as on the player: no real-time shadows (cut list) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      <group ref={bubble} position={[0, 2.45, 0]} visible={false}>
        {tex && (
          <mesh>
            <planeGeometry args={[2.1, 0.394]} />
            <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  );
}
