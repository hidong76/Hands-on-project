import { describe, expect, it } from "vitest";

import { HOLIDAYS_2027, isRestDay } from "@/features/holiday-combos";

// 요일은 UTC 기준으로 읽는다. 날짜는 "YYYY-MM-DD" 문자열이다.
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
const SUNDAY = 0;
const SATURDAY = 6;

describe("2027년 공휴일 목록", () => {
  it("공식 목록의 24개 항목을 그대로 담는다", () => {
    expect(HOLIDAYS_2027).toHaveLength(24);
  });

  it("일요일과 겹치는 날이 4일이다 (2/7, 6/6, 8/15, 10/3)", () => {
    const sundays = HOLIDAYS_2027.filter((h) => weekday(h.date) === SUNDAY);

    expect(sundays.map((h) => h.date)).toEqual([
      "2027-02-07",
      "2027-06-06",
      "2027-08-15",
      "2027-10-03",
    ]);
  });

  it("토요일과 겹치는 날이 5일이다 (2/6, 5/1, 7/17, 10/9, 12/25)", () => {
    const saturdays = HOLIDAYS_2027.filter(
      (h) => weekday(h.date) === SATURDAY,
    );

    expect(saturdays.map((h) => h.date)).toEqual([
      "2027-02-06",
      "2027-05-01",
      "2027-07-17",
      "2027-10-09",
      "2027-12-25",
    ]);
  });

  it("같은 날짜가 두 번 들어 있지 않고 모두 2027년 날짜다", () => {
    const dates = HOLIDAYS_2027.map((h) => h.date);

    expect(new Set(dates).size).toBe(dates.length);
    expect(dates.every((d) => d.startsWith("2027-"))).toBe(true);
  });

  it("일요일 52일에 일요일 외 공휴일 20일을 더한 실질 공휴일이 72일이다", () => {
    const nonSundayHolidays = HOLIDAYS_2027.filter(
      (h) => weekday(h.date) !== SUNDAY,
    );

    expect(nonSundayHolidays).toHaveLength(20);
    expect(52 + nonSundayHolidays.length).toBe(72);
  });

  it("2027년의 쉬는 날(토·일·공휴일)은 119일이다", () => {
    let restDays = 0;
    for (let d = new Date("2027-01-01T00:00:00Z"); ; ) {
      const iso = d.toISOString().slice(0, 10);
      if (!iso.startsWith("2027-")) break;
      if (isRestDay(iso)) restDays += 1;
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }

    expect(restDays).toBe(119);
  });
});
