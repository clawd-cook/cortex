import { describe, expect, it } from "vitest";
import { addIsoDays, todayIso } from "./dates";
import {
  PROJECT_DELETE_BLOCKED,
  assertCanDeleteProject,
  completedInboxTasks,
  groupByList,
  inboxTasks,
  isInboxTask,
  nextTasks,
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
    startTime: null,
    endTime: null,
    kind: "task",
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

const lists: List[] = [
  {
    id: "proj",
    name: "对账清零",
    emoji: "📦",
    color: "#4f46e5",
    sortOrder: 0,
    createdAt: "t",
    updatedAt: "t",
  },
];

describe("PARA smart lists", () => {
  const today = todayIso(new Date("2026-09-19T12:00:00"));
  const tasks: Task[] = [
    task({ id: "inbox-1", title: "还没处理" }),
    task({ id: "inbox-2", title: "另一条收集" }),
    task({
      id: "proj-undated",
      title: "项目里没日期",
      listId: "proj",
    }),
    task({
      id: "proj-today",
      title: "项目里今天",
      listId: "proj",
      startDate: today,
      dueDate: today,
    }),
    task({
      id: "proj-span",
      title: "项目里跨今天",
      listId: "proj",
      startDate: addIsoDays(today, -1),
      dueDate: addIsoDays(today, 1),
    }),
    task({
      id: "solo-today",
      title: "独立今天",
      dueDate: today,
    }),
    task({
      id: "solo-later",
      title: "独立后天",
      dueDate: addIsoDays(today, 2),
    }),
    task({
      id: "done-today",
      title: "已完成不应出现",
      dueDate: today,
      status: "completed",
      completedAt: "t",
    }),
    task({
      id: "done-now",
      title: "现在做完",
      status: "completed",
      completedAt: "t",
    }),
    task({
      id: "habit-today",
      title: "喝水",
      kind: "habit",
      dueDate: today,
    }),
  ];

  it("keeps inbox as unprocessed: no project and no date", () => {
    expect(inboxTasks(tasks).map((row) => row.id)).toEqual(["inbox-1", "inbox-2"]);
    expect(tasks.filter(isInboxTask).some((row) => row.id === "solo-today")).toBe(false);
    expect(isInboxTask(task({ id: "done-now", title: "现在做完", status: "completed" }))).toBe(
      false,
    );
  });

  it("does not overlap inbox and today", () => {
    const inboxIds = new Set(inboxTasks(tasks).map((row) => row.id));
    const todayIds = new Set(todayTasks(tasks, today).map((row) => row.id));
    for (const id of inboxIds) {
      expect(todayIds.has(id)).toBe(false);
    }
    expect(todayIds.has("inbox-1")).toBe(false);
    expect(todayIds.has("inbox-2")).toBe(false);
  });

  it("puts undated project tasks in next, not today or inbox", () => {
    expect(nextTasks(tasks).map((row) => row.id)).toContain("proj-undated");
    expect(todayTasks(tasks, today).some((row) => row.id === "proj-undated")).toBe(false);
    expect(inboxTasks(tasks).some((row) => row.id === "proj-undated")).toBe(false);
  });

  it("puts dated independent tasks in next and today, not inbox", () => {
    expect(inboxTasks(tasks).some((row) => row.id === "solo-today")).toBe(false);
    expect(nextTasks(tasks).map((row) => row.id)).toContain("solo-today");
    expect(todayTasks(tasks, today).map((row) => row.id)).toContain("solo-today");
  });

  it("keeps completed work and habits out of smart lists", () => {
    const todayRows = todayTasks(tasks, today);
    expect(todayRows.some((row) => row.id === "done-today")).toBe(false);
    expect(todayRows.some((row) => row.id === "done-now")).toBe(false);
    expect(todayRows.some((row) => row.id === "habit-today")).toBe(false);
    expect(nextTasks(tasks).some((row) => row.id === "done-today")).toBe(false);
    expect(inboxTasks(tasks).some((row) => row.id === "done-now")).toBe(false);
  });

  it("does not treat completed independent next as inbox completed", () => {
    expect(completedInboxTasks(tasks).map((row) => row.id)).toEqual(["done-now"]);
  });

  it("groups today by project and labels callers' null group as independent", () => {
    const todayRows = todayTasks(tasks, today);
    expect(todayRows.map((row) => row.id).sort()).toEqual(
      ["proj-span", "proj-today", "solo-today"].sort(),
    );
    const grouped = groupByList(todayRows, lists);
    expect(grouped.map((g) => [g.list?.name ?? "独立", g.tasks.map((row) => row.id)])).toEqual([
      ["独立", ["solo-today"]],
      ["对账清零", ["proj-today", "proj-span"]],
    ]);
    expect(tomorrowTasks(tasks, addIsoDays(today, 1)).some((row) => row.id === "proj-span")).toBe(
      true,
    );
    expect(undatedOpenTasks(tasks).map((row) => row.id)).toEqual([
      "inbox-1",
      "inbox-2",
      "proj-undated",
    ]);
    expect(searchByTitle(tasks, "项目里今天").map((row) => row.id)).toEqual(["proj-today"]);
  });

  it("blocks deleting a project that still has open next actions", () => {
    expect(() => assertCanDeleteProject(tasks, "proj")).toThrow(PROJECT_DELETE_BLOCKED);
    const cleared = tasks.map((row) =>
      row.listId === "proj" ? { ...row, status: "completed" as const, completedAt: "t" } : row,
    );
    expect(() => assertCanDeleteProject(cleared, "proj")).not.toThrow();
    expect(() =>
      assertCanDeleteProject(
        [
          task({
            id: "habit-in-proj",
            title: "习惯不挡删除",
            listId: "proj",
            kind: "habit",
          }),
        ],
        "proj",
      ),
    ).not.toThrow();
  });
});
