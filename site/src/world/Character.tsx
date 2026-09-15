"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// AJ.exe — original voxel humanoid. Deliberately NOT a Steve clone (spec §5).
//
// Readability is a hard requirement, not a taste call (spec §24). The plan's
// original charcoal BODY was #232b3e — 1.01:1 against the hub floor, i.e.
// effectively invisible, and worst against dark rooms. Every colour below is an
// existing plan §4 token chosen on LIGHTNESS rather than hue, so the figure is
// still distinguishable to colour-blind visitors:
//   BODY   #e6eaf2 (facility-text) 7.9-12.2:1 vs every room floor and wall
//   ACCENT #4fd1c5 (accent)        5.1:1 worst case, used on the antenna alone
//   VISOR  #0b0e14 (facility-bg)   ~16.9:1 against the BODY, so the face reads
const BODY = "#e6eaf2"; // light suit, not charcoal
const VISOR = "#0b0e14";
const ACCENT = "#4fd1c5";
const PACK = "#f6ad55";

export function Character({
  movingRef,
}: {
  movingRef: React.RefObject<boolean>;
}) {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    const moving = movingRef.current;
    const walk = moving ? Math.sin(t.current * 10) * 0.6 : 0;
    if (legL.current) legL.current.rotation.x = walk;
    if (legR.current) legR.current.rotation.x = -walk;
    if (armL.current) armL.current.rotation.x = -walk * 0.7;
    if (armR.current) armR.current.rotation.x = walk * 0.7;
    if (group.current) {
      group.current.position.y = moving
        ? Math.abs(Math.sin(t.current * 10)) * 0.04
        : Math.sin(t.current * 2) * 0.02;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={legL} position={[-0.13, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.75, 0.24]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh ref={legR} position={[0.13, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.75, 0.24]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.52, 0.6, 0.3]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh position={[0, 1.1, -0.22]}>
        <boxGeometry args={[0.34, 0.4, 0.14]} />
        <meshLambertMaterial color={PACK} />
      </mesh>
      <mesh ref={armL} position={[-0.36, 1.08, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.22]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh ref={armR} position={[0.36, 1.08, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.22]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh position={[0, 1.6, 0.22]}>
        <boxGeometry args={[0.34, 0.12, 0.03]} />
        <meshBasicMaterial color={VISOR} />
      </mesh>
      <mesh position={[0.14, 1.9, 0]}>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshBasicMaterial color={ACCENT} />
      </mesh>
      {/* fake blob shadow — no real-time shadows (cut list) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
