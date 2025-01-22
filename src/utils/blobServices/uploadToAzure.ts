import { parse } from "path";
import { readFile } from "fs/promises";
import { BlobService } from "../../models";

export const uploadToAzure = async (
  blobService: BlobService,
  attachments: { name: string; path?: string; contentType: string }[]
) => {
  const azureContainerUrl = blobService.azure?.azureStorageUrl;
  const azureContainerSas = blobService.azure?.azureStorageSAS;

  if (!azureContainerUrl || !azureContainerSas) {
    return;
  }

  const mediaFiles: { name: string; url: string }[] = [];

  if (attachments.length > 0) {
    attachments = attachments.filter(
      (a) => a.contentType.startsWith("image/") && a.path
    );

    for (const attachment of attachments) {
      try {
        if (attachment.path) {
          const githubRunId = process.env.GITHUB_RUN_ID || "";
          const parsedFile = parse(attachment.path);
          let fileUrl = `${azureContainerUrl}`;

          if (githubRunId) {
            fileUrl = `${fileUrl}/${githubRunId}`;
          }

          fileUrl = `${fileUrl}/${parsedFile.name}_${Date.now()}${
            parsedFile.ext
          }`;

          const putResponse = await fetch(`${fileUrl}?${azureContainerSas}`, {
            method: "PUT",
            headers: {
              "x-ms-blob-type": "BlockBlob",
              "x-ms-blob-content-type": attachment.contentType,
            },
            body: await readFile(attachment.path),
          });

          if (putResponse.ok) {
            mediaFiles.push({
              name: attachment.name,
              url: fileUrl,
            });
          } else {
            console.log(`Failed to upload attachment: ${attachment.name}`);
            console.log(`Response: ${putResponse.statusText}`);
          }
        }
      } catch (e) {
        console.log(`Failed to upload attachment: ${attachment.name}`);
        console.log((e as Error).message);
      }
    }
  }

  return mediaFiles;
};
