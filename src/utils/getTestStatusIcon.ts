import { TestCase } from "@playwright/test/reporter";
import { getTestOutcome } from "./getTestOutcome";

export const getTestStatusIcon = (tests: TestCase[]) => {
  if (!tests || tests.length === 0) {
    return "❌";
  }

  const testOutcomes = tests.map((test) => {
    const lastResult = test.results[test.results.length - 1];
    return getTestOutcome(test, lastResult);
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
