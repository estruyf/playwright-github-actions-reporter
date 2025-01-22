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

  test("Test should fail", {annotation: { type: "info", description: "A test check failure.",},},async () => {
    const logo = page.locator(`#logo`);
    await logo.waitFor();

    expect((await logo.allInnerTexts()).join()).toBe("PYOD");
  });

  test("Make screenshot fail", async () => {
    await page.goto(
      `https://www.eliostruyf.com?playwright=margin-left:10px;%20text-transform:%20lowercase;`
    );

    await expect(page).toHaveScreenshot("layout-mask.png", {
      mask: [page.locator(`.sidebar__content`)],
    });
  });
});
