import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("save on listing, open saved-jobs page, and apply", async ({ page }) => {
  await page.getByPlaceholder("Search jobs...").fill("Fullstack");
  await expect(page.locator(".job")).toHaveCount(1);

  await page.locator(".job").first().getByRole("button", { name: "Save job" }).click();
  await expect(page.locator("#savedCount")).toHaveText("Saved: 1");

  await page.goto("/saved-jobs.html");
  await expect(page.locator("#jobs-fetch-error")).toBeHidden();
  await expect(page.locator(".saved-jobs-card")).toHaveCount(1);
  await expect(page.locator(".saved-jobs-card")).toContainText("Fullstack Developer");

  await page.locator(".saved-page-apply").click();
  await expect(page.locator("#jobModal")).toBeVisible();
  await page.locator("#confirmApplyBtn").click();

  await expect(page.locator("#toast")).toContainText("Application recorded");
  await expect(page.locator(".saved-page-apply")).toBeDisabled();
  await expect(page.locator(".saved-page-apply")).toHaveText("Applied");

  await page.reload();
  await expect(page.locator(".saved-page-apply")).toBeDisabled();
});
