import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

function search({
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
  fireEvent.click(screen.getByRole("button", { name: "연휴 조합 찾기" }));
}

describe("연휴 조합 추천 화면", () => {
  it("연차 수는 비어 있고 기간은 2027년 전체로 시작하며 결과는 아직 없다", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "이어쉼" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("남은 연차 수")).toHaveValue("");
    expect(screen.getByLabelText("기간 시작일")).toHaveValue("2027-01-01");
    expect(screen.getByLabelText("기간 종료일")).toHaveValue("2027-12-31");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("연차 2일, 9/1~9/30을 넣으면 1위 조합의 기간·총 일수·연차·연차 쓰는 날·효율을 보여준다", () => {
    render(<Home />);

    search({ leaveDays: "2", start: "2027-09-01", end: "2027-09-30" });

    const rows = within(screen.getByRole("table")).getAllByRole("row");
    // rows[0]은 머리글이다.
    const first = within(rows[1]).getAllByRole("cell");
    expect(first.map((cell) => cell.textContent)).toEqual([
      "1",
      "9/11(토)~9/19(일)",
      "9일",
      "2일",
      "9/13(월), 9/17(금)",
      "4.5일",
    ]);
    expect(rows).toHaveLength(11); // 머리글 + 상위 10개
  });

  it.each(["0", "31", "", "2.5", "abc"])(
    "연차 수 %j를 넣으면 결과 없이 1~30 안내를 보여준다",
    (leaveDays) => {
      render(<Home />);

      search({ leaveDays });

      expect(screen.getByRole("alert")).toHaveTextContent("1~30");
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    },
  );

  it("연차 수 30일도 허용 범위 안이라 추천 표를 보여준다", () => {
    render(<Home />);

    search({ leaveDays: "30" });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("2027년 밖 기간을 넣으면 2027년만 지원한다고 안내한다", () => {
    render(<Home />);

    search({ leaveDays: "2", start: "2026-12-01", end: "2027-01-31" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "현재는 2027년만 지원합니다",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("시작일이 종료일보다 늦으면 안내한다", () => {
    render(<Home />);

    search({ leaveDays: "2", start: "2027-09-30", end: "2027-09-01" });

    expect(screen.getByRole("alert")).toHaveTextContent("시작일이 종료일보다 늦습니다");
  });

  it("조건에 맞는 조합이 없으면 없다고 안내한다", () => {
    render(<Home />);

    search({ leaveDays: "1", start: "2027-01-04", end: "2027-01-04" });

    expect(screen.getByText("만들 수 있는 연휴 조합이 없습니다")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("조합이 없어도 기간 밖으로 이어지는 연휴가 있으면 기간을 넓히라고 함께 안내한다", () => {
    render(<Home />);

    search({ leaveDays: "1", start: "2027-01-04", end: "2027-01-04" });

    expect(screen.getByText("만들 수 있는 연휴 조합이 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "1/1(금)~1/4(월) 연휴가 필요하면 기간을 1/1부터로 넓혀 보세요.",
    );
  });

  it("기간 밖으로 이어지는 연휴가 있으면 결과와 함께 기간을 넓히라고 안내한다", () => {
    render(<Home />);

    search({ leaveDays: "1", start: "2027-05-04", end: "2027-05-31" });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "기간 밖으로 이어지는 연휴가 있어 제외했습니다. 5/1(토)~5/5(수) 연휴가 필요하면 기간을 5/1부터로 넓혀 보세요.",
    );
  });

  it("2028년으로 이어지는 연휴가 제외되면 2028년 안내를 보여준다", () => {
    render(<Home />);

    search({ leaveDays: "4", start: "2027-12-01", end: "2027-12-31" });

    expect(
      screen.getByText("2028년으로 이어지는 연휴는 현재 계산하지 않습니다"),
    ).toBeInTheDocument();
  });

  it("안내가 없는 조건에서는 안내를 보여주지 않는다", () => {
    render(<Home />);

    search({ leaveDays: "2" });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("좁은 화면용 조합 카드에도 같은 정보를 보여준다", () => {
    render(<Home />);

    search({ leaveDays: "2", start: "2027-09-01", end: "2027-09-30" });

    const cards = within(
      screen.getByRole("list", { name: "추천 조합 카드" }),
    ).getAllByRole("listitem");
    expect(cards).toHaveLength(10);
    const first = within(cards[0]);
    expect(first.getByText("1위")).toBeInTheDocument();
    expect(first.getByText("9/11(토)~9/19(일)")).toBeInTheDocument();
    expect(first.getByText("9일")).toBeInTheDocument();
    expect(first.getByText("2일")).toBeInTheDocument();
    // 날짜마다 칩으로 감싸 한 덩어리 글자로는 찾을 수 없으므로, 칸에 보이는 글자가 같은지 읽는다.
    expect(first.getByText("연차 쓰는 날").nextElementSibling).toHaveTextContent(
      /^9\/13\(월\), 9\/17\(금\)$/,
    );
    expect(first.getByText("4.5일")).toBeInTheDocument();
  });

  it("연차 30일이어도 카드에 연차 쓰는 날 30개가 모두 들어 있다", () => {
    render(<Home />);

    search({ leaveDays: "30" });

    const [firstCard] = within(
      screen.getByRole("list", { name: "추천 조합 카드" }),
    ).getAllByRole("listitem");
    const dates = within(firstCard)
      .getByText("연차 쓰는 날")
      .nextElementSibling?.textContent?.split(", ");
    expect(dates).toHaveLength(30);
    expect(dates?.[0]).toBe("8/30(월)");
    expect(dates?.[29]).toBe("10/15(금)");
  });

  describe("풋노트의 2027년 제약 설명", () => {
    const CONSTRAINT =
      "현재는 초안 버전으로, 우주항공청 2027년 월력요항 기준 2027년 공휴일만 지원합니다.";
    const EMPHASIS = "강조 표시된 날짜는 연차를 써야 하는 날입니다.";

    it("처음 화면에서 2027년 제약 설명이 보이고 강조 설명은 보이지 않는다", () => {
      render(<Home />);

      expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
      expect(screen.queryByText(EMPHASIS)).not.toBeInTheDocument();
    });

    it("결과에 연휴가 있으면 강조 설명과 제약 설명이 모두 보인다", () => {
      render(<Home />);

      search({ leaveDays: "2", start: "2027-09-01", end: "2027-09-30" });

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText(EMPHASIS)).toBeInTheDocument();
      expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
    });

    it("입력 오류(연차 0일)일 때도 제약 설명이 보이고 강조 설명은 보이지 않는다", () => {
      render(<Home />);

      search({ leaveDays: "0" });

      expect(screen.getByRole("alert")).toHaveTextContent("1~30");
      expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
      expect(screen.queryByText(EMPHASIS)).not.toBeInTheDocument();
    });

    it("조합이 없을 때(연차 1일, 1/4~1/4)도 제약 설명만 보이고 강조 설명은 없다", () => {
      render(<Home />);

      search({ leaveDays: "1", start: "2027-01-04", end: "2027-01-04" });

      expect(screen.getByText("만들 수 있는 연휴 조합이 없습니다")).toBeInTheDocument();
      expect(screen.getByText(CONSTRAINT)).toBeInTheDocument();
      expect(screen.queryByText(EMPHASIS)).not.toBeInTheDocument();
    });
  });

  describe("연차 쓰는 날 강조 칩", () => {
    function leaveChips(container: HTMLElement) {
      return [...container.querySelectorAll("mark")];
    }

    it("표 첫 행의 연차 쓰는 날(9/13·9/17)이 날짜마다 칩으로 강조된다", () => {
      render(<Home />);

      search({ leaveDays: "2" });

      const firstRow = within(screen.getByRole("table")).getAllByRole("row")[1];
      const leaveCell = within(firstRow).getAllByRole("cell")[4];
      expect(leaveChips(leaveCell).map((chip) => chip.textContent)).toEqual([
        "9/13(월)",
        "9/17(금)",
      ]);
      expect(leaveCell).toHaveTextContent("9/13(월), 9/17(금)");
    });

    it("카드의 연차 쓰는 날도 같은 날짜가 칩으로 강조된다", () => {
      render(<Home />);

      search({ leaveDays: "2" });

      const [firstCard] = within(
        screen.getByRole("list", { name: "추천 조합 카드" }),
      ).getAllByRole("listitem");
      const leaveDates = within(firstCard).getByText("연차 쓰는 날")
        .nextElementSibling as HTMLElement;
      expect(leaveChips(leaveDates).map((chip) => chip.textContent)).toEqual([
        "9/13(월)",
        "9/17(금)",
      ]);
    });

    it("표와 카드의 칩은 같은 모양(굵은 글씨, chart-4 글자색, 연한 chart-1 배경)이다", () => {
      render(<Home />);

      search({ leaveDays: "2" });

      const [tableChip] = leaveChips(screen.getByRole("table"));
      const [cardChip] = leaveChips(
        screen.getByRole("list", { name: "추천 조합 카드" }),
      );
      expect(tableChip.className).toBe(cardChip.className);
      expect(tableChip).toHaveClass("font-semibold", "text-chart-4", "bg-chart-1/20");
    });

    it("칩 사이의 쉼표는 시각적으로만 숨기고 읽는 글자에는 남긴다", () => {
      render(<Home />);

      search({ leaveDays: "2" });

      const firstRow = within(screen.getByRole("table")).getAllByRole("row")[1];
      const leaveCell = within(firstRow).getAllByRole("cell")[4];
      const commas = [...leaveCell.querySelectorAll(".sr-only")];
      expect(commas.map((comma) => comma.textContent)).toEqual([", "]);
      expect(leaveCell.textContent).toBe("9/13(월), 9/17(금)");
      // 칩 안에는 쉼표가 없다.
      expect(leaveChips(leaveCell).every((chip) => !chip.textContent?.includes(","))).toBe(true);
    });

    it("연차 30일 카드에서도 날짜 사이마다 숨긴 쉼표가 있어 날짜 30개가 구분되어 읽힌다", () => {
      render(<Home />);

      search({ leaveDays: "30" });

      const [firstCard] = within(
        screen.getByRole("list", { name: "추천 조합 카드" }),
      ).getAllByRole("listitem");
      const leaveDates = within(firstCard).getByText("연차 쓰는 날")
        .nextElementSibling as HTMLElement;
      const commas = [...leaveDates.querySelectorAll(".sr-only")];
      expect(leaveChips(leaveDates)).toHaveLength(30);
      expect(commas).toHaveLength(29);
      expect(commas.every((comma) => comma.textContent === ", ")).toBe(true);
    });

    it("연차 날짜가 아닌 칸(연휴 기간, 일수)은 칩이 아니다", () => {
      render(<Home />);

      search({ leaveDays: "2" });

      const firstRow = within(screen.getByRole("table")).getAllByRole("row")[1];
      const cells = within(firstRow).getAllByRole("cell");
      expect([0, 1, 2, 3, 5].every((i) => leaveChips(cells[i]).length === 0)).toBe(true);
    });
  });
});
