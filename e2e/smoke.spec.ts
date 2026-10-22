import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 연휴 조합을 찾을 수 있다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("이어쉼");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("이어쉼");

  await page.getByLabel("남은 연차 수").fill("2");
  await page.getByLabel("기간 시작일").fill("2027-09-01");
  await page.getByLabel("기간 종료일").fill("2027-09-30");
  await page.getByRole("button", { name: "연휴 조합 찾기" }).click();

  await expect(
    page.getByRole("row").nth(1).getByRole("cell", { name: "9/11(토)~9/19(일)" }),
  ).toBeVisible();
});
