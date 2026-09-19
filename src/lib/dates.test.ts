import { describe, expect, it } from "vitest";
import { addIsoDays, buildMonthGrid, durationDays, fromIsoDate, normalizeIsoDate, shiftRange, taskOverlapsDay, todayIso } from "./dates";

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
});
