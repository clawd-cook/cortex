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
  projectsMissingNext,
  searchByTitle,
  todayTasks,
  tomorrowTasks,
  undatedOpenTasks,
} from "./filters";
import { hydrateTask, type List, type Task } from "../types";

function task(partial: Partial<Task> & { id: string; title: string }): Task {
  return hydrateTask({
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
  });
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
  {
    id: "empty-proj",
    name: "空项目",
    emoji: "🎯",
    color: "#0f7a4a",
    sortOrder: 1,
    createdAt: "t",
    updatedAt: "t",
  },
];

describe("PARA smart lists (processed semantics)", () => {
  const today = todayIso(new Date("2026-09-19T12:00:00"));
  const tasks: Task[] = [
    task({ id: "inbox-1", title: "还没处理", processed: false }),
    task({ id: "inbox-2", title: "另一条收集", processed: false }),
    task({
      id: "solo-undated",
      title: "已处理独立无日期",
      processed: true,
    }),
    task({
      id: "proj-undated",
      title: "项目里没日期",
      listId: "proj",
      processed: true,
    }),
    task({
      id: "proj-today",
      title: "项目里今天",
      listId: "proj",
      startDate: today,
      dueDate: today,
      processed: true,
    }),
    task({
      id: "proj-span",
      title: "项目里跨今天",
      listId: "proj",
      startDate: addIsoDays(today, -1),
      dueDate: addIsoDays(today, 1),
      processed: true,
    }),
    task({
      id: "solo-today",
      title: "独立今天",
      dueDate: today,
      processed: true,
    }),
    task({
      id: "solo-later",
      title: "独立后天",
      dueDate: addIsoDays(today, 2),
      processed: true,
    }),
    task({
      id: "unprocessed-dated",
      title: "不该进今天的未处理",
      dueDate: today,
      processed: false,
    }),
    task({
      id: "waiting",
      title: "等待中",
      listId: "proj",
      processed: true,
      actionable: false,
    }),
    task({
      id: "done-today",
      title: "已完成不应出现",
      dueDate: today,
      status: "completed",
      completedAt: "t",
      processed: true,
    }),
    task({
      id: "done-now",
      title: "收集里勾掉",
      status: "completed",
      completedAt: "t",
      processed: false,
    }),
    task({
      id: "habit-today",
      title: "喝水",
      kind: "habit",
      dueDate: today,
    }),
  ];

  it("inbox is open unprocessed non-habits, not null-list+no-date", () => {
    expect(inboxTasks(tasks).map((row) => row.id)).toEqual(["inbox-1", "inbox-2", "unprocessed-dated"]);
    expect(isInboxTask(task({ id: "solo-undated", title: "x", processed: true }))).toBe(false);
    expect(isInboxTask(task({ id: "done-now", title: "x", status: "completed", processed: false }))).toBe(
      false,
    );
  });

  it("puts processed undated independent in next, not inbox", () => {
    expect(inboxTasks(tasks).some((row) => row.id === "solo-undated")).toBe(false);
    expect(nextTasks(tasks).map((row) => row.id)).toContain("solo-undated");
  });

  it("never puts unprocessed items in today", () => {
    const todayIds = new Set(todayTasks(tasks, today).map((row) => row.id));
    expect(todayIds.has("inbox-1")).toBe(false);
    expect(todayIds.has("unprocessed-dated")).toBe(false);
    for (const id of inboxTasks(tasks).map((row) => row.id)) {
      expect(todayIds.has(id)).toBe(false);
    }
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

  it("excludes non-actionable from next and today", () => {
    expect(nextTasks(tasks).some((row) => row.id === "waiting")).toBe(false);
    expect(todayTasks(tasks, today).some((row) => row.id === "waiting")).toBe(false);
  });

  it("keeps completed work and habits out of smart lists", () => {
    const todayRows = todayTasks(tasks, today);
    expect(todayRows.some((row) => row.id === "done-today")).toBe(false);
    expect(todayRows.some((row) => row.id === "done-now")).toBe(false);
    expect(todayRows.some((row) => row.id === "habit-today")).toBe(false);
    expect(nextTasks(tasks).some((row) => row.id === "done-today")).toBe(false);
    expect(inboxTasks(tasks).some((row) => row.id === "done-now")).toBe(false);
  });

  it("completed inbox fold uses unprocessed completed, not null-list", () => {
    expect(completedInboxTasks(tasks).map((row) => row.id)).toEqual(["done-now"]);
  });

  it("calendar undated queue is next ∩ no date (excludes inbox)", () => {
    expect(undatedOpenTasks(tasks).map((row) => row.id).sort()).toEqual(
      ["proj-undated", "solo-undated"].sort(),
    );
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
    expect(searchByTitle(tasks, "项目里今天").map((row) => row.id)).toEqual(["proj-today"]);
  });

  it("flags projects missing open actionable next", () => {
    expect(projectsMissingNext(lists, tasks).map((list) => list.id)).toEqual(["empty-proj"]);
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

describe("hydrateTask processed migration", () => {
  it("marks open null-list undated as unprocessed when field missing", () => {
    const row = hydrateTask({ id: "a", title: "抓住" });
    expect(row.processed).toBe(false);
    expect(row.actionable).toBe(true);
  });

  it("marks dated or listed open tasks as processed when field missing", () => {
    expect(hydrateTask({ id: "b", title: "有期", dueDate: "2026-09-19" }).processed).toBe(true);
    expect(hydrateTask({ id: "c", title: "有项", listId: "proj" }).processed).toBe(true);
  });

  it("preserves explicit processed false even with a date (legacy edge)", () => {
    expect(
      hydrateTask({ id: "d", title: "怪", dueDate: "2026-09-19", processed: false }).processed,
    ).toBe(false);
  });
});
