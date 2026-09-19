import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "./contract";
import { createWebStore } from "./web";

function ensureLocalStorage() {
  if (typeof globalThis.localStorage?.clear === "function") {
    globalThis.localStorage.clear();
    return;
  }
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, String(value));
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
      clear: () => data.clear(),
      key: (index: number) => [...data.keys()][index] ?? null,
      get length() {
        return data.size;
      },
    },
  });
}

describe("web store persistence", () => {
  beforeEach(() => {
    ensureLocalStorage();
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
      processed: true,
      actionable: true,
      priority: 0,
      status: "open",
      notes: "",
      completedAt: null,
      tagIds: [],
      sortOrder: 0,
      createdAt: "t",
      updatedAt: "t",
    });
    expect(STORAGE_KEY).toBe("cortex:v2");
    expect(localStorage.getItem(STORAGE_KEY)).toContain("关掉再打开还在");

    const second = createWebStore();
    const snap = await second.load();
    expect(snap.tasks[0]?.title).toBe("关掉再打开还在");
    expect(snap.tasks[0]?.processed).toBe(true);
  });

  it("migrates missing processed on load: undated capture stays unprocessed", async () => {
    localStorage.setItem(
      "cortex:v2",
      JSON.stringify({
        lists: [],
        tags: [],
        tasks: [{ id: "old", title: "旧收集", listId: null, status: "open" }],
        settings: {},
      }),
    );
    const store = createWebStore();
    const snap = await store.load();
    expect(snap.tasks[0]?.processed).toBe(false);
    expect(snap.tasks[0]?.actionable).toBe(true);
  });

  it("does not load cortex:v1 snapshots", async () => {
    localStorage.setItem(
      "cortex:v1",
      JSON.stringify({
        lists: [],
        tags: [],
        tasks: [{ id: "old", title: "旧快照" }],
        settings: {},
      }),
    );
    const store = createWebStore();
    const snap = await store.load();
    expect(snap.tasks).toEqual([]);
    expect(localStorage.getItem("cortex:v2")).toBeNull();
  });
});
