"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { projects } from "@/content/projects";
import type { BeltCard } from "@/content/types";
import { ScreenTexture, makeCardTexture } from "../textures";
import type { RoomDef } from "../types";

/**
 * Nightfall's line, one cycle: the picture is shown on the easel, a product
 * rides the belt east under the inspection head, and a flashcard comes out of
 * the chute carrying that category's published numbers.
 *
 * Nothing here infers anything. The numbers are published results for the
 * category, printed on a card that comes out of the end of the line - the
 * claim stays attached to the machine that produced it, which is why this is
 * an object in the room and not a HUD overlay.
 */
const PRESENT_S = 3.2; // the picture faces the room
const TRAVEL_S = 4.6; // the pulley run
const REVEAL_S = 4.4; // the flashcard holds
const GROW_S = 0.6; // card scales out of the chute
const FADE_S = 0.8; // and back down before the next one

const START_X = 3;
const GANTRY_X = 9;
const END_X = 15;
const BELT_Y = 0.62;
const BELT_Z = 4;

/**
 * The sample itself is shown at the head of the line, and the printed card
 * comes out of the chute at the far end. Showing the picture first and the
 * numbers last is the point: you look at the thing, then you read what the
 * model scored on that category.
 *
 * The display sits *over the belt's west end* (z=4) rather than beside it: that
 * row is already blocked, so the picture cannot be walked through, and it can
 * be big enough to read from the doorway.
 */
const EASEL_POSE: [number, number, number] = [5, 2.05, 4];
const CHUTE_POSE: [number, number, number] = [15.9, 1.75, 5.3];
/** the status screen, mounted on the gantry mast facing the room */
const MONITOR_POS: [number, number, number] = [9, 1.9, 3.45];
/** width of the presented sample; the height follows the photo's own aspect */
const EASEL_FACE_W = 3.4;
/** width of the photographed face riding on the product */
const PRODUCT_FACE_W = 0.62;
/** card is 4:3, matching the 512x384 canvas; grown so the numbers read at range */
const CARD_SIZE: [number, number] = [3, 2.25];
const MONITOR_SIZE: [number, number] = [3.2, 1.6];

/** used until the photo's own aspect is known (and when there is no photo) */
const FALLBACK_ASPECT = 4 / 3;

/**
 * A face sized to the photo it carries. The plan resampled every photo into a
 * fixed 4:3 canvas with a cover-crop, which both squashed nothing and rendered
 * nothing: the CanvasTexture built in the loader callback sampled black, while
 * the same `document.createElement("canvas")` path works fine when the texture
 * is built during render (makeCardTexture). Dropping the canvas removes the
 * resample, the crop and the bug: the plane takes the image's own aspect.
 */
function photoAspect(photo: THREE.Texture | null): number {
  const img = photo?.image as { naturalWidth?: number; naturalHeight?: number } | null;
  const w = img?.naturalWidth ?? 0;
  const h = img?.naturalHeight ?? 0;
  return w > 0 && h > 0 ? w / h : FALLBACK_ASPECT;
}

/** A face sized to the photo it carries, so nothing is ever squashed. */
function faceSize(photo: THREE.Texture | null, width: number): [number, number] {
  return [width, width / photoAspect(photo)];
}

type Phase = "present" | "travel" | "reveal";

const cards: BeltCard[] =
  projects.find((p) => p.slug === "nightfall")?.room.belt ?? [];

export function BeltDirector({ room }: { room: RoomDef }) {
  const [index, setIndex] = useState(0);
  const phase = useRef<Phase>("present");
  const clock = useRef(0);
  const product = useRef<THREE.Group>(null);
  const easel = useRef<THREE.Group>(null);
  const cardGroup = useRef<THREE.Group>(null);
  const cardMat = useRef<THREE.MeshBasicMaterial>(null);
  const statusKey = useRef("");
  const monitor = useMemo(() => new ScreenTexture(), []);
  const accent = room.palette.accent;

  useEffect(() => () => monitor.dispose(), [monitor]);

  const card: BeltCard | undefined = cards[index];
  // One photo per card, owned here so the presented picture and the product
  // riding the belt are the same texture rather than two loads of one file.
  const photo = useCardPhoto(card?.image);
  const easelFace = faceSize(photo, EASEL_FACE_W);
  const productFace = faceSize(photo, PRODUCT_FACE_W);
  const cardTex = useMemo(
    () => (card ? makeCardTexture(card, accent) : null),
    [card, accent],
  );
  // The old card's texture is released when the index advances, not just when
  // the room unmounts: a 13-second cycle would otherwise add three textures a
  // minute for as long as somebody stands there.
  useEffect(() => () => cardTex?.dispose(), [cardTex]);

  useFrame((_, dtRaw) => {
    if (!card) return;
    const dt = Math.min(dtRaw, 0.05);
    clock.current += dt;
    const t = clock.current;
    const p = product.current;
    const g = cardGroup.current;
    const e = easel.current;
    const m = cardMat.current;

    let status: string;
    if (phase.current === "present") {
      status = "DISPLAYING";
      if (p) p.visible = false;
      if (g) g.visible = false;
      if (e) {
        e.visible = true;
        e.position.set(...EASEL_POSE);
        // a slow breath, so the picture is clearly a live display
        e.position.y = EASEL_POSE[1] + Math.sin(t * 1.6) * 0.06;
        e.scale.setScalar(0.85 + 0.15 * Math.min(1, t / 0.5));
      }
      if (t >= PRESENT_S) {
        phase.current = "travel";
        clock.current = 0;
      }
    } else if (phase.current === "travel") {
      const k = Math.min(1, t / TRAVEL_S);
      const x = START_X + (END_X - START_X) * k;
      status = x >= GANTRY_X ? "SCANNED" : "ON BELT";
      if (g) g.visible = false;
      if (e) e.visible = false;
      if (p) {
        p.visible = true;
        p.position.set(x, BELT_Y, BELT_Z);
        // a little bob over the rails, so the product reads as carried
        p.position.y = BELT_Y + Math.sin(t * 6) * 0.02;
      }
      if (k >= 1) {
        phase.current = "reveal";
        clock.current = 0;
        if (p) p.visible = false;
      }
    } else {
      status = "CARD OUT";
      if (p) p.visible = false;
      if (e) e.visible = false;
      if (g) {
        g.visible = true;
        g.position.set(...CHUTE_POSE);
        g.scale.setScalar(0.2 + 0.8 * Math.min(1, t / GROW_S));
      }
      if (m) m.opacity = t > REVEAL_S - FADE_S ? (REVEAL_S - t) / FADE_S : 1;
      if (t >= REVEAL_S) {
        phase.current = "present";
        clock.current = 0;
        // Discrete, once per ~13s cycle: not a per-frame state write (AD-12).
        setIndex((i) => (i + 1) % cards.length);
      }
    }

    // Repainting a 512x256 canvas every frame for text that changes twice a
    // cycle is waste; redraw only when the line actually says something else.
    const key = `${card.id}:${status}`;
    if (statusKey.current !== key) {
      statusKey.current = key;
      monitor.update(
        [
          "NIGHTFALL VISION SYSTEM",
          `CATEGORY: ${card.category.toUpperCase()}`,
          `STATUS: ${status}`,
          "SOURCE: PUBLISHED RESULTS",
        ],
        accent,
      );
    }
  });

  return (
    <group>
      <mesh position={MONITOR_POS}>
        <planeGeometry args={MONITOR_SIZE} />
        <meshBasicMaterial map={monitor.texture} />
      </mesh>

      {/* the sample, shown at the head of the line before it rides */}
      <group ref={easel} position={EASEL_POSE}>
        {/*
         * Two meshes with separate keys, not one mesh with a swapped material.
         * R3F reconciles `mesh` + `meshBasicMaterial` by type and reuses the
         * instance, so setting `map` on a material that was compiled without one
         * leaves the texture unsampled - the photo rendered black. A keyed
         * element is a different element, so the mapped material is built fresh.
         */}
        {photo ? (
          <mesh key="photo">
            <planeGeometry args={easelFace} />
            <meshBasicMaterial map={photo} />
          </mesh>
        ) : (
          // no photo supplied: a grey plate, never a fake picture
          <mesh key="swatch">
            <planeGeometry args={[EASEL_FACE_W, EASEL_FACE_W / FALLBACK_ASPECT]} />
            <meshBasicMaterial color="#8b94a7" />
          </mesh>
        )}
      </group>

      {/* the printed card, out of the chute at the far end */}
      <group ref={cardGroup} visible={false}>
        {cardTex && (
          <mesh>
            <planeGeometry args={CARD_SIZE} />
            <meshBasicMaterial
              ref={cardMat}
              map={cardTex}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
        )}
      </group>

      <group ref={product} visible={false}>
        <mesh>
          <boxGeometry args={[0.7, 0.5, 0.7]} />
          <meshLambertMaterial color={room.palette.trim} />
        </mesh>
        <ProductFace photo={photo} size={productFace} />
      </group>
    </group>
  );
}

/**
 * The product's photographed face. A hook, so this has to be a component: each
 * product owns exactly one texture and disposes it on unmount or card change.
 */
function useCardPhoto(src: string | null | undefined): THREE.Texture | null {
  const [photo, setPhoto] = useState<{ src: string; tex: THREE.Texture } | null>(null);

  useEffect(() => {
    if (!src) return;
    let alive = true;
    const tex = new THREE.TextureLoader().load(
      src,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        if (alive) setPhoto({ src, tex: loaded });
      },
      undefined,
      () => {
        // A missing photo falls back to the swatch. It must never throw inside
        // the room's render loop.
      },
    );
    return () => {
      alive = false;
      tex.dispose();
    };
  }, [src]);

  return src && photo?.src === src ? photo.tex : null;
}

function ProductFace({
  photo,
  size,
}: {
  photo: THREE.Texture | null;
  size: [number, number];
}) {
  // Keyed, for the same reason as the easel: a material that gains a `map`
  // after being compiled without one renders black.
  if (photo) {
    return (
      <mesh key="photo" position={[0, 0.02, 0.36]}>
        <planeGeometry args={size} />
        <meshBasicMaterial map={photo} />
      </mesh>
    );
  }
  return (
    <mesh key="swatch" position={[0, 0.02, 0.36]}>
      <planeGeometry args={size} />
      {/* No photo yet: a grey face, so a missing image is visible rather than
          faked. */}
      <meshBasicMaterial color="#8b94a7" />
    </mesh>
  );
}
