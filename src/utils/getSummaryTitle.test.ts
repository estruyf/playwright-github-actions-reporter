import { getSummaryTitle } from "./getSummaryTitle";

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
});
