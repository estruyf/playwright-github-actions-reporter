import { getTestHeading } from "./getTestHeading";

describe("getTestHeading", () => {
  test("should return a string with the file name, OS and project name when all parameters are provided", () => {
    const fileName = "testFile.ts";
    const os = "linux";
    const project = { name: "testProject" };

    const result = getTestHeading(fileName, os, project as any);

    expect(result).toBe(`${fileName} (${os} / ${project.name})`);
  });

  test("should return a string with the file name and OS when only the file name and OS are provided", () => {
    const fileName = "testFile.ts";
    const os = "linux";

    const result = getTestHeading(fileName, os);

    expect(result).toBe(`${fileName} (${os})`);
  });
});
