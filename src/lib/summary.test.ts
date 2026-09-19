import { describe, expect, it } from "vitest";
import { formatWeekSummary, weekSummary } from "./summary";
import type { Task } from "../types";
import { hydrateTask } from "../types";

function task(partial: Partial<Task> & { id: string; title: string }): Task {
  return hydrateTask(partial);
}

describe("weekly summary", () => {
  it("groups by completedAt and due range without habits or AI text", () => {
    const tasks = [
      task({
        id: "done",
        title: "写周报",
        status: "completed",
        completedAt: "2026-09-16T08:00:00.000Z",
        dueDate: "2026-09-16",
      }),
      task({
        id: "open",
        title: "未完成需求",
        dueDate: "2026-09-18",
      }),
      task({
        id: "later",
        title: "下周",
        dueDate: "2026-09-22",
      }),
      task({
        id: "habit",
        title: "喝水",
        kind: "habit",
        dueDate: "2026-09-16",
      }),
    ];
    const summary = weekSummary(tasks, "2026-09-14", "2026-09-20");
    expect(summary.completed.map((item) => item.id)).toEqual(["done"]);
    expect(summary.incomplete.map((item) => item.id)).toEqual(["open"]);
    const text = formatWeekSummary(summary);
    expect(text).toContain("已完成 · 1");
    expect(text).toContain("- 写周报");
    expect(text).toContain("- 未完成需求");
    expect(text).not.toContain("喝水");
  });
});
