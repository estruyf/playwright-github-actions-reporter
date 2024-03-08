import { SummaryTableRow } from "@actions/core/lib/summary";
import { TestCase } from "@playwright/test/reporter";
import Convert from "ansi-to-html";
import { getTestStatus } from "./getTestStatus";
import { getTestTitle } from "./getTestTitle";
import { getTestTags } from "./getTestTags";
import { getTestAnnotations } from "./getTestAnnotations";

export const getTableRows = (
  tests: TestCase[],
  showAnnotations: boolean,
  showTags: boolean,
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

  if (showTags) {
    tableHeaders.push({
      data: "Tags",
      header: true,
    });
  }

  if (showError) {
    tableHeaders.push({
      data: "Error",
      header: true,
    });
  }

  const tableRows: SummaryTableRow[] = [tableHeaders];

  for (const test of tests) {
    // Get the last result
    const result = test.results[test.results.length - 1];

    if (showAnnotations && test.annotations) {
      let colLength = 4;
      if (showTags) {
        colLength++;
      }
      if (showError) {
        colLength++;
      }

      const annotations = getTestAnnotations(test);
      if (annotations) {
        tableRows.push([
          {
            data: annotations,
            header: false,
            colspan: `${colLength}`,
          },
        ]);
      }
    }

    const tableRow = [
      {
        data: getTestTitle(test),
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

    if (showTags) {
      tableRow.push({
        data: getTestTags(test),
        header: false,
      });
    }

    if (showError) {
      const error = result?.error?.message || "";
      tableRow.push({
        data: convert.toHtml(error),
        header: false,
      });
    }

    tableRows.push(tableRow);
  }

  return tableRows;
};
