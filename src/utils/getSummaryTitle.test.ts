import { getSummaryTitle } from "./getSummaryTitle.js";

describe("getSummaryTitle", () => {
  it("should return 'Test results' when no title is provided", () => {
    const result = getSummaryTitle();
    expect(result).toEqual("Test results");
  });

  it("should return 'Test results' when set to undefined", () => {
    const result = getSummaryTitle(undefined);
    expect(result).toEqual("Test results");
  });

  it("should return the provided title when a title is provided", () => {
    const result = getSummaryTitle("Custom title");
    expect(result).toEqual("Custom title");
  });

  it("should return undefined when empty string is passed", () => {
    const result = getSummaryTitle("");
    expect(result).toBeUndefined();
  });

  it("should include shard in title when shard is provided", () => {
    const result = getSummaryTitle(undefined, { current: 2, total: 4 });
    expect(result).toEqual("Test results (shard 2/4)");
  });

  it("should include shard with custom title", () => {
    const result = getSummaryTitle("Custom title", { current: 1, total: 3 });
    expect(result).toEqual("Custom title (shard 1/3)");
  });

  it("should not include shard when shard is null or undefined", () => {
    const resultNull = getSummaryTitle("Custom title", null);
    expect(resultNull).toEqual("Custom title");

    const resultUndefined = getSummaryTitle("Custom title", undefined);
    expect(resultUndefined).toEqual("Custom title");
  });

  it("should return undefined when empty string is passed even if shard is provided", () => {
    const result = getSummaryTitle("", { current: 2, total: 4 });
    expect(result).toBeUndefined();
  });
});
