import { Suite, TestCase } from "@playwright/test/reporter";

export const getTestsPerFile = (suite: Suite) => {
  // Get all the test files
  const files = suite
    .allTests()
    .map((test) => test.location.file)
    .reduce((acc, curr) => {
      if (!acc.includes(curr)) {
        acc.push(curr);
      }

      return acc;
    }, [] as string[]);

  // Get all the tests per file
  const tests = files.reduce((acc, curr) => {
    acc[curr] = suite.allTests().filter((test) => {
      return test.location.file === curr;
    });

    return acc;
  }, {} as { [fileName: string]: TestCase[] });

  return tests;
};
