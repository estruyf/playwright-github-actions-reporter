import { TestCase } from "@playwright/test/reporter";

export const checkForFailedTests = (tests: TestCase[]) => {
  const failedTests = tests.filter((test) => {
    return test.results[test.results.length - 1].status !== "passed";
  });

  return failedTests.length > 0;
};
