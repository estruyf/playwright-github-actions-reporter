import { getTestAnnotations } from "./getTestAnnotations";

describe("getTestAnnotations", () => {
  it("should return an empty string if test or test.annotations is falsy", () => {
    const test: any = null;
    const result = getTestAnnotations(test);
    expect(result).toBe("");
  });

  it("should return the formatted annotations when test.annotations is provided", () => {
    const test: any = {
      annotations: [
        { type: "bug", description: "This is a bug" },
        { type: "feature", description: "This is a feature" },
      ],
    };
    const result = getTestAnnotations(test);
    expect(result).toBe(
      "<b>bug</b>: This is a bug\n<b>feature</b>: This is a feature"
    );
  });

  it("should return single line annotations when there is only one annotation", () => {
    const test: any = {
      annotations: [{ type: "bug", description: "This is a bug" }],
    };
    const result = getTestAnnotations(test);
    expect(result).toBe("<b>bug</b>: This is a bug");
  });

  it("should return the HTML formatted annotations when isHtml is set to true", () => {
    const test: any = {
      annotations: [
        { type: "bug", description: "This is a bug" },
        { type: "feature", description: "This is a feature" },
      ],
    };
    const result = getTestAnnotations(test, true);
    expect(result).toBe(
      "<b>bug</b>: This is a bug<br><b>feature</b>: This is a feature"
    );
  });

  it("should return an empty string if test.annotations is an empty array", () => {
    const test: any = {
      annotations: [],
    };
    const result = getTestAnnotations(test);
    expect(result).toBe("");
  });
});
