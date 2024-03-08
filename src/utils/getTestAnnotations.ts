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
    const type = isHtml
      ? `<strong>${annotation.type}</strong>`
      : `**${annotation.type}**`;
    list.push(`${type}: ${annotation.description}`);
  }

  return list.join(isHtml ? "<br>" : "\n");
};
