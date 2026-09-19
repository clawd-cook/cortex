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
      month: "2026-09",
      taskId: "t1",
    });
  });
});
