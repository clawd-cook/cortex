import { invoke } from "@tauri-apps/api/core";
import type { List, Settings, Snapshot, Tag, Task } from "../../types";
import type { CortexStore } from "./contract";

export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

export function createTauriStore(): CortexStore {
  return {
    load: () => invoke<Snapshot>("load_snapshot"),
    saveList: (list: List) => invoke("save_list", { list }),
    deleteList: (id: string) => invoke("delete_list", { id }),
    saveTag: (tag: Tag) => invoke("save_tag", { tag }),
    deleteTag: (id: string) => invoke("delete_tag", { id }),
    saveTask: (task: Task) => invoke("save_task", { task }),
    deleteTask: (id: string) => invoke("delete_task", { id }),
    saveSettings: (settings: Settings) => invoke("save_settings", { settings }),
  };
}
