import { formatDay, formatMonthDay } from "./format";
import { isRestDay } from "./holidays";

export type Combo = {
  start: string;
  end: string;
  totalDays: number;
  leaveDates: string[];
  // 연차 1일당 쉬는 일수 = 연휴 총 일수 ÷ 사용 연차 수
  efficiency: number;
};

export type Notice =
  | { kind: "extends-period"; start: string; end: string; message: string }
  | { kind: "extends-2028"; message: string };

export type RecommendInput = {
  // 비어 있거나 숫자가 아닌 입력은 null 또는 NaN으로 넘긴다.
  leaveDays: number | null;
  start: string;
  end: string;
};

export type InvalidReason =
  | "leave-days"
  | "period-missing"
  | "outside-2027"
  | "start-after-end";

export type RecommendResult =
  | { status: "ok"; combos: Combo[]; notices: Notice[] }
  | { status: "empty"; message: string; notices: Notice[] }
  | { status: "invalid"; reason: InvalidReason; message: string };

const MIN_LEAVE_DAYS = 1;
const MAX_LEAVE_DAYS = 15;
const SUPPORTED_YEAR = "2027";
const FIRST_DAY = "2027-01-01";
const LAST_DAY = "2027-12-31";
// 연차를 최대 15일 쓰더라도 닿지 않는, 2028년 쪽 계산 상한.
const POOL_LAST_DAY = "2028-02-29";
const TOP_COMBOS = 10;
const NOTICE_2028 = "2028년으로 이어지는 연휴는 현재 계산하지 않습니다";

const DAY_MS = 24 * 60 * 60 * 1000;

const toTime = (date: string) => new Date(`${date}T00:00:00Z`).getTime();
const fromTime = (time: number) => new Date(time).toISOString().slice(0, 10);
const addDays = (date: string, days: number) =>
  fromTime(toTime(date) + days * DAY_MS);

const isValidDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(toTime(date)) &&
  fromTime(toTime(date)) === date;

// 연휴 조합: 구간 안의 근무일을 모두 연차로 쓰고, 앞날과 뒷날은 근무일인 구간.
function enumerateCombos(
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

// 연휴 총 일수가 긴 순, 같으면 사용 연차가 적은 순, 같으면 시작일이 빠른 순
const byRank = (a: Combo, b: Combo) =>
  b.totalDays - a.totalDays ||
  a.leaveDates.length - b.leaveDates.length ||
  a.start.localeCompare(b.start);

function periodNotice(excluded: Combo, start: string, end: string): Notice {
  const before = excluded.start < start;
  const after = excluded.end > end;
  const widen =
    before && after
      ? `${formatMonthDay(excluded.start)}~${formatMonthDay(excluded.end)}로`
      : before
        ? `${formatMonthDay(excluded.start)}부터로`
        : `${formatMonthDay(excluded.end)}까지로`;
  return {
    kind: "extends-period",
    start: excluded.start,
    end: excluded.end,
    message: `기간 밖으로 이어지는 연휴가 있어 제외했습니다. ${formatDay(excluded.start)}~${formatDay(excluded.end)} 연휴가 필요하면 기간을 ${widen} 넓혀 보세요.`,
  };
}

export function recommend(input: RecommendInput): RecommendResult {
  const { leaveDays } = input;
  if (
    leaveDays === null ||
    !Number.isInteger(leaveDays) ||
    leaveDays < MIN_LEAVE_DAYS ||
    leaveDays > MAX_LEAVE_DAYS
  ) {
    return {
      status: "invalid",
      reason: "leave-days",
      message: `남은 연차 수는 ${MIN_LEAVE_DAYS}~${MAX_LEAVE_DAYS} 사이 정수로 입력해 주세요.`,
    };
  }
  const { start, end } = input;
  if (!isValidDate(start) || !isValidDate(end)) {
    return {
      status: "invalid",
      reason: "period-missing",
      message: "기간의 시작일과 종료일을 올바른 날짜로 입력해 주세요.",
    };
  }
  if (!start.startsWith(SUPPORTED_YEAR) || !end.startsWith(SUPPORTED_YEAR)) {
    return {
      status: "invalid",
      reason: "outside-2027",
      message: "현재는 2027년만 지원합니다",
    };
  }
  if (start > end) {
    return {
      status: "invalid",
      reason: "start-after-end",
      message: "시작일이 종료일보다 늦습니다. 날짜를 다시 확인해 주세요.",
    };
  }

  // 입력 기간과 일부라도 겹치는 조합만 놓고 기간 경계 제한 없이 순위를 매긴다.
  // 2026년으로 이어지는 조합은 2027년 1월 1일부터 세므로 들어오지 않는다.
  const pool = enumerateCombos(leaveDays, FIRST_DAY, POOL_LAST_DAY)
    .filter((c) => c.start <= end && c.end >= start)
    .sort(byRank);
  const isInside = (c: Combo) => c.start >= start && c.end <= end;

  const combos = pool.filter(isInside).slice(0, TOP_COMBOS);

  const excludedInTop = pool.slice(0, TOP_COMBOS).filter((c) => !isInside(c));
  const notices: Notice[] = [];
  const within2027 = excludedInTop.find((c) => c.end <= LAST_DAY);
  if (within2027) notices.push(periodNotice(within2027, start, end));
  if (excludedInTop.some((c) => c.end > LAST_DAY)) {
    notices.push({ kind: "extends-2028", message: NOTICE_2028 });
  }

  if (combos.length === 0) {
    return {
      status: "empty",
      message: "만들 수 있는 연휴 조합이 없습니다",
      notices,
    };
  }
  return { status: "ok", combos, notices };
}
