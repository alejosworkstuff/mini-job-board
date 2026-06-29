import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("search, save a job, and open saved jobs modal", async ({ page }) => {
  await expect(page.locator("#jobs-fetch-error")).toBeHidden();
  await expect(page.locator("#resultsCount")).toContainText(/jobs? shown/);
  await expect(page.locator(".job")).not.toHaveCount(0);

  await page.getByPlaceholder("Search jobs...").fill("Fullstack");
  await expect(page.locator(".job")).toHaveCount(1);
  await expect(page.locator(".job").first()).toContainText("Fullstack Developer");

  await page.locator(".job").first().getByRole("button", { name: "Save job" }).click();
  await expect(page.locator("#toast")).toContainText("Saved job to your list");
  await expect(page.locator("#savedCount")).toHaveText("Saved: 1");

  await page.locator("#userMenuBtn").click();
  await page.getByRole("menuitem", { name: "Saved Jobs" }).click();

  await expect(page.locator("#savedJobsModal")).toBeVisible();
  await expect(page.locator(".saved-job-title")).toContainText("Fullstack Developer");
});
