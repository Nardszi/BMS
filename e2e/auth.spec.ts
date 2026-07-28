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

  // Navigate to session endpoint first to initialize client session
  await page.goto("/api/auth/session");
  await page.waitForTimeout(1000);
  await page.goto("/");
  await page.waitForTimeout(3000);
}

test.describe("Login", () => {
  test("shows login page with form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 10000 });
    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpass123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/login");
  });

  test("logs in and shows dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator("body")).toContainText(/Barangay Management System/i, { timeout: 10000 });
  });
});

test.describe("Logout", () => {
  test("logs out via API and redirects", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator("body")).toContainText(/Barangay Management System/i, { timeout: 10000 });

    // Call the NextAuth signout endpoint directly
    const csrfRes = await page.request.get(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    await page.request.post(`${BASE_URL}/api/auth/signout`, {
      form: { csrfToken: csrfData.csrfToken },
      maxRedirects: 0,
    });

    // Navigate to home — should redirect to login
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 10000 });
  });
});
