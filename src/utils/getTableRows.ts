import { SummaryTableRow } from "@actions/core/lib/summary";
import { TestCase } from "@playwright/test/reporter";
import Convert from "ansi-to-html";
import { getTestStatus } from "./getTestStatus";

export const getTableRows = (
  tests: TestCase[],
  showError: boolean
): SummaryTableRow[] => {
  const convert = new Convert();

  const tableHeaders = [
    {
      data: "Test",
      header: true,
    },
    {
      data: "Status",
      header: true,
    },
    {
      data: "Duration",
      header: true,
    },
    {
      data: "Retries",
      header: true,
    },
  ];

  if (showError) {
    tableHeaders.push({
      data: "Error",
      header: true,
    });
  }

  const tableRows = [tableHeaders];

  for (const test of tests) {
    // Get the last result
    const result = test.results[test.results.length - 1];

    const tableRow = [
      {
        data: test.title,
        header: false,
      },
      {
        data: getTestStatus(test, result),
        header: false,
      },
      {
        data: result?.duration ? `${result.duration / 1000}s` : "",
        header: false,
      },
      {
        data: `${result?.retry || ""}`,
        header: false,
      },
    ];

    if (showError) {
      tableRow.push({
        data:
          result?.error && result.error?.message
            ? convert.toHtml(result.error.message!)
            : "",
        header: false,
      });
    }

    tableRows.push(tableRow);
  }

  return tableRows;
};
