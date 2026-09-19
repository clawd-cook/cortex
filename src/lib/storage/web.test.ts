import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "./contract";
import { createWebStore } from "./web";

describe("web store persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reloads tasks after a simulated restart", async () => {
    const first = createWebStore();
    await first.saveTask({
      id: "t1",
      title: "关掉再打开还在",
      listId: null,
      startDate: "2026-09-19",
      dueDate: "2026-09-19",
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
    });
    expect(localStorage.getItem(STORAGE_KEY)).toContain("关掉再打开还在");

    const second = createWebStore();
    const snap = await second.load();
    expect(snap.tasks[0]?.title).toBe("关掉再打开还在");
  });
});
