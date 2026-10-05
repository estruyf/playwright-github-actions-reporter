import { test, expect, type Page } from "@playwright/test";

// Page object helper, so the error location points to the helper and the
// failed step path shows which part of the test broke
const addToCart = async (page: Page, sku: number) => {
  await page.setContent(`<button>Add ${sku}</button>`);
  await expect(page.getByRole("button", { name: "Buy" })).toBeVisible({
    timeout: 500,
  });
};

test.describe("Failed steps", () => {
  // Fails on purpose to show the failed step path in the summary
  test("Fails inside a test step", async ({ page }) => {
    await test.step("Open the shop", async () => {
      await page.setContent("<h1>Shop</h1>");
    });

    await test.step("Checkout", async () => {
      await test.step(
        "Add to cart",
        async () => {
          await addToCart(page, 42);
        },
        { subtitle: "SKU 42" },
      );
    });
  });
});

test.describe("Failed hooks", () => {
  // Fails on purpose to show the hook in the summary
  test.beforeEach(async () => {
    expect(process.env.SHOP_URL ?? "", "the shop URL is set").not.toBe("");
  });

  test("Fails in the beforeEach hook", async () => {});
});
