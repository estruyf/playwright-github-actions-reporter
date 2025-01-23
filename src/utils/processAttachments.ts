import { BlobService } from "../models";
import { uploadToAzure } from "./blobServices/uploadToAzure";

export const processAttachments = async (
  blobService: BlobService,
  attachments?: { name: string; path?: string; contentType: string }[]
) => {
  if (!blobService || !attachments || attachments.length === 0) {
    return;
  }

  if (blobService.azure) {
    return await uploadToAzure(blobService, attachments);
  }

  return undefined;
};
