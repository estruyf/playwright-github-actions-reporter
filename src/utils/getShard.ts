import type { FullConfig } from "@playwright/test/reporter";

export type Shard = NonNullable<FullConfig["shard"]>;

/**
 * Label for sharded runs, e.g. `shard 2/4`. Merged reports have no shard.
 */
export const getShardLabel = (shard?: Shard | null): string | undefined => {
  return shard ? `shard ${shard.current}/${shard.total}` : undefined;
};

/**
 * Id that keeps the pull request comment of each shard apart.
 */
export const getShardCommentId = (
  shard?: Shard | null,
): string | undefined => {
  return shard ? `shard-${shard.current}-of-${shard.total}` : undefined;
};
