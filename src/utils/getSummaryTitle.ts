export const getSummaryTitle = (title?: string): string | undefined => {
  const summaryTitle = typeof title === "undefined" ? "Test results" : title;
  if (summaryTitle) {
    return summaryTitle;
  }
  return undefined;
};
