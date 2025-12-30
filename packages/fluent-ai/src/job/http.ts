import * as fs from "node:fs";
import * as path from "node:path";
import type { ImageJob } from "./schema";

export async function createHTTPJob<T>(
  request: RequestInfo | URL,
  handleResponse: (response: Response) => T | Promise<T>,
): Promise<T> {
  try {
    const response = await fetch(request);

    if (!response.ok) {
      console.error("HTTP Error Response:", await response.text());
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`,
      );
    }

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
    throw error;
  }
}

export async function downloadImages(
  images: Array<{ url: string; [key: string]: any }>,
  options: ImageJob["input"]["download"],
  jobId?: string,
): Promise<Array<{ url: string; downloadPath?: string; [key: string]: any }>> {
  const localDir = options!.local;

  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  const downloadedImages = await Promise.all(
    images.map(async (img, index) => {
      try {
        const response = await fetch(img.url);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const contentType =
          response.headers.get("content-type") || "image/jpeg";
        const ext = contentType.split("/")[1] || "jpg";

        const filename = jobId
          ? `job_${jobId}_${index + 1}.${ext}`
          : `image_${Date.now()}_${index + 1}.${ext}`;

        const filePath = path.join(localDir, filename);

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));

        return {
          ...img,
          downloadPath: path.join(path.basename(localDir), filename),
        };
      } catch (error) {
        console.error(`Failed to download image ${index + 1}:`, error);
        return img;
      }
    }),
  );

  return downloadedImages;
}
