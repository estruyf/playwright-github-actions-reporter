import type { TestCase } from "@playwright/test/reporter";
import { marked } from "marked";
import { getSourceUrl } from "./getSourceLink.js";

export const getTestAnnotations = async (test: TestCase): Promise<string> => {
  if (!test || !test.annotations) {
    return "";
  }

  let list = [];
  const isList = test.annotations.length > 1;
  for (const annotation of test.annotations) {
    // The location is available since Playwright 1.54
    const url = getSourceUrl(annotation.location);
    const type = url
      ? `[**${annotation.type}**](<${url}>)`
      : `**${annotation.type}**`;

    // Annotations like `test.skip()` without a reason have no description
    const description = annotation.description?.trim()
      ? `: ${annotation.description}`
      : "";

    list.push(`${isList ? "- " : ""}${type}${description}`);
  }

  const markdown = list.join("\n");
  return (await marked.parse(markdown)).trim();
};
