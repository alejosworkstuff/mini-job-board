import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("records application from apply modal", async ({ page }) => {
  await expect(page.locator("#appliedCount")).toHaveText("Applied: 0");

  await page.locator(".job").first().getByRole("button", { name: "Apply now" }).click();
  await expect(page.locator("#jobModal")).toBeVisible();
  await page.locator("#confirmApplyBtn").click();

  await expect(page.locator("#toast")).toContainText("Application recorded");
  await expect(page.locator("#appliedCount")).toHaveText("Applied: 1");
  await expect(page.locator(".job").first().getByRole("button", { name: "Applied" })).toBeDisabled();

  await page.reload();
  await expect(page.locator("#appliedCount")).toHaveText("Applied: 1");
  await expect(page.locator(".job").first().getByRole("button", { name: "Applied" })).toBeDisabled();
});

test("applied state persists on job details page", async ({ page }) => {
  await page.goto("/job-details.html?id=21");

  await expect(page.locator("#detailTitle")).toContainText("Fullstack Developer");
  await page.locator("#detailApplyBtn").click();
  await page.locator("#confirmApplyBtn").click();
  await expect(page.locator("#toast")).toContainText("Application recorded");
  await expect(page.locator("#detailApplyBtn")).toBeDisabled();
  await expect(page.locator("#detailApplyBtn")).toHaveText("Applied");

  await page.reload();
  await expect(page.locator("#detailApplyBtn")).toBeDisabled();
  await expect(page.locator("#detailApplyBtn")).toHaveText("Applied");
});
