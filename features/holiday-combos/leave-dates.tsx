import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";

import { formatDay } from "./format";

// 연차를 써야 하는 날짜를 날짜마다 칩으로 강조한다.
// 칩 사이의 쉼표는 화면에서만 숨기고(sr-only) 화면 낭독기와 복사에는 "9/13(월), 9/17(금)"처럼 남긴다.
export function LeaveDates({ dates }: { dates: string[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {dates.map((date, index) => (
        <Fragment key={date}>
          {index > 0 && <span className="sr-only">, </span>}
          <Badge
            variant="secondary"
            render={<mark />}
            className="bg-chart-1/20 font-semibold text-chart-4"
          >
            {formatDay(date)}
          </Badge>
        </Fragment>
      ))}
    </span>
  );
}
