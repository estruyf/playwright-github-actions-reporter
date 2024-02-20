import { TestCase, TestResult } from "@playwright/test/reporter";

export const getTestOutcome = (test: TestCase, result: TestResult) => {
  if (result?.status) {
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
