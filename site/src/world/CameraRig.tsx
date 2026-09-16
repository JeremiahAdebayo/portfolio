"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The hub is the menu: wide, so every door sign is readable at a glance. Rooms
 * are where you actually look at things, so they get a closer frame.
 *
 * Two things drive the numbers, and both were measured rather than guessed.
 *
 * 1. Zoom comes from the field of view, not from moving in. Pulling the rig
 *    closer *and* keeping the look-at on the player pushed the belt off the top
 *    of the screen: the camera frames the player, and the room's content is
 *    6-8 tiles away in front of it. Narrowing the fov instead magnifies
 *    everything without re-composing the shot.
 *
 * 2. The rig has to be high enough to see over the wall between it and the
 *    player. The camera always sits south of the player, so once the player
 *    walks within ~2 tiles of the south wall, the wall is between them. The
 *    sight line clears a wall of height `w` when 1 + g(H-1) > w, where
 *    g = (distance from player to wall) / D. At the old 10/8 that failed for
 *    any tile south of z=10.7 and the player simply vanished behind the wall.
 *    H=11.5 with D=6.2 clears a 3-tall wall even standing against it.
 *
 * One geometry for every room, two fields of view. The rig height and pull-back
 * are fixed by the wall-clearance maths above and are not a taste decision;
 * only the fov and the aim change between the menu and a lab.
 */
const OFFSET = new THREE.Vector3(0, 11.5, 6.2);
const HUB_FOV = 45;
const ROOM_FOV = 36;
/** how far past the player the room view is aimed, in tiles */
const ROOM_AHEAD = 2.5;

export function CameraRig({
  target,
  close = false,
}: {
  target: React.RefObject<THREE.Object3D | null>;
  /** true inside a project room, false in the hub */
  close?: boolean;
}) {
  const desired = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3());
  const fovTarget = close ? ROOM_FOV : HUB_FOV;
  const ahead = close ? ROOM_AHEAD : 0;

  useFrame((state, dt) => {
    if (!target.current) return;
    const t = target.current.position;
    desired.current.set(t.x + OFFSET.x, OFFSET.y, t.z + OFFSET.z);
    // frame-rate-independent damping: close fraction 1 - exp(-k*dt) per frame
    state.camera.position.lerp(desired.current, 1 - Math.exp(-6 * dt));
    // Aim a little past the player so the room ahead fills the frame instead of
    // a screenful of empty floor behind them.
    aim.current.set(t.x, 1, t.z - ahead);
    state.camera.lookAt(aim.current);

    // Entering a room animates its zoom in rather than snapping to it. The
    // canvas is created with a perspective camera (WorldCanvas), so the cast is
    // the honest one; an orthographic camera has no fov to change.
    const cam = state.camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fovTarget) > 0.05) {
      cam.fov += (fovTarget - cam.fov) * (1 - Math.exp(-4 * dt));
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
