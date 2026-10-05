import { test, expect, Page } from "@playwright/test";

console.log("Running the homepage tests.");

test.describe("Homepage", () => {
  let page: Page;
  console.log("Running tests for the homepage.");

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    console.log("Opening the homepage.");

    await page.goto("https://www.eliostruyf.com", {
      waitUntil: "domcontentloaded",
    });
  });

  test.afterAll(async () => {
    console.log("Closing the homepage.");
    await page.close();
  });

  test(
    "Check logo",
    {
      tag: "@website",
      annotation: {
        type: "info",
        description: "A test to check the logo.",
      },
    },
    async () => {
      console.log("Checking the logo.");
      const logo = page.locator("header").getByTitle("Go to homepage");

      await expect(logo).toHaveText("Elio Struyf");
    }
  );

  test(
    "Check navigation",
    {
      tag: ["@website", "@navigation"],
      annotation: [
        {
          type: "info",
          description: "A test to check the navigation links.",
        },
        {
          type: "website",
          description: "https://www.eliostruyf.com",
        },
      ],
    },
    async () => {
      console.log("Checking the navigation.");
      const nav = page.locator(`header nav`);
      await nav.waitFor();

      await expect(nav.locator("a")).toHaveCount(6);
    }
  );
});
