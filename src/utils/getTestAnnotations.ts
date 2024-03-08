import { TestCase } from "@playwright/test/reporter";

export const getTestAnnotations = (
  test: TestCase,
  isHtml: boolean = false
): string => {
  if (!test || !test.annotations) {
    return "";
  }

  let list = [];
  for (const annotation of test.annotations) {
    const type = `<b>${annotation.type}</b>`;
    list.push(`${type}: ${annotation.description}`);
  }

  return list.join(isHtml ? "<br>" : "\n");
};
