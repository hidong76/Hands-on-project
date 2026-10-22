"use client";

import { type FormEvent, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatDay } from "./format";
import { type RecommendResult, recommend } from "./recommend";

const DEFAULT_START = "2027-01-01";
const DEFAULT_END = "2027-12-31";

// 입력 칸의 글자를 연차 수로 바꾼다. 비었거나 숫자가 아니면 recommend가 안내하도록 null/NaN으로 넘긴다.
function parseLeaveDays(text: string): number | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : Number(trimmed);
}

// 효율은 소수 첫째 자리까지, 정수면 소수점 없이 보여준다.
const formatEfficiency = (value: number) => `${Number(value.toFixed(1))}일`;

export function HolidayCombosPage() {
  const [leaveDays, setLeaveDays] = useState("");
  const [start, setStart] = useState(DEFAULT_START);
  const [end, setEnd] = useState(DEFAULT_END);
  const [result, setResult] = useState<RecommendResult | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(recommend({ leaveDays: parseLeaveDays(leaveDays), start, end }));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          이어쉼
        </h1>
        <p className="text-muted-foreground">
          남은 연차 수와 기간을 넣으면, 그 연차로 만들 수 있는 연휴 조합을
          나란히 비교해 볼 수 있습니다.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>연휴 조합 찾기</CardTitle>
          <CardDescription>
            주 5일 근무와 2027년 공휴일(대체공휴일 포함) 기준입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="leave-days">남은 연차 수</FieldLabel>
                <Input
                  id="leave-days"
                  inputMode="numeric"
                  autoComplete="off"
                  value={leaveDays}
                  onChange={(event) => setLeaveDays(event.target.value)}
                />
                <FieldDescription>1~15 사이 정수로 입력합니다.</FieldDescription>
              </Field>
              <FieldGroup className="sm:flex-row">
                <Field>
                  <FieldLabel htmlFor="period-start">기간 시작일</FieldLabel>
                  <Input
                    id="period-start"
                    type="date"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="period-end">기간 종료일</FieldLabel>
                  <Input
                    id="period-end"
                    type="date"
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" size="lg">
                연휴 조합 찾기
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {result?.status === "invalid" && (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {result && result.status !== "invalid" && (
        <section className="flex flex-col gap-4" aria-label="추천 결과">
          {result.notices.map((notice) => (
            <Alert key={notice.kind} role="status">
              <AlertDescription>{notice.message}</AlertDescription>
            </Alert>
          ))}

          {result.status === "empty" ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>{result.message}</EmptyTitle>
                <EmptyDescription>
                  연차 수를 늘리거나 기간을 넓혀 다시 찾아 보세요.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>순위</TableHead>
                  <TableHead>연휴 기간</TableHead>
                  <TableHead>연휴 총 일수</TableHead>
                  <TableHead>사용 연차</TableHead>
                  <TableHead>연차 쓰는 날</TableHead>
                  <TableHead>연차 1일당 쉬는 일수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.combos.map((combo, index) => (
                  <TableRow key={`${combo.start}-${combo.end}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {formatDay(combo.start)}~{formatDay(combo.end)}
                    </TableCell>
                    <TableCell>{combo.totalDays}일</TableCell>
                    <TableCell>{combo.leaveDates.length}일</TableCell>
                    <TableCell>
                      {combo.leaveDates.map(formatDay).join(", ")}
                    </TableCell>
                    <TableCell>{formatEfficiency(combo.efficiency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      )}
    </div>
  );
}
