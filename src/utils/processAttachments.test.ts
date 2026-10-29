import {
  isBlobServiceConfigured,
  processAttachments,
} from "../../src/utils/processAttachments.js";

describe("isBlobServiceConfigured", () => {
  test("should return false without a blob service", () => {
    expect(isBlobServiceConfigured(undefined)).toBe(false);
    expect(isBlobServiceConfigured({})).toBe(false);
  });

  test("should return true for azure or a custom uploader", () => {
    expect(isBlobServiceConfigured({ azure: {} })).toBe(true);
    expect(
      isBlobServiceConfigured({ custom: async () => "https://example.com" }),
    ).toBe(true);
  });
});

describe("processAttachments", () => {
  test("should upload only image attachments with a path via the custom uploader", async () => {
    const uploader = jest.fn(
      async (attachment: { path: string }) =>
        `https://example.com/${attachment.path}`,
    );

    const mediaFiles = await processAttachments({ custom: uploader }, [
      { name: "screenshot", path: "shot.png", contentType: "image/png" },
      { name: "trace", path: "trace.zip", contentType: "application/zip" },
      { name: "inline", contentType: "image/png" },
    ]);

    expect(uploader).toHaveBeenCalledTimes(1);
    expect(mediaFiles).toEqual([
      { name: "screenshot", url: "https://example.com/shot.png" },
    ]);
  });

  test("should skip attachments when the uploader returns undefined or throws", async () => {
    const uploader = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("upload failed"));
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    const mediaFiles = await processAttachments({ custom: uploader }, [
      { name: "first", path: "first.png", contentType: "image/png" },
      { name: "second", path: "second.png", contentType: "image/png" },
    ]);

    expect(mediaFiles).toEqual([]);
    expect(log).toHaveBeenCalledWith("Failed to upload attachment: second");
    log.mockRestore();
  });
});
