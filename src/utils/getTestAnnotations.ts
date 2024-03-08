import { TestCase } from "@playwright/test/reporter";
import { marked } from "marked";

export const getTestAnnotations = async (test: TestCase): Promise<string> => {
  if (!test || !test.annotations) {
    return "";
  }

  let list = [];
  const isList = test.annotations.length > 1;
  for (const annotation of test.annotations) {
    list.push(
      `${isList ? "- " : ""}**${annotation.type}**: ${annotation.description}`
    );
  }

  const markdown = list.join("\n");
  return (await marked.parse(markdown)).trim();
};
