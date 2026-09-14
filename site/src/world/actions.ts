import { useWorldStore } from "./store";
import type { Action, DoorTarget } from "./types";

export function runAction(action: Action) {
  const store = useWorldStore.getState();
  switch (action.type) {
    case "panel":
      store.openPanel(action.panel);
      break;
    case "link":
      window.open(action.href, "_blank", "noopener");
      break;
  }
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
