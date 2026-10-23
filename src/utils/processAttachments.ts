import type { Attachment, BlobService } from "../models/index.js";
import { uploadToAzure } from "./blobServices/uploadToAzure.js";
import { uploadWithCustomUploader } from "./blobServices/uploadWithCustomUploader.js";

export const isBlobServiceConfigured = (blobService?: BlobService): boolean =>
  !!blobService &&
  (!!blobService.azure || !!blobService.github || !!blobService.custom);

export const processAttachments = async (
  blobService?: BlobService,
  attachments?: Attachment[],
) => {
  if (!blobService || !attachments || attachments.length === 0) {
    return;
  }

  if (blobService.azure) {
    return await uploadToAzure(blobService, attachments);
  }

  if (blobService.github) {
    const github = blobService.github;
    return await uploadWithCustomUploader(
      (attachment) => github.getUrl(attachment),
      attachments,
    );
  }

  if (blobService.custom) {
    return await uploadWithCustomUploader(blobService.custom, attachments);
  }

  return undefined;
};
