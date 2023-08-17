import { test, expect, Page } from "@playwright/test";

test.describe("Failing test", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    await page.goto("https://www.eliostruyf.com/stickers/", {
      waitUntil: "domcontentloaded",
    });
  });

  test.afterAll(async ({ browser }) => {
    await page.close();
    await browser.close();
  });

  test("Test should fail", async () => {
    const logo = page.locator(`#logo`);
    await logo.waitFor();

    expect((await logo.allInnerTexts()).join()).toBe("PYOD");
  });
});
