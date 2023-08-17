import { TestResults } from "..";

export const getHtmlTable = (tests: TestResults): string => {
  const content: string[] = [];

  content.push(`<br>`);
  content.push(`<table role="table">`);
  content.push(`<thead>`);
  content.push(`<tr>`);
  content.push(`<th>Test</th>`);
  content.push(`<th>Status</th>`);
  content.push(`<th>Duration</th>`);
  content.push(`</tr>`);
  content.push(`</thead>`);
  content.push(`<tbody>`);

  for (const testName of Object.keys(tests)) {
    const test = tests[testName];

    content.push(`<tr>`);
    content.push(`<td>${testName}</td>`);
    content.push(
      `<td>${test.status === "passed" ? "✅ Pass" : "❌ Fail"}</td>`
    );
    content.push(`<td>${test.duration / 1000}s</td>`);
    content.push(`</tr>`);
  }

  content.push(`</tbody>`);
  content.push(`</table>`);

  return content.join("\n");
};
