import { describe, expect, it } from "vitest";

import { buildPlan, type Combo, type PlanSummary } from "@/features/holiday-combos";

const DEFAULT_START = "2027-01-01";
const DEFAULT_END = "2027-12-31";

// 모든 플랜에서 성립해야 하는 불변식: 요약이 연휴 목록과 맞고, 사용 연차 합은 입력한 연차 이하이며,
// 남는 연차는 입력한 연차에서 사용 연차를 뺀 값이다.
function expectConsistent(
  plan: { combos: Combo[]; summary: PlanSummary },
  leaveDays: number,
) {
  const usedLeave = plan.combos.reduce((sum, c) => sum + c.leaveDates.length, 0);
  const totalDays = plan.combos.reduce((sum, c) => sum + c.totalDays, 0);
  expect(plan.summary.count).toBe(plan.combos.length);
  expect(plan.summary.usedLeave).toBe(usedLeave);
  expect(plan.summary.totalDays).toBe(totalDays);
  expect(plan.summary.usedLeave).toBeLessThanOrEqual(leaveDays);
  expect(plan.summary.remainingLeave).toBe(leaveDays - plan.summary.usedLeave);
}

// 계산 결과를 "시작일~종료일" 목록으로 본다. 부른 모든 사례에서 불변식도 함께 확인한다.
function planOf(leaveDays: number, start = DEFAULT_START, end = DEFAULT_END) {
  const result = buildPlan({ leaveDays, start, end });
  if (result.status !== "ok") {
    throw new Error(`꿀조합 플랜이 아닙니다: ${result.status}`);
  }
  expectConsistent(result, leaveDays);
  return result;
}

const spans = (combos: { start: string; end: string }[]) =>
  combos.map((c) => `${c.start}~${c.end}`);

describe("1년 꿀조합 플랜", () => {
  it("연차 1일이면 9/11~9/16 6일 1회이고 남는 연차는 0일이다 (같은 6일인 9/14~9/19는 시작일이 늦어 뽑히지 않는다)", () => {
    const plan = planOf(1);

    expect(spans(plan.combos)).toEqual(["2027-09-11~2027-09-16"]);
    expect(plan.combos[0].leaveDates).toEqual(["2027-09-13"]);
    expect(plan.summary).toEqual({
      count: 1,
      totalDays: 6,
      usedLeave: 1,
      remainingLeave: 0,
    });
  });

  it("연차 2일이면 5일짜리 동점(설 2/5~2/9, 2/6~2/10, 5/1~5/5) 중 가장 이른 2/5~2/9와 9/11~9/16이 뽑혀 총 11일이다", () => {
    const plan = planOf(2);

    expect(spans(plan.combos)).toEqual([
      "2027-02-05~2027-02-09",
      "2027-09-11~2027-09-16",
    ]);
    expect(plan.combos.map((c) => c.leaveDates)).toEqual([
      ["2027-02-05"],
      ["2027-09-13"],
    ]);
    expect(plan.summary).toEqual({
      count: 2,
      totalDays: 11,
      usedLeave: 2,
      remainingLeave: 0,
    });
  });

  it("연차 3일이면 2/5~2/9, 5/1~5/5, 9/11~9/16 3회 총 16일이고 남는 연차는 0일이다", () => {
    const plan = planOf(3);

    expect(spans(plan.combos)).toEqual([
      "2027-02-05~2027-02-09",
      "2027-05-01~2027-05-05",
      "2027-09-11~2027-09-16",
    ]);
    expect(plan.combos.map((c) => c.leaveDates)).toEqual([
      ["2027-02-05"],
      ["2027-05-04"],
      ["2027-09-13"],
    ]);
    expect(plan.summary).toEqual({
      count: 3,
      totalDays: 16,
      usedLeave: 3,
      remainingLeave: 0,
    });
  });

  it("연차 4일이면 4일짜리 동점 중 시작일이 가장 이른 1/1~1/4를 더해 4회 총 20일이다", () => {
    const plan = planOf(4);

    expect(spans(plan.combos)).toEqual([
      "2027-01-01~2027-01-04",
      "2027-02-05~2027-02-09",
      "2027-05-01~2027-05-05",
      "2027-09-11~2027-09-16",
    ]);
    expect(plan.combos[0].leaveDates).toEqual(["2027-01-04"]);
    expect(plan.summary).toEqual({
      count: 4,
      totalDays: 20,
      usedLeave: 4,
      remainingLeave: 0,
    });
  });

  it("연차 11일이면 꿀조합 11회 총 48일이고 남는 연차는 0일이다", () => {
    const plan = planOf(11);

    expect(
      plan.combos.map((c) => `${c.start}~${c.end} ${c.leaveDates.join(",")}`),
    ).toEqual([
      "2027-01-01~2027-01-04 2027-01-04",
      "2027-02-05~2027-02-09 2027-02-05",
      "2027-02-26~2027-03-01 2027-02-26",
      "2027-05-01~2027-05-05 2027-05-04",
      "2027-05-13~2027-05-16 2027-05-14",
      "2027-07-16~2027-07-19 2027-07-16",
      "2027-08-13~2027-08-16 2027-08-13",
      "2027-09-11~2027-09-16 2027-09-13",
      "2027-10-01~2027-10-04 2027-10-01",
      "2027-10-08~2027-10-11 2027-10-08",
      "2027-12-24~2027-12-27 2027-12-24",
    ]);
    expect(plan.summary).toEqual({
      count: 11,
      totalDays: 48,
      usedLeave: 11,
      remainingLeave: 0,
    });
  });

  it.each([
    [12, 0],
    [15, 3],
    [30, 18],
  ])(
    "연차 %i일이면 추석이 9/11~9/19 9일(연차 9/13·9/17)로 바뀐 11회 총 51일, 사용 연차 12일이고 남는 연차는 %i일이다",
    (leaveDays, remainingLeave) => {
      const plan = planOf(leaveDays);

      expect(plan.combos).toHaveLength(11);
      const chuseok = plan.combos.find((c) => c.start === "2027-09-11");
      expect(chuseok).toMatchObject({
        end: "2027-09-19",
        totalDays: 9,
        leaveDates: ["2027-09-13", "2027-09-17"],
      });
      expect(plan.summary).toEqual({
        count: 11,
        totalDays: 51,
        usedLeave: 12,
        remainingLeave,
      });
    },
  );

  it("설 2/5~2/10처럼 연차 2일로 6일을 만드는 조합(1일당 3.0)은 꿀조합이 아니라 어떤 플랜에도 없다", () => {
    for (const leaveDays of [5, 11, 15, 30]) {
      const plan = planOf(leaveDays);

      expect(
        plan.combos.some((c) => c.start === "2027-02-05" && c.end === "2027-02-10"),
      ).toBe(false);
    }
  });

  it("연차 1일, 6/1~6/30이면 꿀조합이 없어 안내와 남는 연차 1일(입력한 연차 전부)이 나온다", () => {
    const result = buildPlan({
      leaveDays: 1,
      start: "2027-06-01",
      end: "2027-06-30",
    });

    expect(result).toEqual({
      status: "empty",
      message: "이 기간에는 공휴일 꿀조합이 없습니다",
      summary: { count: 0, totalDays: 0, usedLeave: 0, remainingLeave: 1 },
    });
    if (result.status !== "empty") throw new Error(result.status);
    expectConsistent({ combos: [], summary: result.summary }, 1);
  });

  it("모든 플랜에서 연휴끼리 겹치지 않고, 날짜순이며, 모든 연휴의 1일당 쉬는 일수가 4 이상이다", () => {
    const cases: [number, string, string][] = [
      [1, DEFAULT_START, DEFAULT_END],
      [2, DEFAULT_START, DEFAULT_END],
      [3, DEFAULT_START, DEFAULT_END],
      [4, DEFAULT_START, DEFAULT_END],
      [11, DEFAULT_START, DEFAULT_END],
      [12, DEFAULT_START, DEFAULT_END],
      [15, DEFAULT_START, DEFAULT_END],
      [30, DEFAULT_START, DEFAULT_END],
      [5, "2027-04-01", "2027-10-31"],
    ];

    for (const [leaveDays, start, end] of cases) {
      const { combos, summary } = planOf(leaveDays, start, end);

      combos.forEach((combo, index) => {
        expect(combo.efficiency).toBeGreaterThanOrEqual(4);
        expect(combo.start >= start && combo.end <= end).toBe(true);
        if (index > 0) expect(combos[index - 1].end < combo.start).toBe(true);
      });
      expect(summary.usedLeave).toBeLessThanOrEqual(leaveDays);
      expect(summary.remainingLeave).toBe(leaveDays - summary.usedLeave);
    }
  });

  it.each([0, 31, 2.5, Number.NaN, null])(
    "연차 수가 %s이면 기존 추천과 같이 1~30 정수 안내만 하고 계산하지 않는다",
    (leaveDays) => {
      expect(
        buildPlan({ leaveDays, start: DEFAULT_START, end: DEFAULT_END }),
      ).toEqual({
        status: "invalid",
        reason: "leave-days",
        message: "남은 연차 수는 1~30 사이 정수로 입력해 주세요.",
      });
    },
  );

  it.each([
    ["2026-12-01", "2027-01-31", "outside-2027", "현재는 2027년만 지원합니다"],
    ["2027-12-01", "2028-01-31", "outside-2027", "현재는 2027년만 지원합니다"],
    [
      "2027-09-30",
      "2027-09-01",
      "start-after-end",
      "시작일이 종료일보다 늦습니다. 날짜를 다시 확인해 주세요.",
    ],
    [
      "",
      "2027-09-30",
      "period-missing",
      "기간의 시작일과 종료일을 올바른 날짜로 입력해 주세요.",
    ],
  ])("기간 %j~%j는 기존 추천과 같은 안내(%s)를 쓴다", (start, end, reason, message) => {
    expect(buildPlan({ leaveDays: 2, start, end })).toEqual({
      status: "invalid",
      reason,
      message,
    });
  });

  it("연차 30일을 넣어도 계산이 1초 안에 끝난다", () => {
    const startedAt = performance.now();
    buildPlan({ leaveDays: 30, start: DEFAULT_START, end: DEFAULT_END });

    expect(performance.now() - startedAt).toBeLessThan(1000);
  });
});
