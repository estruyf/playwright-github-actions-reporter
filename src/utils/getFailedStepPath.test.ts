import { getFailedStepPath } from "./getFailedStepPath.js";

const error = { message: "Boom" };

const step = (
  title: string,
  category: string,
  steps: any[] = [],
  extra: Record<string, unknown> = {},
) => ({
  title,
  category,
  steps,
  error: steps.some((s) => s.error) || extra.failed ? error : undefined,
  ...extra,
});

describe("getFailedStepPath", () => {
  it("should return undefined without steps", () => {
    expect(getFailedStepPath(undefined)).toBeUndefined();
    expect(getFailedStepPath({ steps: [] } as any)).toBeUndefined();
  });

  it("should return undefined for a plain expect in the test body", () => {
    const result: any = {
      steps: [
        step("Before Hooks", "hook"),
        step('Expect "toBe"', "expect", [], { failed: true }),
      ],
    };
    expect(getFailedStepPath(result)).toBeUndefined();
  });

  it("should return the nested test steps with their subtitle", () => {
    const result: any = {
      steps: [
        step("Open the shop", "test.step"),
        step("Checkout", "test.step", [
          step(
            "Add to cart",
            "test.step",
            [
              step("Click", "pw:api"),
              step('Expect "toBeVisible"', "expect", [], { failed: true }),
            ],
            { subtitle: "SKU 42" },
          ),
        ]),
      ],
    };
    expect(getFailedStepPath(result)).toBe("Checkout › Add to cart (SKU 42)");
  });

  it("should return the hook the test failed in", () => {
    const result: any = {
      steps: [
        step("Before Hooks", "hook", [
          step("beforeEach hook", "hook", [
            step('Expect "toBe"', "expect", [], { failed: true }),
          ]),
        ]),
      ],
    };
    expect(getFailedStepPath(result)).toBe("Before Hooks › beforeEach hook");
  });

  it("should follow the first failed step", () => {
    const result: any = {
      steps: [
        step("First", "test.step", [step("expect", "expect", [], { failed: true })]),
        step("Second", "test.step", [step("expect", "expect", [], { failed: true })]),
      ],
    };
    expect(getFailedStepPath(result)).toBe("First");
  });
});
