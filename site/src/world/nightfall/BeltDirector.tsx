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
 * Where the card is shown at the start of a cycle, and where it pops out.
 * The easel pose sits *over the belt's west end* (z=4) rather than beside it:
 * that row is already blocked, so the display cannot be walked through, and the
 * card can be big enough to read from the doorway.
 */
const EASEL_POSE: [number, number, number] = [3, 1.85, 4];
const CHUTE_POSE: [number, number, number] = [15.9, 1.75, 5.3];
/** the status screen, mounted on the gantry mast facing the room */
const MONITOR_POS: [number, number, number] = [9, 1.9, 3.45];
/** card is 4:3, matching the 512x384 canvas; grown so the numbers read at range */
const CARD_SIZE: [number, number] = [3, 2.25];
const MONITOR_SIZE: [number, number] = [3.2, 1.6];

/** photos are downsampled to this on load: fixed GPU cost, whatever AJ sends */
const PHOTO_EDGE = 256;

type Phase = "present" | "travel" | "reveal";

const cards: BeltCard[] =
  projects.find((p) => p.slug === "nightfall")?.room.belt ?? [];

export function BeltDirector({ room }: { room: RoomDef }) {
  const [index, setIndex] = useState(0);
  const phase = useRef<Phase>("present");
  const clock = useRef(0);
  const product = useRef<THREE.Group>(null);
  const cardGroup = useRef<THREE.Group>(null);
  const cardMat = useRef<THREE.MeshBasicMaterial>(null);
  const statusKey = useRef("");
  const monitor = useMemo(() => new ScreenTexture(), []);
  const accent = room.palette.accent;

  useEffect(() => () => monitor.dispose(), [monitor]);

  const card: BeltCard | undefined = cards[index];
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
    const m = cardMat.current;

    let status: string;
    if (phase.current === "present") {
      status = "DISPLAYING";
      if (p) p.visible = false;
      if (g) {
        g.visible = true;
        g.position.set(...EASEL_POSE);
        g.scale.setScalar(1);
      }
      if (m) m.opacity = 1;
      if (t >= PRESENT_S) {
        phase.current = "travel";
        clock.current = 0;
      }
    } else if (phase.current === "travel") {
      const k = Math.min(1, t / TRAVEL_S);
      const x = START_X + (END_X - START_X) * k;
      status = x >= GANTRY_X ? "SCANNED" : "ON BELT";
      if (g) g.visible = false;
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

      <group ref={cardGroup} position={EASEL_POSE}>
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
        <ProductFace card={card} />
      </group>
    </group>
  );
}

/**
 * The product's photographed face. A hook, so this has to be a component: each
 * product owns exactly one texture and disposes it on unmount or card change.
 */
function useCardPhoto(src: string | null | undefined): THREE.Texture | null {
  // The src is stored beside the texture so a re-render can never hand back a
  // texture that belongs to the previous card.
  const [photo, setPhoto] = useState<{ src: string; tex: THREE.Texture } | null>(null);

  useEffect(() => {
    if (!src) return;
    let alive = true;
    let made: THREE.CanvasTexture | null = null;
    new THREE.TextureLoader().load(
      src,
      (loaded) => {
        if (!alive) {
          loaded.dispose();
          return;
        }
        const img = loaded.image as HTMLImageElement;
        const canvas = document.createElement("canvas");
        canvas.width = PHOTO_EDGE;
        canvas.height = Math.round(PHOTO_EDGE * (0.465 / 0.62));
        const ctx = canvas.getContext("2d")!;
        // Cover, not stretch: a 453x362 photo on a 4:3 face would otherwise be
        // squashed, and squashing a photo of a defect is a lie about its shape.
        const scale = Math.max(
          canvas.width / img.naturalWidth,
          canvas.height / img.naturalHeight,
        );
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        loaded.dispose();
        made = new THREE.CanvasTexture(canvas);
        made.colorSpace = THREE.SRGBColorSpace;
        setPhoto({ src, tex: made });
      },
      undefined,
      () => {
        // A missing photo falls back to the swatch. It must never throw inside
        // the room's render loop.
      },
    );
    return () => {
      alive = false;
      made?.dispose();
    };
  }, [src]);

  return src && photo?.src === src ? photo.tex : null;
}

function ProductFace({ card }: { card?: BeltCard }) {
  const photo = useCardPhoto(card?.image);
  return (
    <mesh position={[0, 0.02, 0.36]}>
      <planeGeometry args={[0.62, 0.465]} />
      {photo ? (
        <meshBasicMaterial map={photo} />
      ) : (
        // No photo yet: a labelled grey face, so a missing image is visible
        // rather than faked.
        <meshBasicMaterial color="#8b94a7" />
      )}
    </mesh>
  );
}
