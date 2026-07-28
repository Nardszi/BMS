import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.waitForSelector("#email", { timeout: 10000 });

  const csrfResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  const callbackResponse = await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: { csrfToken, email: "admin@barangay.gov", password: "admin123" },
    maxRedirects: 0,
  });

  const cookies = callbackResponse.headers()["set-cookie"];
  if (cookies) {
    const cookieParts = cookies.split(",").map((c) => c.trim().split(";")[0]);
    for (const cookieStr of cookieParts) {
      const [name, ...valueParts] = cookieStr.split("=");
      const value = valueParts.join("=");
      await page.context().addCookies([
        { name: name.trim(), value: value.trim(), domain: "localhost", path: "/" },
      ]);
    }
  }

  await page.goto("/api/auth/session");
  await page.waitForTimeout(1000);
  await page.goto("/");
  await page.waitForTimeout(3000);
}

test.describe("Dashboard", () => {
  test("loads dashboard after login", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator("body")).toContainText(/Barangay Management System/i, { timeout: 10000 });
  });
});

test.describe("Residents Page", () => {
  test("loads residents page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/residents");
    await expect(page.locator("body")).toContainText(/resident/i, { timeout: 10000 });
  });

  test("residents page has search and filter controls", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/residents");
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /all/i }).first()).toBeVisible();
  });
});

test.describe("Certificates Page", () => {
  test("loads certificates page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/certificates");
    await expect(page.locator("body")).toContainText(/certificate/i, { timeout: 10000 });
  });
});

test.describe("Blotter Page", () => {
  test("loads blotter page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/blotter");
    await expect(page.locator("body")).toContainText(/blotter/i, { timeout: 10000 });
  });
});

test.describe("Announcements Page", () => {
  test("loads announcements page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/announcements");
    await expect(page.locator("body")).toContainText(/announcement/i, { timeout: 10000 });
  });
});

test.describe("Session Timeout", () => {
  test("does not cause fatal JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await loginAsAdmin(page);
    await page.goto("/residents");
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("Content Security Policy") && !e.includes("unsafe-eval")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
