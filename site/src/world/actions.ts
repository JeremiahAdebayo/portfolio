import { useWorldStore } from "./store";
import type { Action, DoorTarget } from "./types";

export function runAction(action: Action) {
  const store = useWorldStore.getState();
  switch (action.type) {
    case "panel":
      store.openPanel(action.panel);
      break;
    case "link":
      openExternal(action.href);
      break;
  }
}

/**
 * An anchor click, not window.open. Measured in headless Chromium: a real
 * target=_blank anchor opens a tab, while window.open(url, "_blank", "noopener")
 * silently does not (the feature string is what kills it), and a GitHub link that
 * nothing happens when you press is worse than no link at all. The anchor keeps
 * the same protection - rel="noopener noreferrer" - and inherits the user
 * activation from the keydown that got us here.
 */
function openExternal(href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
}

export function goThroughDoor(door: DoorTarget) {
  useWorldStore.getState().setTransition(1);
  window.setTimeout(() => {
    useWorldStore.getState().enterRoom(door.targetRoom, door.spawn);
    window.setTimeout(() => {
      useWorldStore.getState().setTransition(0);
    }, 200);
  }, 250);
}
