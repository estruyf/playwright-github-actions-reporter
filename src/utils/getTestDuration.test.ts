import { getTestDuration } from "../../src/utils/getTestDuration";

describe("getTestDuration", () => {
  test("should return empty string if result is undefined", () => {
    const result: any | undefined = undefined;
    const duration = getTestDuration(result);
    expect(duration).toBe("");
  });

  test("should return formatted duration if result is defined", () => {
    const result: any = {
      duration: 5000, // 5 seconds
    };
    const duration = getTestDuration(result);
    expect(duration).toBe("5s");
  });
});
