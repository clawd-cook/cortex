import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PROJECT_DELETE_BLOCKED } from "../lib/filters";
import { createWebStore } from "../lib/storage/web";
import type { List, Task } from "../types";
import { CortexProvider, useCortex } from "./store";

function list(partial: Partial<List> & { id: string; name: string }): List {
  return {
    emoji: "📦",
    color: "#4f46e5",
    sortOrder: 0,
    createdAt: "t",
    updatedAt: "t",
    ...partial,
  };
}

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

let api: ReturnType<typeof useCortex> | null = null;
let root: Root | null = null;
let host: HTMLDivElement | null = null;

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

function Probe() {
  api = useCortex();
  return null;
}

async function mount(store = createWebStore()) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  const factory = () => store;
  await act(async () => {
    root!.render(
      <CortexProvider storeFactory={factory}>
        <Probe />
      </CortexProvider>,
    );
  });
  for (let i = 0; i < 20 && !api?.ready; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  if (!api?.ready) throw new Error("store did not become ready");
  return store;
}

describe("project delete guard", () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    ensureLocalStorage();
    api = null;
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    host?.remove();
    root = null;
    host = null;
    api = null;
  });

  it("refuses to delete a project that still has open next actions", async () => {
    const store = createWebStore();
    await store.saveList(list({ id: "p1", name: "对账清零" }));
    await store.saveTask(task({ id: "t1", title: "写第一步", listId: "p1" }));
    await mount(store);
    await expect(api!.removeList("p1")).rejects.toThrow(PROJECT_DELETE_BLOCKED);
    const snap = await store.load();
    expect(snap.lists.map((item) => item.id)).toEqual(["p1"]);
  });

  it("deletes a project after its open next actions are gone", async () => {
    const store = createWebStore();
    await store.saveList(list({ id: "p1", name: "对账清零" }));
    await store.saveTask(
      task({
        id: "t1",
        title: "写第一步",
        listId: "p1",
        status: "completed",
        completedAt: "t",
      }),
    );
    await mount(store);
    await act(async () => {
      await api!.removeList("p1");
    });
    expect(api!.lists).toEqual([]);
  });
});
