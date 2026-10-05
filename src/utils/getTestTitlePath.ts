import type { Suite, TestCase } from "@playwright/test/reporter";

// Full describe path of the test, e.g. "Pages > Homepage > loads all web parts"
export const getTestTitlePath = (test: TestCase): string => {
  const titles = [test.title];

  let parent = test.parent;
  while (parent && parent.type === "describe") {
    if (parent.title) {
      titles.unshift(parent.title);
    }
    parent = parent.parent as Suite;
  }

  return titles.join(" > ");
};
