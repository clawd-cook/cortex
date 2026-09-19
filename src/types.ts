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
  return {
    id: raw.id,
    title: raw.title,
    listId: raw.listId ?? null,
    startDate: raw.startDate ?? null,
    dueDate: raw.dueDate ?? null,
    allDay: raw.allDay ?? true,
    startTime: raw.startTime ?? null,
    endTime: raw.endTime ?? null,
    kind: raw.kind === "habit" ? "habit" : "task",
    priority: raw.priority ?? 0,
    status: raw.status ?? "open",
    notes: raw.notes ?? "",
    completedAt: raw.completedAt ?? null,
    tagIds: raw.tagIds ?? [],
    sortOrder: raw.sortOrder ?? 0,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}
