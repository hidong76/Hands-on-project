export type Holiday = { date: string; name: string };

// 우주항공청 2027년 월력요항 기준 공식 목록. 대체공휴일을 규칙으로 계산하지 않고 그대로 쓴다.
export const HOLIDAYS_2027: readonly Holiday[] = [
  { date: "2027-01-01", name: "신정" },
  { date: "2027-02-06", name: "설날 연휴" },
  { date: "2027-02-07", name: "설날" },
  { date: "2027-02-08", name: "설날 연휴" },
  { date: "2027-02-09", name: "대체공휴일(설날)" },
  { date: "2027-03-01", name: "삼일절" },
  { date: "2027-05-01", name: "노동절" },
  { date: "2027-05-03", name: "대체공휴일(노동절)" },
  { date: "2027-05-05", name: "어린이날" },
  { date: "2027-05-13", name: "부처님오신날" },
  { date: "2027-06-06", name: "현충일" },
  { date: "2027-07-17", name: "제헌절" },
  { date: "2027-07-19", name: "대체공휴일(제헌절)" },
  { date: "2027-08-15", name: "광복절" },
  { date: "2027-08-16", name: "대체공휴일(광복절)" },
  { date: "2027-09-14", name: "추석 연휴" },
  { date: "2027-09-15", name: "추석" },
  { date: "2027-09-16", name: "추석 연휴" },
  { date: "2027-10-03", name: "개천절" },
  { date: "2027-10-04", name: "대체공휴일(개천절)" },
  { date: "2027-10-09", name: "한글날" },
  { date: "2027-10-11", name: "대체공휴일(한글날)" },
  { date: "2027-12-25", name: "성탄절" },
  { date: "2027-12-27", name: "대체공휴일(성탄절)" },
];

const HOLIDAY_DATES = new Set(HOLIDAYS_2027.map((h) => h.date));

const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

// 쉬는 날: 토요일, 일요일, 공휴일 목록에 있는 날.
// 2027년 밖 날짜는 공휴일 목록이 없으므로 토·일만 쉬는 날로 본다.
export function isRestDay(date: string): boolean {
  const day = weekday(date);
  return day === 0 || day === 6 || HOLIDAY_DATES.has(date);
}
