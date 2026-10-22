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
});
