import { TestCase, TestResult } from "@playwright/test/reporter";
import { relative } from "path";

export const getFailureScreenshot = (test: TestCase, result: TestResult): string => {
    if (result.status === "failed" && result.attachments) {
        const screenshot = result.attachments.find(attachment => attachment.name === "screenshot");
        if (screenshot && screenshot.path) {
            return relative(process.cwd(), screenshot.path);
        }
    }
    return "No failure screenshot available.";
};