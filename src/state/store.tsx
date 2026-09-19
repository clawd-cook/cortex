import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { planCsvImport, parseCortexCsv } from "../lib/csv";
import { assertCanDeleteProject } from "../lib/filters";
import { createId, nowIso } from "../lib/id";
import { normalizeIsoDate } from "../lib/dates";
import { createStore, type CortexStore } from "../lib/storage";
import { normalizeHm } from "../lib/times";
import type { List, Settings, Snapshot, Tag, Task, TaskStatus } from "../types";
import {
  DEFAULT_SETTINGS,
  hydrateSettings,
  hydrateTask,
  LIST_COLORS,
  TAG_COLORS,
} from "../types";

type ImportResult = {
  lists: number;
  tags: number;
  tasks: number;
  skipped: number;
};

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
  importCsv: (text: string) => Promise<ImportResult>;
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
        applySnapshot(setSnapshot, {
          lists: loaded.lists ?? [],
          tags: loaded.tags ?? [],
          tasks: (loaded.tasks ?? []).map((task) => hydrateTask(task)),
          settings: hydrateSettings(loaded.settings),
        });
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
      assertCanDeleteProject(snapshot.tasks, id);
      await store.deleteList(id);
      setSnapshot((curr) => ({
        ...curr,
        lists: curr.lists.filter((list) => list.id !== id),
        tasks: curr.tasks.map((task) =>
          task.listId === id ? { ...task, listId: null } : task,
        ),
      }));
    },
    [snapshot.tasks, store],
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
      const listId = input.listId ?? null;
      const startDate = normalizeIsoDate(input.startDate ?? input.dueDate ?? null);
      const dueDate = normalizeIsoDate(input.dueDate ?? input.startDate ?? null);
      const kind = input.kind === "habit" ? ("habit" as const) : ("task" as const);
      const hasDate = startDate != null || dueDate != null;
      // Inbox capture = no date, no list → unprocessed. Date, project, or habit → processed.
      const processed =
        typeof input.processed === "boolean"
          ? input.processed
          : hasDate || listId != null || kind === "habit";
      const actionable = typeof input.actionable === "boolean" ? input.actionable : true;
      const task: Task = {
        id: createId(),
        title,
        listId,
        startDate,
        dueDate,
        allDay: input.allDay ?? !input.startTime,
        startTime: normalizeHm(input.startTime),
        endTime: normalizeHm(input.endTime),
        kind,
        processed,
        actionable,
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
      const startDate = normalizeIsoDate(task.startDate);
      const dueDate = normalizeIsoDate(task.dueDate);
      const hasDate = startDate != null || dueDate != null;
      // Active date assignment or project attach ⇒ clarified.
      const processed =
        hasDate || task.listId != null ? true : Boolean(task.processed);
      const next: Task = {
        ...task,
        startDate,
        dueDate,
        startTime: normalizeHm(task.startTime),
        endTime: normalizeHm(task.endTime),
        kind: task.kind === "habit" ? ("habit" as const) : ("task" as const),
        processed,
        actionable: task.actionable ?? true,
        updatedAt: nowIso(),
      };
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

  const importCsv = useCallback(
    async (text: string) => {
      const parsed = parseCortexCsv(text);
      const stamp = nowIso();
      const plan = planCsvImport(
        parsed,
        snapshot,
        stamp,
        { list: createId, tag: createId, task: createId },
        { list: LIST_COLORS, tag: TAG_COLORS },
      );
      for (const list of plan.lists) await store.saveList(list);
      for (const tag of plan.tags) await store.saveTag(tag);
      for (const task of plan.tasks) await store.saveTask(task);
      setSnapshot((curr) => ({
        ...curr,
        lists: [...curr.lists, ...plan.lists],
        tags: [...curr.tags, ...plan.tags],
        tasks: [...curr.tasks, ...plan.tasks],
      }));
      return {
        lists: plan.lists.length,
        tags: plan.tags.length,
        tasks: plan.tasks.length,
        skipped: parsed.skipped,
      };
    },
    [snapshot, store],
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
      importCsv,
    }),
    [
      createList,
      createTag,
      createTask,
      error,
      importCsv,
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
