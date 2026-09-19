import { getISOWeek } from "date-fns";
import { Solar } from "lunar-javascript";
import { fromIsoDate } from "./dates";
import { holidayMark, type RestKind } from "./holidays";

const SOLAR_FESTIVAL_ALLOW = new Set(["元旦节", "劳动节", "国庆节"]);

export type DayCulture = {
  lunar: string;
  festival: string | null;
  rest: RestKind | null;
  weekNumber: number | null;
};

function lunarLabel(year: number, month: number, day: number): { lunar: string; festival: string | null } {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const lunarText = lunar.getDay() === 1 ? `${lunar.getMonthInChinese()}月` : lunar.getDayInChinese();
  const names = [
    ...lunar.getFestivals(),
    ...solar.getFestivals().filter((name) => SOLAR_FESTIVAL_ALLOW.has(name)),
    lunar.getJieQi(),
  ].filter(Boolean);
  return { lunar: lunarText, festival: names[0] ?? null };
}

export function dayCulture(iso: string): DayCulture {
  const date = fromIsoDate(iso);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const { lunar, festival } = lunarLabel(year, month, day);
  const holiday = holidayMark(iso);
  const weekNumber = date.getDay() === 1 ? getISOWeek(date) : null;
  return {
    lunar,
    festival: holiday?.kind === "off" ? holiday.name ?? festival : festival,
    rest: holiday?.kind ?? null,
    weekNumber,
  };
}
