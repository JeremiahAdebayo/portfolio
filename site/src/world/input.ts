import { useEffect, useRef } from "react";

export interface Dir {
  x: number;
  z: number;
}

const KEY_DIRS: Record<string, Dir> = {
  KeyW: { x: 0, z: -1 },
  ArrowUp: { x: 0, z: -1 },
  KeyS: { x: 0, z: 1 },
  ArrowDown: { x: 0, z: 1 },
  KeyA: { x: -1, z: 0 },
  ArrowLeft: { x: -1, z: 0 },
  KeyD: { x: 1, z: 0 },
  ArrowRight: { x: 1, z: 0 },
};

export function getMoveDir(keys: Set<string>): Dir {
  let x = 0;
  let z = 0;
  for (const key of keys) {
    const d = KEY_DIRS[key];
    if (d) {
      x += d.x;
      z += d.z;
    }
  }
  const len = Math.hypot(x, z);
  return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
}

export function useKeyboard(handlers: {
  onInteract: () => void;
  onPause: () => void;
}) {
  const keys = useRef<Set<string>>(new Set());
  const h = useRef(handlers);
  // Latest handlers are published after every commit (never during render), and
  // always before the browser can deliver an input event.
  useEffect(() => {
    h.current = handlers;
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "KeyE") {
        h.current.onInteract();
        return;
      }
      if (e.code === "Escape") {
        h.current.onPause();
        return;
      }
      if (KEY_DIRS[e.code]) {
        e.preventDefault(); // stop arrow-key page scroll
        keys.current.add(e.code);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  return keys;
}
