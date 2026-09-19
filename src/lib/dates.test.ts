import { describe, expect, it } from "vitest";
import { addIsoDays, buildMonthGrid, durationDays, formatChip, formatDayLabel, fromIsoDate, normalizeIsoDate, shiftRange, taskOverlapsDay, todayIso, weekRangeLabel, weekdayLabels } from "./dates";

describe("dates", () => {
  it("treats a due-only task as a single day", () => {
    expect(taskOverlapsDay({ startDate: null, dueDate: "2026-09-19" }, "2026-09-19")).toBe(true);
    expect(taskOverlapsDay({ startDate: null, dueDate: "2026-09-19" }, "2026-09-20")).toBe(false);
  });

  it("keeps duration when shifting a multi-day range", () => {
    const shifted = shiftRange(
      { startDate: "2026-09-19", dueDate: "2026-09-21" },
      2,
    );
    expect(shifted).toEqual({ startDate: "2026-09-21", dueDate: "2026-09-23" });
    expect(durationDays(shifted!)).toBe(2);
  });

  it("builds a Monday-start month grid that includes neighboring days", () => {
    const grid = buildMonthGrid(fromIsoDate("2026-09-01"), 1);
    expect(grid.weeks[0]).toHaveLength(7);
    expect(grid.weeks[0][0]).toBe("2026-08-31");
    expect(grid.weeks[grid.weeks.length - 1]?.[6]).toBe("2026-10-04");
  });

  it("rejects impossible years from date inputs", () => {
    expect(normalizeIsoDate("0002-09-21")).toBeNull();
    expect(normalizeIsoDate("2026-09-19")).toBe("2026-09-19");
  });

  it("formats today as an ISO date without a timezone shift in local time", () => {
    expect(todayIso(fromIsoDate("2026-09-19"))).toBe("2026-09-19");
    expect(addIsoDays("2026-09-19", 1)).toBe("2026-09-20");
  });

  it("formats chips and weekdays with Intl", () => {
    const now = fromIsoDate("2026-09-19");
    expect(formatChip("2026-09-19", now)).toBe("今天");
    expect(formatChip("2026-09-20", now)).toBe("明天");
    expect(formatChip("2026-09-21", now)).toBe(formatDayLabel(fromIsoDate("2026-09-21")));
    const mondayFirst = weekdayLabels(1);
    const sundayFirst = weekdayLabels(0);
    expect(mondayFirst).toHaveLength(7);
    expect(sundayFirst).toHaveLength(7);
    expect(mondayFirst[6]).toBe(sundayFirst[0]);
    expect(weekRangeLabel(["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"])).toBe(
      `${formatDayLabel(fromIsoDate("2026-09-14"))} – ${formatDayLabel(fromIsoDate("2026-09-20"))}`,
    );
  });
});
