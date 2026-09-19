export type TaskStatus = "open" | "completed" | "abandoned" | "trash";

export type TaskKind = "task" | "habit";

export type List = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  listId: string | null;
  startDate: string | null;
  dueDate: string | null;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  kind: TaskKind;
  /** False = still in 收集箱 (unclarified). Active date or project attach sets true. */
  processed: boolean;
  /** Thin GTD flag; false hides from 下一步 / 今天. Defaults true. */
  actionable: boolean;
  priority: 0 | 1 | 2 | 3;
  status: TaskStatus;
  notes: string;
  completedAt: string | null;
  tagIds: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  weekStartsOn: 0 | 1;
  showCompleted: boolean;
  showLunar: boolean;
  showWeekNumbers: boolean;
  showHolidays: boolean;
  showHabits: boolean;
};

export type Snapshot = {
  lists: List[];
  tags: Tag[];
  tasks: Task[];
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  weekStartsOn: 1,
  showCompleted: false,
  showLunar: true,
  showWeekNumbers: true,
  showHolidays: true,
  showHabits: true,
};

export const LIST_FALLBACK_COLOR = "#57534e";

export const LIST_COLORS = [
  "#4f46e5",
  "#0f7a4a",
  "#b42318",
  "#a16207",
  "#0e7490",
  "#7c3aed",
  "#be185d",
  "#44403c",
] as const;

export const TAG_COLORS = [
  "#2563eb",
  "#db2777",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0891b2",
] as const;

export type Draft = {
  title: string;
  listId: string | null;
  startDate: string | null;
  dueDate: string | null;
  tagIds: string[];
  source: "list" | "cell" | "toolbar" | "slot";
  anchorDate?: string;
  allDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  kind?: TaskKind;
};

export const EMOJI_CHOICES = [
  "📦",
  "🚀",
  "🎯",
  "💡",
  "🏠",
  "🛠",
  "📚",
  "🌱",
  "⭐",
  "🧠",
] as const;

export function isHabit(task: { kind?: string | null }): boolean {
  return task.kind === "habit";
}

export function hydrateSettings(raw?: Partial<Settings> | null): Settings {
  return { ...DEFAULT_SETTINGS, ...raw };
}

export function hydrateTask(raw: Partial<Task> & Pick<Task, "id" | "title">): Task {
  const listId = raw.listId ?? null;
  const startDate = raw.startDate ?? null;
  const dueDate = raw.dueDate ?? null;
  const kind = raw.kind === "habit" ? "habit" : "task";
  const status = raw.status ?? "open";
  const hasDate = startDate != null || dueDate != null;
  // Migration: missing processed → only open undated independent non-habits stay unprocessed.
  const processed =
    typeof raw.processed === "boolean"
      ? raw.processed
      : !(status === "open" && listId === null && !hasDate && kind !== "habit");
  const actionable = typeof raw.actionable === "boolean" ? raw.actionable : true;
  return {
    id: raw.id,
    title: raw.title,
    listId,
    startDate,
    dueDate,
    allDay: raw.allDay ?? true,
    startTime: raw.startTime ?? null,
    endTime: raw.endTime ?? null,
    kind,
    processed,
    actionable,
    priority: raw.priority ?? 0,
    status,
    notes: raw.notes ?? "",
    completedAt: raw.completedAt ?? null,
    tagIds: raw.tagIds ?? [],
    sortOrder: raw.sortOrder ?? 0,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}
