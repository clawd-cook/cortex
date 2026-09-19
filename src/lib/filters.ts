import { isHabit, type List, type Task, type TaskStatus } from "../types";
import { taskDateRange, taskOverlapsDay } from "./dates";

export const PROJECT_DELETE_BLOCKED =
  "项目还有未完成的下一步，先做完、扔掉，或挂到别的项目后再删除。";

export function isOpen(task: Task): boolean {
  return task.status === "open";
}

export function workTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !isHabit(task));
}

/** 收集箱：未完成 ∧ 未处理 ∧ 非习惯 */
export function isInboxTask(task: Task): boolean {
  return !isHabit(task) && isOpen(task) && !task.processed;
}

export function inboxTasks(tasks: Task[]): Task[] {
  return tasks.filter(isInboxTask);
}

/** 下一步：未完成 ∧ 已处理 ∧ 可动手 ∧ 非习惯 */
export function isNextTask(task: Task): boolean {
  return !isHabit(task) && isOpen(task) && task.processed && task.actionable;
}

export function nextTasks(tasks: Task[]): Task[] {
  return tasks.filter(isNextTask);
}

export function tasksForList(tasks: Task[], listId: string): Task[] {
  return workTasks(tasks).filter((task) => task.listId === listId && isOpen(task));
}

/** 进行中项目里没有可动手下一步的项目 */
export function projectsMissingNext(lists: List[], tasks: Task[]): List[] {
  return lists.filter(
    (list) => !tasks.some((task) => task.listId === list.id && isNextTask(task)),
  );
}

export function assertCanDeleteProject(tasks: Task[], projectId: string): void {
  if (tasksForList(tasks, projectId).length > 0) {
    throw new Error(PROJECT_DELETE_BLOCKED);
  }
}

export function tasksForStatus(tasks: Task[], status: TaskStatus): Task[] {
  return workTasks(tasks).filter((task) => task.status === status);
}

export function tasksForTag(tasks: Task[], tagId: string): Task[] {
  return workTasks(tasks).filter((task) => task.tagIds.includes(tagId) && isOpen(task));
}

export function todayTasks(tasks: Task[], todayIso: string): Task[] {
  return nextTasks(tasks).filter((task) => taskOverlapsDay(task, todayIso));
}

export function tomorrowTasks(tasks: Task[], tomorrowIso: string): Task[] {
  return nextTasks(tasks).filter((task) => taskOverlapsDay(task, tomorrowIso));
}

/** 日历未排期队列：已处理的无日期下一步（不含未处理收集项） */
export function undatedOpenTasks(tasks: Task[]): Task[] {
  return nextTasks(tasks).filter((task) => taskDateRange(task) === null);
}

export function openHabits(tasks: Task[]): Task[] {
  return tasks.filter((task) => isHabit(task) && isOpen(task));
}

export function habitsOnDay(tasks: Task[], iso: string, today: string): Task[] {
  return openHabits(tasks).filter((task) => {
    const range = taskDateRange(task);
    if (!range) return iso === today;
    return taskOverlapsDay(task, iso);
  });
}

export function groupByList(
  tasks: Task[],
  lists: List[],
): { list: List | null; tasks: Task[] }[] {
  const byId = new Map(lists.map((list) => [list.id, list]));
  const groups = new Map<string, Task[]>();
  const independent: Task[] = [];
  for (const task of tasks) {
    if (!task.listId) {
      independent.push(task);
      continue;
    }
    const bucket = groups.get(task.listId) ?? [];
    bucket.push(task);
    groups.set(task.listId, bucket);
  }
  const result: { list: List | null; tasks: Task[] }[] = [];
  if (independent.length > 0) result.push({ list: null, tasks: independent });
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
  return workTasks(tasks).filter(
    (task) =>
      task.status === "completed" &&
      (listId === null ? task.listId === null : task.listId === listId),
  );
}

/** 收集箱已完成折页：完成时仍是未处理（不要用 completedInList(..., null)） */
export function completedInboxTasks(tasks: Task[]): Task[] {
  return workTasks(tasks).filter(
    (task) => task.status === "completed" && !task.processed,
  );
}

export function searchByTitle(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return tasks.filter((task) => task.title.toLowerCase().includes(q));
}

export function countOpen(tasks: Task[]): number {
  return workTasks(tasks).filter(isOpen).length;
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
