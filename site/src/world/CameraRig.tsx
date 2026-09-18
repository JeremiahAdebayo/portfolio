"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The hub is the menu: wide, so every door sign is readable at a glance. Rooms
 * are where you actually look at things, so they get a closer frame.
 *
 * In a room the rig follows behind the player like a close third-person game
 * camera. A small shoulder offset keeps the player readable while turning toward
 * a side wall brings that wall face-on. The hub keeps a fixed yaw, because a
 * menu full of doors is easier to read when it does not spin underneath you.
 *
 * The numbers were measured, not guessed.
 *
 * 1. This is intentionally closer and lower than the original isometric rig:
 *    the player and wall writing should share the same readable shot.
 *
 * 2. The height remains above the character but is no longer extreme; the
 *    shorter pullback keeps the room from reading as a distant map.
 *
 * 3. The swing is deliberately slow. The character turn is calm too, so a tap
 *    does not whip either the player or the room around.
 *
 *    `ponytail:` there is still no explicit yaw dead zone; if tiny taps remain
 *    distracting, add hysteresis rather than making the camera faster.
 *
 * 4. The swing starts at `startYaw`, the spawn facing, and deliberately not at
 *    the value read off the player group. This rig subscribes to `useFrame`
 *    before PlayerController does, so on the frame it mounts the group still
 *    carries its default rotation (0, i.e. south) - measured, not assumed, with
 *    a temporary log: frame 0 saw groupY=0.000 while the spawn faced 3.142.
 *    Adopting that made every entry into a north-facing room open with a
 *    180-degree swing before settling.
 */
const RIG_HEIGHT = 7.2;
const RIG_PULLBACK = 4.8;
const HUB_RIG_HEIGHT = 11.5;
const HUB_RIG_PULLBACK = 6.2;
const SHOULDER_OFFSET = 0.85;
const HUB_FOV = 45;
const ROOM_FOV = 43;
/** how far past the player the room view is aimed, in tiles */
const ROOM_AHEAD = 1.8;
/** the hub camera looks north and stays there; north is -z, so its yaw is PI */
const HUB_YAW = Math.PI;
const YAW_LAMBDA = 1.25;
const CAMERA_POSITION_LAMBDA = 4.5;
const FOV_LAMBDA = 3.5;

export function CameraRig({
  target,
  inRoom = false,
  startYaw,
}: {
  target: React.RefObject<THREE.Object3D | null>;
  /** true inside a project room: zoomed in, and swinging behind the player */
  inRoom?: boolean;
  /** the yaw the player spawns facing, from the room's own spawn */
  startYaw: number;
}) {
  const desired = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3());
  const yaw = useRef<number | null>(null);
  const fovTarget = inRoom ? ROOM_FOV : HUB_FOV;
  const ahead = inRoom ? ROOM_AHEAD : 0;

  useFrame((state, dt) => {
    if (!target.current) return;
    const t = target.current.position;

    const wanted = inRoom ? target.current.rotation.y : HUB_YAW;
    if (yaw.current === null) yaw.current = inRoom ? startYaw : HUB_YAW;
    let delta = wanted - yaw.current;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    yaw.current += delta * (1 - Math.exp(-YAW_LAMBDA * dt));

    // Forward is (sin, cos) of the yaw. The camera sits behind the player and
    // just over the right shoulder; at north-facing yaw PI that shoulder is east.
    const fx = Math.sin(yaw.current);
    const fz = Math.cos(yaw.current);
    const rx = -Math.cos(yaw.current);
    const rz = Math.sin(yaw.current);
    const rigHeight = inRoom ? RIG_HEIGHT : HUB_RIG_HEIGHT;
    const rigPullback = inRoom ? RIG_PULLBACK : HUB_RIG_PULLBACK;
    const shoulderOffset = inRoom ? SHOULDER_OFFSET : 0;
    desired.current.set(
      t.x - fx * rigPullback + rx * shoulderOffset,
      rigHeight,
      t.z - fz * rigPullback + rz * shoulderOffset,
    );
    // frame-rate-independent damping: close fraction 1 - exp(-k*dt) per frame
    state.camera.position.lerp(
      desired.current,
      1 - Math.exp(-CAMERA_POSITION_LAMBDA * dt),
    );
    // Aim a little past the player so what is in front of them fills the frame.
    aim.current.set(t.x + fx * ahead, 1, t.z + fz * ahead);
    state.camera.lookAt(aim.current);

    // Entering a room animates its zoom in rather than snapping to it. The
    // canvas is created with a perspective camera (WorldCanvas), so the cast is
    // the honest one; an orthographic camera has no fov to change.
    const cam = state.camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fovTarget) > 0.05) {
      cam.fov += (fovTarget - cam.fov) * (1 - Math.exp(-FOV_LAMBDA * dt));
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
