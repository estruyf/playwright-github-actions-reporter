import { TestCase } from "@playwright/test/reporter";
import { getTestOutcome } from "./getTestOutcome";

export const getSuiteStatusIcon = (tests: TestCase[]) => {
  if (!tests || tests.length === 0) {
    return "❌";
  }

  const testOutcomes = tests.map((test) => {
    const lastResult = test.results[test.results.length - 1];
    const outcome = test.outcome();
    if (outcome === "flaky") {
      return "flaky";
    }

    return getTestOutcome(test, lastResult);
  });

  if (
    testOutcomes.includes("failed") ||
    testOutcomes.includes("interrupted") ||
    testOutcomes.includes("timedOut")
  ) {
    return "❌";
  } else if (testOutcomes.includes("flaky")) {
    return "⚠️";
  }

  return "✅";
};
