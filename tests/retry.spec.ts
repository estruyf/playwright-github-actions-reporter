import { test, expect, Page } from "@playwright/test";

test.describe("Test retry", () => {
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

  test("First test should fail, next should work", async ({}, testInfo) => {
    if (testInfo.retry === 0) {
      expect(true).toBeFalsy();
    }
    expect(true).toBeTruthy();
  });

  test("Skip the test", async () => {
    test.skip(true, "Don't need to test this.");
  });

  test("Should work fine", async () => {
    expect(true).toBeTruthy();
  });
});
