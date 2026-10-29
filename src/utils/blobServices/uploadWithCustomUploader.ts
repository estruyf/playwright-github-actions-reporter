import type { Attachment, AttachmentUploader } from "../../models/index.js";

export const uploadWithCustomUploader = async (
  uploader: AttachmentUploader,
  attachments: Attachment[],
) => {
  const mediaFiles: { name: string; url: string }[] = [];

  for (const attachment of attachments) {
    if (!attachment.contentType.startsWith("image/") || !attachment.path) {
      continue;
    }

    try {
      const url = await uploader({ ...attachment, path: attachment.path });

      if (url) {
        mediaFiles.push({
          name: attachment.name,
          url,
        });
      }
    } catch (e) {
      console.log(`Failed to upload attachment: ${attachment.name}`);
      console.log((e as Error).message);
    }
  }

  return mediaFiles;
};
