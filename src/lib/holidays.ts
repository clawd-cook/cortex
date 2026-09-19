export type RestKind = "off" | "work";

export type HolidayMark = {
  kind: RestKind;
  name: string | null;
};

type OffRange = { start: string; end: string; name: string };

// 国办发明电〔2025〕7号：2026 年部分节假日安排
const OFF_RANGES_2026: OffRange[] = [
  { start: "2026-01-01", end: "2026-01-03", name: "元旦" },
  { start: "2026-02-15", end: "2026-02-23", name: "春节" },
  { start: "2026-04-04", end: "2026-04-06", name: "清明" },
  { start: "2026-05-01", end: "2026-05-05", name: "劳动" },
  { start: "2026-06-19", end: "2026-06-21", name: "端午" },
  { start: "2026-09-25", end: "2026-09-27", name: "中秋" },
  { start: "2026-10-01", end: "2026-10-07", name: "国庆" },
];

const WORKDAYS_2026 = [
  "2026-01-04",
  "2026-02-14",
  "2026-02-28",
  "2026-05-09",
  "2026-09-20",
  "2026-10-10",
];

const MARKS: Map<string, HolidayMark> = (() => {
  const map = new Map<string, HolidayMark>();
  for (const range of OFF_RANGES_2026) {
    let cursor = range.start;
    while (cursor <= range.end) {
      map.set(cursor, { kind: "off", name: range.name });
      const [year, month, day] = cursor.split("-").map(Number);
      const next = new Date(year, month - 1, day + 1);
      const yyyy = String(next.getFullYear()).padStart(4, "0");
      const mm = String(next.getMonth() + 1).padStart(2, "0");
      const dd = String(next.getDate()).padStart(2, "0");
      cursor = `${yyyy}-${mm}-${dd}`;
    }
  }
  for (const iso of WORKDAYS_2026) {
    map.set(iso, { kind: "work", name: null });
  }
  return map;
})();

export function holidayMark(iso: string): HolidayMark | null {
  return MARKS.get(iso) ?? null;
}
