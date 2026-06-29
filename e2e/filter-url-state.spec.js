import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("filters by type and seniority from the UI", async ({ page }) => {
  await expect(page.locator(".job")).toHaveCount(6);
  await expect(page.locator("#loadMore")).toBeVisible();

  await page.locator("#typeFilterBtn").click();
  await page.locator("#typeFilterList .filter-dropdown-option[data-value='remote']").click();
  await expect(page.locator(".job")).not.toHaveCount(0);
  await expect(page.locator(".job .chip").first()).toContainText("Remote");

  await page.locator("#seniorityFilterBtn").click();
  await page.locator("#seniorityFilterList .filter-dropdown-option[data-value='senior']").click();
  await expect(page.locator(".job")).toHaveCount(6);
  await expect(page.locator("#activeFiltersBadge")).toHaveText("2");
  await expect(page.locator("#resultsCount")).toContainText("6 jobs shown");
});

test("filters by salary band", async ({ page }) => {
  await page.locator("#salaryFilterBtn").click();
  await page.locator("#salaryFilterList .filter-dropdown-option[data-value='under-3k']").click();

  await expect(page.locator(".job")).not.toHaveCount(0);
  await expect(page.locator("#resultsCount")).toContainText("shown");
  const countText = await page.locator("#resultsCount").textContent();
  const match = countText.match(/^(\d+)/);
  const shown = Number(match?.[1] ?? 0);
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(24);
});

test("loads filter state from URL query params", async ({ page }) => {
  await page.goto("/?type=remote&seniority=senior&q=Developer");

  await expect(page.locator("#searchInput")).toHaveValue("Developer");
  await expect(page.locator("#typeFilter")).toHaveValue("remote");
  await expect(page.locator("#seniorityFilter")).toHaveValue("senior");
  await expect(page.locator(".job")).toHaveCount(3);
  await expect(page).toHaveURL(/type=remote/);
  await expect(page).toHaveURL(/seniority=senior/);
  await expect(page).toHaveURL(/q=Developer/);
});

test("updates URL when filters change", async ({ page }) => {
  await page.locator("#typeFilterBtn").click();
  await page.locator("#typeFilterList .filter-dropdown-option[data-value='hybrid']").click();

  await expect(page).toHaveURL(/type=hybrid/);
});

test("load more pagination with expanded dataset", async ({ page }) => {
  await expect(page.locator(".job")).toHaveCount(6);
  await page.locator("#loadMore").click();
  await expect(page.locator(".job")).toHaveCount(12);
  await page.locator("#loadMore").click();
  await expect(page.locator(".job")).toHaveCount(18);
});
