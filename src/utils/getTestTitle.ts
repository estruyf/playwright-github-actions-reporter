import { TestCase } from "@playwright/test/reporter";

export const getTestTitle = (test: TestCase): string => {
  if (!test) {
    return "";
  }

  const parent = test.parent;

  if (!parent || !parent.title) {
    return test.title;
  }

  return `${parent.title} > ${test.title}`;
};
