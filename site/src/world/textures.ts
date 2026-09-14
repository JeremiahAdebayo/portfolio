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

/** Tiled floor texture — one tile per repeat. */
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
