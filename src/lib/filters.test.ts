import { describe, expect, it } from "vitest";
import { addIsoDays, todayIso } from "./dates";
import {
  groupByList,
  inboxTasks,
  searchByTitle,
  todayTasks,
  tomorrowTasks,
  undatedOpenTasks,
} from "./filters";
import type { List, Task } from "../types";

function task(partial: Partial<Task> & { id: string; title: string }): Task {
  return {
    listId: null,
    startDate: null,
    dueDate: null,
    allDay: true,
    priority: 0,
    status: "open",
    notes: "",
    completedAt: null,
    tagIds: [],
    sortOrder: 0,
    createdAt: "t",
    updatedAt: "t",
    ...partial,
  };
}

describe("smart lists", () => {
  it("groups today tasks by source list without dropping or misfiling rows", () => {
    const today = todayIso(new Date("2026-09-19T12:00:00"));
    const lists: List[] = [
      {
        id: "proj",
        name: "项目清单",
        emoji: "📦",
        color: "#4f46e5",
        sortOrder: 0,
        createdAt: "t",
        updatedAt: "t",
      },
      {
        id: "next",
        name: "下一步行动池",
        emoji: "🚀",
        color: "#0f7a4a",
        sortOrder: 1,
        createdAt: "t",
        updatedAt: "t",
      },
    ];
    const tasks: Task[] = [];
    for (let i = 0; i < 12; i += 1) {
      tasks.push(
        task({
          id: `inbox-${i}`,
          title: `收集 ${i}`,
          dueDate: today,
        }),
      );
    }
    for (let i = 0; i < 10; i += 1) {
      tasks.push(
        task({
          id: `proj-${i}`,
          title: `需求 ${i}`,
          listId: "proj",
          startDate: i % 2 === 0 ? addIsoDays(today, -1) : today,
          dueDate: i % 2 === 0 ? addIsoDays(today, 1) : today,
        }),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      tasks.push(
        task({
          id: `next-${i}`,
          title: `行动 ${i}`,
          listId: "next",
          dueDate: today,
        }),
      );
    }
    tasks.push(
      task({
        id: "later",
        title: "后天",
        dueDate: addIsoDays(today, 2),
      }),
      task({
        id: "done",
        title: "已完成不应出现",
        dueDate: today,
        status: "completed",
        completedAt: "t",
      }),
      task({
        id: "undated",
        title: "无日期",
      }),
    );

    expect(tasks).toHaveLength(33);
    const todayRows = todayTasks(tasks, today);
    expect(todayRows).toHaveLength(30);
    expect(todayRows.some((row) => row.id === "later")).toBe(false);
    expect(todayRows.some((row) => row.id === "done")).toBe(false);
    expect(todayRows.some((row) => row.id === "undated")).toBe(false);

    const grouped = groupByList(todayRows, lists);
    expect(grouped.map((g) => [g.list?.name ?? "收集箱", g.tasks.length])).toEqual([
      ["收集箱", 12],
      ["项目清单", 10],
      ["下一步行动池", 8],
    ]);
    expect(inboxTasks(tasks)).toHaveLength(14);
    expect(tomorrowTasks(tasks, addIsoDays(today, 1)).some((row) => row.id === "proj-0")).toBe(
      true,
    );
    expect(undatedOpenTasks(tasks).map((row) => row.id)).toEqual(["undated"]);
    expect(searchByTitle(tasks, "需求 3").map((row) => row.id)).toEqual(["proj-3"]);
  });
});
