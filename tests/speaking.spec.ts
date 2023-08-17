import { test, expect, Page } from "@playwright/test";

test.describe("Speaking", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    await page.goto("https://www.eliostruyf.com/speaking/", {
      waitUntil: "domcontentloaded",
    });
  });

  test.afterAll(async ({ browser }) => {
    await page.close();
    await browser.close();
  });

  test("Check figure", async () => {
    const figure = page.locator(`.content_zone figure`);
    await figure.waitFor();

    expect(figure.locator(`img`)).toBeVisible();
  });
});
