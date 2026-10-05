import type { TestCase } from "@playwright/test/reporter";
import { getTestStatus } from "./getTestStatus.js";
import { getTestTitle } from "./getTestTitle.js";
import { getTestTags } from "./getTestTags.js";
import { getTestAnnotations } from "./getTestAnnotations.js";
import { getTestDuration } from "./getTestDuration.js";
import { getTestStatusIcon } from "./getTestStatusIcon.js";
import type { BlobService, DisplayLevel } from "../models/index.js";
import { processAttachments } from "./processAttachments.js";
import { getErrorDetails, type ErrorOptions } from "./getErrorDetails.js";
import { getTableHeaders, type SummaryTableRow } from "./summaryTable.js";

export const getTableRows = async (
  tests: TestCase[],
  showAnnotations: boolean,
  showTags: boolean,
  showError: boolean,
  displayLevel: DisplayLevel[],
  showAnnotationsInColumn: boolean = false,
  blobService?: BlobService,
  errorOptions?: ErrorOptions,
): Promise<SummaryTableRow[]> => {
  const hasBlobService = blobService && blobService.azure;

  const columns = ["Test", "Status", "Duration", "Retries"];

  if (showTags) {
    columns.push("Tags");
  }

  if (showAnnotations && showAnnotationsInColumn) {
    columns.push("Annotations");
  }

  if (showError) {
    columns.push("Error");

    if (hasBlobService) {
      columns.push("Attachments");
    }
  }

  const tableHeaders = getTableHeaders(columns);

  const tableRows: SummaryTableRow[] = [];

  for (const test of tests) {
    // Get the last result
    const result = test.results[test.results.length - 1];

    // Check if the test should be shown
    const testStatus = getTestStatus(test, result);
    if (!displayLevel.includes(testStatus.toLowerCase() as DisplayLevel)) {
      continue;
    }

    if (showAnnotations && !showAnnotationsInColumn && test.annotations) {
      let colLength = 4;
      if (showTags) {
        colLength++;
      }
      if (showError) {
        colLength++;

        if (hasBlobService) {
          colLength++;
        }
      }

      const annotations = await getTestAnnotations(test);
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
        data: `${getTestStatusIcon(test, result)}&nbsp;${testStatus}`,
        header: false,
      },
      {
        data: getTestDuration(result),
        header: false,
      },
      {
        data: `${result?.retry || ""}`,
        header: false,
      },
    ] as SummaryTableRow;

    if (showTags) {
      tableRow.push({
        data: getTestTags(test),
        header: false,
      });
    }

    if (showAnnotations && showAnnotationsInColumn) {
      const annotations = await getTestAnnotations(test);
      if (annotations) {
        tableRow.push({
          data: annotations,
          header: false,
        });
      } else {
        tableRow.push({
          data: "",
          header: false,
        });
      }
    }

    if (showError) {
      tableRow.push({
        data: getErrorDetails(result, errorOptions),
        header: false,
      });

      if (hasBlobService) {
        const mediaFiles =
          (await processAttachments(blobService, result.attachments)) || [];

        tableRow.push({
          data: (mediaFiles || [])
            .map(
              (
                m,
              ) => `<p align="center"><img src="${m.url}" alt="${m.name}" width="250"></p>
<p align="center"><b>${m.name}</b></p>`,
            )
            .join("\n\n"),
          header: false,
        });
      }
    }

    tableRows.push(tableRow);
  }

  if (tableRows.length === 0) {
    return [];
  }

  return [tableHeaders, ...tableRows];
};
