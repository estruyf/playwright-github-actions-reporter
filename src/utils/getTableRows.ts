import { SummaryTableRow } from "@actions/core/lib/summary";
import { TestCase } from "@playwright/test/reporter";
import Convert from "ansi-to-html";
import { getTestStatus } from "./getTestStatus";
import { getTestTitle } from "./getTestTitle";
import { getTestTags } from "./getTestTags";
import { getTestAnnotations } from "./getTestAnnotations";
import { getTestDuration } from "./getTestDuration";
import { getTestStatusIcon } from "./getTestStatusIcon";
import { BlobService, DisplayLevel } from "../models";
import { processAttachments } from "./processAttachments";

export const getTableRows = async (
  tests: TestCase[],
  showAnnotations: boolean,
  showTags: boolean,
  showError: boolean,
  displayLevel: DisplayLevel[],
  showAnnotationsInColumn: boolean = false,
  blobService?: BlobService
): Promise<SummaryTableRow[]> => {
  const convert = new Convert();
  const hasBlobService = blobService && blobService.azure;

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

  if (showAnnotations && showAnnotationsInColumn){
    tableHeaders.push({
      data: "Annotations",
      header: true,
    });
  }

  if (showError) {
    tableHeaders.push({
      data: "Error",
      header: true,
    });

    if (hasBlobService) {
      tableHeaders.push({
        data: "Attachments",
        header: true,
      });
    }
  }

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
        data: `${getTestStatusIcon(test, result)} ${testStatus}`,
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

    if(showAnnotations && showAnnotationsInColumn) {
      const annotations = await getTestAnnotations(test);
      if (annotations) {
        tableRow.push({
          data: annotations,
          header: false,
        });
      }else{
        tableRow.push({
          data: "",
          header: false,
        });
      }
    }

    if (showError) {
      const error = result?.error?.message || "";
      tableRow.push({
        data: convert.toHtml(error),
        header: false,
      });

      if (hasBlobService) {
        const mediaFiles =
          (await processAttachments(blobService, result.attachments)) || [];

        tableRow.push({
          data: (mediaFiles || [])
            .map(
              (
                m
              ) => `<p align="center"><img src="${m.url}" alt="${m.name}" width="250"></p>
<p align="center"><b>${m.name}</b></p>`
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
