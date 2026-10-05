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

  test.afterAll(async () => {
    await page.close();
  });

  // Fails on the first run, so the serial group is retried
  test("Fake timeout 1", async ({}, testInfo) => {
    await page.waitForTimeout(100);
    if (testInfo.retry === 0) {
      throw new Error("Fake error");
    }
  });

  // Times out on the first retry, passes on the second one
  test("Fake timeout 2", async ({}, testInfo) => {
    await page.waitForTimeout(testInfo.retry <= 1 ? 3000 : 100);
  });

  test("Fake timeout 3", async () => {
    await page.waitForTimeout(100);
  });
});
