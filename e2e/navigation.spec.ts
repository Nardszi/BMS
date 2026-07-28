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

  await page.goto("/");
  await page.waitForTimeout(3000);
}

const pages = [
  { name: "Residents", path: "/residents", text: /resident/i },
  { name: "Certificates", path: "/certificates", text: /certificate/i },
  { name: "Blotter", path: "/blotter", text: /blotter/i },
  { name: "Business Permits", path: "/permits", text: /permit/i },
  { name: "Announcements", path: "/announcements", text: /announcement/i },
  { name: "Officials", path: "/officials", text: /official/i },
  { name: "Users", path: "/users", text: /user/i },
  { name: "Reports", path: "/reports", text: /report/i },
];

test.describe("Page Navigation (direct URL)", () => {
  for (const p of pages) {
    test(`loads ${p.name} page`, async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(p.path);
      await expect(page.locator("body")).toContainText(p.text, { timeout: 10000 });
    });
  }
});
