import { describe, expect, it } from "vitest";
import { isTimedTask, layoutTimedEvents } from "./week-layout";
import { eventMinutes, hourLabel } from "./times";

describe("week timeline layout", () => {
  it("labels noon and places overlapping timed events in columns", () => {
    expect(hourLabel(12)).toBe("正午");
    expect(hourLabel(9)).toBe("09:00");
    expect(isTimedTask({
      allDay: false,
      startTime: "09:00",
      startDate: "2026-09-19",
      dueDate: "2026-09-19",
    })).toBe(true);
    expect(isTimedTask({
      allDay: false,
      startTime: "09:00",
      startDate: "2026-09-19",
      dueDate: "2026-09-20",
    })).toBe(false);

    const minutes = eventMinutes({ startTime: "09:00", endTime: "10:30" });
    expect(minutes).toEqual({ startMin: 9 * 60, endMin: 10 * 60 + 30 });

    const placed = layoutTimedEvents([
      { id: "a", startMin: 9 * 60, endMin: 10 * 60 },
      { id: "b", startMin: 9 * 60 + 15, endMin: 10 * 60 },
    ]);
    expect(placed[0].col).toBe(0);
    expect(placed[1].col).toBe(1);
    expect(placed[1].cols).toBe(2);
  });
});
