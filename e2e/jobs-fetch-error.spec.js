import { expect, test } from "@playwright/test";

test("shows error banner when jobs.json fails on index", async ({ page }) => {
  await page.route("**/data/jobs.json", (route) => route.abort("failed"));
  await page.goto("/");

  const banner = page.locator("#jobs-fetch-error");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(/could not load job listings/i);
  await expect(page.locator("#resultsCount")).toContainText("Jobs unavailable");
  await expect(page.locator("#empty-state")).toBeHidden();
});

test("shows error banner when jobs.json fails on saved-jobs page", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("savedJobs", "[21]"));

  await page.route("**/data/jobs.json", (route) => route.abort("failed"));
  await page.goto("/saved-jobs.html");

  const banner = page.locator("#jobs-fetch-error");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(/could not load job listings/i);
  await expect(page.locator("#saved-empty")).toBeHidden();
  await expect(page.locator(".saved-jobs-card")).toHaveCount(0);
});
