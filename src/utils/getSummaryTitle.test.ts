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

  it("should append shard to default title when shard is provided", () => {
    const result = getSummaryTitle(undefined, { current: 2, total: 4 });
    expect(result).toEqual("Test results (shard 2/4)");
  });

  it("should append shard to custom title when shard is provided", () => {
    const result = getSummaryTitle("Custom title", { current: 1, total: 3 });
    expect(result).toEqual("Custom title (shard 1/3)");
  });

  it("should return shard short line when empty title is passed and shard is provided", () => {
    const result = getSummaryTitle("", { current: 3, total: 4 });
    expect(result).toEqual("shard 3/4");
  });

  it("should not append shard when shard is null", () => {
    const result = getSummaryTitle("Test results", null);
    expect(result).toEqual("Test results");
  });
});
