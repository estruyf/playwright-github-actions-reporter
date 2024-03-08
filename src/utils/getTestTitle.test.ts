import { getTestTitle } from "../../src/utils/getTestTitle";

describe("getTestTitle", () => {
  it("should return an empty string if test is falsy", () => {
    const result = getTestTitle(null as any);
    expect(result).toBe("");
  });

  it("should return the test title if parent is falsy", () => {
    const test = { title: "Test Title", parent: null };
    const result = getTestTitle(test as any);
    expect(result).toBe("Test Title");
  });

  it("should return the concatenated parent and test title", () => {
    const parent = { title: "Parent Title" };
    const test = { title: "Test Title", parent };
    const result = getTestTitle(test as any);
    expect(result).toBe("Parent Title > Test Title");
  });
});
