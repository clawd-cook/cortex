import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
} from "date-fns";

export type WeekStartsOn = 0 | 1;

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromIsoDate(iso: string): Date {
  return startOfDay(parseISO(iso));
}

export function todayIso(now = new Date()): string {
  return toIsoDate(now);
}

export function addIsoDays(iso: string, amount: number): string {
  return toIsoDate(addDays(fromIsoDate(iso), amount));
}

export function diffIsoDays(later: string, earlier: string): number {
  return differenceInCalendarDays(fromIsoDate(later), fromIsoDate(earlier));
}

export function minIso(a: string, b: string): string {
  return a <= b ? a : b;
}

export function maxIso(a: string, b: string): string {
  return a >= b ? a : b;
}

export function isIsoWithin(iso: string, start: string, end: string): boolean {
  const day = fromIsoDate(iso);
  return isWithinInterval(day, { start: fromIsoDate(start), end: fromIsoDate(end) });
}

export function taskDateRange(task: {
  startDate: string | null;
  dueDate: string | null;
}): { start: string; end: string } | null {
  if (!task.startDate && !task.dueDate) return null;
  if (task.startDate && task.dueDate) {
    return {
      start: minIso(task.startDate, task.dueDate),
      end: maxIso(task.startDate, task.dueDate),
    };
  }
  const only = task.startDate ?? task.dueDate;
  if (!only) return null;
  return { start: only, end: only };
}

export function taskOverlapsDay(
  task: { startDate: string | null; dueDate: string | null },
  iso: string,
): boolean {
  const range = taskDateRange(task);
  if (!range) return false;
  return isIsoWithin(iso, range.start, range.end);
}

export function durationDays(task: {
  startDate: string | null;
  dueDate: string | null;
}): number {
  const range = taskDateRange(task);
  if (!range) return 0;
  return diffIsoDays(range.end, range.start);
}

export function shiftRange(
  task: { startDate: string | null; dueDate: string | null },
  dayDelta: number,
): { startDate: string; dueDate: string } | null {
  const range = taskDateRange(task);
  if (!range) return null;
  return {
    startDate: addIsoDays(range.start, dayDelta),
    dueDate: addIsoDays(range.end, dayDelta),
  };
}

export function formatChip(iso: string, now = new Date()): string {
  const date = fromIsoDate(iso);
  if (isSameDay(date, now)) return "今天";
  if (isSameDay(date, addDays(startOfDay(now), 1))) return "明天";
  return format(date, "M月d日");
}

export type MonthGrid = {
  weeks: string[][];
  month: number;
  year: number;
};

export function buildMonthGrid(
  monthDate: Date,
  weekStartsOn: WeekStartsOn,
): MonthGrid {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn });
  const days = eachDayOfInterval({ start, end });
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7).map(toIsoDate));
  }
  return {
    weeks,
    month: monthDate.getMonth(),
    year: monthDate.getFullYear(),
  };
}

export function weekdayLabels(weekStartsOn: WeekStartsOn): string[] {
  const sunFirst = ["日", "一", "二", "三", "四", "五", "六"];
  return weekStartsOn === 1
    ? ["一", "二", "三", "四", "五", "六", "日"]
    : sunFirst;
}

export function monthTitle(monthDate: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(monthDate);
}
