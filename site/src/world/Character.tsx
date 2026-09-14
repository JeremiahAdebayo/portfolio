"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// AJ.exe — original voxel humanoid. Charcoal body, cyan visor, amber pack.
// Deliberately NOT a Steve clone (spec §5).
const BODY = "#232b3e";
const VISOR = "#4fd1c5";
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
        <meshBasicMaterial color={VISOR} />
      </mesh>
      {/* fake blob shadow — no real-time shadows (cut list) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
