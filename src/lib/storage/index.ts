import type { CortexStore } from "./contract";
import { createTauriStore, isTauri } from "./tauri";
import { createWebStore } from "./web";

export function createStore(): CortexStore {
  return isTauri() ? createTauriStore() : createWebStore();
}

export { isTauri };
export type { CortexStore } from "./contract";
