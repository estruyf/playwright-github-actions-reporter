import { test, expect } from "@playwright/test";

test.describe("Soft assertions", () => {
  // Fails on purpose to show every failed soft assertion in the summary
  test("Multiple soft assertions fail", async () => {
    expect.soft(1 + 1, "first soft assertion").toBe(3);
    expect.soft("reporter", "second soft assertion").toBe("summary");
    expect(true).toBe(true);
  });
});
