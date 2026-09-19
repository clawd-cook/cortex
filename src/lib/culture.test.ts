import { describe, expect, it } from "vitest";
import { dayCulture } from "./culture";

describe("day culture", () => {
  it("puts lunar text, festival, rest badge and Monday week numbers", () => {
    const spring = dayCulture("2026-02-17");
    expect(spring.lunar).toBe("正月");
    expect(spring.festival).toBe("春节");
    expect(spring.rest).toBe("off");

    const monday = dayCulture("2026-09-14");
    expect(monday.weekNumber).toBe(38);
    expect(monday.rest).toBeNull();

    const makeup = dayCulture("2026-01-04");
    expect(makeup.rest).toBe("work");
    expect(makeup.weekNumber).toBeNull();
  });
});
