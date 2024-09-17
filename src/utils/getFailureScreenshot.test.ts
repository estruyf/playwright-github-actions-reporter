import { getFailureScreenshot } from "./getFailureScreenshot";
import { TestCase, TestResult, Suite } from "@playwright/test/reporter";
import { join } from "path";

const baseSuite: Suite = {
    title: "test",
    suites: [],
    tests: [],
    titlePath: () => [""],
    project: () => undefined,
    allTests: () => [],
    location: { file: "mockFile.spec.ts", line: 1, column: 1 },
};

describe("getFailureScreenshot", () => {
    it("should return the relative path of the failure screenshot", () => {
        const testCase: TestCase = {
            ...baseSuite.tests[0],
            title: "Mock Test Case",
            results: [],
            annotations: [],
            expectedStatus: "passed",
            timeout: 0,
            retries: 0,
            id: "mock-id",
            parent: baseSuite,
            location: { file: "mockFile.spec.ts", line: 1, column: 1 },
            ok: () => true,
        };

        const testResult: TestResult = {
            status: "failed",
            duration: 1000,
            startTime: new Date(),
            retry: 0,
            workerIndex: 0,
            errors: [],
            attachments: [
                {
                    name: "screenshot",
                    path: join(process.cwd(), "tests/fail.spec.ts-snapshots/layout-mask-chromium-darwin.png"),
                    contentType: "image/png",
                    body: Buffer.from([]),
                },
            ],
            stdout: [],
            stderr: [],
            steps: [],
            parallelIndex: 0
        };

        const screenshotPath = getFailureScreenshot(testCase, testResult);
        expect(screenshotPath).toBe("tests/fail.spec.ts-snapshots/layout-mask-chromium-darwin.png");
    });

    it("should return 'No failure screenshot available.' if no screenshot is found", () => {
        const testCase: TestCase = {
            ...baseSuite.tests[0],
            title: "Mock Test Case",
            results: [],
            annotations: [],
            expectedStatus: "passed",
            timeout: 0,
            retries: 0,
            id: "mock-id",
            parent: baseSuite,
            location: { file: "mockFile.spec.ts", line: 1, column: 1 },
            ok: () => true,
        };

        const testResult: TestResult = {
            status: "failed",
            duration: 1000,
            startTime: new Date(),
            retry: 0,
            workerIndex: 0,
            errors: [],
            attachments: [],
            stdout: [],
            stderr: [],
            steps: [],
            parallelIndex: 0
        };

        const screenshotPath = getFailureScreenshot(testCase, testResult);
        expect(screenshotPath).toBe("No failure screenshot available.");
    });

    it("should return 'No failure screenshot available.' if the test did not fail", () => {
        const testCase: TestCase = {
            ...baseSuite.tests[0],
            title: "Mock Test Case",
            results: [],
            annotations: [],
            expectedStatus: "passed",
            timeout: 0,
            retries: 0,
            id: "mock-id",
            parent: baseSuite,
            location: { file: "mockFile.spec.ts", line: 1, column: 1 },
            ok: () => true,
        };

        const testResult: TestResult = {
            status: "passed",
            duration: 1000,
            startTime: new Date(),
            retry: 0,
            workerIndex: 0,
            errors: [],
            attachments: [
                {
                    name: "screenshot",
                    path: join(process.cwd(), "tests/fail.spec.ts-snapshots/layout-mask-chromium-darwin.png"),
                    contentType: "image/png",
                    body: Buffer.from([]),
                },
            ],
            stdout: [],
            stderr: [],
            steps: [],
            parallelIndex: 0
        };

        const screenshotPath = getFailureScreenshot(testCase, testResult);
        expect(screenshotPath).toBe("No failure screenshot available.");
    });

});
