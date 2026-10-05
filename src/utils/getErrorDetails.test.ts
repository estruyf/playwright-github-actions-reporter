import {
  SNIPPET_END,
  SNIPPET_START,
  getErrorDetails,
  getErrorMessage,
  getTestErrors,
} from "./getErrorDetails.js";

const ENV_KEYS = [
  "GITHUB_EVENT_PATH",
  "GITHUB_SERVER_URL",
  "GITHUB_REPOSITORY",
  "GITHUB_WORKSPACE",
  "GITHUB_SHA",
];

const location = {
  file: "/home/runner/work/repo/repo/tests/fail.spec.ts",
  line: 22,
  column: 5,
};

describe("getErrorDetails", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getTestErrors", () => {
    it("should return all errors of the result", () => {
      const errors = [{ message: "First" }, { message: "Second" }];
      expect(
        getTestErrors({ errors, error: errors[0] } as any),
      ).toEqual(errors);
    });

    it("should fall back to the error of the result", () => {
      expect(getTestErrors({ error: { message: "Only" } } as any)).toEqual([
        { message: "Only" },
      ]);
      expect(
        getTestErrors({ errors: [], error: { message: "Only" } } as any),
      ).toEqual([{ message: "Only" }]);
    });

    it("should return an empty array without errors", () => {
      expect(getTestErrors(undefined)).toEqual([]);
      expect(getTestErrors({ errors: [] } as any)).toEqual([]);
    });
  });

  describe("getErrorMessage", () => {
    it("should use the thrown value when there is no message", () => {
      expect(getErrorMessage({ value: "a string" })).toBe("a string");
      expect(getErrorMessage(undefined)).toBe("");
    });
  });

  describe("full format", () => {
    it("should return an empty string without errors", () => {
      expect(getErrorDetails({ errors: [] } as any)).toBe("");
    });

    it("should render the message with ANSI converted to HTML", () => {
      const result = { error: { message: "\u001b[31mBoom\u001b[39m" } } as any;
      expect(getErrorDetails(result)).toBe(
        `<span style="color:#A00">Boom<span style="color:#FFF"></span></span>`,
      );
    });

    it("should render every error", () => {
      const result = {
        errors: [{ message: "First soft" }, { message: "Second soft" }],
      } as any;
      expect(getErrorDetails(result)).toBe("First soft<hr>Second soft");
    });

    it("should render the cause", () => {
      const result = {
        errors: [{ message: "Request failed", cause: { message: "ECONNRESET" } }],
      } as any;
      expect(getErrorDetails(result)).toBe(
        "Request failed<br><br><b>Cause:</b> ECONNRESET",
      );
    });

    it("should render the location as a link in GitHub Actions", () => {
      process.env.GITHUB_REPOSITORY = "owner/repo";
      process.env.GITHUB_WORKSPACE = "/home/runner/work/repo/repo";
      process.env.GITHUB_SHA = "abc123";

      const result = { errors: [{ message: "Boom", location }] } as any;
      expect(getErrorDetails(result)).toBe(
        `Boom<br><br>at <a href="https://github.com/owner/repo/blob/abc123/tests/fail.spec.ts#L22">fail.spec.ts:22</a>`,
      );
    });

    it("should only render the snippet when enabled", () => {
      const result = {
        errors: [
          {
            message: "Boom",
            snippet: "> 22 | \u001b[31mexpect(1).toBe(2);\u001b[39m\n",
          },
        ],
      } as any;

      expect(getErrorDetails(result)).toBe("Boom");
      expect(getErrorDetails(result, { showErrorSnippet: true })).toBe(
        `Boom${SNIPPET_START}<details><summary>Code snippet</summary><pre>&gt; 22 | <span style="color:#A00">expect(1).toBe(2);<span style="color:#FFF"></span></span></pre></details>${SNIPPET_END}`,
      );
    });
  });

  describe("short format", () => {
    it("should render one line per error", () => {
      const result = {
        errors: [
          {
            message:
              "\u001b[31mError:\u001b[39m expect(received).toBe(expected)\n\nExpected: 2\nReceived: 1",
            cause: { message: "Not shown" },
            snippet: "Not shown",
          },
          { message: "Second <soft> error\nwith details" },
        ],
      } as any;

      expect(
        getErrorDetails(result, {
          errorFormat: "short",
          showErrorSnippet: true,
        }),
      ).toBe(
        "Error: expect(received).toBe(expected)<br>Second &lt;soft&gt; error",
      );
    });

    it("should truncate to the max error length", () => {
      const result = { errors: [{ message: "Error: a long message" }] } as any;
      expect(
        getErrorDetails(result, { errorFormat: "short", maxErrorLength: 5 }),
      ).toBe("Error...");
    });

    it("should add the location", () => {
      const result = { errors: [{ message: "Boom", location }] } as any;
      expect(getErrorDetails(result, { errorFormat: "short" })).toBe(
        "Boom (fail.spec.ts:22)",
      );
    });
  });

  describe("failed step", () => {
    const steps = [
      {
        title: "Checkout <cart>",
        category: "test.step",
        subtitle: "SKU 42",
        error: { message: "Boom" },
        steps: [
          {
            title: 'Expect "toBe"',
            category: "expect",
            error: { message: "Boom" },
            steps: [],
          },
        ],
      },
    ];

    it("should show the failed step above the errors", () => {
      const result = { errors: [{ message: "Boom" }], steps } as any;
      expect(getErrorDetails(result)).toBe(
        "<b>Failed at:</b> Checkout &lt;cart&gt; (SKU 42)<br><br>Boom",
      );
    });

    it("should show the failed step in the short format", () => {
      const result = {
        errors: [{ message: "Boom\nCall log:" }, { message: "Second" }],
        steps,
      } as any;
      expect(getErrorDetails(result, { errorFormat: "short" })).toBe(
        "<b>Failed at:</b> Checkout &lt;cart&gt; (SKU 42)<br>Boom<br>Second",
      );
    });

    it("should not show a failed step without errors", () => {
      expect(getErrorDetails({ errors: [], steps } as any)).toBe("");
    });
  });
});
