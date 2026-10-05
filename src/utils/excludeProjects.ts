import type { Suite } from "@playwright/test/reporter";
import { getTestStatus } from "./getTestStatus.js";

export type ProjectPattern = string | RegExp;

const isRegExp = (value: unknown): value is RegExp =>
  Object.prototype.toString.call(value) === "[object RegExp]";

/**
 * Strings match the full project name, regexes are tested against it.
 */
export const isProjectExcluded = (
  projectName: string,
  patterns: ProjectPattern[] = [],
): boolean => {
  return patterns.some((pattern) => {
    if (typeof pattern === "string") {
      return pattern === projectName;
    }

    // `search` ignores the `g` flag and `lastIndex`, unlike `test`
    return isRegExp(pattern) && projectName.search(pattern) !== -1;
  });
};

const hasFailedTests = (projectSuite: Suite): boolean => {
  return projectSuite.allTests().some((test) => {
    const result = test.results[test.results.length - 1];
    return getTestStatus(test, result) === "Fail";
  });
};

/**
 * Leaves out the excluded projects. A project with a failed test is always
 * kept, because a broken setup project makes all dependent tests skip.
 */
export const excludeProjects = (
  suite: Suite,
  patterns?: ProjectPattern[],
): Suite => {
  if (!patterns || patterns.length === 0) {
    return suite;
  }

  const projectSuites = suite.suites.filter(
    (projectSuite) =>
      !isProjectExcluded(projectSuite.project()?.name || "", patterns) ||
      hasFailedTests(projectSuite),
  );

  // Only `suites` and `allTests` are used to build the summary
  return {
    suites: projectSuites,
    allTests: () => projectSuites.flatMap((s) => s.allTests()),
  } as Suite;
};
