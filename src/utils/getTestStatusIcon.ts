import { TestCase } from "@playwright/test/reporter";

export const getTestStatusIcon = (tests: TestCase[]) => {
  const testOutcomes = tests.map((test) => {
    const lastResult = test.results[test.results.length - 1];
    return lastResult.status;
  });

  if (
    testOutcomes.includes("failed") ||
    testOutcomes.includes("interrupted") ||
    testOutcomes.includes("timedOut")
  ) {
    return "❌";
  } else if (testOutcomes.includes("skipped")) {
    return "⚠️";
  }

  return "✅";
};
