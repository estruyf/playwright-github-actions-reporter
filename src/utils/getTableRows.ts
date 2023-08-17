import { SummaryTableRow } from "@actions/core/lib/summary";
import { TestResults } from "..";

export const getTableRows = (tests: TestResults): SummaryTableRow[] => {
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
    ],
  ];

  for (const testName of Object.keys(tests)) {
    const test = tests[testName];

    tableRows.push([
      {
        data: testName,
        header: false,
      },
      {
        data: test.status === "passed" ? "✅ Pass" : "❌ Fail",
        header: false,
      },
      {
        data: `${test.duration / 1000}s`,
        header: false,
      },
    ]);
  }

  return tableRows;
};
