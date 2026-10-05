import type { TestCase } from "@playwright/test/reporter";
import { getTestStatus } from "./getTestStatus.js";
import { getTestStatusIcon } from "./getTestStatusIcon.js";
import { getTestTitle } from "./getTestTitle.js";
import { getTestTags } from "./getTestTags.js";
import { getTestAnnotations } from "./getTestAnnotations.js";
import { getTestDuration } from "./getTestDuration.js";
import type { BlobService, DisplayLevel } from "../models/index.js";
import { processAttachments } from "./processAttachments.js";
import { getErrorDetails, type ErrorOptions } from "./getErrorDetails.js";
import { getTableHeaders } from "./summaryTable.js";

export const getHtmlTable = async (
  tests: TestCase[],
  showAnnotations: boolean,
  showTags: boolean,
  showError: boolean,
  displayLevel: DisplayLevel[],
  showAnnotationsInColumn: boolean = false,
  blobService?: BlobService,
  errorOptions?: ErrorOptions,
  failOnFlakyTests: boolean = false,
): Promise<string | undefined> => {
  const hasBlobService = blobService && blobService.azure;

  const content: string[] = [];

  content.push(`<br>`);
  content.push(`<table role="table">`);
  content.push(`<thead>`);
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

  content.push(`<tr>`);
  for (const { data, width } of getTableHeaders(columns)) {
    content.push(`<th${width ? ` width="${width}"` : ""}>${data}</th>`);
  }
  content.push(`</tr>`);
  content.push(`</thead>`);
  content.push(`<tbody>`);

  const testRows: string[] = [];
  for (const test of tests) {
    // Get the last result
    const result = test.results[test.results.length - 1];
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
        testRows.push(`<tr>`);
        testRows.push(`<td colspan="${colLength}">${annotations}</td>`);
        testRows.push(`</tr>`);
      }
    }

    testRows.push(`<tr>`);
    testRows.push(`<td>${getTestTitle(test)}</td>`);
    testRows.push(
      `<td>${getTestStatusIcon(test, result, failOnFlakyTests)}&nbsp;${getTestStatus(
        test,
        result,
      )}</td>`,
    );
    testRows.push(`<td>${getTestDuration(result)}</td>`);
    testRows.push(`<td>${result?.retry || ""}</td>`);

    if (showTags) {
      testRows.push(`<td>${getTestTags(test)}</td>`);
    }
    if (showAnnotations && showAnnotationsInColumn) {
      const annotations = await getTestAnnotations(test);
      if (annotations) {
        testRows.push(`<td>${annotations}</td>`);
      } else {
        testRows.push(`<td></td>`);
      }
    }
    if (showError) {
      testRows.push(`<td>${getErrorDetails(result, errorOptions)}</td>`);

      if (hasBlobService) {
        const mediaFiles =
          (await processAttachments(blobService, result.attachments)) || [];

        const mediaLinks = mediaFiles
          .map(
            (m) =>
              `<p align="center"><img src="${m.url}" alt="${m.name}" width="250"></p>
<p align="center"><b>${m.name}</b></p>`,
          )
          .join(", ");
        testRows.push(`<td>${mediaLinks}</td>`);
      }
    }
    testRows.push(`</tr>`);
  }

  if (testRows.length === 0) {
    return;
  }

  content.push(testRows.join("\n"));

  content.push(`</tbody>`);
  content.push(`</table>`);

  return content.join("\n");
};
