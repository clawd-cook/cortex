import { describe, expect, it } from "vitest";
import { holidayMark } from "./holidays";

describe("2026 holiday table", () => {
  it("marks 国办发明电〔2025〕7号 rest and makeup days", () => {
    expect(holidayMark("2026-01-01")).toEqual({ kind: "off", name: "元旦" });
    expect(holidayMark("2026-01-04")).toEqual({ kind: "work", name: null });
    expect(holidayMark("2026-02-17")).toEqual({ kind: "off", name: "春节" });
    expect(holidayMark("2026-02-14")).toEqual({ kind: "work", name: null });
    expect(holidayMark("2026-04-04")).toEqual({ kind: "off", name: "清明" });
    expect(holidayMark("2026-05-09")).toEqual({ kind: "work", name: null });
    expect(holidayMark("2026-09-20")).toEqual({ kind: "work", name: null });
    expect(holidayMark("2026-10-01")).toEqual({ kind: "off", name: "国庆" });
    expect(holidayMark("2026-09-19")).toBeNull();
  });
});
