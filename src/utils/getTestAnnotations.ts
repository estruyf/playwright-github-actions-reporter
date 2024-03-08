import { TestCase } from "@playwright/test/reporter";

export const getTestAnnotations = (
  test: TestCase,
  isHtml: boolean = false
): string => {
  if (!test || !test.annotations) {
    return "";
  }

  const list = [];
  for (const annotation of test.annotations) {
    list.push(`${annotation.type}: ${annotation.description}`);
  }

  return list.join(isHtml ? "<br>" : "\n");
};
