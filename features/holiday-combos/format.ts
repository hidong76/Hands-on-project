const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

// "2027-05-01" → "5/1(토)"
export function formatDay(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  return `${day.getUTCMonth() + 1}/${day.getUTCDate()}(${WEEKDAY_NAMES[day.getUTCDay()]})`;
}

// "2027-05-01" → "5/1"
export function formatMonthDay(date: string): string {
  return formatDay(date).replace(/\(.\)$/, "");
}
