import { getShardCommentId, getShardLabel } from "./getShard.js";

describe("getShard", () => {
  it("should return undefined without a shard", () => {
    expect(getShardLabel(null)).toBeUndefined();
    expect(getShardLabel(undefined)).toBeUndefined();
    expect(getShardCommentId(null)).toBeUndefined();
  });

  it("should return the shard label", () => {
    expect(getShardLabel({ current: 2, total: 4 })).toBe("shard 2/4");
  });

  it("should return the shard comment id", () => {
    expect(getShardCommentId({ current: 2, total: 4 })).toBe("shard-2-of-4");
  });
});
