import { getTestAnnotations } from "./getTestAnnotations";

describe("getTestAnnotations", () => {
  it("should return an empty string if test or test.annotations is falsy", async () => {
    const test: any = null;
    const result = await getTestAnnotations(test);
    expect(result).toBe("");
  });

  it("should return the formatted annotations when test.annotations is provided", async () => {
    const test: any = {
      annotations: [
        { type: "bug", description: "This is a bug" },
        { type: "feature", description: "This is a feature" },
      ],
    };
    const result = await getTestAnnotations(test);
    expect(result).toBe(`<ul>
<li><strong>bug</strong>: This is a bug</li>
<li><strong>feature</strong>: This is a feature</li>
</ul>`);
  });

  it("should return single line annotations when there is only one annotation", async () => {
    const test: any = {
      annotations: [{ type: "bug", description: "This is a bug" }],
    };
    const result = await getTestAnnotations(test);
    expect(result).toBe("<p><strong>bug</strong>: This is a bug</p>");
  });

  it("should return an empty string if test.annotations is an empty array", async () => {
    const test: any = {
      annotations: [],
    };
    const result = await getTestAnnotations(test);
    expect(result).toBe("");
  });
});
