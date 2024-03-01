import { test, Page } from "@playwright/test";

test.describe.serial("Timeout test", () => {
  let page: Page;

  test.setTimeout(2000);

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    await page.goto("https://www.google.com/", {
      waitUntil: "domcontentloaded",
    });
  });

  test.afterAll(async ({ browser }) => {
    await page.close();
    await browser.close();
  });

  test("Fake timeout 1", async () => {
    await page.waitForTimeout(100);
    throw new Error("Fake error");
  });

  test("Fake timeout 2", async () => {
    await page.waitForTimeout(3000);
  });

  test("Fake timeout 3", async () => {
    await page.waitForTimeout(3000);
  });
});
