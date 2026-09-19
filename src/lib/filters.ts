import { taskDateRange, taskOverlapsDay } from "./dates";
import type { List, Task, TaskStatus } from "../types";

export function isOpen(task: Task): boolean {
  return task.status === "open";
}

export function inboxTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.listId === null && isOpen(task));
}

export function tasksForList(tasks: Task[], listId: string): Task[] {
  return tasks.filter((task) => task.listId === listId && isOpen(task));
}

export function tasksForStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task) => task.status === status);
}

export function tasksForTag(tasks: Task[], tagId: string): Task[] {
  return tasks.filter((task) => task.tagIds.includes(tagId) && isOpen(task));
}

export function todayTasks(tasks: Task[], todayIso: string): Task[] {
  return tasks.filter((task) => isOpen(task) && taskOverlapsDay(task, todayIso));
}

export function tomorrowTasks(tasks: Task[], tomorrowIso: string): Task[] {
  return tasks.filter(
    (task) => isOpen(task) && taskOverlapsDay(task, tomorrowIso),
  );
}

export function undatedOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => isOpen(task) && taskDateRange(task) === null);
}

export function groupByList(
  tasks: Task[],
  lists: List[],
): { list: List | null; tasks: Task[] }[] {
  const byId = new Map(lists.map((list) => [list.id, list]));
  const groups = new Map<string, Task[]>();
  const inbox: Task[] = [];
  for (const task of tasks) {
    if (!task.listId) {
      inbox.push(task);
      continue;
    }
    const bucket = groups.get(task.listId) ?? [];
    bucket.push(task);
    groups.set(task.listId, bucket);
  }
  const result: { list: List | null; tasks: Task[] }[] = [];
  if (inbox.length > 0) result.push({ list: null, tasks: inbox });
  for (const list of lists) {
    const grouped = groups.get(list.id);
    if (grouped?.length) result.push({ list, tasks: grouped });
  }
  for (const [listId, grouped] of groups) {
    if (!byId.has(listId) && grouped.length > 0) {
      result.push({ list: null, tasks: grouped });
    }
  }
  return result;
}

export function completedInList(
  tasks: Task[],
  listId: string | null,
): Task[] {
  return tasks.filter(
    (task) =>
      task.status === "completed" &&
      (listId === null ? task.listId === null : task.listId === listId),
  );
}

export function searchByTitle(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return tasks.filter((task) => task.title.toLowerCase().includes(q));
}

export function countOpen(tasks: Task[]): number {
  return tasks.filter(isOpen).length;
}

export function splitOpenCompleted(tasks: Task[]): {
  open: Task[];
  completed: Task[];
} {
  const open: Task[] = [];
  const completed: Task[] = [];
  for (const task of tasks) {
    if (task.status === "completed") completed.push(task);
    else if (task.status === "open") open.push(task);
  }
  return { open, completed };
}
