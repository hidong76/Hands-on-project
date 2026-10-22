import {
  type Combo,
  enumerateCombos,
  type Invalid,
  type LeaveInput,
  validateInput,
} from "./combos";

export type PlanSummary = {
  count: number;
  totalDays: number;
  usedLeave: number;
  remainingLeave: number;
};

export type PlanResult =
  | { status: "ok"; combos: Combo[]; summary: PlanSummary }
  | { status: "empty"; message: string; summary: PlanSummary }
  | Invalid;

// 꿀조합: 연차 1일당 쉬는 일수가 4 이상인 연휴 조합
const MIN_HONEY_EFFICIENCY = 4;

type Chosen = { totalDays: number; usedLeave: number; combos: Combo[] };

// 플랜 선택 기준: 꿀조합 연휴 일수의 합이 큰 쪽, 같으면 사용 연차가 적은 쪽,
// 같으면 연휴를 시작일 순으로 놓고 시작일이 먼저 다른 연휴에서 더 이른 쪽.
function isBetter(a: Chosen, b: Chosen): boolean {
  if (a.totalDays !== b.totalDays) return a.totalDays > b.totalDays;
  if (a.usedLeave !== b.usedLeave) return a.usedLeave < b.usedLeave;
  const length = Math.min(a.combos.length, b.combos.length);
  for (let i = 0; i < length; i += 1) {
    if (a.combos[i].start !== b.combos[i].start) {
      return a.combos[i].start < b.combos[i].start;
    }
  }
  return false;
}

export function buildPlan(input: LeaveInput): PlanResult {
  const checked = validateInput(input);
  if ("invalid" in checked) return checked.invalid;
  const { leaveDays, start, end } = checked;

  const candidates = enumerateCombos(leaveDays, start, end)
    .filter((c) => c.efficiency >= MIN_HONEY_EFFICIENCY)
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));

  const memo = new Map<string, Chosen>();
  const best = (i: number, left: number, lastEnd: string): Chosen => {
    if (i === candidates.length) return { totalDays: 0, usedLeave: 0, combos: [] };
    const key = `${i}|${left}|${lastEnd}`;
    const cached = memo.get(key);
    if (cached) return cached;
    let result = best(i + 1, left, lastEnd);
    const c = candidates[i];
    if (c.start > lastEnd && c.leaveDates.length <= left) {
      const rest = best(i + 1, left - c.leaveDates.length, c.end);
      const taken: Chosen = {
        totalDays: c.totalDays + rest.totalDays,
        usedLeave: c.leaveDates.length + rest.usedLeave,
        combos: [c, ...rest.combos],
      };
      if (isBetter(taken, result)) result = taken;
    }
    memo.set(key, result);
    return result;
  };

  const chosen = best(0, leaveDays, "0000-00-00");
  const summary: PlanSummary = {
    count: chosen.combos.length,
    totalDays: chosen.totalDays,
    usedLeave: chosen.usedLeave,
    remainingLeave: leaveDays - chosen.usedLeave,
  };
  if (chosen.combos.length === 0) {
    return {
      status: "empty",
      message: "이 기간에는 공휴일 꿀조합이 없습니다",
      summary,
    };
  }
  return { status: "ok", combos: chosen.combos, summary };
}
