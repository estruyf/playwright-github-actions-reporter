import { getSummaryContext } from "./getSummaryContext.js";

describe("getSummaryContext", () => {
  it("should return an empty string without a description or metadata", async () => {
    expect(await getSummaryContext()).toBe("");
    expect(await getSummaryContext("", {})).toBe("");
    expect(await getSummaryContext("   ")).toBe("");
  });

  it("should render the description as markdown", async () => {
    expect(await getSummaryContext("Selection: **smoke**")).toBe(
      "<p>Selection: <strong>smoke</strong></p>",
    );
  });

  it("should keep HTML in the description", async () => {
    expect(await getSummaryContext(`<p align="center">Nightly run</p>`)).toBe(
      `<p align="center">Nightly run</p>`,
    );
  });

  it("should render the metadata as a list", async () => {
    expect(
      await getSummaryContext(undefined, {
        Environment: "staging",
        Retries: 2,
        Headless: false,
      }),
    ).toBe(`<ul>
<li><strong>Environment</strong>: staging</li>
<li><strong>Retries</strong>: 2</li>
<li><strong>Headless</strong>: false</li>
</ul>`);
  });

  it("should skip empty metadata values", async () => {
    expect(
      await getSummaryContext(undefined, {
        Environment: undefined,
        Target: null,
        Version: "",
        Branch: "  ",
        Commit: "abc123",
      }),
    ).toBe(`<ul>
<li><strong>Commit</strong>: abc123</li>
</ul>`);
  });

  it("should return an empty string when all metadata values are empty", async () => {
    expect(
      await getSummaryContext(undefined, { Environment: undefined, Target: "" }),
    ).toBe("");
  });

  it("should render the description before the metadata", async () => {
    expect(
      await getSummaryContext("Nightly run", { Environment: "staging" }),
    ).toBe(`<p>Nightly run</p>
<ul>
<li><strong>Environment</strong>: staging</li>
</ul>`);
  });
});
