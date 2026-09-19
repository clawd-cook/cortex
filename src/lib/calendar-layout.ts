import { taskDateRange, maxIso, minIso } from "./dates";
import type { Task } from "../types";

export type LayoutBar = {
  taskId: string;
  weekIndex: number;
  lane: number;
  startCol: number;
  span: number;
  showTitle: boolean;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

const MAX_LANES = 3;

export function layoutMonthBars(
  tasks: Task[],
  weeks: string[][],
): { bars: LayoutBar[]; overflow: Map<string, number> } {
  const bars: LayoutBar[] = [];
  const overflow = new Map<string, number>();
  const dated = tasks
    .map((task) => {
      const range = taskDateRange(task);
      return range ? { task, range } : null;
    })
    .filter((entry): entry is { task: Task; range: { start: string; end: string } } =>
      Boolean(entry),
    )
    .slice()
    .sort((a, b) => {
      if (a.range.start !== b.range.start) {
        return a.range.start.localeCompare(b.range.start);
      }
      return b.range.end.localeCompare(a.range.end);
    });

  weeks.forEach((week, weekIndex) => {
    const weekStart = week[0];
    const weekEnd = week[6];
    const occupying: { endCol: number; lane: number }[] = [];

    for (const { task, range } of dated) {
      if (range.end < weekStart || range.start > weekEnd) continue;
      const clippedStart = maxIso(range.start, weekStart);
      const clippedEnd = minIso(range.end, weekEnd);
      const startCol = week.indexOf(clippedStart);
      const endCol = week.indexOf(clippedEnd);
      if (startCol < 0 || endCol < 0) continue;
      occupying.sort((a, b) => a.lane - b.lane);
      let lane = 0;
      const taken = new Set(
        occupying.filter((item) => item.endCol >= startCol).map((item) => item.lane),
      );
      while (taken.has(lane)) lane += 1;
      if (lane >= MAX_LANES) {
        for (let col = startCol; col <= endCol; col += 1) {
          const key = week[col];
          overflow.set(key, (overflow.get(key) ?? 0) + 1);
        }
        continue;
      }
      occupying.push({ endCol, lane });
      bars.push({
        taskId: task.id,
        weekIndex,
        lane,
        startCol,
        span: endCol - startCol + 1,
        showTitle: clippedStart === range.start,
        continuesBefore: range.start < weekStart,
        continuesAfter: range.end > weekEnd,
      });
    }
  });

  return { bars, overflow };
}

export { MAX_LANES };
