import { getTestsPerFile } from "./getTestsPerFile";

describe("getTestsPerFile", () => {
  it("should return an array of unique file paths", () => {
    const suite = {
      allTests: () => [
        { location: { file: "/path/to/file1" } },
        { location: { file: "/path/to/file2" } },
        { location: { file: "/path/to/file1" } },
        { location: { file: "/path/to/file3" } },
      ],
    };

    const result = getTestsPerFile(suite as any);
    expect(Object.keys(result).length).toBe(3);
  });

  it("should return an empty object when no tests are provided", () => {
    const suite = {
      allTests: () => [],
    };

    const result = getTestsPerFile(suite as any);

    expect(result).toEqual({});
  });
});
