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

// 연차 1일당 쉬는 일수는 소수 첫째 자리까지, 정수면 소수점 없이 보여준다.
export function formatEfficiency(value: number): string {
  return `${Number(value.toFixed(1))}일`;
}
