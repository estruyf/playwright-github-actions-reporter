import type { Suite } from "@playwright/test/reporter";
import { basename } from "path";
import { getTestsPerFile } from "./getTestsPerFile.js";
import { getTestStatus } from "./getTestStatus.js";
import { getTestTitle } from "./getTestTitle.js";
import { getShortError } from "./getShortError.js";
import type { DisplayLevel } from "../models/index.js";

// Type definitions for summary table (from @actions/core)
interface SummaryTableCell {
  data: string;
  header?: boolean;
}

type SummaryTableRow = (SummaryTableCell | string)[];

export interface FailedOverview {
  rows: SummaryTableRow[];
  remaining: number;
}

export const DEFAULT_FAILED_OVERVIEW_LIMIT = 10;

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const getFailedOverview = (
  suite: Suite,
  displayLevel: DisplayLevel[],
  limit: number = DEFAULT_FAILED_OVERVIEW_LIMIT,
): FailedOverview | undefined => {
  if (!displayLevel.includes("fail")) {
    return;
  }

  const failedRows: SummaryTableRow[] = [];

  for (const crntSuite of suite.suites) {
    const projectName = crntSuite.project()?.name;
    const tests = getTestsPerFile(crntSuite);

    for (const filePath of Object.keys(tests)) {
      const fileName = basename(filePath);

      for (const test of tests[filePath]) {
        // Get the last result
        const result = test.results[test.results.length - 1];

        // Timed out and interrupted tests are reported as "Fail" as well
        if (getTestStatus(test, result) !== "Fail") {
          continue;
        }

        const error = getShortError(result?.error?.message);

        failedRows.push([
          {
            data: `<code>${fileName}</code>${
              projectName ? ` (${projectName})` : ""
            }`,
          },
          { data: getTestTitle(test) },
          { data: error ? `<code>${escapeHtml(error)}</code>` : "" },
        ]);
      }
    }
  }

  if (failedRows.length === 0) {
    return;
  }

  const maxRows = Math.max(1, limit);

  return {
    rows: [
      [
        { data: "File", header: true },
        { data: "Test", header: true },
        { data: "Error", header: true },
      ],
      ...failedRows.slice(0, maxRows),
    ],
    remaining: Math.max(0, failedRows.length - maxRows),
  };
};
