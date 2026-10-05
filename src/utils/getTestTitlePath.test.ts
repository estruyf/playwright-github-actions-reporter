import { getTestTitlePath } from "./getTestTitlePath.js";

describe("getTestTitlePath", () => {
  it("should return the test title outside of describe blocks", () => {
    const test: any = { title: "Test", parent: { type: "file", title: "a.spec.ts" } };
    expect(getTestTitlePath(test)).toBe("Test");
  });

  it("should return the full describe path", () => {
    const file = { type: "file", title: "a.spec.ts" };
    const outer = { type: "describe", title: "Pages", parent: file };
    const inner = { type: "describe", title: "Homepage", parent: outer };
    const test: any = { title: "loads all web parts", parent: inner };
    expect(getTestTitlePath(test)).toBe("Pages > Homepage > loads all web parts");
  });
});
