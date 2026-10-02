export const getSummaryTitle = (
  title?: string,
  shard?: { current: number; total: number } | null,
): string | undefined => {
  const summaryTitle = typeof title === "undefined" ? "Test results" : title;
  const shardText = shard ? `shard ${shard.current}/${shard.total}` : undefined;

  if (summaryTitle) {
    return shardText ? `${summaryTitle} (${shardText})` : summaryTitle;
  }

  if (shardText) {
    return shardText;
  }

  return undefined;
};
