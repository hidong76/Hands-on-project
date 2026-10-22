import { isRestDay } from "./holidays";

export type Combo = {
  start: string;
  end: string;
  totalDays: number;
  leaveDates: string[];
  // 연차 1일당 쉬는 일수 = 연휴 총 일수 ÷ 사용 연차 수
  efficiency: number;
};

// 연차 수와 기간 입력. 비어 있거나 숫자가 아닌 연차 수는 null 또는 NaN으로 넘긴다.
export type LeaveInput = {
  leaveDays: number | null;
  start: string;
  end: string;
};

export type InvalidReason =
  | "leave-days"
  | "period-missing"
  | "outside-2027"
  | "start-after-end";

export type Invalid = {
  status: "invalid";
  reason: InvalidReason;
  message: string;
};

export const MIN_LEAVE_DAYS = 1;
export const MAX_LEAVE_DAYS = 30;
export const FIRST_DAY = "2027-01-01";
export const LAST_DAY = "2027-12-31";

const SUPPORTED_YEAR = "2027";
const DAY_MS = 24 * 60 * 60 * 1000;

const toTime = (date: string) => new Date(`${date}T00:00:00Z`).getTime();
const fromTime = (time: number) => new Date(time).toISOString().slice(0, 10);
export const addDays = (date: string, days: number) =>
  fromTime(toTime(date) + days * DAY_MS);

const isValidDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(toTime(date)) &&
  fromTime(toTime(date)) === date;

// 추천과 플랜이 같은 입력 검증과 안내를 쓴다.
export function validateInput(
  input: LeaveInput,
): { invalid: Invalid } | { leaveDays: number; start: string; end: string } {
  const { leaveDays, start, end } = input;
  if (
    leaveDays === null ||
    !Number.isInteger(leaveDays) ||
    leaveDays < MIN_LEAVE_DAYS ||
    leaveDays > MAX_LEAVE_DAYS
  ) {
    return {
      invalid: {
        status: "invalid",
        reason: "leave-days",
        message: `남은 연차 수는 ${MIN_LEAVE_DAYS}~${MAX_LEAVE_DAYS} 사이 정수로 입력해 주세요.`,
      },
    };
  }
  if (!isValidDate(start) || !isValidDate(end)) {
    return {
      invalid: {
        status: "invalid",
        reason: "period-missing",
        message: "기간의 시작일과 종료일을 올바른 날짜로 입력해 주세요.",
      },
    };
  }
  if (!start.startsWith(SUPPORTED_YEAR) || !end.startsWith(SUPPORTED_YEAR)) {
    return {
      invalid: {
        status: "invalid",
        reason: "outside-2027",
        message: "현재는 2027년만 지원합니다",
      },
    };
  }
  if (start > end) {
    return {
      invalid: {
        status: "invalid",
        reason: "start-after-end",
        message: "시작일이 종료일보다 늦습니다. 날짜를 다시 확인해 주세요.",
      },
    };
  }
  return { leaveDays, start, end };
}

// 연휴 조합: 구간 안의 근무일을 모두 연차로 쓰고, 앞날과 뒷날은 근무일인 구간.
export function enumerateCombos(
  leaveDays: number,
  firstDay: string,
  lastDay: string,
): Combo[] {
  const combos: Combo[] = [];
  for (let start = firstDay; start <= lastDay; start = addDays(start, 1)) {
    const leaveDates: string[] = [];
    for (let end = start; end <= lastDay; end = addDays(end, 1)) {
      if (!isRestDay(end)) leaveDates.push(end);
      if (leaveDates.length > leaveDays) break;
      if (leaveDates.length === 0) continue;
      if (isRestDay(addDays(start, -1)) || isRestDay(addDays(end, 1))) continue;
      const totalDays = (toTime(end) - toTime(start)) / DAY_MS + 1;
      combos.push({
        start,
        end,
        totalDays,
        leaveDates: [...leaveDates],
        efficiency: totalDays / leaveDates.length,
      });
    }
  }
  return combos;
}
