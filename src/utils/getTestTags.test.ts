import { getTestTags } from "./getTestTags";

describe("getTestTags", () => {
  it("should return empty string test is not defined", () => {
    const result = getTestTags(undefined as any);

    expect(result).toBe("");
  });

  it("should return empty string when test tags are undefined", () => {
    const test = {
      tags: undefined,
    };

    const result = getTestTags(test as any);

    expect(result).toBe("");
  });

  it("should return empty string when test tags are empty", () => {
    const test = {
      tags: [],
    };

    const result = getTestTags(test as any);

    expect(result).toBe("");
  });

  it("should return tags without '@' symbol", () => {
    const test = {
      tags: ["@tag1", "@tag2", "@tag3"],
    };

    const result = getTestTags(test as any);

    expect(result).toBe("tag1, tag2, tag3");
  });

  it("should return tags even when they don't start with '@' symbol", () => {
    const test = {
      tags: ["tag1", "tag2", "tag3"],
    };

    const result = getTestTags(test as any);

    expect(result).toBe("tag1, tag2, tag3");
  });
});
