import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

const CONSTRAINT =
  "현재는 초안 버전으로, 우주항공청 2027년 월력요항 기준 2027년 공휴일만 지원합니다.";
const EMPHASIS = "강조 표시된 날짜는 연차를 써야 하는 날입니다.";
const PLAN_DESCRIPTION =
  "평소처럼 짧게 자주 쉬고 싶을 때 써 보세요. 공휴일을 활용해 연차 1일로 4일 이상 쉬는 꿀조합을 골라 1년 플랜을 만들고, 남는 연차도 알려드려요.";
const RECOMMEND_DESCRIPTION =
  "여행처럼 특별한 계획이 있을 때 써 보세요. 남은 연차로 만들 수 있는 가장 긴 연휴 조합을 순위로 비교해 드려요.";

function enterInputs({
  leaveDays,
  start,
  end,
}: {
  leaveDays?: string;
  start?: string;
  end?: string;
}) {
  if (leaveDays !== undefined) {
    fireEvent.change(screen.getByLabelText("남은 연차 수"), {
      target: { value: leaveDays },
    });
  }
  if (start !== undefined) {
    fireEvent.change(screen.getByLabelText("기간 시작일"), {
      target: { value: start },
    });
  }
  if (end !== undefined) {
    fireEvent.change(screen.getByLabelText("기간 종료일"), {
      target: { value: end },
    });
  }
}

const openPlanTab = () =>
  fireEvent.click(screen.getByRole("tab", { name: "1년 꿀조합 플랜" }));
const openRecommendTab = () =>
  fireEvent.click(screen.getByRole("tab", { name: "연휴 조합 추천" }));

function makePlan(inputs: Parameters<typeof enterInputs>[0]) {
  openPlanTab();
  enterInputs(inputs);
  fireEvent.click(screen.getByRole("button", { name: "1년 플랜 만들기" }));
}

function summaryOf() {
  const summary = within(screen.getByRole("region", { name: "플랜 요약" }));
  const read = (label: string) =>
    summary.getByText(label).nextElementSibling?.textContent;
  return {
    count: read("꿀조합 횟수"),
    totalDays: read("연휴 총 일수"),
    usedLeave: read("사용 연차"),
    remainingLeave: read("남는 연차"),
  };
}

describe("탭과 1년 꿀조합 플랜 화면", () => {
  it("처음 화면에서 1년 꿀조합 플랜이 첫 번째 탭으로 선택되어 있고 제출 버튼은 \"1년 플랜 만들기\"다", () => {
    render(<Home />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "1년 꿀조합 플랜",
      "연휴 조합 추천",
    ]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("button", { name: "1년 플랜 만들기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "연휴 조합 찾기" })).not.toBeInTheDocument();
  });

  it("연휴 조합 추천 탭으로 바꾸면 입력 폼은 그대로 쓰고 제출 버튼 문구만 바뀐다", () => {
    render(<Home />);

    openRecommendTab();

    expect(
      screen.getByRole("tab", { name: "연휴 조합 추천", selected: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "연휴 조합 찾기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "1년 플랜 만들기" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("남은 연차 수")).toBeInTheDocument();
    expect(screen.getByLabelText("기간 시작일")).toHaveValue("2027-01-01");
    expect(screen.getByLabelText("기간 종료일")).toHaveValue("2027-12-31");
  });

  it("처음 화면에서 선택된 플랜 탭의 설명이 탭 바로 아래에 보이고 추천 탭의 설명은 보이지 않는다", () => {
    render(<Home />);

    expect(screen.getByText(PLAN_DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(RECOMMEND_DESCRIPTION)).not.toBeInTheDocument();
    expect(screen.getByRole("tablist").nextElementSibling).toHaveTextContent(
      PLAN_DESCRIPTION,
    );
  });

  it("탭을 바꾸면 설명도 그 탭의 문구로 바뀐다", () => {
    render(<Home />);

    openRecommendTab();
    expect(screen.getByText(RECOMMEND_DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(PLAN_DESCRIPTION)).not.toBeInTheDocument();
    expect(screen.getByRole("tablist").nextElementSibling).toHaveTextContent(
      RECOMMEND_DESCRIPTION,
    );

    openPlanTab();
    expect(screen.getByText(PLAN_DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(RECOMMEND_DESCRIPTION)).not.toBeInTheDocument();
  });

  it("화면 낭독기가 선택된 탭과 그 탭의 내용에 설명을 연결해 읽는다", () => {
    render(<Home />);

    expect(screen.getByRole("tab", { name: "1년 꿀조합 플랜" })).toHaveAccessibleDescription(
      PLAN_DESCRIPTION,
    );
    expect(screen.getByRole("tabpanel")).toHaveAccessibleDescription(PLAN_DESCRIPTION);

    openRecommendTab();

    expect(screen.getByRole("tab", { name: "연휴 조합 추천" })).toHaveAccessibleDescription(
      RECOMMEND_DESCRIPTION,
    );
    expect(screen.getByRole("tabpanel")).toHaveAccessibleDescription(RECOMMEND_DESCRIPTION);
  });

  it("2027년 제약 설명은 두 탭 모두 처음 화면부터 보인다", () => {
    render(<Home />);

    expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
    openRecommendTab();
    expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
    expect(screen.queryByText(EMPHASIS)).not.toBeInTheDocument();
  });

  it("연차 1일이면 요약과 날짜순 목록에 9/11~9/16 한 건이 나오고 남는 연차 안내는 없다", () => {
    render(<Home />);

    makePlan({ leaveDays: "1" });

    expect(summaryOf()).toEqual({
      count: "1회",
      totalDays: "6일",
      usedLeave: "1일",
      remainingLeave: "0일",
    });
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(2); // 머리글 + 1건
    expect(
      within(rows[1])
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["9/11(토)~9/16(목)", "6일", "9/13(월)", "6일"]);
    expect(screen.queryByText(/자유롭게 사용하세요/)).not.toBeInTheDocument();
  });

  it("연차 4일이면 목록 4건에서 연차 쓰는 날 1/4·2/5·5/4·9/13이 모두 칩으로 강조된다", () => {
    render(<Home />);

    makePlan({ leaveDays: "4" });

    const marks = [...screen.getByRole("table").querySelectorAll("mark")];
    expect(marks.map((mark) => mark.textContent)).toEqual([
      "1/4(월)",
      "2/5(금)",
      "5/4(화)",
      "9/13(월)",
    ]);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(5);
  });

  it("연차 30일이면 남는 연차 18일과 안내 문구가 나온다", () => {
    render(<Home />);

    makePlan({ leaveDays: "30" });

    expect(summaryOf()).toEqual({
      count: "11회",
      totalDays: "51일",
      usedLeave: "12일",
      remainingLeave: "18일",
    });
    expect(screen.getByText("남은 연차 18일은 자유롭게 사용하세요")).toBeInTheDocument();
  });

  it("꿀조합이 없는 기간(연차 1일, 6/1~6/30)이면 안내와 남는 연차 1일이 나오고 제약 설명만 보인다", () => {
    render(<Home />);

    makePlan({ leaveDays: "1", start: "2027-06-01", end: "2027-06-30" });

    expect(screen.getByText("이 기간에는 공휴일 꿀조합이 없습니다")).toBeInTheDocument();
    expect(summaryOf().remainingLeave).toBe("1일");
    expect(screen.getByText("남은 연차 1일은 자유롭게 사용하세요")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
    expect(screen.queryByText(EMPHASIS)).not.toBeInTheDocument();
  });

  it("플랜 탭의 처음 화면에서도 제약 설명이 보이고 강조 설명은 보이지 않는다", () => {
    render(<Home />);

    openPlanTab();

    expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
    expect(screen.queryByText(EMPHASIS)).not.toBeInTheDocument();
  });

  it("플랜 결과가 있으면 풋노트에 강조 설명과 제약 설명이 모두 보인다", () => {
    render(<Home />);

    makePlan({ leaveDays: "3" });

    expect(screen.getByText(EMPHASIS)).toBeInTheDocument();
    expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
  });

  it("플랜 탭에서도 입력 오류는 기존 추천과 같은 안내를 쓰고 제약 설명이 보인다", () => {
    render(<Home />);

    makePlan({ leaveDays: "0" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "남은 연차 수는 1~30 사이 정수로 입력해 주세요.",
    );
    expect(screen.queryByRole("region", { name: "플랜 요약" })).not.toBeInTheDocument();
    expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
    expect(screen.queryByText(EMPHASIS)).not.toBeInTheDocument();
  });

  it("좁은 화면용 카드에도 같은 연휴가 칩과 함께 나온다", () => {
    render(<Home />);

    makePlan({ leaveDays: "4" });

    const cards = within(
      screen.getByRole("list", { name: "꿀조합 카드" }),
    ).getAllByRole("listitem");
    expect(cards).toHaveLength(4);
    const first = within(cards[0]);
    expect(first.getByText("1/1(금)~1/4(월)")).toBeInTheDocument();
    expect(first.getByText("일수").nextElementSibling).toHaveTextContent("4일");
    expect(
      [...cards[0].querySelectorAll("mark")].map((mark) => mark.textContent),
    ).toEqual(["1/4(월)"]);
    expect(first.getByText("연차 1일당 쉬는 일수").nextElementSibling).toHaveTextContent(
      "4일",
    );
  });

  it("탭을 전환해도 기존 연휴 조합 추천의 결과와 안내는 이전과 같다", () => {
    render(<Home />);
    openRecommendTab();
    enterInputs({ leaveDays: "1", start: "2027-05-04", end: "2027-05-31" });
    fireEvent.click(screen.getByRole("button", { name: "연휴 조합 찾기" }));
    const before = {
      rows: within(screen.getByRole("table"))
        .getAllByRole("row")
        .map((row) => row.textContent),
      notice: screen.getByRole("status").textContent,
    };

    openPlanTab();
    openRecommendTab();

    expect(
      within(screen.getByRole("table"))
        .getAllByRole("row")
        .map((row) => row.textContent),
    ).toEqual(before.rows);
    expect(screen.getByRole("status")).toHaveTextContent(before.notice ?? "");
  });

  it("각 탭은 마지막으로 계산한 결과를 유지하고 다른 탭의 결과와 섞이지 않는다", () => {
    render(<Home />);
    makePlan({ leaveDays: "4" });

    openRecommendTab();
    expect(screen.queryByRole("region", { name: "플랜 요약" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    openPlanTab();
    expect(summaryOf().count).toBe("4회");
  });
});
