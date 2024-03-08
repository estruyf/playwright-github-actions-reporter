import { TestCase } from "@playwright/test/reporter";
import Convert from "ansi-to-html";
import { getTestStatus } from "./getTestStatus";
import { getTestTitle } from "./getTestTitle";
import { getTestTags } from "./getTestTags";
import { getTestAnnotations } from "./getTestAnnotations";
import { getTestDuration } from "./getTestDuration";

export const getHtmlTable = (
  tests: TestCase[],
  showAnnotations: boolean,
  showTags: boolean,
  showError: boolean
): string => {
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

      const annotations = getTestAnnotations(test, true);
      if (annotations) {
        content.push(`<tr>`);
        content.push(`<td colspan="${colLength}">${annotations}</td>`);
        content.push(`</tr>`);
      }
    }

    content.push(`<tr>`);
    content.push(`<td>${getTestTitle(test)}</td>`);
    content.push(`<td>${getTestStatus(test, result)}</td>`);
    content.push(`<td>${getTestDuration(result)}</td>`);
    content.push(`<td>${result?.retry || ""}</td>`);

    if (showTags) {
      content.push(`<td>${getTestTags(test)}</td>`);
    }

    if (showError) {
      const error = result?.error?.message || "";
      content.push(`<td>${convert.toHtml(error)}</td>`);
    }
    content.push(`</tr>`);
  }

  content.push(`</tbody>`);
  content.push(`</table>`);

  return content.join("\n");
};
