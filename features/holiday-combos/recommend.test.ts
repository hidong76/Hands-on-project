import { describe, expect, it } from "vitest";

import { isRestDay, recommend } from "@/features/holiday-combos";

function combosOf(leaveDays: number, start: string, end: string) {
  const result = recommend({ leaveDays, start, end });
  if (result.status !== "ok") {
    throw new Error(`추천 결과가 아닙니다: ${result.status}`);
  }
  return result.combos;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const shiftDay = (date: string, days: number) =>
  new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);

describe("연휴 조합 추천", () => {
  it("연차 2일, 9/1~9/30이면 9/11(토)~9/19(일) 9일 연휴(연차 9/13·9/17)가 1위다", () => {
    const [first] = combosOf(2, "2027-09-01", "2027-09-30");

    expect(first).toMatchObject({
      start: "2027-09-11",
      end: "2027-09-19",
      totalDays: 9,
      leaveDates: ["2027-09-13", "2027-09-17"],
    });
  });

  it("연휴 총 일수가 같으면 사용 연차가 적은 조합이 앞에 온다", () => {
    // 7월: 4일 연휴 중 연차 1일(7/16~7/19)이 연차 2일(7/1~7/4)보다 시작일이 늦어도 앞선다.
    const combos = combosOf(2, "2027-07-01", "2027-07-31");
    const indexOf = (start: string, end: string) =>
      combos.findIndex((c) => c.start === start && c.end === end);
    const oneLeave = indexOf("2027-07-16", "2027-07-19");
    const twoLeave = indexOf("2027-07-01", "2027-07-04");

    expect(oneLeave).toBeGreaterThanOrEqual(0);
    expect(twoLeave).toBeGreaterThanOrEqual(0);
    expect(oneLeave).toBeLessThan(twoLeave);
  });

  it("연차 1일, 5/1~5/31이면 5/1(토)~5/5(수) 5일 연휴(연차 5/4)가 포함된다", () => {
    const combos = combosOf(1, "2027-05-01", "2027-05-31");

    expect(combos).toContainEqual(
      expect.objectContaining({
        start: "2027-05-01",
        end: "2027-05-05",
        totalDays: 5,
        leaveDates: ["2027-05-04"],
      }),
    );
  });

  it("연차 3일, 5/1~5/31이면 5/1(토)~5/9(일) 9일 연휴(연차 5/4·5/6·5/7)가 1위다", () => {
    const [first] = combosOf(3, "2027-05-01", "2027-05-31");

    expect(first).toMatchObject({
      start: "2027-05-01",
      end: "2027-05-09",
      totalDays: 9,
      leaveDates: ["2027-05-04", "2027-05-06", "2027-05-07"],
    });
  });

  it("연차 1일, 2/1~2/28이면 2/5~2/9와 2/6~2/10 5일 연휴가 모두 있고 시작일이 빠른 2/5 조합이 앞에 온다", () => {
    const combos = combosOf(1, "2027-02-01", "2027-02-28");
    const early = combos.findIndex(
      (c) => c.start === "2027-02-05" && c.end === "2027-02-09",
    );
    const late = combos.findIndex(
      (c) => c.start === "2027-02-06" && c.end === "2027-02-10",
    );

    expect(combos[early]).toMatchObject({
      totalDays: 5,
      leaveDates: ["2027-02-05"],
    });
    expect(combos[late]).toMatchObject({
      totalDays: 5,
      leaveDates: ["2027-02-10"],
    });
    expect(early).toBeLessThan(late);
  });

  it("연차 2일, 2/1~2/28이면 2/5(금)~2/10(수) 6일 연휴(연차 2/5·2/10)가 포함된다", () => {
    const combos = combosOf(2, "2027-02-01", "2027-02-28");

    expect(combos).toContainEqual(
      expect.objectContaining({
        start: "2027-02-05",
        end: "2027-02-10",
        totalDays: 6,
        leaveDates: ["2027-02-05", "2027-02-10"],
      }),
    );
  });

  it("연차 1일, 6/1~6/30이면 현충일(6/6)은 대체공휴일이 없어 6/5(토)~6/7(월) 3일 연휴(연차 6/7)가 나온다", () => {
    const combos = combosOf(1, "2027-06-01", "2027-06-30");

    expect(combos).toContainEqual(
      expect.objectContaining({
        start: "2027-06-05",
        end: "2027-06-07",
        totalDays: 3,
        leaveDates: ["2027-06-07"],
      }),
    );
  });

  it("상위 10개까지만 돌려준다", () => {
    const combos = combosOf(2, "2027-01-01", "2027-12-31");

    expect(combos).toHaveLength(10);
  });

  it("연차 1일당 쉬는 일수(총 일수 ÷ 사용 연차)를 함께 돌려준다", () => {
    const [first] = combosOf(2, "2027-09-01", "2027-09-30");

    expect(first.efficiency).toBe(4.5);
  });

  it.each([0, 31, 2.5, Number.NaN, null])(
    "연차 수가 %s이면 계산하지 않고 1~30 정수로 입력하라고 안내한다",
    (leaveDays) => {
      const result = recommend({
        leaveDays,
        start: "2027-01-01",
        end: "2027-12-31",
      });

      expect(result).toEqual({
        status: "invalid",
        reason: "leave-days",
        message: expect.stringContaining("1~30"),
      });
    },
  );

  it.each([1, 15, 16, 30])(
    "연차 %i일은 허용 범위(1~30) 안이라 기본 기간을 계산한다",
    (leaveDays) => {
      const result = recommend({
        leaveDays,
        start: "2027-01-01",
        end: "2027-12-31",
      });

      expect(result.status).toBe("ok");
    },
  );

  it.each([
    ["2026-12-01", "2027-01-31"],
    ["2027-12-01", "2028-01-31"],
    ["2028-03-01", "2028-03-31"],
  ])(
    "기간 %s~%s가 일부라도 2027년 밖이면 2027년만 지원한다고 안내한다",
    (start, end) => {
      expect(recommend({ leaveDays: 2, start, end })).toEqual({
        status: "invalid",
        reason: "outside-2027",
        message: "현재는 2027년만 지원합니다",
      });
    },
  );

  it("시작일이 종료일보다 늦으면 안내하고 계산하지 않는다", () => {
    expect(
      recommend({ leaveDays: 2, start: "2027-09-30", end: "2027-09-01" }),
    ).toEqual({
      status: "invalid",
      reason: "start-after-end",
      message: expect.stringContaining("시작일"),
    });
  });

  it.each([
    ["", "2027-09-30"],
    ["2027-09-01", ""],
    ["2027-02-30", "2027-03-01"],
  ])("기간 %j~%j처럼 날짜가 비었거나 올바르지 않으면 기간을 입력하라고 안내한다", (start, end) => {
    expect(recommend({ leaveDays: 2, start, end })).toEqual({
      status: "invalid",
      reason: "period-missing",
      message: expect.stringContaining("기간"),
    });
  });

  it("조건에 맞는 조합이 없으면 없다고 안내한다", () => {
    // 1/4(월)은 앞날 1/3(일)이 쉬는 날이라, 이 하루만으로는 더 늘릴 수 없는 구간이 되지 못한다.
    const result = recommend({
      leaveDays: 1,
      start: "2027-01-04",
      end: "2027-01-04",
    });

    expect(result).toMatchObject({
      status: "empty",
      message: "만들 수 있는 연휴 조합이 없습니다",
    });
  });

  it("조합이 없어도 기간 밖으로 이어지는 연휴가 있으면 안내한다: 연차 1일, 1/4~1/4이면 1/1~1/4 연휴가 기간 밖이라 제외된다", () => {
    const result = recommend({
      leaveDays: 1,
      start: "2027-01-04",
      end: "2027-01-04",
    });

    expect(result).toMatchObject({
      status: "empty",
      notices: [
        {
          kind: "extends-period",
          start: "2027-01-01",
          end: "2027-01-04",
          message: expect.stringContaining("기간을 1/1부터로 넓혀 보세요"),
        },
      ],
    });
  });

  it("연차 1일, 5/4~5/31이면 기간 밖으로 이어지는 5/1~5/5 연휴를 목록에서 빼고 5/1부터 넓히라고 안내한다", () => {
    const result = recommend({
      leaveDays: 1,
      start: "2027-05-04",
      end: "2027-05-31",
    });

    if (result.status !== "ok") throw new Error(result.status);
    expect(
      result.combos.some((c) => c.start === "2027-05-01" && c.end === "2027-05-05"),
    ).toBe(false);
    expect(result.notices).toEqual([
      {
        kind: "extends-period",
        start: "2027-05-01",
        end: "2027-05-05",
        message: expect.stringContaining("5/1(토)~5/5(수)"),
      },
    ]);
    expect(result.notices[0].message).toContain("기간을 5/1부터로 넓혀 보세요");
  });

  it("연차 2일, 9/13~9/30이면 9/11~9/19 9일 연휴를 목록에서 빼고 9/11부터 넓히라고 안내한다", () => {
    const result = recommend({
      leaveDays: 2,
      start: "2027-09-13",
      end: "2027-09-30",
    });

    if (result.status !== "ok") throw new Error(result.status);
    expect(
      result.combos.some((c) => c.start === "2027-09-11" && c.end === "2027-09-19"),
    ).toBe(false);
    expect(result.notices).toHaveLength(1);
    expect(result.notices[0]).toMatchObject({
      kind: "extends-period",
      start: "2027-09-11",
      end: "2027-09-19",
    });
    expect(result.notices[0].message).toContain("기간을 9/11부터로 넓혀 보세요");
  });

  it("연차 1일, 9/1~9/30이면 안내가 나오지 않는다", () => {
    const result = recommend({
      leaveDays: 1,
      start: "2027-09-01",
      end: "2027-09-30",
    });

    expect(result).toMatchObject({ status: "ok", notices: [] });
  });

  it("연차 4일, 12/1~12/31이면 12/25~2028/1/2 연휴를 빼고 2028년 안내만 보여준다 (시작일 전날 11/30은 근무일이라 기간 경계 안내는 없다)", () => {
    const result = recommend({
      leaveDays: 4,
      start: "2027-12-01",
      end: "2027-12-31",
    });

    if (result.status !== "ok") throw new Error(result.status);
    expect(result.combos.every((c) => c.end <= "2027-12-31")).toBe(true);
    expect(result.notices).toEqual([
      {
        kind: "extends-2028",
        message: "2028년으로 이어지는 연휴는 현재 계산하지 않습니다",
      },
    ]);
  });

  it("연차 2일, 기본 기간(1/1~12/31)이면 안내가 나오지 않는다", () => {
    const result = recommend({
      leaveDays: 2,
      start: "2027-01-01",
      end: "2027-12-31",
    });

    expect(result).toMatchObject({ status: "ok", notices: [] });
  });

  describe("연휴 조합의 정의", () => {
    it("연차 3일, 5/1~5/31 결과에 5/1~5/7 구간은 없다 (5/8이 토요일이라 더 늘릴 수 있다)", () => {
      const combos = combosOf(3, "2027-05-01", "2027-05-31");

      expect(
        combos.some((c) => c.start === "2027-05-01" && c.end === "2027-05-07"),
      ).toBe(false);
      // 대신 5/8~5/9까지 이어진 5/1~5/9가 1위다.
      expect(combos[0]).toMatchObject({ start: "2027-05-01", end: "2027-05-09" });
    });

    it("모든 조합은 시작일 전날과 종료일 다음날이 근무일이다", () => {
      const periods: [number, string, string][] = [
        [3, "2027-05-01", "2027-05-31"],
        [2, "2027-09-01", "2027-09-30"],
        [1, "2027-02-01", "2027-02-28"],
        [15, "2027-01-01", "2027-12-31"],
      ];

      for (const [leaveDays, start, end] of periods) {
        for (const combo of combosOf(leaveDays, start, end)) {
          expect(isRestDay(shiftDay(combo.start, -1))).toBe(false);
          expect(isRestDay(shiftDay(combo.end, 1))).toBe(false);
        }
      }
    });

    it("연차를 쓰지 않는 구간은 조합이 아니다: 연차 1일, 2/1~2/28 결과의 모든 조합은 사용 연차가 1 이상이고 2/6~2/9는 없다", () => {
      const combos = combosOf(1, "2027-02-01", "2027-02-28");

      expect(combos.length).toBeGreaterThan(0);
      expect(combos.every((c) => c.leaveDates.length >= 1)).toBe(true);
      expect(
        combos.some((c) => c.start === "2027-02-06" && c.end === "2027-02-09"),
      ).toBe(false);
    });

    it.each([
      ["2027-02-06", "2027-02-09"], // 설날 연휴 4일 (쉬는 날만으로 된 구간)
      ["2027-01-01", "2027-01-03"], // 신정과 주말 3일
    ])(
      "기간이 쉬는 날뿐인 %s~%s이면 연차 15일이어도 조합이 없다",
      (start, end) => {
        expect(recommend({ leaveDays: 15, start, end })).toMatchObject({
          status: "empty",
        });
      },
    );

    it("연차 1일, 기본 기간 결과의 모든 조합은 사용 연차가 1이다", () => {
      const combos = combosOf(1, "2027-01-01", "2027-12-31");

      expect(combos.length).toBeGreaterThan(0);
      expect(combos.every((c) => c.leaveDates.length === 1)).toBe(true);
    });
  });

  describe("기간 경계 안내는 쉬는 날 연속 구간이 기간 경계에서 잘린 경우에만 나온다", () => {
    it("연차 1일, 5/1~5/31이면 시작일 전날(4/30)과 종료일 다음날(6/1)이 근무일이라 안내가 없다", () => {
      const result = recommend({
        leaveDays: 1,
        start: "2027-05-01",
        end: "2027-05-31",
      });

      expect(result).toMatchObject({ status: "ok", notices: [] });
    });

    it("연차 2일, 9/1~9/30이면 시작일 전날(8/31)과 종료일 다음날(10/1)이 근무일이라 안내가 없다", () => {
      const result = recommend({
        leaveDays: 2,
        start: "2027-09-01",
        end: "2027-09-30",
      });

      expect(result).toMatchObject({ status: "ok", notices: [] });
    });

    it("연차 1일, 2/1~2/28이면 종료일 다음날(3/1)이 쉬는 날이라 2/26(금)~3/1(월) 연휴를 안내한다", () => {
      const result = recommend({
        leaveDays: 1,
        start: "2027-02-01",
        end: "2027-02-28",
      });

      if (result.status !== "ok") throw new Error(result.status);
      expect(result.notices).toEqual([
        {
          kind: "extends-period",
          start: "2027-02-26",
          end: "2027-03-01",
          message: expect.stringContaining("기간을 3/1까지로 넓혀 보세요"),
        },
      ]);
      expect(
        result.combos.some((c) => c.start === "2027-02-26"),
      ).toBe(false);
    });
  });
});
