import { format } from "date-fns";
import { isHabit, type Task } from "../types";
import { fromIsoDate, isIsoWithin, taskDateRange, toIsoDate } from "./dates";

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  completed: Task[];
  incomplete: Task[];
};

function stampDate(stamp: string | null): string | null {
  if (!stamp) return null;
  const parsed = new Date(stamp);
  if (!Number.isNaN(parsed.getTime())) return toIsoDate(parsed);
  return stamp.slice(0, 10);
}

export function weekSummary(tasks: Task[], weekStart: string, weekEnd: string): WeekSummary {
  const completed: Task[] = [];
  const incomplete: Task[] = [];
  for (const task of tasks) {
    if (isHabit(task)) continue;
    if (task.status === "trash" || task.status === "abandoned") continue;
    if (task.status === "completed") {
      const doneOn = stampDate(task.completedAt);
      if (doneOn && isIsoWithin(doneOn, weekStart, weekEnd)) completed.push(task);
      continue;
    }
    if (task.status !== "open") continue;
    const range = taskDateRange(task);
    if (!range) continue;
    if (range.end < weekStart || range.start > weekEnd) continue;
    incomplete.push(task);
  }
  return { weekStart, weekEnd, completed, incomplete };
}

export function formatWeekSummary(summary: WeekSummary): string {
  const start = format(fromIsoDate(summary.weekStart), "M月d日");
  const end = format(fromIsoDate(summary.weekEnd), "M月d日");
  const lines = [`本周摘要（${start} – ${end}）`, "", `已完成 · ${summary.completed.length}`];
  if (summary.completed.length === 0) lines.push("- （无）");
  else {
    for (const task of summary.completed) lines.push(`- ${task.title}`);
  }
  lines.push("", `未完成 · ${summary.incomplete.length}`);
  if (summary.incomplete.length === 0) lines.push("- （无）");
  else {
    for (const task of summary.incomplete) lines.push(`- ${task.title}`);
  }
  return lines.join("\n");
}
