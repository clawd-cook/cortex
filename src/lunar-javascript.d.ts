declare module "lunar-javascript" {
  export class Lunar {
    getDay(): number;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getFestivals(): string[];
    getOtherFestivals(): string[];
    getJieQi(): string;
  }

  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getFestivals(): string[];
  }
}
