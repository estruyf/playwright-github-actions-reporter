import type { Suite, TestCase, TestResult } from "@playwright/test/reporter";
import { basename } from "path";
import { getTestStatus } from "./getTestStatus.js";
import { getTestDuration } from "./getTestDuration.js";

// Type definitions for summary table (from @actions/core)
interface SummaryTableCell {
  data: string;
  header?: boolean;
}

type SummaryTableRow = (SummaryTableCell | string)[];

interface SlowTest {
  test: TestCase;
  slowestResult: TestResult;
  retries: number;
  projectName?: string;
}

// Full describe path of the test, e.g. "Pages > Homepage > loads all web parts"
const getTestTitlePath = (test: TestCase): string => {
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

export const getSlowestTests = (
  suite: Suite,
  count: number,
): SummaryTableRow[] | undefined => {
  if (!count || count <= 0) {
    return;
  }

  const slowTests: SlowTest[] = [];

  for (const crntSuite of suite.suites) {
    const projectName = crntSuite.project()?.name;

    for (const test of crntSuite.allTests()) {
      if (!test.results || test.results.length === 0) {
        continue;
      }

      // Get the last result
      const result = test.results[test.results.length - 1];
      if (getTestStatus(test, result) === "Skipped") {
        continue;
      }

      // Use the duration of the slowest attempt
      const slowestResult = test.results.reduce((slowest, crnt) =>
        (crnt.duration || 0) > (slowest.duration || 0) ? crnt : slowest,
      );

      slowTests.push({
        test,
        slowestResult,
        retries: result?.retry || 0,
        projectName,
      });
    }
  }

  if (slowTests.length === 0) {
    return;
  }

  const rows = slowTests
    .sort(
      (a, b) =>
        (b.slowestResult.duration || 0) - (a.slowestResult.duration || 0),
    )
    .slice(0, count)
    .map(({ test, slowestResult, retries, projectName }) => [
      {
        data: `<code>${basename(test.location.file)}</code>${
          projectName ? ` (${projectName})` : ""
        }`,
      },
      { data: getTestTitlePath(test) },
      { data: getTestDuration(slowestResult) },
      { data: `${retries}` },
    ]);

  return [
    [
      { data: "File", header: true },
      { data: "Test", header: true },
      { data: "Duration", header: true },
      { data: "Retries", header: true },
    ],
    ...rows,
  ];
};
