import { expect, test } from "@playwright/test";

test("처음 화면은 1년 꿀조합 플랜 탭이고 플랜을 만들 수 있다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("이어쉼");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("이어쉼");
  await expect(
    page.getByRole("tab", { name: "1년 꿀조합 플랜" }),
  ).toHaveAttribute("aria-selected", "true");

  await page.getByLabel("남은 연차 수").fill("4");
  await page.getByRole("button", { name: "1년 플랜 만들기" }).click();

  await expect(page.getByRole("region", { name: "플랜 요약" })).toContainText(
    "20일",
  );
  await expect(
    page.getByRole("row").nth(1).getByRole("cell", { name: "1/1(금)~1/4(월)" }),
  ).toBeVisible();
});

test("연휴 조합 추천 탭에서 연휴 조합을 찾을 수 있다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "연휴 조합 추천" }).click();
  await page.getByLabel("남은 연차 수").fill("2");
  await page.getByLabel("기간 시작일").fill("2027-09-01");
  await page.getByLabel("기간 종료일").fill("2027-09-30");
  await page.getByRole("button", { name: "연휴 조합 찾기" }).click();

  await expect(
    page.getByRole("row").nth(1).getByRole("cell", { name: "9/11(토)~9/19(일)" }),
  ).toBeVisible();
});
