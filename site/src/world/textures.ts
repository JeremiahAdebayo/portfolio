import type { BeltCard } from "@/content/types";
import * as THREE from "three";

/** In-world sign as a canvas texture. No drei, no font loading (AD-11). */
export function makeSignTexture(
  text: string,
  opts: { bg?: string; fg?: string; accent?: string } = {},
): THREE.CanvasTexture {
  const { bg = "#131826", fg = "#e6eaf2", accent = "#4fd1c5" } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = fg;
  ctx.font = "bold 44px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 66, 470);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Updatable monitor texture (Nightfall monitor, Noctis terminal). */
export class ScreenTexture {
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;

  constructor(width = 512, height = 256, private bg = "#05070c") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.update([]);
  }

  update(lines: string[], accent = "#4fd1c5") {
    const { ctx } = this;
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "20px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    lines.slice(-10).forEach((line, i) => {
      ctx.fillStyle = i === 0 ? accent : "#8b94a7";
      ctx.fillText(line, 16, 14 + i * 24, ctx.canvas.width - 32);
    });
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}

/** Tiled floor texture - one tile per repeat. */
export function makeFloorTexture(
  floor: string,
  line: string,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const FRAME_W = 1024;
const FRAME_H = 640;

/**
 * Wall "painting": a double border plus wrapped body text. 1024x640 matches the
 * 3.6 x 2.25 tile frame exactly, so glyphs are never stretched. Body length is
 * capped at 220 chars by validateProject, which is at most 6 lines here.
 */
export function makeFrameTexture(
  title: string,
  body: string,
  opts: { accent?: string; bg?: string; fg?: string } = {},
): THREE.CanvasTexture {
  const { accent = "#4fd1c5", bg = "#131826", fg = "#e6eaf2" } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, FRAME_W - 14, FRAME_H - 14);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 4;
  ctx.strokeRect(34, 34, FRAME_W - 68, FRAME_H - 68);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = accent;
  ctx.font = "bold 52px ui-monospace, monospace";
  ctx.fillText(title.slice(0, 28), 64, 72);
  ctx.fillStyle = fg;
  ctx.font = "38px ui-monospace, monospace";
  // Greedy word wrap. 38px monospace is ~23px per glyph, so ~38 characters fit
  // between the 64px side margins.
  let line = "";
  let y = 168;
  for (const word of body.split(/\s+/)) {
    if (`${line} ${word}`.trim().length > 38) {
      ctx.fillText(line.trim(), 64, y);
      line = word;
      y += 52;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) ctx.fillText(line, 64, y);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const CARD_W = 512;
const CARD_H = 384;

/**
 * The printed flashcard: the published numbers, and the line that says where
 * they came from. 512x384 matches the 2.6 x 1.95 tile plane exactly, so glyphs
 * are never stretched.
 *
 * Row values are drawn at the largest size in `SIZES` that fits, rather than
 * being sliced to a fixed character count: "flags it, localises it badly" is a
 * real row and an ellipsis would have cut the meaning off it.
 */
export function makeCardTexture(
  card: BeltCard,
  accent = "#f6ad55",
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, CARD_W - 8, CARD_H - 8);
  ctx.textBaseline = "top";

  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "bold 44px ui-monospace, monospace";
  ctx.fillText(card.label.slice(0, 16), 28, 28, CARD_W - 56);

  // Largest size that fits the available width ends up used; fillText's
  // maxWidth is the backstop so a very long value is squeezed, never dropped.
  const drawFitted = (text: string, x: number, y: number, maxWidth: number, sizes: number[]) => {
    for (const [i, size] of sizes.entries()) {
      ctx.font = `bold ${size}px ui-monospace, monospace`;
      if (ctx.measureText(text).width <= maxWidth || i === sizes.length - 1) {
        ctx.fillText(text, x, y, maxWidth);
        return;
      }
    }
  };

  card.rows.slice(0, 4).forEach((row, i) => {
    const y = 104 + i * 54;
    ctx.textAlign = "left";
    ctx.fillStyle = "#8b94a7";
    ctx.font = "24px ui-monospace, monospace";
    ctx.fillText(row.label.toUpperCase().slice(0, 14), 28, y + 6);
    const labelWidth = ctx.measureText(row.label.toUpperCase().slice(0, 14)).width;
    ctx.textAlign = "right";
    ctx.fillStyle = "#e6eaf2";
    drawFitted(row.value, CARD_W - 28, y, CARD_W - 28 - (28 + labelWidth + 16), [30, 26, 22, 19, 16]);
  });

  // The honesty line. Small, but present on every card.
  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "17px ui-monospace, monospace";
  ctx.fillText("PUBLISHED RESULTS", 28, 330, CARD_W - 56);
  ctx.fillStyle = "#8b94a7";
  drawFitted(card.source, 28, 352, CARD_W - 56, [17, 15, 13]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Small plate under a frame: the label of the thing you press [E] on. */
export function makePlaqueTexture(
  text: string,
  opts: { accent?: string; bg?: string } = {},
): THREE.CanvasTexture {
  const { accent = "#4fd1c5", bg = "#0b0e14" } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 92);
  ctx.fillStyle = accent;
  ctx.font = "bold 34px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // ASCII arrow: no font loading, and "[E] OPEN GITHUB /" reads fine.
  ctx.fillText(`${text.slice(0, 18)} /`, 256, 50);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
