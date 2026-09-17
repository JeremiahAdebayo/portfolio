"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Character } from "./Character";
import { CameraRig } from "./CameraRig";
import { getMoveDir, useKeyboard } from "./input";
import { makeGridMap, moveWithCollision, tileCharAt } from "./collision";
import { playerPos, useWorldStore } from "./store";
import { rooms } from "./rooms";
import { goThroughDoor, runAction } from "./actions";

const SPEED = 4.5; // tiles per second
const FACING_ANGLE: Record<string, number> = {
  n: Math.PI,
  s: 0,
  e: Math.PI / 2,
  w: -Math.PI / 2,
};

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * (1 - Math.exp(-lambda * dt));
}

export function PlayerController() {
  const roomId = useWorldStore((s) => s.roomId);
  const room = rooms[roomId] ?? rooms.hub;
  const spawn = useWorldStore((s) => s.spawn);
  const paused = useWorldStore((s) => s.paused);
  const panelOpen = useWorldStore((s) => s.panel !== null);

  const map = useMemo(() => makeGridMap(room.map, room.blocked), [room]);
  const group = useRef<THREE.Group>(null);
  const pos = useRef({ x: spawn.x, z: spawn.z });
  const rotation = useRef(FACING_ANGLE[room.spawn.facing]);
  const movingRef = useRef(false);
  const doorLock = useRef(false);

  const keys = useKeyboard({
    onInteract: () => {
      const { action, paused: p, panel } = useWorldStore.getState();
      if (p || panel) return;
      if (action) runAction(action);
    },
    onPause: () => {
      const { paused: p, panel } = useWorldStore.getState();
      if (panel) useWorldStore.getState().closePanel();
      else useWorldStore.getState().setPaused(!p);
    },
  });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05); // clamp tab-switch spikes
    const blocked = paused || panelOpen;
    const dir = blocked ? { x: 0, z: 0 } : getMoveDir(keys.current);
    movingRef.current = dir.x !== 0 || dir.z !== 0;

    if (movingRef.current) {
      pos.current = moveWithCollision(map, pos.current, {
        x: dir.x * SPEED * dt,
        z: dir.z * SPEED * dt,
      });
      rotation.current = dampAngle(
        rotation.current,
        Math.atan2(dir.x, dir.z),
        12,
        dt,
      );
    }

    // publish position for the interaction system (never React state — AD-12)
    playerPos.x = pos.current.x;
    playerPos.z = pos.current.z;

    if (group.current) {
      group.current.position.set(pos.current.x, 0, pos.current.z);
      group.current.rotation.y = rotation.current;
    }

    // door tiles teleport (auto, on step)
    const ch = tileCharAt(room.map, pos.current.x, pos.current.z);
    if (ch === "D" && !doorLock.current) {
      const key = `${Math.round(pos.current.x)},${Math.round(pos.current.z)}`;
      const door = room.doors[key];
      if (door) {
        doorLock.current = true;
        goThroughDoor(door);
      }
    } else if (ch !== "D") {
      doorLock.current = false;
    }
  });

  return (
    <>
      <CameraRig
        target={group}
        inRoom={room.id !== "hub"}
        startYaw={FACING_ANGLE[room.spawn.facing]}
      />
      <group ref={group}>
        <Character movingRef={movingRef} />
      </group>
    </>
  );
}
