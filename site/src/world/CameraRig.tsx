"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const OFFSET = new THREE.Vector3(0, 10, 8);

export function CameraRig({
  target,
}: {
  target: React.RefObject<THREE.Object3D | null>;
}) {
  const desired = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    if (!target.current) return;
    const t = target.current.position;
    desired.current.set(t.x + OFFSET.x, OFFSET.y, t.z + OFFSET.z);
    // frame-rate-independent damping: close fraction 1 - exp(-k*dt) per frame
    state.camera.position.lerp(desired.current, 1 - Math.exp(-6 * dt));
    state.camera.lookAt(t.x, 1, t.z);
  });

  return null;
}
