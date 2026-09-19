import type { List, Settings, Snapshot, Tag, Task } from "../../types";

export interface CortexStore {
  load(): Promise<Snapshot>;
  saveList(list: List): Promise<void>;
  deleteList(id: string): Promise<void>;
  saveTag(tag: Tag): Promise<void>;
  deleteTag(id: string): Promise<void>;
  saveTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
}

export const STORAGE_KEY = "cortex:v1";
