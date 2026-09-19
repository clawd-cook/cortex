export type TaskStatus = "open" | "completed" | "abandoned" | "trash";

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
  source: "list" | "cell" | "toolbar";
  anchorDate?: string;
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
