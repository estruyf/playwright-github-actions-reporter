import { test, expect, Page } from "@playwright/test";

test.describe("Homepage", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    await page.goto("https://www.eliostruyf.com", {
      waitUntil: "domcontentloaded",
    });
  });

  test.afterAll(async ({ browser }) => {
    await page.close();
    await browser.close();
  });

  test("Check logo", async () => {
    const logo = page.locator(`#logo`);
    await logo.waitFor();

    expect((await logo.allInnerTexts()).join()).toBe("ELIOSTRUYF");
  });

  test("Check navigation", async () => {
    const nav = page.locator(`.navigation nav`);
    await nav.waitFor();

    await expect(page.locator(".navigation nav a")).toHaveCount(5);
  });
});
