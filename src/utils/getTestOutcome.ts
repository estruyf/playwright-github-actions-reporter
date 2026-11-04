import type { TestCase, TestResult } from "@playwright/test/reporter";

export const getTestOutcome = (test: TestCase, result: TestResult) => {
  if (result?.status) {
    // A `test.fail()` test passes when it fails, and fails when it passes
    if (test.expectedStatus === "failed") {
      if (result.status === "failed") {
        return "passed";
      } else if (result.status === "passed") {
        return "failed";
      }
    }
    return result.status;
  }
  const testOutcome = test.outcome();
  switch (testOutcome) {
    case "expected":
      return "passed";
    case "flaky":
    case "unexpected":
      return "failed";
    default:
      return testOutcome;
  }
};
