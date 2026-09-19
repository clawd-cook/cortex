import { DEFAULT_SETTINGS, hydrateSettings, hydrateTask, type List, type Settings, type Snapshot, type Tag, type Task } from "../../types";
import { STORAGE_KEY, type CortexStore } from "./contract";

type Memory = { snapshot: Snapshot };

function emptySnapshot(): Snapshot {
  return { lists: [], tags: [], tasks: [], settings: { ...DEFAULT_SETTINGS } };
}

function read(memory: Memory): Snapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return memory.snapshot;
    const parsed = JSON.parse(raw) as Snapshot;
    memory.snapshot = {
      lists: parsed.lists ?? [],
      tags: parsed.tags ?? [],
      tasks: (parsed.tasks ?? []).filter((task) => task.id && task.title).map((task) => hydrateTask(task)),
      settings: hydrateSettings(parsed.settings),
    };
    return memory.snapshot;
  } catch {
    return memory.snapshot;
  }
}

function write(memory: Memory, snapshot: Snapshot): void {
  memory.snapshot = snapshot;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private browsing / quota — keep in-memory snapshot.
  }
}

export function createWebStore(): CortexStore {
  const memory: Memory = { snapshot: emptySnapshot() };
  return {
    async load() {
      return structuredClone(read(memory));
    },
    async saveList(list: List) {
      const snap = read(memory);
      const lists = snap.lists.some((item) => item.id === list.id)
        ? snap.lists.map((item) => (item.id === list.id ? list : item))
        : [...snap.lists, list];
      write(memory, { ...snap, lists });
    },
    async deleteList(id: string) {
      const snap = read(memory);
      write(memory, {
        ...snap,
        lists: snap.lists.filter((list) => list.id !== id),
        tasks: snap.tasks.map((task) =>
          task.listId === id ? { ...task, listId: null } : task,
        ),
      });
    },
    async saveTag(tag: Tag) {
      const snap = read(memory);
      const tags = snap.tags.some((item) => item.id === tag.id)
        ? snap.tags.map((item) => (item.id === tag.id ? tag : item))
        : [...snap.tags, tag];
      write(memory, { ...snap, tags });
    },
    async deleteTag(id: string) {
      const snap = read(memory);
      write(memory, {
        ...snap,
        tags: snap.tags.filter((tag) => tag.id !== id),
        tasks: snap.tasks.map((task) => ({
          ...task,
          tagIds: task.tagIds.filter((tagId) => tagId !== id),
        })),
      });
    },
    async saveTask(task: Task) {
      const snap = read(memory);
      const tasks = snap.tasks.some((item) => item.id === task.id)
        ? snap.tasks.map((item) => (item.id === task.id ? task : item))
        : [...snap.tasks, task];
      write(memory, { ...snap, tasks });
    },
    async deleteTask(id: string) {
      const snap = read(memory);
      write(memory, {
        ...snap,
        tasks: snap.tasks.filter((task) => task.id !== id),
      });
    },
    async saveSettings(settings: Settings) {
      const snap = read(memory);
      write(memory, { ...snap, settings });
    },
  };
}
