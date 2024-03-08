import { TestCase } from "@playwright/test/reporter";

export const getTestAnnotations = (test: TestCase): string => {
  if (!test || !test.annotations) {
    return "";
  }

  const list = [];
  for (const annotation of test.annotations) {
    list.push(`${annotation.type}: ${annotation.description}`);
  }

  return list.join("\n");
};
