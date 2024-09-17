import { TestCase, TestResult } from "@playwright/test/reporter";
import { readFileSync } from "fs";
import { relative } from "path";
import sharp from "sharp";

export const getFailureScreenshot = async (test: TestCase, result: TestResult): Promise<string> => {
    if (result.status === "failed" && result.attachments) {
        const screenshot = result.attachments.find(attachment => attachment.name === "screenshot");
        if (screenshot && screenshot.path) {
            const screenshotPath = relative(process.cwd(), screenshot.path);
            const screenshotBuffer = readFileSync(screenshotPath);
            const resizedBuffer = await sharp(screenshotBuffer)
                .resize({ width: 200 }) // Resize the image to a width of 800 pixels
                .toBuffer();
            return resizedBuffer.toString('base64');
        }
    }
    return "No failure screenshot available.";
};