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
    const type = isHtml
      ? `<strong>${annotation.type}</strong>`
      : `**${annotation.type}**`;
    list.push(`${type}: ${annotation.description}`);
  }

  // Trick the markdown
  if (!isHtml) {
    list = list.map((item, idx) => {
      if (list.length > 1) {
        item = `- ${item}`;
      }

      if (idx === 0) {
        item = `\n${item}`;
      }

      return item;
    });
  }

  return list.join(isHtml ? "<br>" : "\n");
};
