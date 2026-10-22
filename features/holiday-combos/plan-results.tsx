import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatDay, formatEfficiency } from "./format";
import { LeaveDates } from "./leave-dates";
import type { PlanResult } from "./plan";

export function PlanResults({
  result,
}: {
  result: Exclude<PlanResult, { status: "invalid" }>;
}) {
  const { summary } = result;
  return (
    <section className="flex flex-col gap-4" aria-label="꿀조합 플랜 결과">
      <section aria-label="플랜 요약">
        <Card size="sm">
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">꿀조합 횟수</dt>
                <dd className="text-base font-medium">{summary.count}회</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">연휴 총 일수</dt>
                <dd className="text-base font-medium">{summary.totalDays}일</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">사용 연차</dt>
                <dd className="text-base font-medium">{summary.usedLeave}일</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">남는 연차</dt>
                <dd className="text-base font-medium">
                  {summary.remainingLeave}일
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      {summary.remainingLeave > 0 && (
        <p className="text-sm">
          남은 연차 {summary.remainingLeave}일은 자유롭게 사용하세요
        </p>
      )}

      {result.status === "empty" ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{result.message}</EmptyTitle>
            <EmptyDescription>기간을 넓혀 다시 만들어 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>연휴 기간</TableHead>
                  <TableHead>일수</TableHead>
                  <TableHead>연차 쓰는 날</TableHead>
                  <TableHead>연차 1일당 쉬는 일수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.combos.map((combo) => (
                  <TableRow key={`${combo.start}-${combo.end}`}>
                    <TableCell>
                      {formatDay(combo.start)}~{formatDay(combo.end)}
                    </TableCell>
                    <TableCell>{combo.totalDays}일</TableCell>
                    <TableCell>
                      <LeaveDates dates={combo.leaveDates} />
                    </TableCell>
                    <TableCell>{formatEfficiency(combo.efficiency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul aria-label="꿀조합 카드" className="flex flex-col gap-3 md:hidden">
            {result.combos.map((combo) => (
              <li key={`${combo.start}-${combo.end}`}>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>
                      {formatDay(combo.start)}~{formatDay(combo.end)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">일수</dt>
                      <dd>{combo.totalDays}일</dd>
                      <dt className="text-muted-foreground">연차 쓰는 날</dt>
                      <dd>
                        <LeaveDates dates={combo.leaveDates} />
                      </dd>
                      <dt className="text-muted-foreground">
                        연차 1일당 쉬는 일수
                      </dt>
                      <dd>{formatEfficiency(combo.efficiency)}</dd>
                    </dl>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
