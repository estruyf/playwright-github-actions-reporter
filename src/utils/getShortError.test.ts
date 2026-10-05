import { getShortError } from "./getShortError.js";

describe("getShortError", () => {
  it("should return an empty string when there is no message", () => {
    expect(getShortError(undefined)).toBe("");
    expect(getShortError("")).toBe("");
  });

  it("should strip ANSI escape sequences", () => {
    const message =
      "\u001b[31mError:\u001b[39m expect(\u001b[2mlocator\u001b[22m).toBeVisible() failed";
    expect(getShortError(message)).toBe(
      "Error: expect(locator).toBeVisible() failed",
    );
  });

  it("should strip control characters", () => {
    expect(getShortError("Error:\u0007 something\u0000 broke")).toBe(
      "Error: something broke",
    );
  });

  it("should only return the first non-empty line", () => {
    const message = [
      "",
      "   ",
      "Error: expect(locator).toBeVisible() failed",
      "",
      "Locator: getByRole('button')",
      "Call log:",
    ].join("\n");
    expect(getShortError(message)).toBe(
      "Error: expect(locator).toBeVisible() failed",
    );
  });

  it("should collapse whitespace", () => {
    expect(getShortError("  Error:\t\ttoo    many   spaces  ")).toBe(
      "Error: too many spaces",
    );
  });

  it("should truncate long messages to 180 characters by default", () => {
    const result = getShortError("a".repeat(200));
    expect(result).toBe(`${"a".repeat(180)}...`);
  });

  it("should truncate to the provided max length", () => {
    expect(getShortError("Error: this is a long message", 12)).toBe(
      "Error: this...",
    );
  });

  it("should not truncate messages within the max length", () => {
    expect(getShortError("Error: short", 12)).toBe("Error: short");
  });
});
