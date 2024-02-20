import { Suite } from "@playwright/test/reporter";
import { getTestOutcome } from "./getTestOutcome";

export const getTotalStatus = (
  suites: Suite[]
): {
  passed: number;
  failed: number;
  skipped: number;
  timedOut: number;
} => {
  let total = {
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
  };

  for (const suite of suites) {
    const testOutcome = suite.allTests().map((test) => {
      const lastResult = test.results[test.results.length - 1];
      return getTestOutcome(test, lastResult);
    });

    for (const outcome of testOutcome) {
      if (outcome === "passed") {
        total.passed++;
      } else if (outcome === "failed") {
        total.failed++;
      } else if (outcome === "skipped") {
        total.skipped++;
      } else if (outcome === "timedOut") {
        total.timedOut++;
      }
    }
  }

  return total;
};
