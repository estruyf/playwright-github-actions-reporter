import { TestCase } from "@playwright/test/reporter";
import Convert from "ansi-to-html";
import { getTestStatus } from "./getTestStatus";
import { getTestStatusIcon } from "./getTestStatusIcon";
import { getTestTitle } from "./getTestTitle";
import { getTestTags } from "./getTestTags";
import { getTestAnnotations } from "./getTestAnnotations";
import { getTestDuration } from "./getTestDuration";
import { DisplayLevel } from "../models";

export const getHtmlTable = async (
  tests: TestCase[],
  showAnnotations: boolean,
  showTags: boolean,
  showError: boolean,
  displayLevel: DisplayLevel[]
): Promise<string | undefined> => {
  const convert = new Convert();

  const content: string[] = [];

  content.push(`<br>`);
  content.push(`<table role="table">`);
  content.push(`<thead>`);
  content.push(`<tr>`);
  content.push(`<th>Test</th>`);
  content.push(`<th>Status</th>`);
  content.push(`<th>Duration</th>`);
  content.push(`<th>Retries</th>`);
  if (showTags) {
    content.push(`<th>Tags</th>`);
  }
  if (showError) {
    content.push(`<th>Error</th>`);
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

    if (showAnnotations && test.annotations) {
      let colLength = 4;
      if (showTags) {
        colLength++;
      }
      if (showError) {
        colLength++;
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
      `<td>${getTestStatusIcon(test, result)} ${getTestStatus(
        test,
        result
      )}</td>`
    );
    testRows.push(`<td>${getTestDuration(result)}</td>`);
    testRows.push(`<td>${result?.retry || ""}</td>`);

    if (showTags) {
      testRows.push(`<td>${getTestTags(test)}</td>`);
    }

    if (showError) {
      const error = result?.error?.message || "";
      testRows.push(`<td>${convert.toHtml(error)}</td>`);
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
