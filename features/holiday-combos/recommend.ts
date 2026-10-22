import {
  addDays,
  type Combo,
  enumerateCombos,
  FIRST_DAY,
  type Invalid,
  LAST_DAY,
  type LeaveInput,
  validateInput,
} from "./combos";
import { formatDay, formatMonthDay } from "./format";
import { isRestDay } from "./holidays";

export type { Combo, InvalidReason } from "./combos";

export type Notice =
  | { kind: "extends-period"; start: string; end: string; message: string }
  | { kind: "extends-2028"; message: string };

export type RecommendInput = LeaveInput;

export type RecommendResult =
  | { status: "ok"; combos: Combo[]; notices: Notice[] }
  | { status: "empty"; message: string; notices: Notice[] }
  | Invalid;

// 연차를 최대 30일 쓰더라도 닿지 않는, 2028년 쪽 계산 상한.
const POOL_LAST_DAY = "2028-02-29";
const TOP_COMBOS = 10;
const NOTICE_2028 = "2028년으로 이어지는 연휴는 현재 계산하지 않습니다";

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
  const checked = validateInput(input);
  if ("invalid" in checked) return checked.invalid;
  const { leaveDays, start, end } = checked;

  // 입력 기간과 일부라도 겹치는 조합만 놓고 기간 경계 제한 없이 순위를 매긴다.
  // 2026년으로 이어지는 조합은 2027년 1월 1일부터 세므로 들어오지 않는다.
  const pool = enumerateCombos(leaveDays, FIRST_DAY, POOL_LAST_DAY)
    .filter((c) => c.start <= end && c.end >= start)
    .sort(byRank);
  const isInside = (c: Combo) => c.start >= start && c.end <= end;

  const combos = pool.filter(isInside).slice(0, TOP_COMBOS);

  const excludedInTop = pool.slice(0, TOP_COMBOS).filter((c) => !isInside(c));
  const notices: Notice[] = [];
  // 기간 경계 안내는 시작일 전날이나 종료일 다음날이 쉬는 날이라 쉬는 날 연속 구간이
  // 기간 경계에서 잘린 경우에만 낸다. 잘린 쪽으로 이어지는 제외 조합 중 순위가 가장 높은 하나를 안내한다.
  const startCut = isRestDay(addDays(start, -1));
  const endCut = isRestDay(addDays(end, 1));
  const cutExcluded = excludedInTop.find(
    (c) =>
      c.end <= LAST_DAY &&
      ((startCut && c.start < start) || (endCut && c.end > end)),
  );
  if (cutExcluded) notices.push(periodNotice(cutExcluded, start, end));
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
