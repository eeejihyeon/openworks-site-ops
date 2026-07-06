import { expect, test } from "@playwright/test";

test("사용자 관리 - 목록이 보이고 등록 모달을 열 수 있다", async ({ page }) => {
  await page.goto("/users");

  await expect(page.getByRole("heading", { name: "사용자 관리" })).toBeVisible();
  await expect(page.getByText("김도현")).toBeVisible();

  await page.getByRole("button", { name: "+ 사용자 등록" }).click();
  await expect(page.getByRole("heading", { name: "사용자 등록" })).toBeVisible();
});

test("현장 관리 - 상태 배지가 표시된다", async ({ page }) => {
  await page.goto("/sites");
  await expect(page.getByRole("heading", { name: "현장 관리" })).toBeVisible();
  await expect(page.getByText("구축중")).toBeVisible();
});
