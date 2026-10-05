import { getTestAnnotations } from "./getTestAnnotations.js";

const ENV_KEYS = [
  "GITHUB_EVENT_PATH",
  "GITHUB_SERVER_URL",
  "GITHUB_REPOSITORY",
  "GITHUB_WORKSPACE",
  "GITHUB_SHA",
];

const location = {
  file: "/home/runner/work/repo/repo/tests/fail.spec.ts",
  line: 18,
  column: 3,
};

describe("getTestAnnotations", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

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

  it("should only render the type when there is no description", async () => {
    const test: any = {
      annotations: [
        { type: "skip" },
        { type: "fixme", description: "" },
        { type: "serial", description: "  " },
      ],
    };
    const result = await getTestAnnotations(test);
    expect(result).not.toContain("undefined");
    expect(result).toBe(`<ul>
<li><strong>skip</strong></li>
<li><strong>fixme</strong></li>
<li><strong>serial</strong></li>
</ul>`);
  });

  it("should link the type to the source line in GitHub Actions", async () => {
    process.env.GITHUB_REPOSITORY = "owner/repo";
    process.env.GITHUB_WORKSPACE = "/home/runner/work/repo/repo";
    process.env.GITHUB_SHA = "abc123";

    const test: any = {
      annotations: [{ type: "info", description: "A check", location }],
    };
    const result = await getTestAnnotations(test);
    expect(result).toBe(
      `<p><a href="https://github.com/owner/repo/blob/abc123/tests/fail.spec.ts#L18"><strong>info</strong></a>: A check</p>`,
    );
  });

  it("should not link the type outside of GitHub Actions", async () => {
    const test: any = {
      annotations: [{ type: "info", description: "A check", location }],
    };
    const result = await getTestAnnotations(test);
    expect(result).toBe("<p><strong>info</strong>: A check</p>");
  });
});
