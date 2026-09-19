import { describe, expect, it } from "vitest";
import { parseHash, toHash } from "./route";

describe("hash routes", () => {
  it("round-trips list and calendar routes", () => {
    expect(parseHash("#/lists/inbox/tasks/abc")).toEqual({
      name: "inbox",
      taskId: "abc",
    });
    expect(toHash({ name: "list", listId: "proj", taskId: "t1" })).toBe(
      "#/lists/proj/tasks/t1",
    );
    expect(parseHash("#/calendar/month?month=2026-09&task=t1")).toEqual({
      name: "calendar",
      view: "month",
      month: "2026-09",
      taskId: "t1",
    });
    expect(toHash({ name: "calendar", view: "week", week: "2026-09-14" })).toBe(
      "#/calendar/week?week=2026-09-14",
    );
    expect(parseHash("#/smart/summary?week=2026-09-14")).toEqual({
      name: "summary",
      week: "2026-09-14",
    });
    expect(toHash({ name: "habits", taskId: "h1" })).toBe("#/habits/tasks/h1");
  });
});
