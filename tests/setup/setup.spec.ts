import { test, Page } from "@playwright/test";

test.describe.serial("Setup", () => {
  let page: Page;

  test.setTimeout(5000);
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    await page.goto("https://www.google.com/", {
      waitUntil: "domcontentloaded",
    });
  });
  test("Fake timeout 1", async () => {
    await page.waitForURL("ssss");
  });
});
