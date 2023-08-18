import { SummaryTableRow } from "@actions/core/lib/summary";
import { TestCase } from "@playwright/test/reporter";

export const getTableRows = (tests: TestCase[]): SummaryTableRow[] => {
  const tableRows = [
    [
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
    ],
  ];

  for (const test of tests) {
    // Get the last result
    const result = test.results[test.results.length - 1];

    tableRows.push([
      {
        data: test.title,
        header: false,
      },
      {
        data: result.status === "passed" ? "✅ Pass" : "❌ Fail",
        header: false,
      },
      {
        data: `${result.duration / 1000}s`,
        header: false,
      },
      {
        data: `${result.retry}`,
        header: false,
      },
    ]);
  }

  return tableRows;
};
