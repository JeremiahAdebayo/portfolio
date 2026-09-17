"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The hub is the menu: wide, so every door sign is readable at a glance. Rooms
 * are where you actually look at things, so they get a closer frame.
 *
 * In a room the rig also swings around behind the player, so whatever you face
 * is square-on instead of being seen edge-first. That is the point: the wall
 * frames hang on *side* walls, and a camera nailed to the south sees them at a
 * grazing angle from anywhere in the room - which is what "I can barely see the
 * writings on the wall" actually was. The hub keeps a fixed yaw, because a menu
 * full of doors is easier to read when it does not spin underneath you.
 *
 * The numbers were measured, not guessed.
 *
 * 1. Zoom comes from the field of view, not from moving in. Pulling the rig
 *    closer *and* keeping the look-at on the player pushed the belt off the top
 *    of the screen: the camera frames the player, and the room's content is
 *    6-8 tiles away in front of it. Narrowing the fov instead magnifies
 *    everything without re-composing the shot.
 *
 * 2. The rig has to be high enough to see over the wall between it and the
 *    player. However the rig is turned, the wall behind the player can end up
 *    between them, and the clearance does not care which wall it is. The sight
 *    line clears a wall of height `w` when 1 + g(H-1) > w, where g = (distance
 *    from player to wall) / D. At the old 10/8 that failed for any tile south of
 *    z=10.7 and the player simply vanished behind the wall. H=11.5 with D=6.2
 *    clears a 3-tall wall even standing against it.
 *
 * 3. The swing is damped on its own clock. The character's turn is nearly
 *    instant (lambda 12 in PlayerController); reusing it would snap the whole
 *    world around on every key press.
 *
 *    `ponytail:` the swing follows the facing exactly, with no dead zone, so a
 *    quick left-right tap swings the whole room. If that ever reads as jumpy,
 *    the upgrade is a hysteresis band, not a slower constant.
 *
 * 4. The swing starts at `startYaw`, the spawn facing, and deliberately not at
 *    the value read off the player group. This rig subscribes to `useFrame`
 *    before PlayerController does, so on the frame it mounts the group still
 *    carries its default rotation (0, i.e. south) - measured, not assumed, with
 *    a temporary log: frame 0 saw groupY=0.000 while the spawn faced 3.142.
 *    Adopting that made every entry into a north-facing room open with a
 *    180-degree swing before settling.
 */
const RIG_HEIGHT = 11.5;
const RIG_PULLBACK = 6.2;
const HUB_FOV = 45;
const ROOM_FOV = 36;
/** how far past the player the room view is aimed, in tiles */
const ROOM_AHEAD = 2.5;
/** the hub camera looks north and stays there; north is -z, so its yaw is PI */
const HUB_YAW = Math.PI;
const YAW_LAMBDA = 3.5;

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

    // forward is (sin, cos) of the yaw, so the rig sits behind the player and
    // the aim sits in front of them, both rotated by the same angle. Facing
    // north (yaw PI) puts the rig due south, which is where it has always been.
    const fx = Math.sin(yaw.current);
    const fz = Math.cos(yaw.current);
    desired.current.set(
      t.x - fx * RIG_PULLBACK,
      RIG_HEIGHT,
      t.z - fz * RIG_PULLBACK,
    );
    // frame-rate-independent damping: close fraction 1 - exp(-k*dt) per frame
    state.camera.position.lerp(desired.current, 1 - Math.exp(-6 * dt));
    // Aim a little past the player so what is in front of them fills the frame.
    aim.current.set(t.x + fx * ahead, 1, t.z + fz * ahead);
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
