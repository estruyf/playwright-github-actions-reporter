import { TestCase } from "@playwright/test/reporter";
import Convert from "ansi-to-html";
import { getTestStatus } from "./getTestStatus";

export const getHtmlTable = (tests: TestCase[], showError: boolean): string => {
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
  if (showError) {
    content.push(`<th>Error</th>`);
  }
  content.push(`</tr>`);
  content.push(`</thead>`);
  content.push(`<tbody>`);

  for (const test of tests) {
    // Get the last result
    const result = test.results[test.results.length - 1];

    content.push(`<tr>`);
    content.push(`<td>${test.title}</td>`);
    content.push(`<td>${getTestStatus(test, result)}</td>`);
    content.push(
      `<td>${result?.duration ? `${result.duration / 1000}s` : ""}</td>`
    );
    content.push(`<td>${result?.retry || ""}</td>`);
    if (showError) {
      content.push(
        `<td>${
          result?.error && result.error?.message
            ? convert.toHtml(result.error.message!)
            : "",
        }</td>`
      );
    }
    content.push(`</tr>`);
  }

  content.push(`</tbody>`);
  content.push(`</table>`);

  return content.join("\n");
};
