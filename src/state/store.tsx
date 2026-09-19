import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createId, nowIso } from "../lib/id";
import { createStore, type CortexStore } from "../lib/storage";
import type { List, Settings, Snapshot, Tag, Task, TaskStatus } from "../types";
import { DEFAULT_SETTINGS } from "../types";

type CortexContextValue = {
  ready: boolean;
  error: string | null;
  lists: List[];
  tags: Tag[];
  tasks: Task[];
  settings: Settings;
  createList: (input: { name: string; emoji?: string; color: string }) => Promise<List>;
  updateList: (list: List) => Promise<void>;
  removeList: (id: string) => Promise<void>;
  createTag: (input: { name: string; color: string }) => Promise<Tag>;
  updateTag: (tag: Tag) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  createTask: (input: Partial<Task> & { title: string }) => Promise<Task | null>;
  updateTask: (task: Task) => Promise<void>;
  setTaskStatus: (task: Task, status: TaskStatus) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
};

const CortexContext = createContext<CortexContextValue | null>(null);

function applySnapshot(setSnap: (snap: Snapshot) => void, next: Snapshot) {
  setSnap(next);
}

export function CortexProvider({
  children,
  storeFactory = createStore,
}: {
  children: ReactNode;
  storeFactory?: () => CortexStore;
}) {
  const store = useMemo(storeFactory, [storeFactory]);
  const [snapshot, setSnapshot] = useState<Snapshot>({
    lists: [],
    tags: [],
    tasks: [],
    settings: DEFAULT_SETTINGS,
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    store
      .load()
      .then((loaded) => {
        if (cancelled) return;
        applySnapshot(setSnapshot, loaded);
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "无法读取本地数据");
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const createList = useCallback(
    async (input: { name: string; emoji?: string; color: string }) => {
      const stamp = nowIso();
      const list: List = {
        id: createId(),
        name: input.name.trim(),
        emoji: input.emoji ?? "",
        color: input.color,
        sortOrder: snapshot.lists.length,
        createdAt: stamp,
        updatedAt: stamp,
      };
      await store.saveList(list);
      setSnapshot((curr) => ({ ...curr, lists: [...curr.lists, list] }));
      return list;
    },
    [snapshot.lists.length, store],
  );

  const updateList = useCallback(
    async (list: List) => {
      const next = { ...list, updatedAt: nowIso() };
      await store.saveList(next);
      setSnapshot((curr) => ({
        ...curr,
        lists: curr.lists.map((item) => (item.id === next.id ? next : item)),
      }));
    },
    [store],
  );

  const removeList = useCallback(
    async (id: string) => {
      await store.deleteList(id);
      setSnapshot((curr) => ({
        ...curr,
        lists: curr.lists.filter((list) => list.id !== id),
        tasks: curr.tasks.map((task) =>
          task.listId === id ? { ...task, listId: null } : task,
        ),
      }));
    },
    [store],
  );

  const createTag = useCallback(
    async (input: { name: string; color: string }) => {
      const tag: Tag = {
        id: createId(),
        name: input.name.trim(),
        color: input.color,
        createdAt: nowIso(),
      };
      await store.saveTag(tag);
      setSnapshot((curr) => ({ ...curr, tags: [...curr.tags, tag] }));
      return tag;
    },
    [store],
  );

  const updateTag = useCallback(
    async (tag: Tag) => {
      await store.saveTag(tag);
      setSnapshot((curr) => ({
        ...curr,
        tags: curr.tags.map((item) => (item.id === tag.id ? tag : item)),
      }));
    },
    [store],
  );

  const removeTag = useCallback(
    async (id: string) => {
      await store.deleteTag(id);
      setSnapshot((curr) => ({
        ...curr,
        tags: curr.tags.filter((tag) => tag.id !== id),
        tasks: curr.tasks.map((task) => ({
          ...task,
          tagIds: task.tagIds.filter((tagId) => tagId !== id),
        })),
      }));
    },
    [store],
  );

  const createTask = useCallback(
    async (input: Partial<Task> & { title: string }) => {
      const title = input.title.trim();
      if (!title) return null;
      const stamp = nowIso();
      const task: Task = {
        id: createId(),
        title,
        listId: input.listId ?? null,
        startDate: input.startDate ?? input.dueDate ?? null,
        dueDate: input.dueDate ?? input.startDate ?? null,
        allDay: input.allDay ?? true,
        priority: input.priority ?? 0,
        status: input.status ?? "open",
        notes: input.notes ?? "",
        completedAt: input.completedAt ?? null,
        tagIds: input.tagIds ?? [],
        sortOrder: snapshot.tasks.length,
        createdAt: stamp,
        updatedAt: stamp,
      };
      await store.saveTask(task);
      setSnapshot((curr) => ({ ...curr, tasks: [...curr.tasks, task] }));
      return task;
    },
    [snapshot.tasks.length, store],
  );

  const updateTask = useCallback(
    async (task: Task) => {
      const next = { ...task, updatedAt: nowIso() };
      await store.saveTask(next);
      setSnapshot((curr) => ({
        ...curr,
        tasks: curr.tasks.map((item) => (item.id === next.id ? next : item)),
      }));
    },
    [store],
  );

  const setTaskStatus = useCallback(
    async (task: Task, status: TaskStatus) => {
      await updateTask({
        ...task,
        status,
        completedAt: status === "completed" ? nowIso() : null,
      });
    },
    [updateTask],
  );

  const removeTask = useCallback(
    async (id: string) => {
      await store.deleteTask(id);
      setSnapshot((curr) => ({
        ...curr,
        tasks: curr.tasks.filter((task) => task.id !== id),
      }));
    },
    [store],
  );

  const updateSettings = useCallback(
    async (settings: Settings) => {
      await store.saveSettings(settings);
      setSnapshot((curr) => ({ ...curr, settings }));
    },
    [store],
  );

  const value = useMemo<CortexContextValue>(
    () => ({
      ready,
      error,
      lists: snapshot.lists,
      tags: snapshot.tags,
      tasks: snapshot.tasks,
      settings: snapshot.settings,
      createList,
      updateList,
      removeList,
      createTag,
      updateTag,
      removeTag,
      createTask,
      updateTask,
      setTaskStatus,
      removeTask,
      updateSettings,
    }),
    [
      createList,
      createTag,
      createTask,
      error,
      ready,
      removeList,
      removeTag,
      removeTask,
      setTaskStatus,
      snapshot,
      updateList,
      updateSettings,
      updateTag,
      updateTask,
    ],
  );

  return <CortexContext.Provider value={value}>{children}</CortexContext.Provider>;
}

export function useCortex(): CortexContextValue {
  const ctx = useContext(CortexContext);
  if (!ctx) throw new Error("useCortex must be used inside CortexProvider");
  return ctx;
}
