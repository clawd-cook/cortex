import { describe, expect, it } from "vitest";
import { layoutMonthBars } from "./calendar-layout";
import type { Task } from "../types";

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

describe("calendar layout", () => {
  it("keeps a multi-day title only on the starting cell and spans the week", () => {
    const weeks = [
      [
        "2026-09-14",
        "2026-09-15",
        "2026-09-16",
        "2026-09-17",
        "2026-09-18",
        "2026-09-19",
        "2026-09-20",
      ],
      [
        "2026-09-21",
        "2026-09-22",
        "2026-09-23",
        "2026-09-24",
        "2026-09-25",
        "2026-09-26",
        "2026-09-27",
      ],
    ];
    const { bars } = layoutMonthBars(
      [
        task({
          id: "span",
          title: "跨周需求",
          startDate: "2026-09-19",
          dueDate: "2026-09-22",
        }),
      ],
      weeks,
    );
    expect(bars).toHaveLength(2);
    expect(bars[0]).toMatchObject({
      taskId: "span",
      weekIndex: 0,
      startCol: 5,
      span: 2,
      showTitle: true,
      continuesAfter: true,
    });
    expect(bars[1]).toMatchObject({
      weekIndex: 1,
      startCol: 0,
      span: 2,
      showTitle: false,
      continuesBefore: true,
    });
  });

  it("overflows extra overlapping bars as +N per day", () => {
    const week = [
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
    ];
    const tasks = [0, 1, 2, 3, 4].map((i) =>
      task({
        id: `t${i}`,
        title: `任务 ${i}`,
        startDate: "2026-09-16",
        dueDate: "2026-09-16",
      }),
    );
    const { bars, overflow } = layoutMonthBars(tasks, [week]);
    expect(bars).toHaveLength(3);
    expect(overflow.get("2026-09-16")).toBe(2);
  });
});
